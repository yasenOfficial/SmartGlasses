# SmartGlassesApp

A React Native application for smart glasses using Expo.

## Getting Started

### Prerequisites

- Node.js (LTS version recommended)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- Mobile device with Expo Go app or emulator

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd SmartGlassesApp
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server:
   ```bash
   npx expo start
   ```

## Environment Variables Setup

This project uses environment variables to securely store API keys. Follow these steps to set up:

1. Create a `.env` file in the root directory of the project
2. Add your API keys to the `.env` file:

```
OPENAI_API_KEY=your_openai_api_key_here
OCR_API_KEY=your_ocr_api_key_here
```

3. Make sure the `.env` file is listed in your `.gitignore` to prevent committing sensitive information

## Development

### Project Structure

SmartGlassesApp/
├── src/
│ ├── components/ # Reusable UI components
│ │ ├── Bluetooth/
│ │ │ ├── BluetoothDeviceList.js    # List of available BLE devices
│ │ │ ├── BluetoothStatus.js        # Status indicator component
│ │ │ └── BluetoothControls.js      # Connection controls
│ │ └── ... other components
│ ├── hooks/
│ │ ├── useBluetooth.js               # Main Bluetooth logic hook
│ │ └── useBluetoothPermissions.js    # Permissions management
│ ├── screens/
│ │ └── BluetoothScreen.js            # Main BLE management screen
│ └── utils/
│   └── bluetoothHelpers.js           # Helper functions
│ ├── navigation/ # Navigation configuration
│ ├── services/ # API and business logic
│ └── assets/ # Images, fonts, etc.
├── App.js # Main application component
├── app.json # Expo configuration
└── package.json # Dependencies and scripts
```

## Important Notes

- Never commit API keys directly in the source code
- Always use environment variables for sensitive information
- Check your git history to ensure no API keys are present in previous commits
