import { Alert } from "react-native";
import HTTPService, { OTAProgress } from "../../http/HTTPService";
import DeviceStorageService, { SavedDevice } from "./DeviceStorageService";
import { otaUrl  } from "../../credentials";

async function getOtaProgress(
  savedDevice: SavedDevice, 
  setOTAProgress: (OTAProgress: OTAProgress) => void, 
  setOtaLoading: (loading: boolean) => void,
) {
    try {
      const httpDevice = await DeviceStorageService.getDevice(savedDevice.id);
      const progress = await HTTPService.getOTAProgress(savedDevice.ip);

      const otaProgress =  { 
        status: progress.status,
        in_progress: !!httpDevice?.otaStatus || progress.in_progress, 
        progress: progress.progress 
      };

      setOTAProgress(otaProgress);
      if (otaProgress?.in_progress) {
        setOtaLoading(true);
        setOtaLoading(false);
      }
    } catch (error) {
      console.warn('Failed to get OTA progress:', error);
  }
}

async function savedInfo(
  device: SavedDevice, 
  setIsConnected: (connected: boolean) => void,
  setOTAProgress: (OTAProgress: OTAProgress) => void, 
  setOtaLoading: (loading: boolean) => void,
) {
  try {
    const savedDevice = await DeviceStorageService.getDevice(device.id);
    if (savedDevice) {
      getOtaProgress(savedDevice, setOTAProgress, setOtaLoading);
      setIsConnected(true);
    } else {
      console.warn('No saved device info found');
    }
  } catch (error) {
    console.error('Failed to get saved device info:', error);
  }
}

export async function deviceInfo(
  device: SavedDevice, 
  setLoading: (loading: boolean) => void, 
  setIsConnected: (connected: boolean) => void, 
  setLightState: (state: 'on' | 'off') => void
) {
  try {
    const online = await HTTPService.checkConnection(device.ip);
    setIsConnected(online);
    if (!online) {
      console.error('Device is not connected');
      return;
    }

    // Get light status
    const status = await HTTPService.getLightStatus(device.ip);
    if (!status) {
      throw new Error('No light status received');
    }
    setLightState(status.state);

    const info = await HTTPService.getFirmwareInfo(device.ip);
    if (!info) {
      throw new Error('No firmware info received');
    }

    // Create a SavedDevice object and save it
    const prev = await DeviceStorageService.getDevice(device.id);
    const savedDevice: SavedDevice = {
      ...prev, // keep previous fields like projectName, buildDate, otaStatus, etc.
      id: device.id,
      name: device.name,
      ip: device.ip,
      version: info.version,
      lastConnected: new Date().toISOString(),
    };
    await DeviceStorageService.saveDevice(savedDevice);

  } catch (error) {
    console.error('Failed to get firmware info:', error);
  } finally {
    setLoading(false);
  }
}

export async function deviceConnection(
  device: SavedDevice, 
  setIsConnected: (connected: boolean) => void,
  setLoading: (loading: boolean) => void,
  setLightState: (state: 'on' | 'off') => void,
  setOTAProgress: (OTAProgress: OTAProgress) => void, 
  setOtaLoading: (loading: boolean) => void,
){
    try {
      await savedInfo(device, setIsConnected, setOTAProgress, setOtaLoading);
      await deviceInfo(device, setLoading, setIsConnected, setLightState);
    } catch (error) {
      console.error('Connection check failed:', error);
      setIsConnected(false);
    }
  };

export async function toggleLight(
  isConnected: boolean, 
  device: SavedDevice, 
  setLoading: (loading: boolean) => void, 
  setLightState: (state: 'on' | 'off') => void
) {
  if (!isConnected) {
    Alert.alert('Device Offline', 'Device is not connected. Please check your network connection.');
    return;
  }

  setLoading(true);
  try {
    const newStateText = await HTTPService.toggleLight(device.ip);
    setLightState(newStateText.toLowerCase() as 'on' | 'off');
  } catch (error) {
    console.error('Toggle failed:', error);
    Alert.alert('Error', 'Failed to toggle light. Please try again.');
  } finally {
    setLoading(false);
  }
}

export async function startOTAUpdate(
  device: SavedDevice,
  setLoading: (loading: boolean) => void, 
  setShowOTAModal: (show: boolean) => void,
) {
  setLoading(true);
  try {
    await HTTPService.startOTAUpdate(device.ip, otaUrl);
    setShowOTAModal(false);
    
    // Start monitoring OTA progress
    const deviceInfo = await DeviceStorageService.getDevice(device.id);
    if (!deviceInfo) {
      console.error('Device not found in storage');
      return;
    }
    const deviceToSave: SavedDevice = {
      ...deviceInfo,
      otaStatus: true, // Mark OTA as in progress
    };
    await DeviceStorageService.saveDevice(deviceToSave);
  } catch (error) {
    console.error('OTA update failed:', error);
    Alert.alert('Error', 'Failed to start OTA update. Please check the URL and try again.');
  } finally {
    setLoading(false);
  }
}

export function confirmDelete(device: SavedDevice, navigation: any) {
  Alert.alert(
    'Delete Device',
    `Are you sure you want to delete ${device.name}?`,
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', onPress: () => {
        DeviceStorageService.deleteDevice(device.id).then(success => {
          if (success) {
            navigation.navigate('Home');
          } else {
            Alert.alert('Error', 'Failed to delete device. Please try again.');
          }
        });
      }, style: 'destructive' },
    ]
  );
}

