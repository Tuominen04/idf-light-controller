# BLE Device Setup

## How It Works

1. The app scans for BLE devices with the name prefix `ESP-C6-Light`.
2. User selects a device from the scan list.
3. The app connects to the ESP32 over BLE.
4. WiFi SSID and password are sent via a BLE characteristic.
5. The ESP32 connects to WiFi and becomes reachable over HTTP.
6. The device is saved locally for future use.

## BLE UUIDs

| Item | UUID |
| --- | --- |
| Service | `4b9131c3-c9c5-cc8f-9e45-b51f01c2af4f` |
| WiFi characteristic | `a8261b36-07ea-f5b7-8846-e1363e48b5be` |
| Device info characteristic | `145f8763-1632-c09d-547c-bb6a451e20cf` |

## Permissions

- **Android 12+**: `BLUETOOTH_SCAN`, `BLUETOOTH_CONNECT`, `ACCESS_FINE_LOCATION`
- **Android 6-11**: `ACCESS_FINE_LOCATION`
- BLE scanning does **not** work on Android emulators. Use a physical device.

## Credentials File

Copy `src/credentials.example.ts` to `src/credentials.ts` and fill in your
WiFi details and OTA server IP:

```typescript
export const CREDENTIALS = {
  wifiSsid: "your_wifi_ssid",
  wifiPassword: "your_wifi_password",
};

export const IPCONFIG = {
  ip: "192.168.1.100",
  port: 8080,
};
```
