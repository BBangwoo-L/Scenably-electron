"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupScenarioHandlers = setupScenarioHandlers;
exports.setupRecordingHandlers = setupRecordingHandlers;
exports.setupAIHandlers = setupAIHandlers;
exports.setupAllHandlers = setupAllHandlers;
const electron_1 = require("electron");
const scenario_1 = require("../src/lib/db/scenario");
const executor_1 = require("../src/lib/playwright/executor");
const recorder_1 = require("../src/lib/playwright/recorder");
// 시나리오 관련 IPC 핸들러
function setupScenarioHandlers() {
    // 모든 시나리오 조회
    electron_1.ipcMain.handle('scenarios:getAll', async () => {
        try {
            const scenarios = await scenario_1.ScenarioService.findAll();
            return { success: true, data: scenarios };
        }
        catch (error) {
            console.error('시나리오 목록 조회 실패:', error);
            return { success: false, error: '시나리오 목록을 가져올 수 없습니다.' };
        }
    });
    // 시나리오 생성
    electron_1.ipcMain.handle('scenarios:create', async (_, data) => {
        try {
            const { name, description, targetUrl, code } = data;
            if (!name || !targetUrl || !code) {
                return { success: false, error: '필수 필드가 누락되었습니다: name, targetUrl, code' };
            }
            const scenario = await scenario_1.ScenarioService.create({
                name,
                description,
                targetUrl,
                code,
            });
            return { success: true, data: scenario };
        }
        catch (error) {
            console.error('시나리오 생성 실패:', error);
            return { success: false, error: '시나리오를 생성할 수 없습니다.' };
        }
    });
    // 시나리오 조회
    electron_1.ipcMain.handle('scenarios:getById', async (_, id) => {
        try {
            const scenario = await scenario_1.ScenarioService.findById(id);
            if (!scenario) {
                return { success: false, error: '시나리오를 찾을 수 없습니다.' };
            }
            return { success: true, data: scenario };
        }
        catch (error) {
            console.error('시나리오 조회 실패:', error);
            return { success: false, error: '시나리오를 조회할 수 없습니다.' };
        }
    });
    // 시나리오 업데이트
    electron_1.ipcMain.handle('scenarios:update', async (_, { id, data }) => {
        try {
            const scenario = await scenario_1.ScenarioService.update(id, data);
            return { success: true, data: scenario };
        }
        catch (error) {
            console.error('시나리오 업데이트 실패:', error);
            return { success: false, error: '시나리오를 업데이트할 수 없습니다.' };
        }
    });
    // 시나리오 삭제
    electron_1.ipcMain.handle('scenarios:delete', async (_, id) => {
        try {
            await scenario_1.ScenarioService.delete(id);
            return { success: true };
        }
        catch (error) {
            console.error('시나리오 삭제 실패:', error);
            return { success: false, error: '시나리오를 삭제할 수 없습니다.' };
        }
    });
    // 시나리오 실행
    electron_1.ipcMain.handle('scenarios:execute', async (_, { id, code }) => {
        try {
            const result = await executor_1.PlaywrightExecutor.executeScenario(code, id);
            return { success: true, data: result };
        }
        catch (error) {
            console.error('시나리오 실행 실패:', error);
            return { success: false, error: '시나리오를 실행할 수 없습니다.' };
        }
    });
    // 시나리오 디버그 (임시로 실행과 동일하게 처리)
    electron_1.ipcMain.handle('scenarios:debug', async (_, { code }) => {
        try {
            // 임시 디버그 세션 ID 생성
            const sessionId = `debug-${Date.now()}`;
            return { success: true, data: { sessionId } };
        }
        catch (error) {
            console.error('시나리오 디버그 실패:', error);
            return { success: false, error: '디버그 세션을 시작할 수 없습니다.' };
        }
    });
}
// 레코딩 관련 IPC 핸들러
function setupRecordingHandlers() {
    // 레코딩 시작
    electron_1.ipcMain.handle('recording:start', async (_, { url }) => {
        try {
            const session = await recorder_1.PlaywrightRecorder.startRecording(url, {});
            return { success: true, data: session };
        }
        catch (error) {
            console.error('레코딩 시작 실패:', error);
            return { success: false, error: '레코딩을 시작할 수 없습니다.' };
        }
    });
    // 레코딩 중지
    electron_1.ipcMain.handle('recording:stop', async (_, { sessionId }) => {
        try {
            const result = await recorder_1.PlaywrightRecorder.stopRecording(sessionId);
            return { success: true, data: result };
        }
        catch (error) {
            console.error('레코딩 중지 실패:', error);
            return { success: false, error: '레코딩을 중지할 수 없습니다.' };
        }
    });
}
// AI 관련 IPC 핸들러
function setupAIHandlers() {
    // AI 코드 수정
    electron_1.ipcMain.handle('ai:modify', async (_, { code, instruction }) => {
        try {
            // AI 서비스 호출 (기존 AI 로직 사용)
            const { ClaudeService } = await Promise.resolve().then(() => __importStar(require('../src/lib/ai/claude')));
            const result = await ClaudeService.modifyScenario({
                currentCode: code,
                modificationRequest: instruction,
                targetUrl: ''
            });
            return { success: true, data: result };
        }
        catch (error) {
            console.error('AI 코드 수정 실패:', error);
            return { success: false, error: 'AI 코드 수정에 실패했습니다.' };
        }
    });
}
// 모든 핸들러 설정
function setupAllHandlers() {
    console.log('IPC 핸들러 설정 중...');
    setupScenarioHandlers();
    setupRecordingHandlers();
    setupAIHandlers();
    console.log('IPC 핸들러 설정 완료');
}
