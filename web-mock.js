// web-mock.js - Mock the Electron IPC API for web demo
window.api = {
  send: function(channel, data) {
    console.log(`Mock send to ${channel}:`, data);
    
    // Mock responses based on request type
    if (channel === 'get-detection-state') {
      setTimeout(() => {
        this.mockReceive('detection-state', { detecting: false });
      }, 100);
    }
    else if (channel === 'get-mappings') {
      setTimeout(() => {
        this.mockReceive('mappings', mockMappings);
      }, 100);
    }
    else if (channel === 'get-macros') {
      setTimeout(() => {
        this.mockReceive('macros', mockMacros);
      }, 100);
    }
    else if (channel === 'toggle-detection') {
      const shouldDetect = data;
      setTimeout(() => {
        this.mockReceive('detection-status', { 
          detecting: shouldDetect, 
          success: true 
        });
        
        // If detection is enabled, simulate gesture detection
        if (shouldDetect) {
          this.startMockGestureDetection();
        } else {
          this.stopMockGestureDetection();
        }
      }, 1500); // Simulate loading time
    }
    else if (channel === 'save-gesture-mapping') {
      setTimeout(() => {
        // Add the new mapping to our mock data
        const newMapping = {...data, id: mockMappings.length + 1};
        mockMappings.push(newMapping);
        this.mockReceive('mapping-saved', { success: true, mapping: newMapping });
        
        // Refresh the list
        this.mockReceive('mappings', mockMappings);
      }, 500);
    }
    else if (channel === 'gesture-toggle') {
      setTimeout(() => {
        // Update the enabled status
        const mapping = mockMappings.find(m => m.name === data.name);
        if (mapping) {
          mapping.enabled = data.enabled;
        }
      }, 200);
    }
    else if (channel === 'save-macro') {
      setTimeout(() => {
        // Add the new macro to our mock data
        const newMacro = {...data, id: mockMacros.length + 1};
        mockMacros.push(newMacro);
        this.mockReceive('macro-saved', { success: true, macro: newMacro });
        
        // Refresh the list
        this.mockReceive('macros', mockMacros);
      }, 500);
    }
  },
  
  receive: function(channel, callback) {
    if (!this.callbacks) this.callbacks = {};
    this.callbacks[channel] = callback;
  },
  
  mockReceive: function(channel, data) {
    console.log(`Mock receive on ${channel}:`, data);
    if (this.callbacks && this.callbacks[channel]) {
      this.callbacks[channel](data);
    }
  },
  
  mockDetectionInterval: null,
  
  startMockGestureDetection: function() {
    const gestures = [
      { gesture: "open_hand", gestureName: "Open Hand", gestureEmoji: "✋" },
      { gesture: "fist", gestureName: "Fist", gestureEmoji: "✊" },
      { gesture: "thumbs_up", gestureName: "Thumbs Up", gestureEmoji: "👍" },
      { gesture: "peace", gestureName: "Peace", gestureEmoji: "✌️" }
    ];
    
    this.mockDetectionInterval = setInterval(() => {
      const randomGesture = gestures[Math.floor(Math.random() * gestures.length)];
      const matchingMapping = mockMappings.find(m => m.gesture_id === randomGesture.gesture);
      
      this.mockReceive('gesture-detected', {
        ...randomGesture,
        matchingMappings: matchingMapping && matchingMapping.enabled ? 
          [{ name: matchingMapping.name, enabled: true }] : []
      });
    }, 5000); // Simulate gesture detection every 5 seconds
  },
  
  stopMockGestureDetection: function() {
    if (this.mockDetectionInterval) {
      clearInterval(this.mockDetectionInterval);
      this.mockDetectionInterval = null;
    }
  }
};

// Mock data
const mockMappings = [
  {
    id: 1,
    name: "Volume Up",
    gesture: "✋",
    gesture_id: "open_hand",
    macro: "Volume Up",
    enabled: true
  },
  {
    id: 2,
    name: "Play/Pause",
    gesture: "✊",
    gesture_id: "fist",
    macro: "Media Controls",
    enabled: true
  },
  {
    id: 3,
    name: "Volume Down",
    gesture: "✌️",
    gesture_id: "peace",
    macro: "Volume Down",
    enabled: true
  }
];

const mockMacros = [
  {
    id: 1,
    name: "Volume Up",
    actions: [
      { type: "keypress", value: "volumeup" }
    ]
  },
  {
    id: 2,
    name: "Media Controls",
    actions: [
      { type: "keypress", value: "playpause" }
    ]
  },
  {
    id: 3,
    name: "Volume Down",
    actions: [
      { type: "keypress", value: "volumedown" }
    ]
  },
  {
    id: 4,
    name: "Command Example",
    actions: [
      { type: "command", value: "echo Hello World" }
    ]
  }
]; 