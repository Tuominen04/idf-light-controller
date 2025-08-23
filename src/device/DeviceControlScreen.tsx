import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Modal,
  RefreshControl,
} from 'react-native';
import { useRoute, RouteProp, useNavigation, useFocusEffect } from '@react-navigation/native';
import { SavedDevice } from './DeviceStorageService';
import HTTPService from '../http/HTTPService';
import { IPCONFIG } from '../credentials';
import { StackNavigationProp } from '@react-navigation/stack';
import DeviceStorageService from './DeviceStorageService';
import styles from '../styles/DeviceControlScreen.styles';

type RootStackParamList = {
  Home: undefined;
  BLEScan: undefined;
  DeviceSetup: { device: { id: string; name: string; rssi: number | null } };
  DeviceControl: { device: SavedDevice };
};

type NavigationProp = StackNavigationProp<RootStackParamList, 'DeviceControl'>;
type RoutePropType = RouteProp<RootStackParamList, 'DeviceControl'>;

interface OTAProgress {
  in_progress: boolean;
  progress?: number;
  status?: string;
}

const DeviceControlScreen = () => {
  const route = useRoute<RoutePropType>();
  const { device } = route.params;

  const otaUrl = `http://${IPCONFIG.ip}:${IPCONFIG.port}/light_client.bin`
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

    // Helper to format date/time to 'YYYY-MM-DD HH:mm:ss'
  function formatDateTime(dateString: string, timeString?: string): string {
    let dateObj: Date;
    if (timeString) {
      // firmwareInfo.date: "Jul 19 2025", firmwareInfo.time: "20:29:21"
      // Parse month name to number
      const [monthStr, day, year] = dateString.split(' ');
      const monthMap: { [key: string]: string } = {
        Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
        Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12'
      };
      const month = monthMap[monthStr] || '01';
      // Build ISO string: "2025-07-19T20:29:21"
      const isoString = `${year}-${month}-${day}T${timeString}`;
      dateObj = new Date(isoString);
    } else {
      // device.lastConnected: ISO string
      dateObj = new Date(dateString);
    }
    if (isNaN(dateObj.getTime())) return dateString + (timeString ? ' ' + timeString : '');
    // Format as YYYY-MM-DD HH:mm:ss
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())} ${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}`;
  }

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

  const renderConnectionStatus = () => (
    <View style={styles.statusContainer}>
      <View style={[styles.statusDot, { backgroundColor: isConnected ? '#4CAF50' : '#f44336' }]} />
      <Text style={[styles.statusText, { color: isConnected ? '#4CAF50' : '#f44336' }]}>
        {isConnected ? 'Connected' : 'Offline'}
      </Text>
    </View>
  );

  const renderLightControl = () => (
    <View style={styles.controlCard}>
      <Text style={styles.cardTitle}>Light Control</Text>
      <View style={styles.lightControl}>
        <View style={styles.lightStatus}>
          <View style={[styles.lightIndicator, { backgroundColor: lightState === 'on' ? '#FFC107' : '#666' }]} />
          <Text style={styles.lightStateText}>Light is {lightState.toUpperCase()}</Text>
        </View>
        <View style={styles.controlButtons}>
          <TouchableOpacity
            style={[styles.controlButton, { opacity: loading || !isConnected ? 0.5 : 1 }]}
            onPress={toggleLight}
            disabled={loading || refresh || !isConnected}
          >
            {loading || refresh ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.controlButtonText}>
                {lightState === 'on' ? 'Turn OFF' : 'Turn ON'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderDeviceInfo = () => (
    <View style={styles.controlCard}>
      <Text style={styles.cardTitle}>Device Information</Text>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Name:</Text>
        <Text style={styles.infoValue}>{device.name}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>ID:</Text>
        <Text style={styles.infoValue}>{device.id}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>IP Address:</Text>
        <Text style={styles.infoValue}>{device.ip}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Project:</Text>
        <Text style={styles.infoValue}>{device.projectName}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Version:</Text>
        <Text style={styles.infoValue}>{device.version}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Last Connected:</Text>
        <Text style={styles.infoValue}>{formatDateTime(device.lastConnected)}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Build Date:</Text>
        <Text style={styles.infoValue}>{formatDateTime(device.buildDate ?? '')}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>OTA Status:</Text>
        <Text style={[styles.infoValue, { color: device.otaStatus ? '#FF9800' : '#4CAF50' }]}>
          {device.otaStatus ? 'In Progress' : 'Ready'}
        </Text>
      </View>
    </View>
  );

  const renderOTAControl = () => (
    <View style={styles.controlCard}>
      <Text style={styles.cardTitle}>OTA Updates</Text>
      <Text style={styles.cardDescription}>
        Upload new firmware to your device over WiFi
      </Text>
      
      {otaProgress?.in_progress && (
        <View style={styles.otaProgress}>
          <Text style={styles.otaStatusText}>{otaProgress.status}</Text>
          {otaProgress.progress && (
            <View style={styles.progressBar}>
              <View 
                style={[styles.progressFill, { width: `${otaProgress.progress}%` }]} 
              />
              <Text style={styles.progressText}>{otaProgress.progress.toFixed(0)}%</Text>
            </View>
          )}
        </View>
      )}
      
      <TouchableOpacity
        style={[styles.secondaryButton, { 
          opacity: loading || !isConnected || (otaProgress?.in_progress) ? 0.5 : 1 
        }]}
        onPress={() => setShowOTAModal(true)}
        disabled={loading || !isConnected || (otaProgress?.in_progress)}
      >
        <Text style={styles.secondaryButtonText}>Start OTA Update</Text>
      </TouchableOpacity>
    </View>
  );

  const renderOTAModal = () => (
    <Modal
      visible={showOTAModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowOTAModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>OTA Update</Text>
          <Text style={styles.modalDescription}>
            Start ota from URL {otaUrl}
          </Text>          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowOTAModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton]}
              onPress={startOTAUpdate}
              disabled={loading || refresh || otaLoading}
            >
              {loading || refresh || otaLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.confirmButtonText}>Start Update</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderDeleteButton = () => (
    <TouchableOpacity
      style={[styles.deleteButton, { 
        opacity: loading || !isConnected ? 0.5 : 1 
      }]}
      onPress={() => confirmDelete(device)}
      disabled={loading || !isConnected}
    >
      <Text style={styles.deleteButtonText}>Delete Device</Text>
    </TouchableOpacity>
  );

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
        {renderConnectionStatus()}
      </View>
      
      {renderLightControl()}
      {renderDeviceInfo()}
      {renderOTAControl()}
      {renderOTAModal()}
      {renderDeleteButton()}
    </ScrollView>
  );
};

export default DeviceControlScreen;