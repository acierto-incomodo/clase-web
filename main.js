const { app, BrowserWindow, Notification, Menu, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

autoUpdater.allowDowngrade = true;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    // Establece el icono de la ventana.
    icon: path.join(__dirname, 'img/logo_2048x2048.png'),
    webPreferences: {
      // Security best practices
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Maximiza la ventana al iniciar
  mainWindow.maximize();

  // Cargar la página web directamente
  mainWindow.loadURL('https://acierto-incomodo.github.io/clase-web/');

  // Manejo de errores de carga
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    // Ignorar error de cancelación (ej. al recargar rápidamente o navegar antes de terminar)
    if (errorCode === -3) return;

    const html = `
      <html>
        <body style="background-color: #121212; color: #e0e0e0; font-family: sans-serif; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; margin: 0;">
          <h2 style="color: #bb86fc;">¡Vaya! No se pudo cargar la página.</h2>
          <p>Comprueba tu conexión a internet.</p>
          <p style="color: #a0a0a0; font-size: 0.8em;">Error: ${errorDescription}</p>
          <button onclick="location.reload()" style="padding: 10px 20px; background-color: #bb86fc; color: #121212; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; margin-top: 20px;">Reintentar</button>
        </body>
      </html>
    `;
    mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
  });

  // Crear el menú de la aplicación
  const template = [
    {
      label: 'Menú',
      submenu: [
        {
          label: 'Ir a la página principal',
          click: () => {
            mainWindow.loadURL('https://acierto-incomodo.github.io/clase-web/');
          }
        },
        {
          label: 'Ir al repositorio',
          click: async () => {
            await shell.openExternal('https://github.com/acierto-incomodo/clase-web');
          }
        },
        { type: 'separator' },
        {
          label: 'Comprobar actualizaciones',
          click: () => {
            if (!app.isPackaged) {
              showUpdateNotification(
                'Información',
                'La búsqueda de actualizaciones solo funciona en la aplicación empaquetada.',
              );
              return;
            }
            autoUpdater.checkForUpdates();
          }
        },
        { type: 'separator' },
        { role: 'quit', label: 'Salir' }
      ]
    },
    {
      label: 'Navegación',
      submenu: [
        {
          label: 'Atrás',
          accelerator: 'Alt+Left',
          click: () => {
            if (mainWindow.webContents.canGoBack())
              mainWindow.webContents.goBack();
          }
        },
        {
          label: 'Adelante',
          accelerator: 'Alt+Right',
          click: () => {
            if (mainWindow.webContents.canGoForward())
              mainWindow.webContents.goForward();
          }
        }
      ]
    },
    {
      label: 'Edición',
      submenu: [
        { role: 'undo', label: 'Deshacer' },
        { role: 'redo', label: 'Rehacer' },
        { type: 'separator' },
        { role: 'cut', label: 'Cortar' },
        { role: 'copy', label: 'Copiar' },
        { role: 'paste', label: 'Pegar' },
        { role: 'selectAll', label: 'Seleccionar todo' }
      ]
    },
    {
      label: 'Ver',
      submenu: [
        { role: 'reload', label: 'Recargar' },
        { role: 'forceReload', label: 'Forzar recarga' },
        { role: 'toggleDevTools', label: 'Herramientas de desarrollo' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Tamaño real' },
        { role: 'zoomIn', label: 'Acercar' },
        { role: 'zoomOut', label: 'Alejar' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Pantalla completa' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // Menú contextual (clic derecho)
  mainWindow.webContents.on('context-menu', (e, params) => {
    Menu.buildFromTemplate([
      { role: 'cut', label: 'Cortar', visible: params.editFlags.canCut },
      { role: 'copy', label: 'Copiar', visible: params.editFlags.canCopy },
      { role: 'paste', label: 'Pegar', visible: params.editFlags.canPaste },
      { type: 'separator', visible: params.editFlags.canCut || params.editFlags.canCopy || params.editFlags.canPaste },
      { role: 'selectAll', label: 'Seleccionar todo' },
      { type: 'separator' },
      { role: 'reload', label: 'Recargar' }
    ]).popup(mainWindow);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', async () => {
  createWindow();

  // Only check for updates when the app is packaged
  if (app.isPackaged) {
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

// Helper para mostrar notificaciones
function showUpdateNotification(title, body) {
  if (Notification.isSupported()) {
    new Notification({ title, body }).show();
  }
}

// Cuando se encuentra una actualización, se muestra una notificación.
autoUpdater.on('update-available', (info) => {
  showUpdateNotification(
    'Actualización disponible',
    `Descargando la versión ${info.version}...`
  );
});

// Muestra el progreso de la descarga en la barra de tareas
autoUpdater.on('download-progress', (progressObj) => {
  if (mainWindow) {
    // El progreso es un valor de 0 a 1
    mainWindow.setProgressBar(progressObj.percent / 100);
  }
});

autoUpdater.on('update-downloaded', (info) => {
  // La actualización está lista. Se quita la barra de progreso y se notifica al usuario.
  if (mainWindow) {
    mainWindow.setProgressBar(-1);
  }
  showUpdateNotification(
    'Actualización lista',
    'La aplicación se reiniciará en breve para instalar la nueva versión.'
  );
  // Salir e instalar silenciosamente después de un breve retraso
  setTimeout(() => {
    autoUpdater.quitAndInstall(false, true);
  }, 3000);
});

autoUpdater.on('error', (err) => {
  if (mainWindow) {
    mainWindow.setProgressBar(-1); // Limpiar la barra de progreso en caso de error
  }
  showUpdateNotification('Error en la actualización', `Ocurrió un error: ${err.message}`);
});

autoUpdater.on('update-not-available', (info) => {
  showUpdateNotification('Sin actualizaciones', 'No hay nuevas actualizaciones disponibles.');
});