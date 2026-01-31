import { ipcMain } from 'electron';

// 시나리오 관련 IPC 핸들러
export function setupScenarioHandlers() {
  // 모든 시나리오 조회
  ipcMain.handle('scenarios:getAll', async () => {
    try {
      const { ScenarioService } = await import('../src/lib/db/scenario');
      const scenarios = await ScenarioService.findAll();
      return { success: true, data: scenarios };
    } catch (error) {
      console.error('시나리오 목록 조회 실패:', error);
      return { success: false, error: '시나리오 목록을 가져올 수 없습니다.' };
    }
  });

  // 시나리오 생성
  ipcMain.handle('scenarios:create', async (_, data) => {
    try {
      const { ScenarioService } = await import('../src/lib/db/scenario');
      const { name, description, targetUrl, code } = data;

      if (!name || !targetUrl || !code) {
        return { success: false, error: '필수 필드가 누락되었습니다: name, targetUrl, code' };
      }

      const scenario = await ScenarioService.create({
        name,
        description,
        targetUrl,
        code,
      });

      return { success: true, data: scenario };
    } catch (error) {
      console.error('시나리오 생성 실패:', error);
      return { success: false, error: '시나리오를 생성할 수 없습니다.' };
    }
  });

  // 시나리오 조회
  ipcMain.handle('scenarios:getById', async (_, id: string) => {
    try {
      const { ScenarioService } = await import('../src/lib/db/scenario');
      const scenario = await ScenarioService.findById(id);

      if (!scenario) {
        return { success: false, error: '시나리오를 찾을 수 없습니다.' };
      }

      return { success: true, data: scenario };
    } catch (error) {
      console.error('시나리오 조회 실패:', error);
      return { success: false, error: '시나리오를 조회할 수 없습니다.' };
    }
  });

  // 시나리오 업데이트
  ipcMain.handle('scenarios:update', async (_, { id, data }) => {
    try {
      const { ScenarioService } = await import('../src/lib/db/scenario');
      const scenario = await ScenarioService.update(id, data);
      return { success: true, data: scenario };
    } catch (error) {
      console.error('시나리오 업데이트 실패:', error);
      return { success: false, error: '시나리오를 업데이트할 수 없습니다.' };
    }
  });

  // 시나리오 삭제
  ipcMain.handle('scenarios:delete', async (_, id: string) => {
    try {
      const { ScenarioService } = await import('../src/lib/db/scenario');
      await ScenarioService.delete(id);
      return { success: true };
    } catch (error) {
      console.error('시나리오 삭제 실패:', error);
      return { success: false, error: '시나리오를 삭제할 수 없습니다.' };
    }
  });

  // 시나리오 실행
  ipcMain.handle('scenarios:execute', async (_, { id, code }) => {
    try {
      const { PlaywrightExecutor } = await import('../src/lib/playwright/executor');
      const result = await PlaywrightExecutor.executeScenario(code, id);
      return { success: true, data: result };
    } catch (error) {
      console.error('시나리오 실행 실패:', error);
      return { success: false, error: '시나리오를 실행할 수 없습니다.' };
    }
  });

  // 시나리오 디버그 (임시로 실행과 동일하게 처리)
  ipcMain.handle('scenarios:debug', async (_, { code }) => {
    try {
      // 임시 디버그 세션 ID 생성
      const sessionId = `debug-${Date.now()}`;
      return { success: true, data: { sessionId } };
    } catch (error) {
      console.error('시나리오 디버그 실패:', error);
      return { success: false, error: '디버그 세션을 시작할 수 없습니다.' };
    }
  });
}

// 레코딩 관련 IPC 핸들러
export function setupRecordingHandlers() {
  // 레코딩 시작 (임시 구현)
  ipcMain.handle('recording:start', async (_, { url }) => {
    try {
      // 임시로 세션 생성
      const sessionId = `recording-${Date.now()}`;
      return { success: true, data: { sessionId, url } };
    } catch (error) {
      console.error('레코딩 시작 실패:', error);
      return { success: false, error: '레코딩을 시작할 수 없습니다.' };
    }
  });

  // 레코딩 중지 (임시 구현)
  ipcMain.handle('recording:stop', async (_, { sessionId }) => {
    try {
      // 임시로 성공 응답
      return { success: true, data: { sessionId, code: '// 녹화된 코드가 여기에 표시됩니다' } };
    } catch (error) {
      console.error('레코딩 중지 실패:', error);
      return { success: false, error: '레코딩을 중지할 수 없습니다.' };
    }
  });
}

// AI 관련 IPC 핸들러
export function setupAIHandlers() {
  // AI 코드 수정 (임시 구현)
  ipcMain.handle('ai:modify', async (_, { code, instruction }) => {
    try {
      // 임시로 수정된 코드 반환
      const modifiedCode = `// AI에 의해 수정된 코드
${code}
// 수정 요청: ${instruction}`;

      return {
        success: true,
        data: {
          modifiedCode,
          explanation: '코드가 AI에 의해 수정되었습니다.'
        }
      };
    } catch (error) {
      console.error('AI 코드 수정 실패:', error);
      return { success: false, error: 'AI 코드 수정에 실패했습니다.' };
    }
  });
}

// 모든 핸들러 설정
export function setupAllHandlers() {
  console.log('IPC 핸들러 설정 중...');
  setupScenarioHandlers();
  setupRecordingHandlers();
  setupAIHandlers();
  console.log('IPC 핸들러 설정 완료');
}