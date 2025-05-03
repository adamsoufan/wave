const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const net = require('net');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
//if (require('electron-squirrel-startup')) {
//  app.quit();
//}

let mainWindow;
let macros = [];
let mappings = [];

// Detector process variables
let detectorProcess = null;
let isDetecting = false;
let socketServer = null;

// Socket server port
const SOCKET_PORT = 5050;

// Gesture mappings
// Map the detector's output gestures to emoji representations used in the UI
const gestureToEmojiMap = {
  'open_hand': '✋',
  'fist': '✊',
  'thumbs_up': '👍'
};

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

// Function to start the socket server
const startSocketServer = () => {
  if (socketServer) {
    console.log('Socket server already running');
    return;
  }
  
  // Create the socket server
  socketServer = net.createServer((socket) => {
    console.log('Python detector connected to socket server');
    
    let buffer = '';
    
    // Handle data received from the detector
    socket.on('data', (data) => {
      // Convert buffer to string and append to existing buffer
      buffer += data.toString();
      
      // Process complete JSON messages
      const messages = buffer.split('\n');
      buffer = messages.pop(); // Keep the last potentially incomplete message
      
      messages.forEach(message => {
        if (message.trim()) {
          try {
            const parsedData = JSON.parse(message);
            if (parsedData.gesture) {
              handleDetectedGesture(parsedData.gesture);
            }
          } catch (error) {
            console.error('Error parsing JSON from detector:', error);
          }
        }
      });
    });
    
    // Handle socket closure
    socket.on('close', () => {
      console.log('Python detector disconnected from socket server');
    });
    
    // Handle socket errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });
  
  // Start listening on the specified port
  socketServer.listen(SOCKET_PORT, () => {
    console.log(`Socket server listening on port ${SOCKET_PORT}`);
  });
  
  // Handle server errors
  socketServer.on('error', (error) => {
    console.error('Socket server error:', error);
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${SOCKET_PORT} is already in use`);
    }
    socketServer = null;
  });
};

// Function to stop the socket server
const stopSocketServer = () => {
  if (!socketServer) {
    return;
  }
  
  socketServer.close(() => {
    console.log('Socket server closed');
    socketServer = null;
  });
};

// Function to start gesture detection
const startGestureDetection = () => {
  if (isDetecting || detectorProcess) {
    return false;
  }
  
  try {
    // Start the socket server first
    startSocketServer();
    
    // Get the path to the detector script
    const detectorScriptPath = path.join(__dirname, 'gesture-detection', 'Detector.py');
    const detectorModelPath = path.join(__dirname, 'gesture-detection', 'hand_gesture_knn_model.pkl');
    
    // Spawn the Python process
    detectorProcess = spawn('python', [detectorScriptPath]);
    
    isDetecting = true;
    
    // Handle process output
    detectorProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      
      // Look for gesture detection messages
      if (output.includes('[GESTURE]')) {
        const gesture = output.split('[GESTURE]')[1].trim();
        handleDetectedGesture(gesture);
      } else {
        console.log(`Detector output: ${output}`);
      }
    });
    
    // Handle errors
    detectorProcess.stderr.on('data', (data) => {
      console.error(`Detector error: ${data}`);
    });
    
    // Handle process termination
    detectorProcess.on('close', (code) => {
      console.log(`Detector process exited with code ${code}`);
      isDetecting = false;
      detectorProcess = null;
      
      // Stop the socket server when the detector is stopped
      stopSocketServer();
      
      // Notify renderer that detection has stopped
      if (mainWindow) {
        mainWindow.webContents.send('detection-status', { detecting: false });
      }
    });
    
    return true;
  } catch (error) {
    console.error('Failed to start gesture detection:', error);
    isDetecting = false;
    detectorProcess = null;
    stopSocketServer();
    return false;
  }
};

// Function to stop gesture detection
const stopGestureDetection = () => {
  if (!isDetecting || !detectorProcess) {
    return false;
  }
  
  try {
    // Kill the detector process
    detectorProcess.kill();
    isDetecting = false;
    detectorProcess = null;
    
    // Stop the socket server
    stopSocketServer();
    
    return true;
  } catch (error) {
    console.error('Failed to stop gesture detection:', error);
    return false;
  }
};

// Function to handle a detected gesture
const handleDetectedGesture = (gesture) => {
  console.log(`Detected gesture: ${gesture}`);
  
  // Convert gesture name to emoji representation
  const gestureEmoji = gestureToEmojiMap[gesture] || null;
  
  if (!gestureEmoji) {
    console.log(`No emoji mapping for gesture: ${gesture}`);
    return;
  }
  
  console.log(`Gesture emoji: ${gestureEmoji}`);
  
  // Find matching mappings that are enabled
  const matchingMappings = mappings.filter(mapping => 
    mapping.enabled && 
    (mapping.leftGesture === gestureEmoji || mapping.rightGesture === gestureEmoji)
  );
  
  if (matchingMappings.length > 0) {
    console.log(`Found ${matchingMappings.length} matching mapping(s):`, matchingMappings);
    
    // Send the matching mappings to the renderer
    if (mainWindow) {
      mainWindow.webContents.send('gesture-detected', {
        gesture,
        gestureEmoji,
        matchingMappings
      });
    }
  } else {
    console.log(`No matching mappings found for gesture: ${gesture} (${gestureEmoji})`);
    
    // Send the detected gesture to the renderer anyway (for status display)
    if (mainWindow) {
      mainWindow.webContents.send('gesture-detected', {
        gesture,
        gestureEmoji,
        matchingMappings: []
      });
    }
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
  // Stop gesture detection if running
  if (isDetecting && detectorProcess) {
    stopGestureDetection();
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Clean up processes on app quit
app.on('will-quit', () => {
  // Stop gesture detection if running
  if (isDetecting && detectorProcess) {
    stopGestureDetection();
  }
});

// IPC Communication between main and renderer processes
ipcMain.on('message-from-renderer', (event, arg) => {
  console.log('Message from renderer:', arg);
  // Send response back if needed
  event.reply('message-from-main', 'Message received in main process');
});

// Handle gesture detection toggle requests
ipcMain.on('toggle-detection', (event, shouldDetect) => {
  console.log(`Toggle detection request: ${shouldDetect}`);
  
  let success = false;
  
  if (shouldDetect) {
    success = startGestureDetection();
  } else {
    success = stopGestureDetection();
  }
  
  // Send status back to renderer
  event.reply('detection-status', { 
    detecting: isDetecting,
    success
  });
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