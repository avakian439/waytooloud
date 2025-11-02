const electron = require('electron');
const { contextBridge, ipcRenderer } = electron;
  

// minimal declaration so TypeScript recognizes the type used in this file
type LimitData = any;
// FIXME: import the actual LimitData type from '../types' if possible
electron.contextBridge.exposeInMainWorld('electron', {
  saveLimits: (limits: LimitData[]) => ipcRenderer.invoke('save-limits', limits),
  loadLimits: () => ipcRenderer.invoke('load-limits'),
  selectSoundFile: () => ipcRenderer.invoke('select-sound-file'),
  getSoundPath: (fileName: string) => ipcRenderer.invoke('get-sound-path', fileName)
});
