# React Native App with Bottom Tab Navigation

## Overview

This is a React Native application built using Expo. The app features a bottom tab navigation with two screens: Home and Settings. The Home screen displays animated buttons, and the Settings screen allows users to simulate a connection process.

## Features

- **Bottom Tab Navigation**: Navigation between Home and Settings screens using `@react-navigation/bottom-tabs`.
- **Animated Buttons**: The Home screen displays buttons with fade-in animations.
- **Connectivity Simulation**: The Settings screen allows users to "connect" by clicking an image.
- **React Native Paper**: UI components styled using `react-native-paper`.
- **Icons**: Uses `@expo/vector-icons` for tab bar icons.

## Installation

### Prerequisites

- Node.js installed
- Expo CLI installed (`npm install -g expo-cli`)

### Steps

1. Clone the repository:
   ```sh
   git clone https://github.com/yasenOfficial/SmartGlasses.git
   cd SmartGlassesApp
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Start the Expo development server:
   ```sh
   npx expo start -c
   ```
4. Scan the QR code with the Expo Go app on your mobile device or use an emulator.

## Project Structure

```
.
├── .expo/               # Expo-related configuration files
├── .vscode/             # VS Code workspace settings
├── App.js               # Main entry point
├── babel.config.js      # Babel configuration file
├── package.json         # Project metadata and dependencies
├── package-lock.json    # Locked dependency versions
└── README.md            # Project documentation
```

## Dependencies

- `react-native`
- `expo`
- `react-navigation`
- `react-native-paper`
- `@expo/vector-icons`

## Screens

### Home Screen

- Displays four buttons (GPT, Spotify, Web Cam, Maps) with animation.
- Buttons only respond if the user is "connected".

### Settings Screen

- Displays an image button that sets the "connected" state when clicked.
- Once connected, the Home screen buttons become functional.
