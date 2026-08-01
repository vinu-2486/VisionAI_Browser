const path = require('node:path');
const { BrowserWindow } = require('electron');

function createBrowserWindow() {
  return new BrowserWindow({
    width: 1440,
    height: 960,
    title: 'VisionAI Browser',
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
}

module.exports = { createBrowserWindow };
