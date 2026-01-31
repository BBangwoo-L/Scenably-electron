import { contextBridge, ipcRenderer } from 'electron';

const electronAPI = {
  // 시나리오 관련 API
  scenarios: {
    getAll: () => ipcRenderer.invoke('scenarios:getAll'),
    create: (data: any) => ipcRenderer.invoke('scenarios:create', data),
    getById: (id: string) => ipcRenderer.invoke('scenarios:getById', id),
    update: (id: string, data: any) => ipcRenderer.invoke('scenarios:update', { id, data }),
    delete: (id: string) => ipcRenderer.invoke('scenarios:delete', id),
    execute: (id: string, code: string) => ipcRenderer.invoke('scenarios:execute', { id, code }),
    debug: (code: string) => ipcRenderer.invoke('scenarios:debug', { code }),
  },

  // 레코딩 관련 API
  recording: {
    start: (url: string) => ipcRenderer.invoke('recording:start', { url }),
    stop: (sessionId: string) => ipcRenderer.invoke('recording:stop', { sessionId }),
  },

  // AI 관련 API
  ai: {
    modify: (code: string, instruction: string) => ipcRenderer.invoke('ai:modify', { code, instruction }),
  },
};

// TypeScript 타입 정의를 위해 전역 타입 확장
declare global {
  interface Window {
    electronAPI: typeof electronAPI;
  }
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI);