const { app, BrowserWindow } = require('electron');
const { autoUpdater } = require('electron-updater');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // Security best practices
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load the web page
  mainWindow.loadURL('https://acierto-incomodo.github.io/clase-web/');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', () => {
  createWindow();

  // Only check for updates when the app is packaged
  if (app.isPackaged) {
    // This will check for updates and download them automatically in the background
    autoUpdater.checkForUpdates();
  }
});

app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// --- Auto-update Logic ---
autoUpdater.on('update-downloaded', (info) => {
  // The update is ready. Quit and install it silently.
  autoUpdater.quitAndInstall(true, true);
});