const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
//if (require('electron-squirrel-startup')) {
//  app.quit();
//}

let mainWindow;
let macros = [];
let mappings = [];

// Paths for storing macros and mappings data
const userDataPath = app.getPath('userData');
const macrosPath = path.join(userDataPath, 'macros.json');
const mappingsPath = path.join(userDataPath, 'mappings.json');

// Helper function to load data from file
const loadDataFromFile = (filePath, defaultValue) => {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`Error loading data from ${filePath}:`, error);
  }
  return defaultValue;
};

// Helper function to save data to file
const saveDataToFile = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error saving data to ${filePath}:`, error);
    return false;
  }
};

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
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  // Load saved macros and mappings
  macros = loadDataFromFile(macrosPath, []);
  mappings = loadDataFromFile(mappingsPath, []);
  
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

// Save macro
ipcMain.on('save-macro', (event, macro) => {
  // Check if macro already exists
  const existingIndex = macros.findIndex(m => m.name === macro.name);
  
  if (existingIndex !== -1) {
    // Update existing macro
    macros[existingIndex] = macro;
  } else {
    // Add new macro
    macros.push(macro);
  }
  
  // Save to file
  saveDataToFile(macrosPath, macros);
  
  // Reply with updated macros list
  event.reply('macros-loaded', macros);
});

// Save gesture mapping
ipcMain.on('save-gesture-mapping', (event, mapping) => {
  // Check if mapping already exists
  const existingIndex = mappings.findIndex(m => m.name === mapping.name);
  
  if (existingIndex !== -1) {
    // Update existing mapping
    mappings[existingIndex] = mapping;
  } else {
    // Add new mapping
    mappings.push(mapping);
  }
  
  // Save to file
  saveDataToFile(mappingsPath, mappings);
  
  // Reply with updated mappings list
  event.reply('mappings-loaded', mappings);
});

// Toggle gesture on/off
ipcMain.on('gesture-toggle', (event, toggleData) => {
  const { name, enabled } = toggleData;
  
  // Find the mapping
  const mappingIndex = mappings.findIndex(m => m.name === name);
  
  if (mappingIndex !== -1) {
    // Update enabled status
    mappings[mappingIndex].enabled = enabled;
    
    // Save to file
    saveDataToFile(mappingsPath, mappings);
  }
});

// Load macros
ipcMain.on('load-macros', (event) => {
  event.reply('macros-loaded', macros);
});

// Load mappings
ipcMain.on('load-mappings', (event) => {
  event.reply('mappings-loaded', mappings);
});

// Delete macro
ipcMain.on('delete-macro', (event, macroName) => {
  // Find the macro
  const macroIndex = macros.findIndex(m => m.name === macroName);
  
  if (macroIndex !== -1) {
    // Remove the macro
    macros.splice(macroIndex, 1);
    
    // Save to file
    saveDataToFile(macrosPath, macros);
    
    // Also remove any mappings that use this macro
    const affectedMappings = mappings.filter(mapping => mapping.macro === macroName);
    if (affectedMappings.length > 0) {
      mappings = mappings.filter(mapping => mapping.macro !== macroName);
      saveDataToFile(mappingsPath, mappings);
    }
    
    // Reply with updated macros list
    event.reply('macros-loaded', macros);
    
    // Also reply with updated mappings list if any mappings were affected
    if (affectedMappings.length > 0) {
      event.reply('mappings-loaded', mappings);
    }
  }
});

// Delete mapping
ipcMain.on('delete-mapping', (event, mappingName) => {
  // Find the mapping
  const mappingIndex = mappings.findIndex(m => m.name === mappingName);
  
  if (mappingIndex !== -1) {
    // Remove the mapping
    mappings.splice(mappingIndex, 1);
    
    // Save to file
    saveDataToFile(mappingsPath, mappings);
    
    // Reply with updated mappings list
    event.reply('mappings-loaded', mappings);
  }
}); 