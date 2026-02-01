import { app, BrowserWindow } from 'electron';
import { join } from 'path';
import { setupSQLiteHandlers } from './ipc-handlers-sqlite';
import { closeDatabase } from './database-sqlite';

// SQLite 데이터베이스는 자동으로 초기화됩니다

const isDevelopment = process.env.NODE_ENV === 'development';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js'),
    },
    show: false,
  });

  const startUrl = 'http://localhost:3000';

  mainWindow.loadURL(startUrl);

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