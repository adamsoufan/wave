const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Create simple JSON-based storage for macros and mappings
const macrosPath = path.join(app.getPath('userData'), 'macros.json');
const mappingsPath = path.join(app.getPath('userData'), 'mappings.json');

// Helper functions for storage
function readJSONFile(filePath, defaultValue = []) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
    return defaultValue;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return defaultValue;
  }
}

function writeJSONFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error);
    return false;
  }
}

// Storage API
const macroStore = {
  get: (key) => {
    if (key === 'items') {
      return readJSONFile(macrosPath);
    }
    return null;
  },
  set: (key, value) => {
    if (key === 'items') {
      return writeJSONFile(macrosPath, value);
    }
    return false;
  }
};

const mappingStore = {
  get: (key) => {
    if (key === 'items') {
      return readJSONFile(mappingsPath);
    }
    return null;
  },
  set: (key, value) => {
    if (key === 'items') {
      return writeJSONFile(mappingsPath, value);
    }
    return false;
  }
};

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
//if (require('electron-squirrel-startup')) {
//  app.quit();
//}

let mainWindow;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Open DevTools in development mode
  if (process.env.NODE_ENV === 'development' || process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Communication between main and renderer processes
ipcMain.on('message-from-renderer', (event, arg) => {
  console.log('Message from renderer:', arg);
  // Send response back if needed
  event.reply('message-from-main', 'Message received in main process');
});

// Save a macro
ipcMain.on('save-macro', (event, macro) => {
  try {
    const macros = macroStore.get('items') || [];
    const existingIndex = macros.findIndex(m => m.id === macro.id);
    
    if (existingIndex >= 0) {
      // Update existing macro
      macros[existingIndex] = macro;
    } else {
      // Add new macro with unique ID if not provided
      if (!macro.id) {
        macro.id = Date.now().toString();
      }
      macros.push(macro);
    }
    
    macroStore.set('items', macros);
    event.reply('macro-saved', macro);
  } catch (error) {
    console.error('Error saving macro:', error);
  }
});

// Load all macros
ipcMain.on('load-macros', (event) => {
  try {
    const macros = macroStore.get('items') || [];
    event.reply('macros-loaded', macros);
  } catch (error) {
    console.error('Error loading macros:', error);
    event.reply('macros-loaded', []);
  }
});

// Delete a macro
ipcMain.on('delete-macro', (event, macroId) => {
  try {
    const macros = macroStore.get('items') || [];
    const updatedMacros = macros.filter(m => m.id !== macroId);
    macroStore.set('items', updatedMacros);
    event.reply('macro-deleted', macroId);
  } catch (error) {
    console.error('Error deleting macro:', error);
  }
});

// Save a gesture mapping
ipcMain.on('save-gesture-mapping', (event, mapping) => {
  try {
    const mappings = mappingStore.get('items') || [];
    const existingIndex = mappings.findIndex(m => m.id === mapping.id);
    
    if (existingIndex >= 0) {
      // Update existing mapping
      mappings[existingIndex] = mapping;
    } else {
      // Add new mapping with unique ID if not provided
      if (!mapping.id) {
        mapping.id = Date.now().toString();
      }
      // Set enabled to true by default for new mappings
      if (mapping.enabled === undefined) {
        mapping.enabled = true;
      }
      mappings.push(mapping);
    }
    
    mappingStore.set('items', mappings);
    event.reply('mapping-saved', mapping);
  } catch (error) {
    console.error('Error saving mapping:', error);
  }
});

// Load all mappings
ipcMain.on('load-mappings', (event) => {
  try {
    const mappings = mappingStore.get('items') || [];
    event.reply('mappings-loaded', mappings);
  } catch (error) {
    console.error('Error loading mappings:', error);
    event.reply('mappings-loaded', []);
  }
});

// Delete a mapping
ipcMain.on('delete-mapping', (event, mappingId) => {
  try {
    const mappings = mappingStore.get('items') || [];
    const updatedMappings = mappings.filter(m => m.id !== mappingId);
    mappingStore.set('items', updatedMappings);
    event.reply('mapping-deleted', mappingId);
  } catch (error) {
    console.error('Error deleting mapping:', error);
  }
});

// Toggle a gesture mapping
ipcMain.on('gesture-toggle', (event, data) => {
  try {
    const { id, enabled } = data;
    const mappings = mappingStore.get('items') || [];
    const mappingIndex = mappings.findIndex(m => m.id === id);
    
    if (mappingIndex >= 0) {
      mappings[mappingIndex].enabled = enabled;
      mappingStore.set('items', mappings);
    }
  } catch (error) {
    console.error('Error toggling mapping:', error);
  }
}); 