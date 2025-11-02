// This file manages audio capture communication between main and renderer processes
// The actual audio capture happens in the renderer process where Web Audio API is available

import { ipcMain, BrowserWindow } from 'electron';

let mainWindow: BrowserWindow | null = null;

export function initAudioCapture(window: BrowserWindow) {
  mainWindow = window;
  
  // Handle start audio capture request
  ipcMain.handle('start-audio-capture', async () => {
    try {
      // Request the renderer to start capturing audio
      mainWindow?.webContents.send('start-audio-monitoring');
      return { success: true };
    } catch (error) {
      console.error('Error starting audio capture:', error);
      return { success: false, error: (error as Error).message };
    }
  });
  
  // Handle stop audio capture request
  ipcMain.handle('stop-audio-capture', async () => {
    try {
      mainWindow?.webContents.send('stop-audio-monitoring');
      return { success: true };
    } catch (error) {
      console.error('Error stopping audio capture:', error);
      return { success: false, error: (error as Error).message };
    }
  });
}

export function cleanupAudioCapture() {
  mainWindow = null;
}
