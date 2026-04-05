# ESP32 Light Controller

React Native app for controlling ESP32-C6 LED lights over WiFi.

Devices are discovered and configured via BLE, then controlled through a local
HTTP API. Supports light toggling, firmware info, and OTA updates.

## Features

- BLE scanning and automatic ESP32-C6 discovery
- WiFi provisioning over BLE
- Light on/off control over HTTP
- Firmware version display
- Over-the-air (OTA) firmware updates with progress tracking
- Saved device list with online/offline status
- Pull-to-refresh connectivity checks

## Quick Start

### Prerequisites

- Node.js 18+
- Android Studio with Android SDK
- JDK 17+
- Physical Android device (BLE does not work on emulators)

### Setup

```bash
npm install
cp src/credentials.example.ts src/credentials.ts
# Edit src/credentials.ts with your WiFi and OTA server details
```

### Run

```bash
npm start          # Start Metro bundler
npm run android    # Build and install on device
```

### Test

```bash
npm test
```

## Project Structure

```txt
src/
  screens/            # App screens (Home, BLEScan, DeviceSetup, DeviceControl)
  services/           # BLE, HTTP, device storage, business logic
  device/
    components/       # Device control UI (light toggle, OTA, device info)
    hooks/            # Custom hooks (OTA monitor, device connection)
  styles/             # StyleSheet files per screen
  utils/              # Constants and helpers
  types.ts            # Shared TypeScript types
  credentials.ts      # WiFi and OTA config (not committed)
```

## How It Works

```txt
1. Scan for ESP32 devices via BLE
2. Connect and send WiFi credentials
3. ESP32 joins your network
4. Control the light over HTTP from the Home screen
```

## Documentation

- [Architecture](docs/architecture.md)
- [BLE Setup](docs/ble-setup.md)
- [API Endpoints](docs/api-endpoints.md)
- [Running on Android](docs/running-android.md)
- [Testing](docs/testing.md)

## Tech Stack

- React Native 0.80
- TypeScript
- react-native-ble-plx (BLE)
- React Navigation (stack)
- AsyncStorage (device persistence)
- Jest + Testing Library

## License

This project is provided as-is for educational and personal use.
