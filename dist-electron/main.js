"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = require("path");
const electron_log_1 = __importDefault(require("electron-log"));
const ipc_handlers_sqlite_1 = require("./ipc-handlers-sqlite");
const database_sqlite_1 = require("./database-sqlite");
// electron-log 설정
electron_log_1.default.info('🚀 Scenably Electron Main Process Started');
electron_log_1.default.info(`🔍 Process info - execPath: ${process.execPath}`);
electron_log_1.default.info(`🔍 Process info - cwd: ${process.cwd()}`);
electron_log_1.default.info(`🔍 Process info - platform: ${process.platform}`);
electron_log_1.default.info(`🔍 Process info - resourcesPath: ${process.resourcesPath}`);
electron_log_1.default.info(`🔍 Process info - NODE_ENV: ${process.env.NODE_ENV}`);
// SQLite 데이터베이스는 자동으로 초기화됩니다
const isDevelopment = process.env.NODE_ENV === 'development';
let mainWindow = null;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        title: 'Scenably - E2E Testing Scenario Builder',
        width: 1200,
        height: 800,
        icon: (0, path_1.join)(__dirname, '../assets/icon.png'), // 앱 아이콘 설정
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: (0, path_1.join)(__dirname, 'preload.js'),
        },
        show: false,
    });
    // Vite로 빌드된 React 렌더러 사용
    const htmlPath = (0, path_1.join)(__dirname, 'index.html');
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
electron_1.app.whenReady().then(async () => {
    try {
        electron_log_1.default.info('🏁 Scenably 앱 시작 중...');
        console.log('Scenably 앱 시작 중...');
        // SQLite IPC 핸들러 설정
        electron_log_1.default.info('⚙️ SQLite IPC 핸들러 설정 시작...');
        (0, ipc_handlers_sqlite_1.setupSQLiteHandlers)();
        electron_log_1.default.info('✅ SQLite IPC 핸들러 설정 완료');
        // 메인 윈도우 생성
        electron_log_1.default.info('🪟 메인 윈도우 생성 시작...');
        createWindow();
        electron_log_1.default.info('✅ 메인 윈도우 생성 완료');
        electron_log_1.default.info('🎉 앱 초기화 완료');
        console.log('앱 초기화 완료');
    }
    catch (error) {
        electron_log_1.default.error('❌ 앱 초기화 실패:', error);
        console.error('앱 초기화 실패:', error);
        // 에러가 있어도 앱은 실행
        createWindow();
    }
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        (0, database_sqlite_1.closeDatabase)(); // SQLite 연결 정리
        electron_1.app.quit();
    }
});
electron_1.app.on('before-quit', () => {
    (0, database_sqlite_1.closeDatabase)(); // 앱 종료 전 데이터베이스 연결 닫기
});
electron_1.app.on('activate', () => {
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
