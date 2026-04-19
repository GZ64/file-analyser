Disk Analyzer - Electron Desktop Application

A cross-platform desktop application built with Electron that analyzes directories, displays storage usage statistics, tracks the largest files, and maintains a history of recent folders.

## Features

- Directory scanning with file and folder counts
- Total size calculation (MB/GB auto-formatting)
- Top 10 largest files display
- Real-time progress bar during analysis
- Doughnut chart visualization (files vs folders)
- Recent folders history (persisted across sessions)
- Delete individual entries from recent history

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

1. Clone or download the project files

2. Install dependencies:

```npm install```





3. Install additional packages:

```npm install electron-store@8.2.0 chart.js```





## **Project Structure**

```disk-analyzer/
├── main.js           # Main Electron process
├── preload.js        # Secure bridge between main and renderer
├── index.html        # Application UI
├── renderer.js       # Frontend logic
├── package.json      # Dependencies and scripts
└── README.md         # Documentation


```


## **Usage**

1.  Start the application:

```npm start```





1.  Click "Choose a folder" to select a directory
2.  Wait for the analysis to complete (progress bar shows real-time status)
3.  View results:

-   Total files and folders count
-   Total size of the directory
-   Top 10 largest files with their sizes and paths
-   Chart visualization of files vs folders distribution

1.  Recent folders are automatically saved and appear in the right panel
2.  Click on any recent folder to re-analyze it
3.  Use the delete button next to any recent folder to remove it from history

## **How It Works**

### **Main Process (main.js)**

Handles file system operations using Node.js fs.promises

Manages folder selection dialog

Performs two-pass directory scanning (count then analyze)

Sends progress updates to renderer process

Persists recent folders using electron-store

### **Preload Script (preload.js)**

Exposes secure IPC APIs to the renderer process

Provides functions for folder selection, directory scanning, and recent folders management

### **Renderer Process (index.html + renderer.js)**

Displays the user interface

Handles user interactions

Renders charts using Chart.js

Shows real-time progress updates

Displays top 10 largest files

## **Key Functions**

### **Directory Scanning**

The application performs a recursive scan of the selected directory:

First pass: Counts total items to calculate progress percentage

Second pass: Collects file sizes, counts files/folders, and tracks largest files

### **Largest Files Tracking**

Maintains a list of the 10 largest files during scanning

Files are sorted by size (descending)

Automatically formats sizes in B, KB, MB, GB, or TB

### **Recent Folders Storage**

Stores up to 5 recent folders

Each entry contains: path, folder name, and timestamp

Data persists between application restarts

Duplicate entries are moved to the top instead of creating duplicates

## **Technologies Used**

-   Electron - Desktop application framework
-   Chart.js - Data visualization
-   electron-store - Persistent storage
-   Node.js fs module - File system operations

## **Configuration**

The application stores user data in:

-   Windows: %APPDATA%/disk-analyzer/
-   macOS: ~/Library/Application Support/disk-analyzer/
-   Linux: ~/.config/disk-analyzer/

## **Performance Notes**

-   Large directories with thousands of files may take several seconds to analyze
-   The progress bar updates after each file/directory is processed
-   Memory usage scales with the number of files (stores top 10 largest files only)

## **Troubleshooting**

### **Error: Store is not a constructor**

Solution: Install electron-store version 8.2.0 specifically:

bash

npm uninstall electron-store
npm install electron-store@8.2.0





### **Folder selection not working**

Ensure you have granted file system access permissions to the application.

### **No files appear in largest files list**

The directory may contain only subdirectories or be empty. The list only shows actual files, not folders.

## **License**

MIT

## **Author**

Created for learning Electron framework fundamentals including:

-   Main and renderer process communication
-   File system access in desktop applications
-   Persistent storage management
-   Real-time UI updates with progress indicators