const electron = require('electron');
const { contextBridge, ipcRenderer } = electron;
  

// minimal declaration so TypeScript recognizes the type used in this file
type LimitData = {
  id: string;
  name: string;
  timeframeFrom: string;
  timeframeTo: string;
  weekdays: string[];
  soundFile: string;
  dbThreshold: number;
};
electron.contextBridge.exposeInMainWorld('electron', {
  saveLimits: (limits: LimitData[]) => ipcRenderer.invoke('save-limits', limits),
  loadLimits: () => ipcRenderer.invoke('load-limits'),
  selectSoundFile: () => ipcRenderer.invoke('select-sound-file'),
  getSoundPath: (fileName: string) => ipcRenderer.invoke('get-sound-path', fileName),
  startAudioCapture: () => ipcRenderer.invoke('start-audio-capture'),
  stopAudioCapture: () => ipcRenderer.invoke('stop-audio-capture'),
  onStartAudioMonitoring: (callback: () => void) => {
    ipcRenderer.on('start-audio-monitoring', callback);
  },
  onStopAudioMonitoring: (callback: () => void) => {
    ipcRenderer.on('stop-audio-monitoring', callback);
  },
  onAudioLevel: (callback: (level: number) => void) => {
    ipcRenderer.on('audio-level', (_event: any, level: number) => callback(level));
  }
});
