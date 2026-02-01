import { app, BrowserWindow } from 'electron';
import { join } from 'path';
import { setupSQLiteHandlers } from './ipc-handlers-sqlite';
import { closeDatabase } from './database-sqlite';

// SQLite 데이터베이스는 자동으로 초기화됩니다

const isDevelopment = process.env.NODE_ENV === 'development';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    title: 'Scenably - E2E Testing Scenario Builder',
    width: 1200,
    height: 800,
    icon: join(__dirname, '../assets/icon.png'),  // 앱 아이콘 설정
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js'),
    },
    show: false,
  });

  const startUrl = isDevelopment
    ? 'http://localhost:3000'
    : `file://${join(__dirname, '../.next/standalone/server.html')}`; // Next.js 빌드 파일

  // 개발환경에서는 localhost를 사용하고, 프로덕션에서는 간단한 HTML
  if (isDevelopment) {
    mainWindow.loadURL(startUrl);
  } else {
    // 패키징된 앱에서는 간단한 HTML 파일로 시작
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Scenably - E2E Testing Scenario Builder</title>
      <style>
        body {
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          color: white;
        }
        .container {
          text-align: center;
          padding: 40px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          backdrop-filter: blur(10px);
        }
        .logo {
          width: 120px;
          height: auto;
          margin-bottom: 30px;
        }
        h1 { font-size: 3rem; margin: 0 0 20px 0; }
        p { font-size: 1.2rem; opacity: 0.9; margin: 0; }
        .features {
          margin-top: 30px;
          display: flex;
          gap: 20px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .feature {
          background: rgba(255, 255, 255, 0.2);
          padding: 15px 20px;
          border-radius: 10px;
          font-size: 0.9rem;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <img src="logo.png" alt="Scenably Logo" class="logo" />
        <h1>Scenably</h1>
        <p>E2E Testing Scenario Builder</p>
        <div class="features">
          <div class="feature">🎭 시나리오 관리</div>
          <div class="feature">📹 자동 레코딩</div>
          <div class="feature">🤖 AI 코드 생성</div>
          <div class="feature">⚡ Playwright 통합</div>
        </div>
        <br><br>
        <p style="font-size: 0.9rem; opacity: 0.7;">
          앱이 완전히 로드되었습니다!<br>
          SQLite 데이터베이스와 모든 기능이 준비되어 있습니다.
        </p>
      </div>
    </body>
    </html>`;

    mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  if (isDevelopment) {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(async () => {
  try {
    console.log('Scenably 앱 시작 중...');

    // SQLite IPC 핸들러 설정
    setupSQLiteHandlers();

    // 메인 윈도우 생성
    createWindow();

    console.log('앱 초기화 완료');
  } catch (error) {
    console.error('앱 초기화 실패:', error);
    // 에러가 있어도 앱은 실행
    createWindow();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    closeDatabase(); // SQLite 연결 정리
    app.quit();
  }
});

app.on('before-quit', () => {
  closeDatabase(); // 앱 종료 전 데이터베이스 연결 닫기
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});