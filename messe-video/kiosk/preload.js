const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('kiosk', {
  checkPin: pin => ipcRenderer.invoke('kiosk:checkPin', pin),
  quit: () => ipcRenderer.send('kiosk:quit'),
});
