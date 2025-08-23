import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { SavedDevice } from './DeviceStorageService';
import HTTPService from '../http/HTTPService';
import DeviceStorageService from './DeviceStorageService';
import styles from '../styles/DeviceControlScreen.styles';
import { renderConnectionStatus, renderDeviceInfo } from './components/DeviceInfo';
import { renderLightControl } from './components/LightControll';
import { OTAProgress, NavigationProp, RoutePropType } from './types';
import { IPCONFIG } from '../credentials';
import { renderOTAControl, renderOTAModal } from './components/OTAControll';
import { renderDeleteButton } from './components/DeleteButton';

const DeviceControlScreen = () => {
  const route = useRoute<RoutePropType>();
  const { device } = route.params;

  let fixedOtaProgress = 0;

  const navigation = useNavigation<NavigationProp>();

  // State management
  const [lightState, setLightState] = useState<'on' | 'off'>('off');
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otaLoading, setOtaLoading] = useState(false);
  const [refresh, setRefreshing] = useState(false);
  const [otaProgress, setOTAProgress] = useState<OTAProgress | null>(null);
  const [showOTAModal, setShowOTAModal] = useState(false);
  const [monitoringOTA, setMonitoringOTA] = useState(false);
  const otaIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clear interval on unmount
  useEffect(() => {
    return () => {
      if (otaIntervalRef.current) {
        clearInterval(otaIntervalRef.current);
        otaIntervalRef.current = null;
      }
    };
  }, []);

  // Poll device connection only when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      let interval: NodeJS.Timeout | null = null;
      setLoading(true);
      checkDeviceConnection();
      interval = setInterval(checkDeviceConnection, 10000);
      return () => {
        if (interval) clearInterval(interval);
      };
    }, [device])
  );

  const refreshDeviceData = async () => {
    setRefreshing(true);
    try {
      // Check connection and get light status
      await checkDeviceConnection();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    refreshDeviceData();
  };

  const checkDeviceConnection = async () => {
    try {
      getSavedInfo();
      await getDeviceInfo();
    } catch (error) {
      console.error('Connection check failed:', error);
      setIsConnected(false);
    }
  };

  const getOtaProgress = async (savedDevice: SavedDevice) => {
    try {
      const httpDevice = await DeviceStorageService.getDevice(savedDevice.id);
      const progress = await HTTPService.getOTAProgress(device.ip);

      console.log('OTA http:', httpDevice);
      console.log('OTA progress:', progress);
      const otaProgress =  { 
        status: progress.status,
        in_progress: !!httpDevice?.otaStatus || progress.in_progress, 
        progress: progress.progress 
      };

      setOTAProgress(otaProgress);
      if (otaProgress?.in_progress) {
        setOtaLoading(true);
        monitorOTAProgress();
        setOtaLoading(false);
      }
    } catch (error) {
      console.warn('Failed to get OTA progress:', error);
    }
  };

  const getSavedInfo = async () => {
    try {
      const savedDevice = await DeviceStorageService.getDevice(device.id);
      if (savedDevice) {
        getOtaProgress(savedDevice);
        setIsConnected(true);
      } else {
        console.warn('No saved device info found');
      }
    } catch (error) {
      console.error('Failed to get saved device info:', error);
    }
  };

  const getDeviceInfo = async () => {
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
  };

  const toggleLight = async () => {
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
  };

  const startOTAUpdate = async () => {
    setLoading(true);
    try {
      const otaUrl = `http://${IPCONFIG.ip}:${IPCONFIG.port}/light_client.bin`;
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

      monitorOTAProgress();
    } catch (error) {
      console.error('OTA update failed:', error);
      Alert.alert('Error', 'Failed to start OTA update. Please check the URL and try again.');
    } finally {
      setLoading(false);
    }
  };

  const monitorOTAProgress = () => {
    if (monitoringOTA) return; // Prevent duplicate intervals
    setMonitoringOTA(true);

    if (otaIntervalRef.current) {
      clearInterval(otaIntervalRef.current);
      otaIntervalRef.current = null;
    }

    otaIntervalRef.current = setInterval(async () => {
      try {
        const progress = await HTTPService.getOTAProgress(device.ip);
        if (!progress) {
          console.warn('No OTA progress data received');
          return;
        }

        if (progress?.progress !== undefined && progress.progress > fixedOtaProgress) {
          setOTAProgress(progress);
          fixedOtaProgress = progress?.progress;
        }
        
        if (!progress.in_progress) {
          if (otaIntervalRef.current) {
            clearInterval(otaIntervalRef.current);
            otaIntervalRef.current = null;
          }
          setOTAProgress(null);
          setMonitoringOTA(false); // Allow future monitoring
          // Update device info to clear otaStatus
          const deviceInfo = await DeviceStorageService.getDevice(device.id);
          if (deviceInfo) {
            await DeviceStorageService.saveDevice({ ...deviceInfo, otaStatus: false });
          }
          setOTAProgress(null);
          setTimeout(getDeviceInfo, 2000);
        }
      } catch (error) {
        console.warn('Failed to monitoring OTA progress:', error);
      }
    }, 2000);

    setTimeout(() => {
      if (otaIntervalRef.current) {
        clearInterval(otaIntervalRef.current);
        otaIntervalRef.current = null;
      }
      setOTAProgress(null);
      setMonitoringOTA(false);
    }, 300000);
  };

  const confirmDelete = (device: SavedDevice) => {
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
  };
  
  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
         refreshing={refresh}
          onRefresh={onRefresh}
          colors={['#2196F3']} // Android
          tintColor="#2196F3" // iOS
          title="Pull to refresh..." // iOS
          titleColor="#666" // iOS   
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.deviceName}>{device.name}</Text>
        {renderConnectionStatus(isConnected)}
      </View>

      {renderLightControl(lightState, loading, refresh, isConnected, toggleLight)}
      {renderDeviceInfo(device)}
      {renderOTAControl(loading, isConnected, otaProgress, setShowOTAModal)}
      {renderOTAModal(showOTAModal, setShowOTAModal, startOTAUpdate, loading, refresh, otaLoading)}
      {renderDeleteButton(loading, isConnected, confirmDelete, device)}
    </ScrollView>
  );
};

export default DeviceControlScreen;