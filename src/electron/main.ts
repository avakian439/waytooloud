import {app, BrowserWindow, ipcMain, dialog, protocol, Tray, Menu} from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { isDevMode } from './util.js';
import { getPreloadPath } from './pathresolver.js';
import { initAudioCapture } from './audiocapture.js';
import electronUpdater, { type AppUpdater } from 'electron-updater';

export function getAutoUpdater(): AppUpdater {
   // Using destructuring to access autoUpdater due to the CommonJS module of 'electron-updater'.
   // It is a workaround for ESM compatibility issues, see https://github.com/electron-userland/electron-builder/issues/7976.
   const { autoUpdater } = electronUpdater;
   return autoUpdater;
}
const LIMITS_FILE = path.join(app.getPath('userData'), 'limits.json');
const SOUNDS_DIR = path.join(app.getPath('userData'), 'sounds');

let tray: Tray | null = null;
let mainWindow: BrowserWindow | null = null;
let isQuitting = false;
let hasShownTrayNotification = false; // Only show notification once per session

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

function setupAutoUpdater() {
  const autoUpdater = getAutoUpdater();
  
  // Only check for updates in production
  if (isDevMode()) {
    console.log('Auto-updater disabled in development mode');
    return;
  }

  // Configure auto-updater
  autoUpdater.autoDownload = false; // Don't auto-download, ask user first
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    console.log('Checking for updates...');
  });

  autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info.version);
    
    if (mainWindow) {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Update Available',
        message: `A new version (${info.version}) is available!`,
        detail: 'Would you like to download it now? The update will be installed when you close the app.',
        buttons: ['Download', 'Later'],
        defaultId: 0,
        cancelId: 1
      }).then((result) => {
        if (result.response === 0) {
          autoUpdater.downloadUpdate();
        }
      });
    }
  });

  autoUpdater.on('update-not-available', () => {
    console.log('No updates available');
  });

  autoUpdater.on('download-progress', (progressObj) => {
    const message = `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}%`;
    console.log(message);
    
    if (mainWindow) {
      mainWindow.setProgressBar(progressObj.percent / 100);
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded:', info.version);
    
    if (mainWindow) {
      mainWindow.setProgressBar(-1); // Remove progress bar
      
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Update Ready',
        message: 'Update downloaded successfully!',
        detail: 'The update will be installed when you close the application. Would you like to restart now?',
        buttons: ['Restart Now', 'Later'],
        defaultId: 0,
        cancelId: 1
      }).then((result) => {
        if (result.response === 0) {
          isQuitting = true;
          autoUpdater.quitAndInstall();
        }
      });
    }
  });

  autoUpdater.on('error', (error) => {
    console.error('Auto-updater error:', error);
    
    if (mainWindow) {
      mainWindow.setProgressBar(-1); // Remove progress bar on error
    }
  });

  // Check for updates on startup
  autoUpdater.checkForUpdates();
  
  // Check for updates every 4 hours
  setInterval(() => {
    autoUpdater.checkForUpdates();
  }, 4 * 60 * 60 * 1000);
}

app.on('ready', () => {
  const iconPath = isDevMode() 
    ? path.join(app.getAppPath(), 'desktopIcon.png')
    : path.join(app.getAppPath(), '..', 'desktopIcon.png');

  mainWindow = new BrowserWindow({
    width: 600,
    height: 800,
    minWidth: 600,
    minHeight: 500,
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
      
      // Show tray balloon the first time the app is minimized to tray
      if (!hasShownTrayNotification && tray) {
        tray.displayBalloon({
          title: 'WayTooLoud',
          content: 'App minimized to system tray. Audio monitoring continues in the background.',
          icon: iconPath
        });
        hasShownTrayNotification = true;
      }
    }
  });
  
  // Initialize audio capture handlers
  initAudioCapture(mainWindow);
  
  // Setup auto-updater after window is created
  setupAutoUpdater();
  
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
