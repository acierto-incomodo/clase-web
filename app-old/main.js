const { app, BrowserWindow, Notification, Menu, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const https = require('https');
const extract = require('extract-zip');
const { URL } = require('url');

autoUpdater.allowDowngrade = true;

let mainWindow;
let offlineContentDir = null;

// --- Descarga y gestión de contenidos offline (asignaturas en .zip) ---

function getContentBaseDir() {
  const version = app.getVersion();
  return path.join(app.getPath('userData'), 'offline-content', version);
}

// TODO: sustituir estas URLs por las reales donde publiques parte1.zip y parte2.zip
const CONTENT_PACKS = [
  {
    name: 'parte1.zip',
    url: 'https://github.com/acierto-incomodo/clase-web/releases/latest/download/parte1.zip',
  },
  {
    name: 'parte2.zip',
    url: 'https://github.com/acierto-incomodo/clase-web/releases/latest/download/parte2.zip',
  },
  {
    name: 'parte3.zip',
    url: 'https://github.com/acierto-incomodo/clase-web/releases/latest/download/parte3.zip',
  }
];

function downloadFile(url, destination, onProgress, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 10) {
      reject(new Error(`Demasiadas redirecciones al descargar: ${url}`));
      return;
    }

    const requestUrl = new URL(url);
    const file = fs.createWriteStream(destination);

    const req = https.get(
      {
        protocol: requestUrl.protocol,
        hostname: requestUrl.hostname,
        path: requestUrl.pathname + requestUrl.search,
        headers: {
          'User-Agent': 'Clase-Web',
          Accept: '*/*',
        },
      },
      (response) => {
        // Seguir redirects (GitHub assets normalmente redirigen)
        if (
          response.statusCode &&
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location
        ) {
          file.close(() => {
            try {
              fs.unlinkSync(destination);
            } catch {
              // ignore
            }
            const nextUrl = new URL(response.headers.location, requestUrl).toString();
            resolve(downloadFile(nextUrl, destination, onProgress, redirectCount + 1));
          });
          return;
        }

        if (response.statusCode !== 200) {
          reject(new Error(`Fallo al descargar ${url}: código ${response.statusCode}`));
          return;
        }

        const total = Number(response.headers['content-length'] || 0);
        let received = 0;

        response.on('data', (chunk) => {
          received += chunk.length;
          if (onProgress && total > 0) {
            onProgress(received / total);
          } else if (onProgress) {
            onProgress(null); // progreso desconocido
          }
        });

        response.pipe(file);
        file.on('finish', () => {
          file.close(() => resolve());
        });
      },
    );

    req.on('error', (err) => {
      fs.unlink(destination, () => reject(err));
    });
  });
}

async function ensureOfflineContent(onOverallProgress) {
  const contentDir = getContentBaseDir();
  const asignaturasDir = path.join(contentDir, 'asignaturas');

  // Si ya existe la carpeta asignaturas para esta versión, no hacemos nada
  if (fs.existsSync(asignaturasDir)) {
    return contentDir;
  }

  fs.mkdirSync(contentDir, { recursive: true });

  const totalPacks = CONTENT_PACKS.length;
  const downloadWeight = 0.85; // 85% descarga, 15% extracción/copia

  for (let i = 0; i < totalPacks; i++) {
    const pack = CONTENT_PACKS[i];
    const zipPath = path.join(contentDir, pack.name);
    if (!fs.existsSync(zipPath)) {
      await downloadFile(pack.url, zipPath, (p) => {
        if (!onOverallProgress) return;
        const packProgress = p == null ? 0 : p;
        const overall =
          (i / totalPacks) * downloadWeight +
          (packProgress / totalPacks) * downloadWeight;
        onOverallProgress(overall);
      });
    }

    if (onOverallProgress) {
      onOverallProgress(downloadWeight);
    }

    // extract-zip no ofrece progreso fino: usamos modo indeterminado mientras extrae
    if (onOverallProgress) {
      onOverallProgress(2); // indeterminado
    }
    await extract(zipPath, { dir: contentDir });
  }

  if (onOverallProgress) {
    onOverallProgress(0.95);
  }

  // Copiar offline-index.html y style.css al directorio de contenido
  const appDir = __dirname;
  const offlineIndexSrc = path.join(appDir, 'offline-index.html');
  const offlineIndexDest = path.join(contentDir, 'offline-index.html');
  if (fs.existsSync(offlineIndexSrc)) {
    fs.copyFileSync(offlineIndexSrc, offlineIndexDest);
  }

  const styleSrc = path.join(appDir, 'style.css');
  const styleDest = path.join(contentDir, 'style.css');
  if (fs.existsSync(styleSrc)) {
    fs.copyFileSync(styleSrc, styleDest);
  }

  if (onOverallProgress) {
    onOverallProgress(1);
  }

  return contentDir;
}

