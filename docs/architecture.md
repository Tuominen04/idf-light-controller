# Architecture

## Overview

The app uses a service-based architecture with React Native stack navigation.
ESP32 devices are discovered over BLE, configured with WiFi credentials, then
controlled over HTTP on the local network.

## App Flow

```txt
BLE Scan --> Device Setup (send WiFi creds via BLE)
                |
                v
Home (saved devices) --> Device Control (HTTP)
```

## Screens

| Screen | Purpose |
| --- | --- |
| `HomeScreen` | Lists saved devices with online/offline status |
| `BLEScanScreen` | Scans for nearby ESP32-C6 BLE devices |
| `DeviceSetupScreen` | Sends WiFi credentials to ESP32 over BLE |
| `DeviceControlScreen` | Light toggle, firmware info, OTA updates |

## Services

| Service | Role |
| --- | --- |
| `BLEService` | BLE scanning, connecting, sending WiFi credentials |
| `HTTPService` | REST calls to ESP32 (light control, OTA, status) |
| `DeviceService` | Business logic combining HTTP and storage |
| `DeviceStorageService` | Persists devices to AsyncStorage |

## State Management

The app uses local `useState` hooks per screen. No global state library is
needed given the app's size. Services receive state setters as callbacks.
