import { BleManager, Device, State } from 'react-native-ble-plx';
import { PermissionsAndroid, Platform } from 'react-native';
import { BLE_CONSTANTS } from '../utils/constants';
import base64 from 'react-native-base64';

interface BLEDevice {
  id: string;
  name: string;
  rssi: number | null;
}

class BLEServiceClass {
  private manager: BleManager;
  private scanning: boolean = false;
  private connectedDevice: Device | null = null;
  private initialized: boolean = false;

  constructor() {
    this.manager = new BleManager();
  }

  // Initialize BLE and request permissions
  async initialize(): Promise<void> {
    // Check if already initialized
    if (this.initialized) {
      console.log('BLE already initialized');
      return;
    }

    console.log('Initializing BLE...');
    
    // Request permissions on Android
    if (Platform.OS === 'android') {
      const apiLevel = parseInt(Platform.Version.toString(), 10);
      
      if (apiLevel >= 31) {
        // Android 12 and above
        const result = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        
        const allGranted = Object.values(result).every(
          permission => permission === PermissionsAndroid.RESULTS.GRANTED
        );
        
        if (!allGranted) {
          throw new Error('Bluetooth permissions not granted');
        }
      } else if (apiLevel >= 23) {
        // Android 6 to 11
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'Bluetooth Low Energy needs access to your location',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          throw new Error('Location permission not granted');
        }
      }
    }

    // Check if Bluetooth is powered on
    const state = await this.manager.state();
    console.log('Current BLE state:', state);
    
    if (state !== State.PoweredOn) {
      // Wait for Bluetooth to be powered on
      await new Promise<void>((resolve) => {
        const subscription = this.manager.onStateChange((newState) => {
          console.log('BLE state changed to:', newState);
          if (newState === State.PoweredOn) {
            subscription.remove();
            resolve();
          }
        }, true);
      });
    }
    
    console.log('BLE initialized successfully');
    this.initialized = true;
  }

  // Scan for ESP32 devices
  async scanForDevices(
    onDeviceFound: (device: BLEDevice) => void,
    duration: number = 10000
  ): Promise<void> {
    if (this.scanning) {
      console.log('Already scanning');
      return;
    }

    console.log('Starting BLE scan for', BLE_CONSTANTS.DEVICE_NAME_PREFIX);
    this.scanning = true;
    const foundDevices = new Map<string, Device>();

    this.manager.startDeviceScan(
      null, // Scan for all services
      { allowDuplicates: true }, // Allow duplicates to update RSSI
      (error, device) => {
        if (error) {
          console.error('Scan error:', error);
          this.scanning = false;
          return;
        }

        if (device && device.name) {
          // Check if device name starts with our prefix
          if (device.name.startsWith(BLE_CONSTANTS.DEVICE_NAME_PREFIX)) {
            // Update or add device
            foundDevices.set(device.id, device);
            
            console.log(`Found device: ${device.name} (${device.id}) RSSI: ${device.rssi}`);
            
            // Notify callback
            onDeviceFound({
              id: device.id,
              name: device.name,
              rssi: device.rssi,
            });
          }
        }
      }
    );

    // Stop scanning after duration
    setTimeout(() => {
      this.stopScan();
    }, duration);
  }

  // Stop scanning
  stopScan(): void {
    if (this.scanning) {
      console.log('Stopping BLE scan');
      this.manager.stopDeviceScan();
      this.scanning = false;
    }
  }

  // Connect to device
  async connectToDevice(deviceId: string): Promise<Device> {
    try {
      console.log('Connecting to device:', deviceId);
      
      // Stop scanning first
      this.stopScan();
      
      // Connect to device
      const device = await this.manager.connectToDevice(deviceId, {
        autoConnect: false,
        timeout: 15000,
      });
      
      // Discover services and characteristics
      await device.discoverAllServicesAndCharacteristics();
      
      this.connectedDevice = device;
      console.log('Connected to device:', device.name);
      
      return device;
    } catch (error) {
      console.error('Connection error:', error);
      throw error;
    }
  }

  // Send WiFi credentials (uncomment when needed)
  async sendWiFiCredentials(ssid: string, password: string): Promise<void> {
    if (!this.connectedDevice) {
      throw new Error('No device connected');
    }

    const credentials = { ssid, password };
    const credentialsJson = JSON.stringify(credentials);
    const base64Data = base64.encode(credentialsJson);

    console.log('Sending WiFi credentials');
    await this.connectedDevice.writeCharacteristicWithResponseForService(
      BLE_CONSTANTS.SERVICE_UUID,
      BLE_CONSTANTS.WIFI_CHARACTERISTIC_UUID,
      base64Data
    );
  }

  // Disconnect from device
  async disconnect(): Promise<void> {
    if (this.connectedDevice) {
      console.log('Disconnecting from device');
      await this.connectedDevice.cancelConnection();
      this.connectedDevice = null;
    }
  }

  // Cleanup
  destroy(): void {
    this.stopScan();
    this.disconnect();
    this.manager.destroy();
  }
}

// Export singleton instance
const BLEService = new BLEServiceClass();
export default BLEService;