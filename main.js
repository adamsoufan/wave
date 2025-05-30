const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, Notification, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const net = require('net');
const robot = require('robotjs');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
//if (require('electron-squirrel-startup')) {
//  app.quit();
//}

let mainWindow;
let macros = [];
let mappings = [];
let tray = null;

// Detector process variables
let detectorProcess = null;
let isDetecting = false;
let socketServer = null;

// Socket server port
const SOCKET_PORT = 5050;

// Define gesture IDs for internal use
const gestureData = {
  'open_hand': { id: 'open_hand', emoji: '✋', name: 'Open Hand' },
  'pinched_fingers': { id: 'pinched_fingers', emoji: '🤌', name: 'Pinched Fingers' },
  'ok': { id: 'ok', emoji: '👌', name: 'OK' },
  'peace': { id: 'peace', emoji: '✌️', name: 'Peace' },
  'point_up': { id: 'point_up', emoji: '👆', name: 'Point Up' },
  'point_down': { id: 'point_down', emoji: '👇', name: 'Point Down' },
  'thumbs_up': { id: 'thumbs_up', emoji: '👍', name: 'Thumbs Up' },
  'thumbs_down': { id: 'thumbs_down', emoji: '👎', name: 'Thumbs Down' }
};

// Map emoji representations back to gesture IDs (for UI → internal conversion)
const emojiToGestureIdMap = {
  '✋': 'open_hand',
  '🤌': 'pinched_fingers',
  '👌': 'ok',
  '✌️': 'peace',
  '👆': 'point_up',
  '👇': 'point_down',
  '👍': 'thumbs_up',
  '👎': 'thumbs_down'
};

// Paths for storing macros and mappings data
const userDataPath = app.getPath('userData');
const macrosPath = path.join(userDataPath, 'macros.json');
const mappingsPath = path.join(userDataPath, 'mappings.json');

// Global variable to track the last notification time and active notification
let lastNotificationTime = 0;
let activeNotification = null;

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
    fullscreen: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Maximize the window instead of fullscreen
  mainWindow.maximize();

  // Load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Open DevTools in development mode
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
  
  // When main window is closed, don't stop detection - just set the reference to null
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

// Function to start the socket server
const startSocketServer = () => {
  if (socketServer) {
    console.log('Socket server already running');
    return;
  }
  
  try {
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
        // Try to close any existing instance and restart
        try {
          const tempServer = net.createServer();
          tempServer.on('error', () => {
            // Port is in use and not accessible
            console.error(`Port ${SOCKET_PORT} is in use and cannot be released`);
          });
          
          tempServer.listen(SOCKET_PORT, () => {
            tempServer.close();
            console.log(`Port ${SOCKET_PORT} was in use but has been released`);
            // Try starting again after a short delay
            setTimeout(() => startSocketServer(), 1000);
          });
        } catch (err) {
          console.error('Failed to release port:', err);
        }
      }
      socketServer = null;
    });
    
    return true;
  } catch (error) {
    console.error('Failed to start socket server:', error);
    socketServer = null;
    return false;
  }
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
    if (!startSocketServer()) {
      console.error('Failed to start socket server');
      return false;
    }
    
    // Get the path to the detector script
    const detectorDir = path.join(__dirname, 'gesture-detection');
    const detectorScriptPath = path.join(detectorDir, 'Detector.py');
    
    console.log(`Starting detector from: ${detectorScriptPath}`);
    
    // Spawn the Python process with working directory set to the detection folder
    detectorProcess = spawn('python', [detectorScriptPath], {
      cwd: detectorDir
    });
    
    isDetecting = true;
    
    // Update tray menu to reflect new state
    updateTrayMenu();
    
    // Handle process output
    detectorProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      console.log(`Detector output: ${output}`);
      
      // Look for gesture detection messages
      if (output.includes('[GESTURE]')) {
        const gesture = output.split('[GESTURE]')[1].trim();
        handleDetectedGesture(gesture);
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
      
      // Update tray menu
      updateTrayMenu();
      
      // Notify renderer that detection has stopped (if window exists)
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
  console.log('Stopping gesture detection...');
  
  // Always reset the state variables
  isDetecting = false;
  
  // If no detector process exists, just clean up and return success
  if (!detectorProcess) {
    console.log('No detector process to stop');
    
    // Stop the socket server to be safe
    stopSocketServer();
    
    // Update tray menu
    updateTrayMenu();
    
    return true;
  }
  
  try {
    console.log('Killing detector process...');
    
    // Kill the detector process
    detectorProcess.kill('SIGTERM');
    
    // Clean up the process reference
    detectorProcess = null;
    
    // Stop the socket server
    stopSocketServer();
    
    // Update tray menu
    updateTrayMenu();
    
    console.log('Gesture detection stopped successfully');
    return true;
  } catch (error) {
    console.error('Failed to stop gesture detection:', error);
    
    // Force clean up even if there was an error
    detectorProcess = null;
    stopSocketServer();
    updateTrayMenu();
    
    console.log('Gesture detection state reset after error');
    return true; // Return true to avoid showing error to user
  }
};

