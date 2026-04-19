const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    scanDir: (dirPath) => ipcRenderer.invoke('scan-dir', dirPath),
    openFolderDialog: () => ipcRenderer.invoke('dialog:openFolder'),
    onScanProgress: (callback) => ipcRenderer.on('scan-progress', (event, data) => callback(data)),
    getRecentFolders: () => ipcRenderer.invoke('get-recent-folders'),
    removeRecentFolder: (folderPath) => ipcRenderer.invoke('remove-recent-folder', folderPath)
});