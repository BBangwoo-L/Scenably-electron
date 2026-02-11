import { ipcMain } from 'electron';
import log from 'electron-log';
import { getDatabase } from './database-sqlite';
import { createOrUpdateTask, deleteTask, setTaskEnabled } from './scheduler-windows';
import { ElectronPlaywrightRecorder } from './playwright-electron-recorder';
import { ElectronPlaywrightDebugger } from './playwright-electron-debug';
import { ElectronPlaywrightExecutor } from './playwright-electron-executor';

// 간단하고 깔끔한 IPC 핸들러 (SQLite 기반)
export function setupSQLiteHandlers() {
  console.log('🔧 [Setup] SQLite IPC 핸들러 설정 시작...');

  try {
    let db: ReturnType<typeof getDatabase> | null = null;
    const ensureDb = () => {
      if (!db) {
        console.log('🔧 [Setup] 데이터베이스 인스턴스 가져오는 중...');
        db = getDatabase();
        console.log('🔧 [Setup] 데이터베이스 인스턴스 획득 성공');
      }
      return db;
    };

  // 시나리오 관련 핸들러
  ipcMain.handle('scenarios:getAll', async () => {
    try {
      const scenarios = ensureDb().findAllScenarios();
      return { success: true, data: scenarios };
    } catch (error) {
      console.error('시나리오 목록 조회 실패:', error);
      return { success: false, error: '시나리오 목록을 가져올 수 없습니다.' };
    }
  });

  ipcMain.handle('scenarios:create', async (_, data) => {
    try {
      const { name, description, targetUrl, code } = data;

      if (!name?.trim() || !targetUrl?.trim() || !code?.trim()) {
        return {
          success: false,
          error: '필수 필드가 누락되었습니다: 이름, 대상 URL, 코드를 모두 입력해주세요.'
        };
      }

      const scenario = ensureDb().createScenario({
        name: name.trim(),
        description: description?.trim() || null,
        targetUrl: targetUrl.trim(),
        code: code.trim()
      });

      return { success: true, data: scenario };
    } catch (error) {
      console.error('시나리오 생성 실패:', error);
      return { success: false, error: '시나리오를 생성할 수 없습니다.' };
    }
  });

  ipcMain.handle('scenarios:getById', async (_, id: string) => {
    try {
      if (!id) {
        return { success: false, error: '시나리오 ID가 필요합니다.' };
      }

      const scenario = ensureDb().findScenarioById(id);

      if (!scenario) {
        return { success: false, error: '시나리오를 찾을 수 없습니다.' };
      }

      return { success: true, data: scenario };
    } catch (error) {
      console.error('시나리오 조회 실패:', error);
      return { success: false, error: '시나리오를 조회할 수 없습니다.' };
    }
  });

  ipcMain.handle('scenarios:update', async (_, { id, data }) => {
    try {
      if (!id) {
        return { success: false, error: '시나리오 ID가 필요합니다.' };
      }

      // 업데이트할 데이터 정리
      const updateData: any = {};
      if (data.name?.trim()) updateData.name = data.name.trim();
      if (data.description !== undefined) updateData.description = data.description?.trim() || null;
      if (data.targetUrl?.trim()) updateData.targetUrl = data.targetUrl.trim();
      if (data.code?.trim()) updateData.code = data.code.trim();

      const scenario = ensureDb().updateScenario(id, updateData);

      if (!scenario) {
        return { success: false, error: '시나리오를 찾을 수 없습니다.' };
      }

      return { success: true, data: scenario };
    } catch (error) {
      console.error('시나리오 업데이트 실패:', error);
      return { success: false, error: '시나리오를 업데이트할 수 없습니다.' };
    }
  });

  ipcMain.handle('scenarios:delete', async (_, id: string) => {
    try {
      if (!id) {
        return { success: false, error: '시나리오 ID가 필요합니다.' };
      }

      const deleted = ensureDb().deleteScenario(id);

      if (!deleted) {
        return { success: false, error: '시나리오를 찾을 수 없습니다.' };
      }

      return { success: true, data: { deletedId: id } };
    } catch (error) {
      console.error('시나리오 삭제 실패:', error);
      return { success: false, error: '시나리오를 삭제할 수 없습니다.' };
    }
  });

  // 시나리오 실행 (백그라운드 Playwright 실행)
  ipcMain.handle('scenarios:execute', async (_, { id, code }) => {
    try {
      // 시나리오에서 코드 가져오기
      const scenario = ensureDb().findScenarioById(id);
      if (!scenario) {
        return { success: false, error: '시나리오를 찾을 수 없습니다.' };
      }

      const executionCode = code || scenario.code;

      // RUNNING 상태로 실행 기록 생성
      const execution = ensureDb().createExecution({
        scenarioId: id,
        status: 'RUNNING',
        result: null,
        completedAt: null
      });

      // 백그라운드에서 비동기 실행 (fire-and-forget)
      ElectronPlaywrightExecutor.executeInBackground(execution.id, id, executionCode);

      return {
        success: true,
        data: {
          success: true,
          executionId: execution.id,
          status: 'RUNNING',
          message: '백그라운드에서 테스트를 실행 중입니다.'
        }
      };
    } catch (error) {
      console.error('시나리오 실행 실패:', error);
      return { success: false, error: '시나리오를 실행할 수 없습니다.' };
    }
  });

  // 실행 결과 조회
  ipcMain.handle('executions:getById', async (_, id: string) => {
    try {
      if (!id) {
        return { success: false, error: '실행 ID가 필요합니다.' };
      }

      const execution = ensureDb().getExecutionById(id);
      if (!execution) {
        return { success: false, error: '실행 기록을 찾을 수 없습니다.' };
      }

      return { success: true, data: execution };
    } catch (error) {
      console.error('실행 결과 조회 실패:', error);
      return { success: false, error: '실행 결과를 조회할 수 없습니다.' };
    }
  });

  // 시나리오 디버그 (실제 Playwright 실행)
  ipcMain.handle('scenarios:debug', async (_, { code }) => {
    try {
      const sessionId = `debug-${Date.now()}`;
      console.log(`디버그 시작: ${sessionId}`);

      const result = await ElectronPlaywrightDebugger.startDebugSession(code, sessionId);

      return {
        success: true,
        data: {
          sessionId: result.sessionId,
          message: result.message
        }
      };
    } catch (error) {
      console.error('시나리오 디버그 실패:', error);
      return { success: false, error: error instanceof Error ? error.message : '디버그 세션을 시작할 수 없습니다.' };
    }
  });

  // 레코딩 관련 핸들러 (실제 Playwright Recorder 사용)
  ipcMain.handle('recording:start', async (_, { url }) => {
    log.info('🎬 [IPC] Recording:start handler called with URL:', url);
    console.log('🎬 [IPC] Recording:start handler called with URL:', url);
    try {
      const sessionId = `recording-${Date.now()}`;
      log.info(`🎬 [IPC] 레코딩 시작 요청: ${url}, Session ID: ${sessionId}`);
      console.log(`🎬 [IPC] 레코딩 시작 요청: ${url}, Session ID: ${sessionId}`);

      log.info(`🎬 [IPC] ElectronPlaywrightRecorder.startRecording 호출 중...`);
      console.log(`🎬 [IPC] ElectronPlaywrightRecorder.startRecording 호출 중...`);
      const result = await ElectronPlaywrightRecorder.startRecording(url, sessionId);
      log.info(`🎬 [IPC] ElectronPlaywrightRecorder 결과:`, result);
      console.log(`🎬 [IPC] ElectronPlaywrightRecorder 결과:`, result);

      const response = {
        success: true,
        data: {
          sessionId: result.sessionId,
          url,
          status: 'recording',
          message: result.message
        }
      };

      log.info(`🎬 [IPC] 응답 준비 완료:`, response);
      console.log(`🎬 [IPC] 응답 준비 완료:`, response);
      return response;
    } catch (error) {
      log.error('❌ [IPC] 레코딩 시작 실패:', error);
      log.error('❌ [IPC] 에러 스택:', error instanceof Error ? error.stack : 'No stack trace');
      console.error('❌ [IPC] 레코딩 시작 실패:', error);
      console.error('❌ [IPC] 에러 스택:', error instanceof Error ? error.stack : 'No stack trace');
      return { success: false, error: error instanceof Error ? error.message : '레코딩을 시작할 수 없습니다.' };
    }
  });

  ipcMain.handle('recording:stop', async (_, { sessionId }) => {
    try {
      console.log(`레코딩 중지: ${sessionId}`);

      const result = await ElectronPlaywrightRecorder.stopRecording(sessionId);

      return {
        success: true,
        data: {
          sessionId,
          code: result.code,
          message: result.message
        }
      };
    } catch (error) {
      console.error('레코딩 중지 실패:', error);
      return { success: false, error: error instanceof Error ? error.message : '레코딩을 중지할 수 없습니다.' };
    }
  });

  // 스케줄링 관련 핸들러 (Windows 전용)
  ipcMain.handle('schedules:getByScenarioId', async (_, scenarioId: string) => {
    try {
      if (!scenarioId) {
        return { success: false, error: '시나리오 ID가 필요합니다.' };
      }
      const schedule = ensureDb().getScheduleByScenarioId(scenarioId);
      return { success: true, data: schedule };
    } catch (error) {
      console.error('스케줄 조회 실패:', error);
      return { success: false, error: '스케줄을 조회할 수 없습니다.' };
    }
  });

  ipcMain.handle('schedules:list', async () => {
    try {
      const schedules = ensureDb().listSchedulesWithLatestRun();
      return { success: true, data: schedules };
    } catch (error) {
      console.error('스케줄 목록 조회 실패:', error);
      return { success: false, error: '스케줄 목록을 조회할 수 없습니다.' };
    }
  });

  ipcMain.handle('schedules:runs', async (_, scheduleId: string) => {
    try {
      if (!scheduleId) {
        return { success: false, error: '스케줄 ID가 필요합니다.' };
      }
      const runs = ensureDb().listScheduleRuns(scheduleId);
      return { success: true, data: runs };
    } catch (error) {
      console.error('스케줄 이력 조회 실패:', error);
      return { success: false, error: '스케줄 이력을 조회할 수 없습니다.' };
    }
  });

  ipcMain.handle('schedules:save', async (_, data) => {
    try {
      const db = ensureDb();
      console.log('[Schedule] save 요청:', data);
      const schedule = db.upsertSchedule({
        scenarioId: data.scenarioId,
        enabled: data.enabled ? 1 : 0,
        frequency: data.frequency,
        time: data.time,
        dayOfWeek: data.dayOfWeek ?? null,
        dayOfMonth: data.dayOfMonth ?? null
      });

      if (process.platform !== 'win32') {
        console.log('[Schedule] non-win32 등록 완료:', schedule);
        return { success: true, data: schedule };
      }

      const taskResult = createOrUpdateTask({
        id: schedule.id,
        scenarioId: schedule.scenarioId,
        frequency: schedule.frequency,
        time: schedule.time,
        dayOfWeek: schedule.dayOfWeek ?? undefined,
        dayOfMonth: schedule.dayOfMonth ?? undefined,
        enabled: schedule.enabled
      });

      if (!taskResult.ok) {
        console.error('[Schedule] 등록 실패:', taskResult.error);
        db.updateScheduleEnabled(schedule.scenarioId, 0);
        return {
          success: false,
          error: `스케줄 등록 실패: ${taskResult.error || '권한이 부족할 수 있습니다.'}`
        };
      }

      console.log('[Schedule] 등록 완료:', schedule);
      return { success: true, data: schedule };
    } catch (error) {
      console.error('스케줄 저장 실패:', error);
      return { success: false, error: '스케줄을 저장할 수 없습니다.' };
    }
  });

  ipcMain.handle('schedules:toggle', async (_, { scenarioId, enabled }) => {
    try {
      const db = ensureDb();
      console.log('[Schedule] toggle 요청:', scenarioId, enabled);
      const schedule = db.getScheduleByScenarioId(scenarioId);
      if (!schedule) {
        return { success: false, error: '스케줄이 없습니다.' };
      }

      if (process.platform !== 'win32') {
        console.log('[Schedule] non-win32 toggle:', scenarioId, enabled);
        const updated = db.updateScheduleEnabled(scenarioId, enabled ? 1 : 0);
        return { success: true, data: updated };
      }

      const result = setTaskEnabled(schedule.id, !!enabled);
      if (!result.ok) {
        console.error('[Schedule] toggle 실패:', result.error);
        db.updateScheduleEnabled(scenarioId, 0);
        return { success: false, error: result.error || '스케줄 상태 변경 실패' };
      }

      const updated = db.updateScheduleEnabled(scenarioId, enabled ? 1 : 0);
      console.log('[Schedule] toggle 완료:', updated);
      return { success: true, data: updated };
    } catch (error) {
      console.error('스케줄 토글 실패:', error);
      return { success: false, error: '스케줄 상태를 변경할 수 없습니다.' };
    }
  });

  ipcMain.handle('schedules:delete', async (_, scenarioId: string) => {
    try {
      const db = ensureDb();
      console.log('[Schedule] delete 요청:', scenarioId);
      const schedule = db.getScheduleByScenarioId(scenarioId);
      if (!schedule) {
        return { success: true, data: { deleted: false } };
      }

      if (process.platform !== 'win32') {
        const deleted = db.deleteScheduleByScenarioId(scenarioId);
        console.log('[Schedule] non-win32 delete 완료:', deleted);
        return { success: true, data: { deleted } };
      }

      const result = deleteTask(schedule.id);
      if (!result.ok) {
        console.error('[Schedule] delete 실패(작업):', result.error);
        // 작업 삭제가 실패해도 DB에서는 제거해서 UI에서 지워지도록 처리
      }

      const deleted = db.deleteScheduleByScenarioId(scenarioId);
      console.log('[Schedule] delete 완료:', deleted);
      return {
        success: true,
        data: { deleted },
        warning: result.ok ? undefined : (result.error || '작업 삭제 실패')
      };
    } catch (error) {
      console.error('스케줄 삭제 실패:', error);
      return { success: false, error: '스케줄을 삭제할 수 없습니다.' };
    }
  });

  // AI 관련 핸들러 (데모 구현)
  ipcMain.handle('ai:modify', async (_, { code, instruction }) => {
    try {
      const modifiedCode = `// AI에 의해 개선된 코드 (데모)
${code}

// 추가된 개선사항:
// - ${instruction}
// - 에러 처리 강화
// - 대기 시간 최적화
// - 스크린샷 추가

// 참고: 실제 AI 기능을 사용하려면 Claude API 키 설정이 필요합니다.`;

      return {
        success: true,
        data: {
          modifiedCode,
          explanation: `코드가 다음과 같이 개선되었습니다:\\n\\n1. ${instruction}\\n2. 에러 처리 로직 추가\\n3. 성능 최적화\\n4. 가독성 향상\\n\\n(현재는 데모 모드입니다)`
        }
      };
    } catch (error) {
      console.error('AI 코드 수정 실패:', error);
      return { success: false, error: 'AI 코드 수정에 실패했습니다.' };
    }
  });

    console.log('🔧 [Setup] Recording 핸들러 등록 완료');
    console.log('✅ [Setup] SQLite IPC 핸들러 설정 완료');

  } catch (error) {
    console.error('❌ [Setup] IPC 핸들러 설정 중 오류 발생:', error);
    console.error('❌ [Setup] 스택 트레이스:', error instanceof Error ? error.stack : 'No stack trace');
    throw error;
  }
}
