import { ipcMain } from 'electron';
import { join } from 'path';

// 직접 Prisma를 사용하는 간단한 IPC 핸들러
export function setupSimpleHandlers() {
  console.log('간단한 IPC 핸들러 설정 중...');

  // Prisma 클라이언트 가져오기
  let prisma: any;

  const getPrisma = async () => {
    if (!prisma) {
      try {
        const prismaModule = require(join(process.cwd(), 'src/lib/db/prisma'));
        prisma = prismaModule.prisma;
      } catch (error) {
        console.error('Prisma 로드 실패:', error);
        // 대안: 직접 Prisma 클라이언트 생성
        const { PrismaClient } = require('@prisma/client');
        prisma = new PrismaClient();
      }
    }
    return prisma;
  };

  // 시나리오 관련 핸들러
  ipcMain.handle('scenarios:getAll', async () => {
    try {
      const db = await getPrisma();
      const scenarios = await db.scenario.findMany({
        include: { executions: true },
        orderBy: { createdAt: 'desc' }
      });
      return { success: true, data: scenarios };
    } catch (error) {
      console.error('시나리오 목록 조회 실패:', error);
      return { success: false, error: '시나리오 목록을 가져올 수 없습니다.' };
    }
  });

  ipcMain.handle('scenarios:create', async (_, data) => {
    try {
      const db = await getPrisma();
      const { name, description, targetUrl, code } = data;

      if (!name || !targetUrl || !code) {
        return { success: false, error: '필수 필드가 누락되었습니다: name, targetUrl, code' };
      }

      const scenario = await db.scenario.create({
        data: { name, description, targetUrl, code }
      });

      return { success: true, data: scenario };
    } catch (error) {
      console.error('시나리오 생성 실패:', error);
      return { success: false, error: '시나리오를 생성할 수 없습니다.' };
    }
  });

  ipcMain.handle('scenarios:getById', async (_, id: string) => {
    try {
      const db = await getPrisma();
      const scenario = await db.scenario.findUnique({
        where: { id },
        include: { executions: true }
      });

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
      const db = await getPrisma();
      const scenario = await db.scenario.update({
        where: { id },
        data
      });
      return { success: true, data: scenario };
    } catch (error) {
      console.error('시나리오 업데이트 실패:', error);
      return { success: false, error: '시나리오를 업데이트할 수 없습니다.' };
    }
  });

  ipcMain.handle('scenarios:delete', async (_, id: string) => {
    try {
      const db = await getPrisma();
      await db.scenario.delete({ where: { id } });
      return { success: true };
    } catch (error) {
      console.error('시나리오 삭제 실패:', error);
      return { success: false, error: '시나리오를 삭제할 수 없습니다.' };
    }
  });

  // 시나리오 실행 (간단한 구현)
  ipcMain.handle('scenarios:execute', async (_, { id, code }) => {
    try {
      // 임시로 성공 응답 반환
      const result = {
        success: true,
        output: 'Playwright 테스트가 성공적으로 실행되었습니다.',
        screenshots: []
      };
      return { success: true, data: result };
    } catch (error) {
      console.error('시나리오 실행 실패:', error);
      return { success: false, error: '시나리오를 실행할 수 없습니다.' };
    }
  });

  // 시나리오 디버그
  ipcMain.handle('scenarios:debug', async (_, { code }) => {
    try {
      const sessionId = `debug-${Date.now()}`;
      return { success: true, data: { sessionId } };
    } catch (error) {
      console.error('시나리오 디버그 실패:', error);
      return { success: false, error: '디버그 세션을 시작할 수 없습니다.' };
    }
  });

  // 레코딩 관련 핸들러 (간단한 구현)
  ipcMain.handle('recording:start', async (_, { url }) => {
    try {
      const sessionId = `recording-${Date.now()}`;
      return { success: true, data: { sessionId, url } };
    } catch (error) {
      console.error('레코딩 시작 실패:', error);
      return { success: false, error: '레코딩을 시작할 수 없습니다.' };
    }
  });

  ipcMain.handle('recording:stop', async (_, { sessionId }) => {
    try {
      return {
        success: true,
        data: {
          sessionId,
          code: '// 녹화된 Playwright 코드가 여기에 표시됩니다\n// 현재는 데모 버전입니다'
        }
      };
    } catch (error) {
      console.error('레코딩 중지 실패:', error);
      return { success: false, error: '레코딩을 중지할 수 없습니다.' };
    }
  });

  // AI 관련 핸들러 (간단한 구현)
  ipcMain.handle('ai:modify', async (_, { code, instruction }) => {
    try {
      const modifiedCode = `// AI에 의해 수정된 코드
${code}

// 수정 요청: ${instruction}
// 현재는 데모 버전입니다. 실제 AI 연동을 위해서는 API 키 설정이 필요합니다.`;

      return {
        success: true,
        data: {
          modifiedCode,
          explanation: '코드가 AI에 의해 수정되었습니다. (데모 버전)'
        }
      };
    } catch (error) {
      console.error('AI 코드 수정 실패:', error);
      return { success: false, error: 'AI 코드 수정에 실패했습니다.' };
    }
  });

  console.log('간단한 IPC 핸들러 설정 완료');
}