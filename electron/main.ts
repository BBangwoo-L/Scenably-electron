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

  // Vite로 빌드된 React 렌더러 사용
  const htmlPath = join(__dirname, 'index.html');
  console.log('HTML 파일 로드:', htmlPath);
  mainWindow.loadFile(htmlPath);

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    // 디버깅을 위해 개발자 도구 항상 열기
    mainWindow?.webContents.openDevTools();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {₩
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