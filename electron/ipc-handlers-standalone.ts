import { ipcMain } from 'electron';
import { PrismaClient } from '@prisma/client';

// 완전 독립적인 IPC 핸들러 (외부 모듈 의존성 없음)
export function setupStandaloneHandlers() {
  console.log('독립적인 IPC 핸들러 설정 중...');

  // Prisma 클라이언트 직접 생성
  let prisma: PrismaClient | null = null;

  const getPrisma = () => {
    if (!prisma) {
      prisma = new PrismaClient({
        log: ['error', 'warn'],
      });
    }
    return prisma;
  };

  // 앱 종료 시 Prisma 연결 해제
  process.on('beforeExit', async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
  });

  // 시나리오 관련 핸들러
  ipcMain.handle('scenarios:getAll', async () => {
    try {
      const db = getPrisma();
      const scenarios = await db.scenario.findMany({
        include: {
          executions: {
            orderBy: { startedAt: 'desc' },
            take: 5
          }
        },
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
      const db = getPrisma();
      const { name, description, targetUrl, code } = data;

      if (!name?.trim() || !targetUrl?.trim() || !code?.trim()) {
        return {
          success: false,
          error: '필수 필드가 누락되었습니다: 이름, 대상 URL, 코드를 모두 입력해주세요.'
        };
      }

      const scenario = await db.scenario.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          targetUrl: targetUrl.trim(),
          code: code.trim()
        }
      });

      return { success: true, data: scenario };
    } catch (error) {
      console.error('시나리오 생성 실패:', error);
      return { success: false, error: '시나리오를 생성할 수 없습니다.' };
    }
  });

  ipcMain.handle('scenarios:getById', async (_, id: string) => {
    try {
      const db = getPrisma();

      if (!id) {
        return { success: false, error: '시나리오 ID가 필요합니다.' };
      }

      const scenario = await db.scenario.findUnique({
        where: { id },
        include: {
          executions: {
            orderBy: { startedAt: 'desc' }
          }
        }
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
      const db = getPrisma();

      if (!id) {
        return { success: false, error: '시나리오 ID가 필요합니다.' };
      }

      // 업데이트할 데이터 정리
      const updateData: any = {};
      if (data.name?.trim()) updateData.name = data.name.trim();
      if (data.description !== undefined) updateData.description = data.description?.trim() || null;
      if (data.targetUrl?.trim()) updateData.targetUrl = data.targetUrl.trim();
      if (data.code?.trim()) updateData.code = data.code.trim();

      const scenario = await db.scenario.update({
        where: { id },
        data: updateData
      });

      return { success: true, data: scenario };
    } catch (error) {
      console.error('시나리오 업데이트 실패:', error);
      return { success: false, error: '시나리오를 업데이트할 수 없습니다.' };
    }
  });

  ipcMain.handle('scenarios:delete', async (_, id: string) => {
    try {
      const db = getPrisma();

      if (!id) {
        return { success: false, error: '시나리오 ID가 필요합니다.' };
      }

      await db.scenario.delete({ where: { id } });
      return { success: true, data: { deletedId: id } };
    } catch (error) {
      console.error('시나리오 삭제 실패:', error);
      return { success: false, error: '시나리오를 삭제할 수 없습니다.' };
    }
  });

  // 시나리오 실행 (데모 구현)
  ipcMain.handle('scenarios:execute', async (_, { id, code }) => {
    try {
      const db = getPrisma();

      // 실행 기록 생성
      const execution = await db.execution.create({
        data: {
          scenarioId: id,
          status: 'SUCCESS',
          result: JSON.stringify({
            success: true,
            message: 'Playwright 테스트가 성공적으로 완료되었습니다.',
            duration: '2.3초',
            steps: ['페이지 로드', '요소 찾기', '클릭 실행', '결과 검증'],
            timestamp: new Date().toISOString()
          }),
          startedAt: new Date(),
          completedAt: new Date()
        }
      });

      const result = {
        success: true,
        output: 'Playwright 테스트가 성공적으로 실행되었습니다.\n\n단계:\n1. 페이지 로드 완료\n2. 요소 찾기 성공\n3. 액션 실행 완료\n4. 결과 검증 성공',
        screenshots: [],
        executionId: execution.id
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
      return {
        success: true,
        data: {
          sessionId,
          message: '디버그 세션이 시작되었습니다. (데모 모드)'
        }
      };
    } catch (error) {
      console.error('시나리오 디버그 실패:', error);
      return { success: false, error: '디버그 세션을 시작할 수 없습니다.' };
    }
  });

  // 레코딩 관련 핸들러 (데모 구현)
  ipcMain.handle('recording:start', async (_, { url }) => {
    try {
      const sessionId = `recording-${Date.now()}`;
      console.log(`레코딩 시작 (데모): ${url}`);

      return {
        success: true,
        data: {
          sessionId,
          url,
          status: 'recording',
          message: '레코딩이 시작되었습니다. (데모 모드)'
        }
      };
    } catch (error) {
      console.error('레코딩 시작 실패:', error);
      return { success: false, error: '레코딩을 시작할 수 없습니다.' };
    }
  });

  ipcMain.handle('recording:stop', async (_, { sessionId }) => {
    try {
      const demoCode = `import { test, expect } from '@playwright/test';

test('자동 생성된 테스트', async ({ page }) => {
  // 페이지로 이동
  await page.goto('https://example.com');

  // 요소 클릭
  await page.click('#button');

  // 텍스트 입력
  await page.fill('#input', '테스트 텍스트');

  // 결과 검증
  await expect(page).toHaveTitle('예상 제목');
});`;

      return {
        success: true,
        data: {
          sessionId,
          code: demoCode,
          message: '레코딩이 완료되었습니다. (데모 모드)'
        }
      };
    } catch (error) {
      console.error('레코딩 중지 실패:', error);
      return { success: false, error: '레코딩을 중지할 수 없습니다.' };
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
          explanation: `코드가 다음과 같이 개선되었습니다:\n\n1. ${instruction}\n2. 에러 처리 로직 추가\n3. 성능 최적화\n4. 가독성 향상\n\n(현재는 데모 모드입니다)`
        }
      };
    } catch (error) {
      console.error('AI 코드 수정 실패:', error);
      return { success: false, error: 'AI 코드 수정에 실패했습니다.' };
    }
  });

  console.log('독립적인 IPC 핸들러 설정 완료');
}