// Function to handle a detected gesture
const handleDetectedGesture = (gesture) => {
  console.log(`Detected gesture: ${gesture}`);
  
  // Get gesture data (includes emoji for display purposes only)
  const gestureInfo = gestureData[gesture] || null;
  
  if (!gestureInfo) {
    console.log(`No gesture mapping for: ${gesture}`);
    return;
  }
  
  // For UI display - the emoji is only for visualization
  const gestureEmoji = gestureInfo.emoji;
  
  console.log(`Gesture info:`, gestureInfo);
  console.log(`Checking ${mappings.length} mappings for matches with gesture: ${gesture}`);
  
  // Find matching mappings that are enabled
  const matchingMappings = mappings.filter(mapping => {
    console.log(`\nChecking mapping: "${mapping.name}"`);
    console.log(`  Left hand: ${mapping.leftGestureId || 'none'}, Right hand: ${mapping.rightGestureId || 'none'}, Enabled: ${mapping.enabled}`);
    
    if (!mapping.enabled) {
      console.log(`  Skipping disabled mapping`);
      return false;
    }
    
    // Case 1: Only one hand gesture is defined in the mapping
    if ((mapping.leftGestureId && !mapping.rightGestureId) || 
        (!mapping.leftGestureId && mapping.rightGestureId)) {
      // Match if the detected gesture matches either defined hand
      const isMatch = mapping.leftGestureId === gesture || mapping.rightGestureId === gesture;
      console.log(`  Single-hand mapping: ${isMatch ? 'MATCH' : 'NO MATCH'}`);
      return isMatch;
    }
    // Case 2: Both hands are defined in the mapping
    // We can't tell if this is left or right hand from detector, so we'll 
    // assume it's either-or for now. A future enhancement would be to use 
    // the mediapipe data to determine which hand is which.
    else if (mapping.leftGestureId && mapping.rightGestureId) {
      // For now, we match if either hand matches the gesture
      const isMatch = mapping.leftGestureId === gesture || mapping.rightGestureId === gesture;
      console.log(`  Dual-hand mapping: ${isMatch ? 'MATCH' : 'NO MATCH'}`);
      return isMatch;
    }
    
    console.log(`  No valid gesture IDs defined in mapping`);
    return false;
  });
  
  if (matchingMappings.length > 0) {
    console.log(`Found ${matchingMappings.length} matching mapping(s):`, matchingMappings.map(m => m.name).join(', '));
    
    // Show a notification for the first matching mapping, but only if enough time has passed
    if (!mainWindow || !mainWindow.isFocused()) {
      const currentTime = Date.now();
      const mapping = matchingMappings[0];
      
      // Only show a new notification if:
      // 1. At least 3 seconds have passed since the last notification, or
      // 2. We have a different gesture/macro combination
      if (currentTime - lastNotificationTime > 3000 || !activeNotification) {
        // Close any existing notification
        if (activeNotification) {
          activeNotification.close();
        }
        
        // Create a new notification with a short timeout
        activeNotification = new Notification({
          title: 'Gesture Detected',
          body: `Detected "${gestureInfo.name}" ${gestureEmoji} - Macro: ${mapping.name}`,
          silent: true, // Don't play a sound to avoid annoyance with frequent detections
          timeoutType: 'never' // We'll manually close it
        });
        
        activeNotification.show();
        lastNotificationTime = currentTime;
        
        // Close the notification after 2 seconds
        setTimeout(() => {
          if (activeNotification) {
            activeNotification.close();
            activeNotification = null;
          }
        }, 2000);
      }
    }
    
    // Execute the macro for the first matching mapping
    const macroName = matchingMappings[0].macro;
    if (macroName) {
      executeMacro(macroName);
    }
    
    // Send the matching mappings to the renderer
    if (mainWindow) {
      mainWindow.webContents.send('gesture-detected', {
        gestureId: gesture,
        gestureEmoji,
        gestureName: gestureInfo.name,
        matchingMappings
      });
    }
  } else {
    console.log(`No matching mappings found for gesture: ${gesture}`);
    
    // Send the detected gesture to the renderer anyway (for status display)
    if (mainWindow) {
      mainWindow.webContents.send('gesture-detected', {
        gestureId: gesture,
        gestureEmoji,
        gestureName: gestureInfo.name,
        matchingMappings: []
      });
    }
  }
};

