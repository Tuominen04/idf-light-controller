import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICES_STORAGE_KEY = '@saved_devices';

export interface SavedDevice {
  id: string;
  name: string;
  ip: string;
  version: string;
  lastConnected: string;
}

class DeviceStorageService {
  // Get all saved devices
  async getDevices(): Promise<SavedDevice[]> {
    try {
      const devicesJson = await AsyncStorage.getItem(DEVICES_STORAGE_KEY);
      return devicesJson ? JSON.parse(devicesJson) : [];
    } catch (error) {
      console.error('Failed to get devices:', error);
      return [];
    }
  }

  // Save or update a device
  async saveDevice(deviceInfo: Omit<SavedDevice, 'lastConnected'>): Promise<boolean> {
    try {
      const devices = await this.getDevices();
      const existingIndex = devices.findIndex(d => d.id === deviceInfo.id);
      
      const deviceToSave: SavedDevice = {
        ...deviceInfo,
        lastConnected: new Date().toISOString(),
      };

      if (existingIndex >= 0) {
        // Update existing device
        devices[existingIndex] = deviceToSave;
      } else {
        // Add new device
        devices.push(deviceToSave);
      }

      await AsyncStorage.setItem(DEVICES_STORAGE_KEY, JSON.stringify(devices));
      return true;
    } catch (error) {
      console.error('Failed to save device:', error);
      return false;
    }
  }

  // Delete a device
  async deleteDevice(deviceId: string): Promise<boolean> {
    try {
      const devices = await this.getDevices();
      const filteredDevices = devices.filter(d => d.id !== deviceId);
      await AsyncStorage.setItem(DEVICES_STORAGE_KEY, JSON.stringify(filteredDevices));
      return true;
    } catch (error) {
      console.error('Failed to delete device:', error);
      return false;
    }
  }

  // Get a specific device by ID
  async getDevice(deviceId: string): Promise<SavedDevice | null> {
    try {
      const devices = await this.getDevices();
      return devices.find(d => d.id === deviceId) || null;
    } catch (error) {
      console.error('Failed to get device:', error);
      return null;
    }
  }

  // Clear all devices
  async clearAllDevices(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(DEVICES_STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Failed to clear devices:', error);
      return false;
    }
  }

  // Check if a device exists
  async deviceExists(deviceId: string): Promise<boolean> {
    const devices = await this.getDevices();
    return devices.some(d => d.id === deviceId);
  }
}

export default new DeviceStorageService();