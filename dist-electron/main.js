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
        // Prisma 환경 설정 (패키징된 앱에서 필요)
        if (electron_1.app.isPackaged) {
            // 패키징된 환경에서 Prisma 경로 설정
            const resourcesPath = process.resourcesPath;
            const prismaPath = (0, path_1.join)(resourcesPath, 'node_modules', '.prisma');
            const prismaClientPath = (0, path_1.join)(resourcesPath, 'app.asar.unpacked', 'node_modules', '@prisma', 'client');
            console.log('Prisma 경로 설정:', {
                resourcesPath,
                prismaPath,
                prismaClientPath
            });
            // Node.js 모듈 경로에 Prisma 클라이언트 추가
            const Module = require('module');
            const originalResolveFilename = Module._resolveFilename;
            Module._resolveFilename = function (request, parent, isMain, options) {
                // @prisma/client 요청을 올바른 경로로 리디렉션
                if (request === '@prisma/client' || request.startsWith('@prisma/client/')) {
                    const targetPath = request.replace('@prisma/client', prismaClientPath);
                    console.log(`Prisma 모듈 리디렉션: ${request} -> ${targetPath}`);
                    return originalResolveFilename.call(this, targetPath, parent, isMain, options);
                }
                return originalResolveFilename.call(this, request, parent, isMain, options);
            };
            // Windows 환경에 맞는 바이너리 설정
            if (process.platform === 'win32') {
                process.env.PRISMA_QUERY_ENGINE_LIBRARY = (0, path_1.join)(prismaPath, 'client', 'libquery_engine-windows.dll.node');
                process.env.PRISMA_SCHEMA_ENGINE_BINARY = (0, path_1.join)(prismaPath, 'client', 'schema-engine-windows.exe');
                process.env.PRISMA_QUERY_ENGINE_BINARY = (0, path_1.join)(prismaPath, 'client', 'query-engine-windows.exe');
            }
        }
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
