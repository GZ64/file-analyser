const selectBtn = document.getElementById('selectBtn');
const resultsDiv = document.getElementById('results');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const recentFoldersDiv = document.getElementById('recentFolders');
const largestFilesDiv = document.getElementById('largestFiles');
let chart;

// Écouter les événements de progression
window.electronAPI.onScanProgress((data) => {
    progressBar.style.width = `${data.percent}%`;
    progressBar.textContent = `${data.percent}%`;

    if (data.percent === 100) {
        setTimeout(() => {
            progressContainer.style.display = 'none';
        }, 500);
    }
});

// Charger et afficher les dossiers récents
async function loadRecentFolders() {
    const folders = await window.electronAPI.getRecentFolders();
    if (folders.length === 0) {
        recentFoldersDiv.innerHTML = '<p style="color: #999;">Aucun dossier récent</p>';
        return;
    }

    recentFoldersDiv.innerHTML = folders.map(folder => `
    <div class="recent-folder" data-path="${folder.path}">
      <div>
        <strong>📁 ${folder.name}</strong><br>
        <small>${folder.path} - ${new Date(folder.timestamp).toLocaleDateString()}</small>
      </div>
      <button class="delete-btn" data-path="${folder.path}">🗑️</button>
    </div>
  `).join('');

    // Ajouter les événements
    document.querySelectorAll('.recent-folder').forEach(el => {
        const path = el.dataset.path;
        el.addEventListener('click', (e) => {
            if (!e.target.classList.contains('delete-btn')) {
                analyzeFolder(path);
            }
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const path = btn.dataset.path;
            await window.electronAPI.removeRecentFolder(path);
            loadRecentFolders();
        });
    });
}

// Afficher les fichiers les plus lourds
function displayLargestFiles(files) {
    if (!files || files.length === 0) {
        largestFilesDiv.innerHTML = '<p style="color: #999;">Aucun fichier trouvé</p>';
        return;
    }

    largestFilesDiv.innerHTML = files.map((file, index) => `
    <div class="file-item">
      <div class="file-name">${index + 1}. ${file.name}</div>
      <div class="file-size">📦 ${file.sizeFormatted}</div>
      <small style="color: #999;">${file.path}</small>
    </div>
  `).join('');
}

// Analyser un dossier
async function analyzeFolder(dirPath) {
    if (!dirPath) return;

    progressContainer.style.display = 'block';
    progressBar.style.width = '0%';
    progressBar.textContent = '0%';
    resultsDiv.innerHTML = '<p>⏳ Analyse du dossier... Veuillez patienter</p>';
    largestFilesDiv.innerHTML = '<p>⏳ Recherche des fichiers lourds...</p>';

    const stats = await window.electronAPI.scanDir(dirPath);
    const sizeMB = (stats.totalSize / (1024 * 1024)).toFixed(2);
    const sizeGB = (stats.totalSize / (1024 * 1024 * 1024)).toFixed(2);
    const affichageTaille = stats.totalSize > 1073741824 ? `${sizeGB} Go` : `${sizeMB} Mo`;

    resultsDiv.innerHTML = `
    <p><strong>📂 Dossier :</strong> ${dirPath}</p>
    <p><strong>📄 Fichiers :</strong> ${stats.fileCount.toLocaleString()}</p>
    <p><strong>📁 Dossiers :</strong> ${stats.dirCount.toLocaleString()}</p>
    <p><strong>💾 Taille totale :</strong> ${affichageTaille}</p>
  `;

    // Afficher les fichiers les plus lourds
    displayLargestFiles(stats.largestFiles);

    // Mettre à jour le graphique
    if (chart) chart.destroy();
    const ctx = document.getElementById('myChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Fichiers', 'Dossiers'],
            datasets: [{
                data: [stats.fileCount, stats.dirCount],
                backgroundColor: ['#36A2EB', '#FF6384'],
            }]
        }
    });
}

// Sélectionner un dossier
selectBtn.addEventListener('click', async () => {
    const dirPath = await window.electronAPI.openFolderDialog();
    if (dirPath) {
        analyzeFolder(dirPath);
        loadRecentFolders();
    }
});

// Charger les dossiers récents au démarrage
loadRecentFolders();