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