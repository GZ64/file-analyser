const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const Store = require('electron-store');

// Initialiser le stockage
const store = new Store({
    name: 'app-data',
    defaults: {
        recentFolders: []  // Liste des dossiers récents
    }
});

function createWindow() {
    const win = new BrowserWindow({
        width: 900,
        height: 700,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
        },
    });
    win.loadFile('index.html');
}

app.whenReady().then(createWindow);

// Analyser un dossier avec fichiers les plus lourds
ipcMain.handle('scan-dir', async (event, dirPath) => {
    let totalSize = 0;
    let fileCount = 0;
    let dirCount = 0;
    let totalItems = 0;
    let processedItems = 0;
    const largestFiles = []; // Stocker les 10 plus gros fichiers

    // Fonction pour ajouter un fichier dans le top 10
    function addToLargestFiles(filePath, size) {
        largestFiles.push({ path: filePath, size });
        largestFiles.sort((a, b) => b.size - a.size);
        if (largestFiles.length > 10) largestFiles.pop();
    }

    // Première passe : compter le nombre total d'éléments
    async function countItems(dir) {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        let count = entries.length;
        for (const entry of entries) {
            if (entry.isDirectory()) {
                const fullPath = path.join(dir, entry.name);
                count += await countItems(fullPath);
            }
        }
        return count;
    }

    totalItems = await countItems(dirPath);

    // Deuxième passe : analyser avec mise à jour de progression
    async function walk(dir) {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                dirCount++;
                await walk(fullPath);
            } else {
                fileCount++;
                const stats = await fs.stat(fullPath);
                totalSize += stats.size;
                addToLargestFiles(fullPath, stats.size);
            }
            processedItems++;

            const percent = Math.floor((processedItems / totalItems) * 100);
            event.sender.send('scan-progress', { percent, current: entry.name });
        }
    }

    await walk(dirPath);

    // Formater les fichiers les plus lourds
    const formattedLargestFiles = largestFiles.map(file => ({
        name: path.basename(file.path),
        path: file.path,
        size: file.size,
        sizeFormatted: formatBytes(file.size)
    }));

    return { totalSize, fileCount, dirCount, largestFiles: formattedLargestFiles };
});

// Ouvrir le dialogue de dossier et sauvegarder dans l'historique
ipcMain.handle('dialog:openFolder', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openDirectory']
    });

    if (!result.canceled && result.filePaths[0]) {
        const folderPath = result.filePaths[0];

        // Sauvegarder dans les dossiers récents
        let recentFolders = store.get('recentFolders', []);
        // Supprimer l'entrée si elle existe déjà
        recentFolders = recentFolders.filter(f => f.path !== folderPath);
        // Ajouter au début
        recentFolders.unshift({
            path: folderPath,
            name: path.basename(folderPath),
            timestamp: Date.now()
        });
        // Garder seulement les 5 derniers
        recentFolders = recentFolders.slice(0, 5);
        store.set('recentFolders', recentFolders);

        return folderPath;
    }
    return null;
});

// Récupérer les dossiers récents
ipcMain.handle('get-recent-folders', () => {
    return store.get('recentFolders', []);
});

// Supprimer un dossier de l'historique
ipcMain.handle('remove-recent-folder', (event, folderPath) => {
    let recentFolders = store.get('recentFolders', []);
    recentFolders = recentFolders.filter(f => f.path !== folderPath);
    store.set('recentFolders', recentFolders);
    return recentFolders;
});

// Helper pour formater les bytes
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}