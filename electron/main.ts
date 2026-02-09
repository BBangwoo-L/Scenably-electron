import { app, BrowserWindow } from 'electron';
import { join } from 'path';
import log from 'electron-log';
import { setupSQLiteHandlers } from './ipc-handlers-sqlite';
import { closeDatabase } from './database-sqlite';

// electron-log 설정
log.info('🚀 Scenably Electron Main Process Started');
log.info(`🔍 Process info - execPath: ${process.execPath}`);
log.info(`🔍 Process info - cwd: ${process.cwd()}`);
log.info(`🔍 Process info - platform: ${process.platform}`);
log.info(`🔍 Process info - resourcesPath: ${process.resourcesPath}`);
log.info(`🔍 Process info - NODE_ENV: ${process.env.NODE_ENV}`);

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
    mainWindow?.maximize();
    mainWindow?.show();
    if (isDevelopment) {
      mainWindow?.webContents.openDevTools();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    log.info('🏁 Scenably 앱 시작 중...');
    console.log('Scenably 앱 시작 중...');

    // SQLite IPC 핸들러 설정
    log.info('⚙️ SQLite IPC 핸들러 설정 시작...');
    setupSQLiteHandlers();
    log.info('✅ SQLite IPC 핸들러 설정 완료');

    // 메인 윈도우 생성
    log.info('🪟 메인 윈도우 생성 시작...');
    createWindow();
    log.info('✅ 메인 윈도우 생성 완료');

    log.info('🎉 앱 초기화 완료');
    console.log('앱 초기화 완료');
  } catch (error) {
    log.error('❌ 앱 초기화 실패:', error);
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