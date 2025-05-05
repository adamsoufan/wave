# Wave Gestures

![Wave Gestures Logo](renderer/assets/images/wave.png)

Wave Gestures is a desktop application that allows you to control your computer using hand gestures detected through your webcam. Create custom macros, map them to specific hand gestures, and execute commands without touching your keyboard or mouse.

## Features

- **Real-time Hand Gesture Detection**: Detects common hand gestures like open hand, fist, thumbs up, and peace sign
- **Custom Macro Creation**: Create sequences of actions that can be triggered by gestures
- **Multiple Action Types**:
  - Keyboard shortcuts
  - Command line commands
- **Intuitive UI**: Easy-to-use interface for managing mappings and macros
- **System Tray Integration**: Runs in the background with tray icon access
- **Toggle Control**: Enable/disable specific gesture mappings as needed

## Demo

When running, Wave Gestures can detect the following gestures:

- ✋ Open Hand
- ✊ Fist
- 👍 Thumbs Up
- ✌️ Peace Sign
- 👌 OK Sign

## Installation

### Prerequisites

- Windows 10 or later
- Python 3.8+ installed
- Node.js and npm installed
- Webcam connected to your computer

### Step 1: Clone the Repository

```bash
git clone https://github.com/adamsoufan/wave.git
cd wave
```

### Step 2: Install JavaScript Dependencies

```bash
npm install
```

### Step 3: Install Python Dependencies

```bash
pip install -r requirements.txt
```

### Step 4: Start the Application

```bash
npm start
```

For development mode with DevTools open:

```bash
npm run dev
```

## Building the Application

To build a distributable package:

```bash
npm run build
```

This will create installation packages in the `dist` directory.

## Usage Guide

### Setting Up Your First Gesture Macro

1. **Create a Macro**:

   - Go to the Macro Hub page
   - Click "New Macro"
   - Name your macro (e.g., "Volume Up")
   - Add actions (e.g., a key press action for volume up key)
   - Save the macro

2. **Map a Gesture to Your Macro**:

   - Go to the Mapping Hub page
   - Click "New Mapping"
   - Select your macro from the dropdown
   - Give the mapping a name
   - Click on the hand icon to select a gesture (e.g., Thumbs Up)
   - Save the mapping

3. **Use Your Gesture**:
   - Go to the Home page
   - Click "Start Detecting"
   - Perform the gesture in front of your webcam
   - The action will be executed

### Example: Media Controls

Create macros for:

- Play/Pause (Space key)
- Volume Up (volume up key)
- Volume Down (volume down key)

Map them to:

- Fist gesture for Play/Pause
- Thumbs Up for Volume Up
- Peace Sign for Volume Down

## Project Structure

- `main.js`: Main Electron process
- `preload.js`: Preload script for renderer process
- `renderer/`: UI files
- `gesture-detection/`: Python scripts for gesture detection
  - `Detector.py`: Main detector script
  - `hand_gesture_knn_model.pkl`: Trained model for gesture recognition

## Technology Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Electron, Node.js
- **Gesture Detection**: Python, OpenCV, MediaPipe, scikit-learn
- **OS Integration**: RobotJS

## Troubleshooting

### Camera Access Issues

- Ensure your webcam is properly connected
- Verify webcam permissions are enabled for the application
- Try using a different camera by changing the `CAMERA_INDEX` in `gesture-detection/Detector.py`

### Detection Problems

- Ensure good lighting in your environment
- Position your hand clearly in front of the camera
- Try restarting the detection process

### Macro Execution Issues

- Verify the macro is correctly defined
- Check if the mapping is enabled (toggle is ON)
- Ensure the target application is in focus when needed

## License

ISC License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

- [MediaPipe](https://mediapipe.dev/) for hand tracking technology
- [Electron](https://www.electronjs.org/) for the desktop application framework
- [RobotJS](http://robotjs.io/) for system automation capabilities
