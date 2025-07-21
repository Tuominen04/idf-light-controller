// BLE Service and Characteristic UUIDs from ESP32 firmware
export const BLE_CONSTANTS = {
  SERVICE_UUID: '4b9131c3-c9c5-cc8f-9e45-b51f01c2af4f',
  WIFI_CHARACTERISTIC_UUID: 'a8261b36-07ea-f5b7-8846-e1363e48b5be',
  DEVICE_INFO_CHARACTERISTIC_UUID: '145f8763-1632-c09d-547c-bb6a451e20cf',
  DEVICE_NAME_PREFIX: 'ESP-C6-Light',
} as const;

// App-wide constants
export const APP_CONSTANTS = {
  SCAN_DURATION: 10000, // 10 seconds
  CONNECTION_TIMEOUT: 15000, // 15 seconds
  DEVICE_STORAGE_KEY: 'saved_devices',
} as const;

// HTTP API endpoints
export const API_ENDPOINTS = {
  ONLINE_STATUS: '/online',
  LIGHT_STATUS: '/light',
  TOGGLE_LIGHT: '/toggle',
  FIRMWARE_INFO: '/ota/firmware-info',
  OTA_UPDATE: '/ota/update',
  OTA_PROGRESS: '/ota/progress',
} as const;