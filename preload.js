const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  // Send a message to the main process
  send: (channel, data) => {
    // Only allow specific channels for security
    const validChannels = ['message-from-renderer'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  
  // Receive a message from the main process
  receive: (channel, func) => {
    const validChannels = ['message-from-main'];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender` 
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  
  // Remove a listener for a channel
  removeListener: (channel, func) => {
    const validChannels = ['message-from-main'];
    if (validChannels.includes(channel)) {
      ipcRenderer.removeListener(channel, func);
    }
  }
}); 