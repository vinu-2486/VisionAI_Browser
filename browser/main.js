const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    title: 'VisionAI Browser',
    backgroundColor: '#f8fafc',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.VISIONAI_WEB_URL) {
    window.loadURL(process.env.VISIONAI_WEB_URL);
  } else {
    window.loadFile(path.join(__dirname, 'index.html'));
  }

  return window;
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('browser:get-status', () => ({
  status: 'ready',
  mode: 'prototype',
}));

ipcMain.handle('browser:detect-form', async (_event, payload = {}) => ({
  formDetected: true,
  formId: payload.formId || 'income_certificate',
  fields: [
    { key: 'full_name', label: 'Full name', required: true },
    { key: 'date_of_birth', label: 'Date of birth', required: true },
    { key: 'address', label: 'Address', required: true },
  ],
}));
