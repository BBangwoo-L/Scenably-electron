"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = require("path");
const fs_1 = require("fs");
const database_1 = require("./database");
const ipc_handlers_standalone_1 = require("./ipc-handlers-standalone");
// 로컬 데이터베이스 설정
async function setupDatabase() {
    const userDataPath = electron_1.app.getPath('userData');
    const dbDir = (0, path_1.join)(userDataPath, 'database');
    // 데이터베이스 폴더가 없으면 생성
    if (!(0, fs_1.existsSync)(dbDir)) {
        (0, fs_1.mkdirSync)(dbDir, { recursive: true });
    }
    const dbPath = (0, path_1.join)(dbDir, 'scenably.db');
    // 환경변수 설정
    process.env.DATABASE_URL = `file:${dbPath}`;
    console.log('데이터베이스 경로 설정됨:', dbPath);
    // 데이터베이스 초기화
    await (0, database_1.initializeDatabase)();
    return dbPath;
}
const isDevelopment = process.env.NODE_ENV === 'development';
let mainWindow = null;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: (0, path_1.join)(__dirname, 'preload.js'),
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
electron_1.app.whenReady().then(async () => {
    try {
        // 데이터베이스 설정을 가장 먼저 실행
        await setupDatabase();
        // IPC 핸들러 설정
        (0, ipc_handlers_standalone_1.setupStandaloneHandlers)();
        createWindow();
    }
    catch (error) {
        console.error('앱 초기화 실패:', error);
        // 데이터베이스 오류가 있어도 앱은 실행
        createWindow();
    }
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