// Function to execute a macro by name
const executeMacro = (macroName) => {
  console.log(`Executing macro: ${macroName}`);
  
  // Find the macro by name
  const macro = macros.find(m => m.name === macroName);
  
  if (!macro) {
    console.error(`Macro not found: ${macroName}`);
    return;
  }
  
  // Execute each action in the macro
  if (macro.actions && macro.actions.length > 0) {
    macro.actions.forEach((action, index) => {
      // Add a slight delay between actions
      setTimeout(() => {
        executeAction(action);
      }, index * 500); // 500ms delay between actions
    });
  }
};

// Function to execute a single action
const executeAction = (action) => {
  console.log(`Executing action: ${action.type}`, action.value);
  
  switch (action.type) {
    case 'keypress':
      executeKeyPress(action.value);
      break;
    case 'command':
      executeCommand(action.value);
      break;
    case 'script':
      // Script execution code would go here
      console.log('Script execution not implemented yet');
      break;
    default:
      console.error(`Unknown action type: ${action.type}`);
  }
};

// Function to execute a command line command
const executeCommand = (command) => {
  if (!command || typeof command !== 'string' || command.trim() === '') {
    console.error('Invalid command provided');
    return;
  }
  
  console.log(`Executing command: ${command}`);
  
  try {
    // Use child_process.exec for simple command execution
    const { exec } = require('child_process');
    
    const process = exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Command execution error: ${error}`);
        return;
      }
      
      if (stdout) {
        console.log(`Command stdout: ${stdout}`);
      }
      
      if (stderr) {
        console.error(`Command stderr: ${stderr}`);
      }
    });
    
    // Handle process exit
    process.on('exit', (code) => {
      console.log(`Command process exited with code ${code}`);
    });
    
    // Log if process fails to spawn
    process.on('error', (err) => {
      console.error(`Failed to start command process: ${err}`);
    });
    
  } catch (error) {
    console.error(`Error executing command: ${error}`);
  }
};

// Function to execute a key press action
const executeKeyPress = (keyCombo) => {
  if (!keyCombo) {
    console.error('No key combination provided');
    return;
  }
  
  console.log(`Executing key press: ${keyCombo}`);
  
  // Parse the key combination (e.g., "Ctrl + Alt + T")
  const keys = keyCombo.split(' + ').map(k => k.trim());
  
  // Map the keys to robotjs format
  const modifiers = [];
  let key = null;
  
  keys.forEach(k => {
    // Convert key names to robotjs format
    const lowerKey = k.toLowerCase();
    
    // Handle modifier keys
    if (lowerKey === 'ctrl' || lowerKey === 'control') {
      modifiers.push('control');
    } else if (lowerKey === 'alt') {
      modifiers.push('alt');
    } else if (lowerKey === 'shift') {
      modifiers.push('shift');
    } else if (lowerKey === 'meta' || lowerKey === 'command' || lowerKey === 'cmd' || lowerKey === 'win') {
      modifiers.push('command');
    } else {
      // Handle special keys
      if (k === '↑') key = 'up';
      else if (k === '↓') key = 'down';
      else if (k === '←') key = 'left';
      else if (k === '→') key = 'right';
      else if (lowerKey === 'esc') key = 'escape';
      else if (lowerKey === 'space') key = 'space';
      else if (lowerKey === 'tab') key = 'tab';
      else if (lowerKey === 'enter') key = 'enter';
      else if (lowerKey === 'backspace') key = 'backspace';
      // Handle function keys (F1-F12)
      else if (lowerKey.startsWith('f') && !isNaN(parseInt(lowerKey.substring(1))) && 
              parseInt(lowerKey.substring(1)) >= 1 && parseInt(lowerKey.substring(1)) <= 12) {
        key = lowerKey;
      }
      else key = lowerKey; // For regular keys, use lowercase
    }
  });
  
  // Execute the key combination using robotjs
  try {
    if (key) {
      console.log(`Attempting to press: ${key} with modifiers: ${modifiers.join(', ')}`);
      robot.keyTap(key, modifiers);
      console.log(`Successfully pressed: ${key} with modifiers: ${modifiers.join(', ')}`);
    } else {
      console.error('No main key found in combination');
    }
  } catch (error) {
    console.error('Error executing key press:', error);
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  // Load saved macros and mappings
  macros = loadDataFromFile(macrosPath, []);
  mappings = loadDataFromFile(mappingsPath, []);
  
  // Validate and fix mappings
  validateMappings();
  
  // Create the main window
  createWindow();
  
  // Create the tray icon
  createTray();

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
  // Don't quit the app when all windows are closed
  // We want it to keep running in the background for gesture detection
  console.log('All windows closed, app still running in background for gesture detection');
});

// Clean up processes on app quit
app.on('will-quit', () => {
  // Stop gesture detection if running
  if (isDetecting && detectorProcess) {
    stopGestureDetection();
  }
  
  // Unregister all shortcuts
  globalShortcut.unregisterAll();
});

// IPC Communication between main and renderer processes
ipcMain.on('message-from-renderer', (event, arg) => {
  console.log('Message from renderer:', arg);
  // Send response back if needed
  event.reply('message-from-main', 'Message received in main process');
});

// Handle gesture detection toggle requests
ipcMain.on('toggle-detection', (event, shouldDetect) => {
  console.log(`Toggle detection request received: shouldDetect = ${shouldDetect}`);
  
  let success = false;
  
  if (shouldDetect) {
    console.log('Attempting to start gesture detection...');
    success = startGestureDetection();
    console.log(`Start gesture detection result: ${success ? 'SUCCESS' : 'FAILED'}`);
  } else {
    console.log('Attempting to stop gesture detection...');
    success = stopGestureDetection();
    console.log(`Stop gesture detection result: ${success ? 'SUCCESS' : 'FAILED'}`);
  }
  
  // Update the tray menu
  updateTrayMenu();
  
  // Send status back to renderer
  console.log(`Sending detection status to renderer: detecting=${isDetecting}, success=${success}`);
  event.reply('detection-status', { 
    detecting: isDetecting,
    success: success
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
  console.log('Saving gesture mapping. Received data:', mapping);

  // Use the leftGestureId and rightGestureId from the UI if available
  let leftGestureId = mapping.leftGestureId || null;
  let rightGestureId = mapping.rightGestureId || null;

  console.log(`Initial gesture IDs - Left: ${leftGestureId}, Right: ${rightGestureId}`);
  
  // Only use emoji to ID conversion as a fallback when the IDs aren't directly provided
  if (!leftGestureId && mapping.leftGesture) {
    leftGestureId = emojiToGestureIdMap[mapping.leftGesture] || null;
    console.log(`Converted left gesture emoji ${mapping.leftGesture} to ID: ${leftGestureId}`);
  }
  
  if (!rightGestureId && mapping.rightGesture) {
    rightGestureId = emojiToGestureIdMap[mapping.rightGesture] || null;
    console.log(`Converted right gesture emoji ${mapping.rightGesture} to ID: ${rightGestureId}`);
  }
  
  // Store both emoji (for display) and ID (for matching)
  const processedMapping = {
    ...mapping,
    leftGestureId,
    rightGestureId
  };
  
  console.log('Processed mapping to save:', processedMapping);
  
  // Check if mapping already exists
  const existingIndex = mappings.findIndex(m => m.name === mapping.name);
  
  if (existingIndex !== -1) {
    // Update existing mapping
    mappings[existingIndex] = processedMapping;
    console.log(`Updated existing mapping at index ${existingIndex}`);
  } else {
    // Add new mapping
    mappings.push(processedMapping);
    console.log('Added new mapping');
  }
  
  // Save to file
  saveDataToFile(mappingsPath, mappings);
  
  // Reply with updated mappings list
  event.reply('mappings-loaded', mappings);
});

// Handle mapping updates from Home screen toggles
ipcMain.on('update-mapping', (event, mapping) => {
  console.log('Updating mapping. Received data:', mapping);
  
  // Check if mapping exists
  const existingIndex = mappings.findIndex(m => m.name === mapping.name);
  
  if (existingIndex !== -1) {
    // Update existing mapping
    mappings[existingIndex] = {
      ...mappings[existingIndex],  // Preserve any existing fields not in the update
      ...mapping                   // Apply the updates
    };
    console.log(`Updated existing mapping at index ${existingIndex}`);
    
    // Save to file
    saveDataToFile(mappingsPath, mappings);
  }
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

// Execute macro manually
ipcMain.on('execute-macro', (event, macroName) => {
  console.log(`Manual macro execution request: ${macroName}`);
  
  // Execute the macro
  executeMacro(macroName);
  
  // Reply with success status
  event.reply('macro-executed', { 
    success: true, 
    macroName 
  });
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

// Handle requests for the current detection state
ipcMain.on('get-detection-state', (event) => {
  event.reply('detection-state', { detecting: isDetecting });
});

// Handle requests to block system shortcuts
ipcMain.on('block-system-shortcuts', (event, shouldBlock) => {
  try {
    // First unregister any existing shortcuts to avoid duplicates
    globalShortcut.unregisterAll();
    
    if (shouldBlock) {
      console.log('Blocking system shortcuts');
      
      // Register various combinations to prevent them from reaching the OS
      // Windows key
      globalShortcut.register('Super', () => { 
        console.log('Windows key blocked');
        return false;
      });
      
      // Alt+F4
      globalShortcut.register('Alt+F4', () => {
        console.log('Alt+F4 blocked');
        return false;
      });
      
      // Win+D (Show desktop)
      globalShortcut.register('Super+D', () => {
        console.log('Win+D blocked');
        return false;
      });
      
      // Win+E (File Explorer)
      globalShortcut.register('Super+E', () => {
        console.log('Win+E blocked');
        return false;
      });
      
      // Other common system shortcuts
      globalShortcut.register('Super+R', () => { return false; }); // Run dialog
      globalShortcut.register('Super+L', () => { return false; }); // Lock screen
      globalShortcut.register('Super+Tab', () => { return false; }); // Task view
      
      event.reply('system-shortcuts-status', { 
        blocking: true,
        success: true
      });
    } else {
      console.log('Unblocking system shortcuts');
      globalShortcut.unregisterAll();
      
      event.reply('system-shortcuts-status', { 
        blocking: false,
        success: true
      });
    }
  } catch (error) {
    console.error('Error managing system shortcuts:', error);
    event.reply('system-shortcuts-status', { 
      blocking: false,
      success: false,
      error: error.message
    });
  }
});

// Unregister all shortcuts when app loses focus
app.on('browser-window-blur', () => {
  console.log('App lost focus, unblocking system shortcuts');
  globalShortcut.unregisterAll();
});

// Function to create the tray icon
const createTray = () => {
  try {
    // First check for the wave.png image in the renderer/assets/images folder
    const waveIconPath = path.join(__dirname, 'renderer', 'assets', 'images', 'wave-tray.png');
    
    // Set up fallback paths for different platforms
    let fallbackIconPath = null;
    if (process.platform === 'darwin') {
      // macOS app icon
      fallbackIconPath = path.join(__dirname, 'build', 'icon.icns');
    } else if (process.platform === 'win32') {
      // Windows app icon
      fallbackIconPath = path.join(__dirname, 'build', 'icon.ico');
    } else {
      // Linux app icon
      fallbackIconPath = path.join(__dirname, 'build', 'icon.png');
    }
    
    // Check if wave.png exists
    if (fs.existsSync(waveIconPath)) {
      console.log('Using wave.png as tray icon:', waveIconPath);
      const waveIcon = nativeImage.createFromPath(waveIconPath);
      tray = new Tray(waveIcon.resize({ width: 16, height: 16 }));
    } 
    // If wave.png doesn't exist, fall back to platform-specific icons
    else if (fallbackIconPath && fs.existsSync(fallbackIconPath)) {
      console.log('Using fallback icon:', fallbackIconPath);
      tray = new Tray(fallbackIconPath);
    } 
    // If no icons are found, create an empty icon as a last resort
    else {
      console.log('No icon found, using empty icon');
      const emptyIcon = nativeImage.createEmpty();
      tray = new Tray(emptyIcon);
    }
    
    const contextMenu = Menu.buildFromTemplate([
      { 
        label: 'Open Wave App', 
        click: () => {
          if (!mainWindow) {
            createWindow();
          } else {
            mainWindow.show();
            mainWindow.focus();
          }
        } 
      },
      { 
        label: isDetecting ? 'Stop Gesture Detection' : 'Start Gesture Detection',
        click: () => {
          if (isDetecting) {
            stopGestureDetection();
          } else {
            startGestureDetection();
          }
          // Update the menu item after toggling
          updateTrayMenu();
        }
      },
      { type: 'separator' },
      { 
        label: 'Exit', 
        click: () => {
          // Stop gesture detection before exiting
          if (isDetecting && detectorProcess) {
            stopGestureDetection();
          }
          app.quit();
        } 
      }
    ]);
    
    tray.setToolTip('Wave Gesture App');
    tray.setContextMenu(contextMenu);
    
    // Double-click on the tray icon opens the app
    tray.on('double-click', () => {
      if (!mainWindow) {
        createWindow();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    });
  } catch (error) {
    console.error('Error creating tray icon:', error);
    // If we can't create a tray icon, still allow the app to run
  }
};

// Function to update the tray menu (e.g., when detection status changes)
const updateTrayMenu = () => {
  if (!tray) return;
  
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Open Wave App', 
      click: () => {
        if (!mainWindow) {
          createWindow();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      } 
    },
    { 
      label: isDetecting ? 'Stop Gesture Detection' : 'Start Gesture Detection',
      click: () => {
        if (isDetecting) {
          stopGestureDetection();
        } else {
          startGestureDetection();
        }
        // Update the menu again after toggling
        updateTrayMenu();
      }
    },
    { type: 'separator' },
    { 
      label: 'Exit', 
      click: () => {
        // Stop gesture detection before exiting
        if (isDetecting && detectorProcess) {
          stopGestureDetection();
        }
        app.quit();
      } 
    }
  ]);
  
  tray.setContextMenu(contextMenu);
};

// Function to validate and fix mappings
const validateMappings = () => {
  if (!mappings || !Array.isArray(mappings)) {
    console.log('Mappings is not an array, initializing empty array');
    mappings = [];
    return;
  }
  
  console.log(`Validating ${mappings.length} mappings`);
  
  // Filter out invalid mappings and fix any issues
  mappings = mappings.filter(mapping => {
    // Basic structure validation
    if (!mapping || typeof mapping !== 'object') {
      console.log('Removing invalid mapping (not an object)');
      return false;
    }
    
    if (!mapping.name || !mapping.macro) {
      console.log(`Removing invalid mapping: missing name or macro - ${mapping.name || 'unnamed'}`);
      return false;
    }
    
    // Make sure enabled property exists
    if (typeof mapping.enabled !== 'boolean') {
      console.log(`Fixing 'enabled' property for mapping: ${mapping.name}`);
      mapping.enabled = true;
    }
    
    // Ensure at least one gesture ID is valid for matching
    if (!mapping.leftGestureId && !mapping.rightGestureId) {
      console.log(`Warning: Mapping "${mapping.name}" has no valid gesture IDs`);
      
      // Try to recover by converting emoji to gesture ID if we have the emoji
      if (mapping.leftGesture && !mapping.leftGestureId) {
        mapping.leftGestureId = emojiToGestureIdMap[mapping.leftGesture] || null;
        console.log(`Recovered leftGestureId for "${mapping.name}": ${mapping.leftGestureId}`);
      }
      
      if (mapping.rightGesture && !mapping.rightGestureId) {
        mapping.rightGestureId = emojiToGestureIdMap[mapping.rightGesture] || null;
        console.log(`Recovered rightGestureId for "${mapping.name}": ${mapping.rightGestureId}`);
      }
      
      // If we still have no valid gesture IDs, this mapping is unusable
      if (!mapping.leftGestureId && !mapping.rightGestureId) {
        console.log(`Removing unusable mapping "${mapping.name}" with no valid gesture IDs`);
        return false;
      }
    }
    
    return true;
  });
  
  // Save the cleaned up mappings
  saveDataToFile(mappingsPath, mappings);
  console.log(`Validation complete. ${mappings.length} valid mappings retained.`);
}; 