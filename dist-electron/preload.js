"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const electronAPI = {
    // 시나리오 관련 API
    scenarios: {
        getAll: () => electron_1.ipcRenderer.invoke('scenarios:getAll'),
        create: (data) => electron_1.ipcRenderer.invoke('scenarios:create', data),
        getById: (id) => electron_1.ipcRenderer.invoke('scenarios:getById', id),
        update: (id, data) => electron_1.ipcRenderer.invoke('scenarios:update', { id, data }),
        delete: (id) => electron_1.ipcRenderer.invoke('scenarios:delete', id),
        execute: (id, code) => electron_1.ipcRenderer.invoke('scenarios:execute', { id, code }),
        debug: (code) => electron_1.ipcRenderer.invoke('scenarios:debug', { code }),
    },
    // 레코딩 관련 API
    recording: {
        start: (url) => electron_1.ipcRenderer.invoke('recording:start', { url }),
        stop: (sessionId) => electron_1.ipcRenderer.invoke('recording:stop', { sessionId }),
    },
    // AI 관련 API
    ai: {
        modify: (code, instruction) => electron_1.ipcRenderer.invoke('ai:modify', { code, instruction }),
    },
};
electron_1.contextBridge.exposeInMainWorld('electronAPI', electronAPI);
