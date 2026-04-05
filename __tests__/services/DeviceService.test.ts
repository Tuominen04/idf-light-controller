import { Alert } from 'react-native';
import HTTPService from '../../src/services/HTTPService';
import DeviceStorageService, { SavedDevice } from '../../src/services/DeviceStorageService';
import { deviceInfo, deviceConnection, toggleLight, startOTAUpdate, confirmDelete } from '../../src/services/DeviceService';

jest.mock('../../src/services/HTTPService', () => ({
  __esModule: true,
  default: {
    checkConnection: jest.fn(),
    getLightStatus: jest.fn(),
    getFirmwareInfo: jest.fn(),
    toggleLight: jest.fn(),
    startOTAUpdate: jest.fn(),
    getOTAProgress: jest.fn(),
  },
}));

jest.mock('../../src/services/DeviceStorageService', () => ({
  __esModule: true,
  default: {
    getDevice: jest.fn(),
    saveDevice: jest.fn(),
    deleteDevice: jest.fn(),
  },
}));

jest.mock('../../src/credentials', () => ({
  otaUrl: 'http://test-host/firmware.bin',
}));

jest.spyOn(Alert, 'alert');

const mockHTTP = HTTPService as jest.Mocked<typeof HTTPService>;
const mockStorage = DeviceStorageService as jest.Mocked<typeof DeviceStorageService>;

const device: SavedDevice = {
  id: 'dev-1',
  name: 'Test Light',
  ip: '192.168.1.50',
  version: '1.0.0',
  lastConnected: '2025-01-01T00:00:00Z',
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('deviceInfo', () => {
  const setLoading = jest.fn();
  const setIsConnected = jest.fn();
  const setLightState = jest.fn();

  test('fetches status, light state, firmware info and saves device', async () => {
    mockHTTP.checkConnection.mockResolvedValue(true);
    mockHTTP.getLightStatus.mockResolvedValue({ device: 1, state: 'on' });
    mockHTTP.getFirmwareInfo.mockResolvedValue({
      version: '2.0.0',
      project_name: 'light_client',
      app_elf_sha256: 'sha',
      date: 'Jul 19 2025',
      time: '20:29:21',
      ota_in_progress: false,
    });
    mockStorage.getDevice.mockResolvedValue(device);
    mockStorage.saveDevice.mockResolvedValue(true);

    await deviceInfo(device, setLoading, setIsConnected, setLightState);

    expect(setIsConnected).toHaveBeenCalledWith(true);
    expect(setLightState).toHaveBeenCalledWith('on');
    expect(mockStorage.saveDevice).toHaveBeenCalledWith(
      expect.objectContaining({ version: '2.0.0' }),
    );
    expect(setLoading).toHaveBeenCalledWith(false);
  });

  test('sets connected false and returns early when offline', async () => {
    mockHTTP.checkConnection.mockResolvedValue(false);

    await deviceInfo(device, setLoading, setIsConnected, setLightState);

    expect(setIsConnected).toHaveBeenCalledWith(false);
    expect(mockHTTP.getLightStatus).not.toHaveBeenCalled();
    expect(setLoading).toHaveBeenCalledWith(false);
  });
});

describe('toggleLight', () => {
  const setLoading = jest.fn();
  const setLightState = jest.fn();

  test('toggles light and updates state', async () => {
    mockHTTP.toggleLight.mockResolvedValue('Off');

    await toggleLight(true, device, setLoading, setLightState);

    expect(setLoading).toHaveBeenCalledWith(true);
    expect(setLightState).toHaveBeenCalledWith('off');
    expect(setLoading).toHaveBeenLastCalledWith(false);
  });

  test('shows alert when device is offline', async () => {
    await toggleLight(false, device, setLoading, setLightState);

    expect(Alert.alert).toHaveBeenCalledWith('Device Offline', expect.any(String));
    expect(mockHTTP.toggleLight).not.toHaveBeenCalled();
  });

  test('shows error alert on toggle failure', async () => {
    mockHTTP.toggleLight.mockRejectedValue(new Error('fail'));

    await toggleLight(true, device, setLoading, setLightState);

    expect(Alert.alert).toHaveBeenCalledWith('Error', expect.stringContaining('toggle'));
    expect(setLoading).toHaveBeenLastCalledWith(false);
  });
});

describe('startOTAUpdate', () => {
  const setLoading = jest.fn();
  const setShowOTAModal = jest.fn();

  test('starts OTA, closes modal, and marks otaStatus in storage', async () => {
    mockHTTP.startOTAUpdate.mockResolvedValue({ status: 'started' });
    mockStorage.getDevice.mockResolvedValue(device);
    mockStorage.saveDevice.mockResolvedValue(true);

    await startOTAUpdate(device, setLoading, setShowOTAModal);

    expect(mockHTTP.startOTAUpdate).toHaveBeenCalledWith(device.ip, 'http://test-host/firmware.bin');
    expect(setShowOTAModal).toHaveBeenCalledWith(false);
    expect(mockStorage.saveDevice).toHaveBeenCalledWith(
      expect.objectContaining({ otaStatus: true }),
    );
    expect(setLoading).toHaveBeenLastCalledWith(false);
  });

  test('shows alert on OTA failure', async () => {
    mockHTTP.startOTAUpdate.mockRejectedValue(new Error('fail'));

    await startOTAUpdate(device, setLoading, setShowOTAModal);

    expect(Alert.alert).toHaveBeenCalledWith('Error', expect.stringContaining('OTA'));
    expect(setLoading).toHaveBeenLastCalledWith(false);
  });
});

describe('confirmDelete', () => {
  test('calls Alert.alert with Delete and Cancel options', () => {
    const navigation = { navigate: jest.fn() };
    confirmDelete(device, navigation);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete Device',
      expect.stringContaining('Test Light'),
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel' }),
        expect.objectContaining({ text: 'Delete' }),
      ]),
    );
  });

  test('Delete button navigates home on success', async () => {
    const navigation = { navigate: jest.fn() };
    mockStorage.deleteDevice.mockResolvedValue(true);

    confirmDelete(device, navigation);

    // Extract the onPress from the Delete button
    const alertArgs = (Alert.alert as jest.Mock).mock.calls[0];
    const deleteButton = alertArgs[2].find((b: any) => b.text === 'Delete');
    await deleteButton.onPress();

    expect(mockStorage.deleteDevice).toHaveBeenCalledWith('dev-1');
    expect(navigation.navigate).toHaveBeenCalledWith('Home');
  });
});
