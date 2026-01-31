import { app, BrowserWindow } from 'electron';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { initializeDatabase } from './database';
import { setupStandaloneHandlers } from './ipc-handlers-standalone';

// 로컬 데이터베이스 설정
async function setupDatabase() {
  const userDataPath = app.getPath('userData');
  const dbDir = join(userDataPath, 'database');

  // 데이터베이스 폴더가 없으면 생성
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = join(dbDir, 'scenably.db');

  // 환경변수 설정
  process.env.DATABASE_URL = `file:${dbPath}`;

  console.log('데이터베이스 경로 설정됨:', dbPath);

  // 데이터베이스 초기화
  await initializeDatabase();

  return dbPath;
}

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
    // Prisma 환경 설정 (패키징된 앱에서 필요)
    if (app.isPackaged) {
      // 패키징된 환경에서 Prisma 경로 설정
      const resourcesPath = process.resourcesPath;
      const prismaPath = join(resourcesPath, 'node_modules', '.prisma');

      console.log('Prisma 경로 설정:', prismaPath);

      // Windows 환경에 맞는 바이너리 설정
      if (process.platform === 'win32') {
        process.env.PRISMA_QUERY_ENGINE_LIBRARY = join(prismaPath, 'client', 'libquery_engine-windows.dll.node');
        process.env.PRISMA_SCHEMA_ENGINE_BINARY = join(prismaPath, 'client', 'schema-engine-windows.exe');
        process.env.PRISMA_QUERY_ENGINE_BINARY = join(prismaPath, 'client', 'query-engine-windows.exe');
      }
    }

    // 데이터베이스 설정을 가장 먼저 실행
    await setupDatabase();

    // IPC 핸들러 설정
    setupStandaloneHandlers();

    createWindow();
  } catch (error) {
    console.error('앱 초기화 실패:', error);
    // 데이터베이스 오류가 있어도 앱은 실행
    createWindow();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});