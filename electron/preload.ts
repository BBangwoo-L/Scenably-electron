import { contextBridge, ipcRenderer } from 'electron';

const electronAPI = {
  // 추후 필요한 API들을 여기에 추가할 예정
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);