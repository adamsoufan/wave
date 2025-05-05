# Wave Gestures - UI Showcase

This is a user interface showcase for the Wave Gestures application, designed to demonstrate the UI/UX design without requiring the actual backend gesture detection components.

## What is Wave Gestures?

Wave Gestures is a desktop application that allows users to control their computer using hand gestures detected through their webcam. The full version uses MediaPipe and machine learning to detect hand gestures in real-time and execute custom actions.

## About this UI Showcase

This showcase demonstrates the user interface of the Wave Gestures app with simulated functionality:

- **Home Page**: View active gesture mappings and toggle gesture detection
- **Mapping Hub**: Create and edit gesture-to-action mappings
- **Macro Hub**: Define custom macros (sequences of actions)
- **Help**: Learn how to use the application

## Features Demonstrated

1. **Dynamic UI with state management**
2. **Drag and drop functionality** in the Macro Hub
3. **Toggle switches** for enabling/disabling gesture mappings
4. **Simulated gesture detection** (when "Start Detecting" is pressed)
5. **Form controls** for creating macros and mappings

## Simulated Functionality

- Pressing "Start Detecting" will simulate gesture detection with random gestures appearing every 5 seconds
- Creating mappings and macros will be stored in the browser session
- Toggling mappings on/off works within the session

## Note for Evaluators

This is a UI-only demonstration. The full application includes:

- Real-time hand gesture detection using Python, OpenCV, and MediaPipe
- Integration with the operating system for executing keyboard commands
- System tray functionality for background operation
- Command line execution capabilities

## Technologies Used

- HTML5
- CSS3
- JavaScript
- Web-based simulation of the Electron framework
