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

  // 실행 관련 API
  executions: {
    getById: (id: string) => ipcRenderer.invoke('executions:getById', id),
    onStatusChanged: (callback: (data: any) => void) => {
      ipcRenderer.on('execution:statusChanged', (_, data) => callback(data));
      return () => { ipcRenderer.removeAllListeners('execution:statusChanged'); };
    },
  },

  // 레코딩 관련 API
  recording: {
    start: (url: string) => ipcRenderer.invoke('recording:start', { url }),
    stop: (sessionId: string) => ipcRenderer.invoke('recording:stop', { sessionId }),
    onError: (callback: (data: any) => void) => {
      ipcRenderer.on('recording:error', (_, data) => callback(data));
      return () => { ipcRenderer.removeAllListeners('recording:error'); };
    },
  },

  // AI 관련 API
  ai: {
    modify: (code: string, instruction: string) => ipcRenderer.invoke('ai:modify', { code, instruction }),
  },

  // 스케줄 관련 API
  schedules: {
    getByScenarioId: (scenarioId: string) => ipcRenderer.invoke('schedules:getByScenarioId', scenarioId),
    save: (data: any) => ipcRenderer.invoke('schedules:save', data),
    toggle: (scenarioId: string, enabled: boolean) => ipcRenderer.invoke('schedules:toggle', { scenarioId, enabled }),
    delete: (scenarioId: string) => ipcRenderer.invoke('schedules:delete', scenarioId),
    list: () => ipcRenderer.invoke('schedules:list'),
    runs: (scheduleId: string) => ipcRenderer.invoke('schedules:runs', scheduleId),
  },
};

// TypeScript 타입 정의를 위해 전역 타입 확장
declare global {
  interface Window {
    electronAPI: typeof electronAPI;
  }
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
