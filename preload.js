const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  // Send a message to the main process
  send: (channel, data) => {
    // Only allow specific channels for security
    const validChannels = [
      'message-from-renderer',
      'save-macro',
      'load-macros',
      'delete-macro',
      'save-gesture-mapping',
      'load-mappings',
      'delete-mapping',
      'gesture-toggle'
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  
  // Receive a message from the main process
  receive: (channel, func) => {
    const validChannels = [
      'message-from-main',
      'macros-loaded',
      'mappings-loaded',
      'macro-saved',
      'mapping-saved',
      'macro-deleted',
      'mapping-deleted'
    ];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender` 
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  
  // Remove a listener for a channel
  removeListener: (channel, func) => {
    const validChannels = [
      'message-from-main',
      'macros-loaded',
      'mappings-loaded',
      'macro-saved',
      'mapping-saved',
      'macro-deleted',
      'mapping-deleted'
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.removeListener(channel, func);
    }
  }
}); 