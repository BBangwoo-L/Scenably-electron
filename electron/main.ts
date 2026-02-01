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

  // 개발환경에서는 localhost, 프로덕션에서는 정적 파일
  if (isDevelopment) {
    mainWindow.loadURL(startUrl);
  } else {
    // 패키징된 앱에서는 Next.js static export 사용
    const htmlPath = join(__dirname, '../.next/server/app/index.html');
    console.log('HTML 파일 로드:', htmlPath);
    mainWindow.loadFile(htmlPath);

    // 클라이언트 사이드 라우팅을 위한 핸들러
    mainWindow.webContents.on('will-navigate', (event, url) => {
      event.preventDefault();
      // URL이 같은 도메인이고 라우팅 경로인 경우
      if (url.includes('/scenario/')) {
        if (url.includes('/scenario/new')) {
          const newScenarioPath = join(__dirname, '../.next/server/app/scenario/new.html');
          mainWindow?.loadFile(newScenarioPath);
        } else if (url.includes('/scenario/edit/')) {
          const editScenarioPath = join(__dirname, '../.next/server/app/scenario/edit/id.html');
          mainWindow?.loadFile(editScenarioPath);
        }
      } else if (url.includes('/test-optimizer')) {
        const optimizerPath = join(__dirname, '../.next/server/app/test-optimizer.html');
        mainWindow?.loadFile(optimizerPath);
      } else {
        // 기본 홈페이지로 이동
        mainWindow?.loadFile(htmlPath);
      }
    });
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