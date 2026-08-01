const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('visionaiBrowser', {
  getStatus: () => ipcRenderer.invoke('browser:get-status'),
  detectForm: (payload) => ipcRenderer.invoke('browser:detect-form', payload),
});
