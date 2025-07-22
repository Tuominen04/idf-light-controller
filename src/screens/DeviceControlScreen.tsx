import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Modal,
  RefreshControl,
} from 'react-native';
import { useRoute, RouteProp, useNavigation, useFocusEffect } from '@react-navigation/native';
import { SavedDevice } from '../services/DeviceStorageService';
import HTTPService, { FirmwareInfo } from '../services/HTTPService';
import { IPCONFIG } from '../credentials';
import { StackNavigationProp } from '@react-navigation/stack';
import DeviceStorageService from '../services/DeviceStorageService';

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
  const [refresh, setRefreshing] = useState(false);
  const [firmwareInfo, setFirmwareInfo] = useState<FirmwareInfo | null>(null);
  const [otaProgress, setOTAProgress] = useState<OTAProgress | null>(null);
  const [showOTAModal, setShowOTAModal] = useState(false);

  // Poll device connection only when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      let interval: NodeJS.Timeout | null = null;
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
      await getFirmwareInfo();
    } catch (error) {
      console.error('Connection check failed:', error);
      setIsConnected(false);
    }
  };

  const getFirmwareInfo = async () => {
    try {
      const online = await HTTPService.checkConnection(device.ip);
      setIsConnected(online);
      if (!online) {
        console.error('Device is not connected');
        return;
      }

      const info = await HTTPService.getFirmwareInfo(device.ip);
      if (!info) {
        throw new Error('No firmware info received');
      }
      setFirmwareInfo(info);

      // Create a SavedDevice object and save it
      const savedDevice: SavedDevice = {
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
      Alert.alert('Success', 'OTA update started successfully!');
      
      // Start monitoring OTA progress
      monitorOTAProgress();
    } catch (error) {
      console.error('OTA update failed:', error);
      Alert.alert('Error', 'Failed to start OTA update. Please check the URL and try again.');
    } finally {
      setLoading(false);
    }
  };

  const monitorOTAProgress = () => {
    const interval = setInterval(async () => {
      try {
        const progress = await HTTPService.getOTAProgress(device.ip);
        if (!progress) {
          console.error('No OTA progress data received');
          return;
        }

        if (progress?.progress !== undefined && progress.progress > fixedOtaProgress) {
          setOTAProgress(progress);
          fixedOtaProgress = progress?.progress;
        }
        
        if (!progress.in_progress) {
          clearInterval(interval);
          setOTAProgress(null);
          Alert.alert('OTA Complete', 'Firmware update completed successfully!');
          // Refresh firmware info
          setTimeout(getFirmwareInfo, 2000);
        }
      } catch (error) {
        console.error('Failed to get OTA progress:', error);
        clearInterval(interval);
        setOTAProgress(null);
      }
    }, 2000);

    // Stop monitoring after 5 minutes
    setTimeout(() => {
      clearInterval(interval);
      setOTAProgress(null);
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
      {firmwareInfo && (
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Project:</Text>
          <Text style={styles.infoValue}>{firmwareInfo.project_name}</Text>
        </View>
      )}
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Version:</Text>
        <Text style={styles.infoValue}>{device.version}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Last Connected:</Text>
        <Text style={styles.infoValue}>{formatDateTime(device.lastConnected)}</Text>
      </View>
      {firmwareInfo && (
        <>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Build Date:</Text>
            <Text style={styles.infoValue}>{formatDateTime(firmwareInfo.date, firmwareInfo.time)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>OTA Status:</Text>
            <Text style={[styles.infoValue, { color: firmwareInfo.ota_in_progress ? '#FF9800' : '#4CAF50' }]}>
              {firmwareInfo.ota_in_progress ? 'In Progress' : 'Ready'}
            </Text>
          </View>
        </>
      )}
    </View>
  );

  const renderOTAControl = () => (
    <View style={styles.controlCard}>
      <Text style={styles.cardTitle}>OTA Updates</Text>
      <Text style={styles.cardDescription}>
        Upload new firmware to your device over WiFi
      </Text>
      
      {otaProgress && (
        <View style={styles.otaProgress}>
          <Text style={styles.otaStatusText}>{otaProgress.status || 'Updating...'}</Text>
          {otaProgress.progress !== undefined && (
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
              disabled={loading===true || refresh===true}
            >
              {loading || refresh ? (
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  deviceName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
  },
  controlCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  lightControl: {
    alignItems: 'center',
  },
  lightStatus: {
    alignItems: 'center',
    marginBottom: 20,
  },
  lightIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 10,
  },
  lightStateText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
  },
  controlButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  controlButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 120,
    height: 45  
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  secondaryButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '500',
  },
  deleteButtonText: {
    color: ' #FFF8DC',
    fontSize: 16,
    fontWeight: '500',
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: '#DC143C',
    backgroundColor: '#DC143C',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
    marginHorizontal: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  firmwareInfo: {
    marginTop: 16,
  },
  otaProgress: {
    marginBottom: 16,
  },
  otaStatusText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  progressBar: {
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  progressText: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  confirmButton: {
    backgroundColor: '#2196F3',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DeviceControlScreen;