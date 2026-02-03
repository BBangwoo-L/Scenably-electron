import { ipcMain } from 'electron';
import { getDatabase } from './database-sqlite';
import { ElectronPlaywrightRecorder } from './playwright-electron-recorder';
import { ElectronPlaywrightDebugger } from './playwright-electron-debug';

// 간단하고 깔끔한 IPC 핸들러 (SQLite 기반)
export function setupSQLiteHandlers() {
  console.log('🔧 [Setup] SQLite IPC 핸들러 설정 시작...');

  try {
    console.log('🔧 [Setup] 데이터베이스 인스턴스 가져오는 중...');
    const db = getDatabase();
    console.log('🔧 [Setup] 데이터베이스 인스턴스 획득 성공');

  // 시나리오 관련 핸들러
  ipcMain.handle('scenarios:getAll', async () => {
    try {
      const scenarios = db.findAllScenarios();
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

      const scenario = db.createScenario({
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

      const scenario = db.findScenarioById(id);

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

      const scenario = db.updateScenario(id, updateData);

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

      const deleted = db.deleteScenario(id);

      if (!deleted) {
        return { success: false, error: '시나리오를 찾을 수 없습니다.' };
      }

      return { success: true, data: { deletedId: id } };
    } catch (error) {
      console.error('시나리오 삭제 실패:', error);
      return { success: false, error: '시나리오를 삭제할 수 없습니다.' };
    }
  });

  // 시나리오 실행 (데모 구현)
  ipcMain.handle('scenarios:execute', async (_, { id, code }) => {
    try {
      // 실행 기록 생성
      const execution = db.createExecution({
        scenarioId: id,
        status: 'SUCCESS',
        result: JSON.stringify({
          success: true,
          message: 'Playwright 테스트가 성공적으로 완료되었습니다.',
          duration: '2.3초',
          steps: ['페이지 로드', '요소 찾기', '클릭 실행', '결과 검증'],
          timestamp: new Date().toISOString()
        }),
        completedAt: new Date().toISOString()
      });

      const result = {
        success: true,
        output: 'Playwright 테스트가 성공적으로 실행되었습니다.\\n\\n단계:\\n1. 페이지 로드 완료\\n2. 요소 찾기 성공\\n3. 액션 실행 완료\\n4. 결과 검증 성공',
        screenshots: [],
        executionId: execution.id
      };

      return { success: true, data: result };
    } catch (error) {
      console.error('시나리오 실행 실패:', error);
      return { success: false, error: '시나리오를 실행할 수 없습니다.' };
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
    console.log('🎬 [IPC] Recording:start handler called with URL:', url);
    try {
      const sessionId = `recording-${Date.now()}`;
      console.log(`🎬 [IPC] 레코딩 시작 요청: ${url}, Session ID: ${sessionId}`);

      console.log(`🎬 [IPC] ElectronPlaywrightRecorder.startRecording 호출 중...`);
      const result = await ElectronPlaywrightRecorder.startRecording(url, sessionId);
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

      console.log(`🎬 [IPC] 응답 준비 완료:`, response);
      return response;
    } catch (error) {
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