import {app, BrowserWindow, ipcMain, dialog, protocol, Tray, Menu} from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { isDevMode } from './util.js';
import { getPreloadPath } from './pathresolver.js';
import { initAudioCapture } from './audiocapture.js';

const LIMITS_FILE = path.join(app.getPath('userData'), 'limits.json');
const SOUNDS_DIR = path.join(app.getPath('userData'), 'sounds');

let tray: Tray | null = null;
let mainWindow: BrowserWindow | null = null;
let isQuitting = false;

// Register custom protocol before app is ready
app.whenReady().then(() => {
  // Register a custom protocol to serve sound files
  protocol.registerFileProtocol('sounds', (request, callback) => {
    const url = request.url.replace('sounds://', '');
    const filePath = path.join(SOUNDS_DIR, url);
    callback({ path: filePath });
  });
});

function createTray(iconPath: string) {
  tray = new Tray(iconPath);
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: 'Hide to Tray',
      click: () => {
        if (mainWindow) {
          mainWindow.hide();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      }
    }
  ]);
  
  tray.setToolTip('WayTooLoud - Audio Monitor');
  tray.setContextMenu(contextMenu);
  
  // Double-click to show/hide window
  tray.on('double-click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}

app.on('ready', () => {
  const iconPath = isDevMode() 
    ? path.join(app.getAppPath(), 'desktopIcon.png')
    : path.join(app.getAppPath(), '..', 'desktopIcon.png');

  mainWindow = new BrowserWindow({
    icon: iconPath,
    webPreferences: {
      preload: getPreloadPath(),
      webSecurity: true, // Keep security enabled
    }
  });
  
  // Create system tray icon
  createTray(iconPath);
  
  // Prevent app from closing when window is closed, just hide it
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });
  
  // Initialize audio capture handlers
  initAudioCapture(mainWindow);
  
  if (isDevMode()) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), 'dist-react/index.html'));
  }
});

// Handle app quit
app.on('before-quit', () => {
  isQuitting = true;
});

// IPC handlers for limit data
ipcMain.handle('save-limits', async (_event, limits) => {
  try {
    await fs.writeFile(LIMITS_FILE, JSON.stringify(limits, null, 2), 'utf-8');
    return { success: true };
  } catch (error) {
    console.error('Error saving limits:', error);
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('load-limits', async () => {
  try {
    const data = await fs.readFile(LIMITS_FILE, 'utf-8');
    return { success: true, data: JSON.parse(data) };
  } catch {
    // File doesn't exist yet or other error
    console.log('No limits file found, returning empty array');
    return { success: true, data: [] };
  }
});

// Ensure sounds directory exists
async function ensureSoundsDir() {
  try {
    await fs.mkdir(SOUNDS_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating sounds directory:', error);
  }
}

// IPC handler for selecting and copying sound file
ipcMain.handle('select-sound-file', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Audio Files', extensions: ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'] }
    ]
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, canceled: true };
  }

  try {
    await ensureSoundsDir();
    
    const sourcePath = result.filePaths[0];
    const fileName = path.basename(sourcePath);
    const destPath = path.join(SOUNDS_DIR, fileName);

    // Copy the file to the sounds directory
    await fs.copyFile(sourcePath, destPath);

    return { 
      success: true, 
      fileName: fileName,
      filePath: destPath
    };
  } catch (error) {
    console.error('Error copying sound file:', error);
    return { success: false, error: (error as Error).message };
  }
});

// IPC handler for getting the full path to a sound file
ipcMain.handle('get-sound-path', async (_event, fileName: string) => {
  return path.join(SOUNDS_DIR, fileName);
});
