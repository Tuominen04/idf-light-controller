import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceStorageService, { SavedDevice } from '../../src/services/DeviceStorageService';

const DEVICES_KEY = '@saved_devices';

const mockDevice: Omit<SavedDevice, 'lastConnected'> = {
  id: 'device-1',
  name: 'ESP Light',
  ip: '192.168.1.100',
  version: '1.0.0',
};

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('DeviceStorageService', () => {
  describe('getDevices', () => {
    test('returns empty array when storage is empty', async () => {
      const devices = await DeviceStorageService.getDevices();
      expect(devices).toEqual([]);
    });

    test('returns saved devices', async () => {
      const saved: SavedDevice = { ...mockDevice, lastConnected: '2025-01-01T00:00:00Z' };
      await AsyncStorage.setItem(DEVICES_KEY, JSON.stringify([saved]));

      const devices = await DeviceStorageService.getDevices();
      expect(devices).toHaveLength(1);
      expect(devices[0].id).toBe('device-1');
    });
  });

  describe('saveDevice', () => {
    test('saves a new device', async () => {
      const result = await DeviceStorageService.saveDevice(mockDevice);
      expect(result).toBe(true);

      const devices = await DeviceStorageService.getDevices();
      expect(devices).toHaveLength(1);
      expect(devices[0].name).toBe('ESP Light');
      expect(devices[0].lastConnected).toBeDefined();
    });

    test('updates existing device by id', async () => {
      await DeviceStorageService.saveDevice(mockDevice);
      await DeviceStorageService.saveDevice({ ...mockDevice, version: '2.0.0' });

      const devices = await DeviceStorageService.getDevices();
      expect(devices).toHaveLength(1);
      expect(devices[0].version).toBe('2.0.0');
    });
  });

  describe('getDevice', () => {
    test('returns device by id', async () => {
      await DeviceStorageService.saveDevice(mockDevice);
      const device = await DeviceStorageService.getDevice('device-1');
      expect(device?.name).toBe('ESP Light');
    });

    test('returns null for unknown id', async () => {
      const device = await DeviceStorageService.getDevice('nonexistent');
      expect(device).toBeNull();
    });
  });

  describe('deleteDevice', () => {
    test('removes device from storage', async () => {
      await DeviceStorageService.saveDevice(mockDevice);
      const result = await DeviceStorageService.deleteDevice('device-1');
      expect(result).toBe(true);

      const devices = await DeviceStorageService.getDevices();
      expect(devices).toHaveLength(0);
    });

    test('succeeds even if device does not exist', async () => {
      const result = await DeviceStorageService.deleteDevice('nonexistent');
      expect(result).toBe(true);
    });
  });

  describe('clearAllDevices', () => {
    test('removes all devices', async () => {
      await DeviceStorageService.saveDevice(mockDevice);
      await DeviceStorageService.saveDevice({ ...mockDevice, id: 'device-2', name: 'Light 2' });

      const result = await DeviceStorageService.clearAllDevices();
      expect(result).toBe(true);

      const devices = await DeviceStorageService.getDevices();
      expect(devices).toEqual([]);
    });
  });

  describe('deviceExists', () => {
    test('returns true for saved device', async () => {
      await DeviceStorageService.saveDevice(mockDevice);
      expect(await DeviceStorageService.deviceExists('device-1')).toBe(true);
    });

    test('returns false for unknown device', async () => {
      expect(await DeviceStorageService.deviceExists('nope')).toBe(false);
    });
  });
});