function createWindow(contentDir) {
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

  // Load the web page:
  // - En modo empaquetado: usar el contenido offline extraído (offline-index.html) cuando exista
  // - En modo empaquetado mientras se prepara el contenido: pantalla de carga
  // - En desarrollo: usar el index.html original del proyecto
  const effectiveContentDir = contentDir || offlineContentDir;
  if (app.isPackaged && effectiveContentDir) {
    const offlineIndexPath = path.join(effectiveContentDir, 'offline-index.html');
    mainWindow.loadFile(offlineIndexPath);
  } else if (app.isPackaged && !effectiveContentDir) {
    mainWindow.loadFile('offline-loading.html');
  } else {
    mainWindow.loadFile('index.html');
  }

  // Manejo de errores de carga
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    // Ignorar error de cancelación (ej. al recargar rápidamente o navegar antes de terminar)
    if (errorCode === -3) return;

    // Si tenemos contenido offline preparado, volver siempre al inicio offline
    if (offlineContentDir) {
      const offlineIndexPath = path.join(offlineContentDir, 'offline-index.html');
      mainWindow.loadFile(offlineIndexPath);
      return;
    }

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
            // Abrir la versión web en el navegador por defecto
            shell.openExternal('https://acierto-incomodo.github.io/clase-web/');
          }
        },
        {
          label: 'Ir al modo offline',
          click: () => {
            if (!app.isPackaged) {
              showUpdateNotification(
                'Modo offline',
                'El modo offline solo está disponible en la aplicación empaquetada.',
              );
              return;
            }
            if (!offlineContentDir) {
              showUpdateNotification(
                'Modo offline',
                'El contenido offline todavía no está preparado. Espera unos instantes.',
              );
              return;
            }
            const offlineIndexPath = path.join(offlineContentDir, 'offline-index.html');
            mainWindow.loadFile(offlineIndexPath);
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
  // Crear la ventana cuanto antes (muestra pantalla de carga en empaquetado)
  createWindow(null);

  let contentDir = null;

  try {
    if (app.isPackaged) {
      // Progreso en barra de tareas durante descarga / extracción
      contentDir = await ensureOfflineContent((p) => {
        if (!mainWindow) return;
        if (p === 2) {
          // indeterminado
          mainWindow.setProgressBar(2);
          return;
        }
        if (typeof p === 'number') {
          mainWindow.setProgressBar(Math.max(0, Math.min(1, p)));
        }
      });
    }
  } catch (err) {
    console.error('Error preparando el contenido offline:', err);
    if (mainWindow) {
      mainWindow.setProgressBar(-1);
    }
    if (Notification.isSupported()) {
      new Notification({
        title: 'Error contenido offline',
        body:
          'No se pudo preparar el contenido offline. Revisa tu conexión o vuelve a intentarlo más tarde.',
      }).show();
    }
  }

  // Si hemos preparado contenido offline, guardar ruta y cargarla en la ventana existente
  if (app.isPackaged && contentDir && mainWindow) {
    offlineContentDir = contentDir;
    mainWindow.setProgressBar(-1);
    const offlineIndexPath = path.join(contentDir, 'offline-index.html');
    mainWindow.loadFile(offlineIndexPath);
  }

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
    createWindow(offlineContentDir);
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