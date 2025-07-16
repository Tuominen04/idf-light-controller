import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import DeviceStorageService, { SavedDevice } from '../services/DeviceStorageService';
import HTTPService from '../services/HTTPService';

type RootStackParamList = {
  Home: undefined;
  BLEScan: undefined;
  DeviceSetup: { device: { id: string; name: string; rssi: number | null } };
  DeviceControl: { device: SavedDevice };
};

type NavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

export const HomeScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [devices, setDevices] = useState<SavedDevice[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [deviceStatuses, setDeviceStatuses] = useState<{ [key: string]: boolean }>({});

  // Load devices when screen focuses
  useFocusEffect(
    useCallback(() => {
      loadDevices();
    }, [])
  );

  const loadDevices = async () => {
    try {
      const savedDevices = await DeviceStorageService.getDevices();
      setDevices(savedDevices);
      console.log('Loaded devices:', savedDevices);
      
      // Check device connectivity
      checkDeviceConnectivity(savedDevices);
    } catch (error) {
      console.error('Failed to load devices:', error);
    }
  };

  const checkDeviceConnectivity = async (deviceList: SavedDevice[]) => {
    const statusPromises = deviceList.map(async (device) => {
      try {
        const isConnected = await HTTPService.ping(device.ip);
        return { [device.id]: isConnected };
      } catch (error) {
        return { [device.id]: false };
      }
    });

    const statuses = await Promise.all(statusPromises);
    const statusMap = statuses.reduce((acc, status) => ({ ...acc, ...status }), {});
    setDeviceStatuses(statusMap);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDevices();
    setRefreshing(false);
  };

  const deleteDevice = async (deviceId: string) => {
    try {
      const success = await DeviceStorageService.deleteDevice(deviceId);
      if (success) {
        setDevices(devices.filter(d => d.id !== deviceId));
        // Remove from status tracking
        const newStatuses = { ...deviceStatuses };
        delete newStatuses[deviceId];
        setDeviceStatuses(newStatuses);
      } else {
        Alert.alert('Error', 'Failed to delete device');
      }
    } catch (error) {
      console.error('Failed to delete device:', error);
      Alert.alert('Error', 'Failed to delete device');
    }
  };

  const handleDevicePress = (device: SavedDevice) => {
    const isConnected = deviceStatuses[device.id];
    
    Alert.alert(
      device.name,
      `IP: ${device.ip}\nVersion: ${device.version}\nStatus: ${isConnected ? 'Online' : 'Offline'}\nLast Connected: ${new Date(device.lastConnected).toLocaleString()}`,
      [
        { 
          text: 'Control', 
          onPress: () => navigation.navigate('DeviceControl', { device }),
        },
        { 
          text: 'Delete', 
          onPress: () => confirmDelete(device), 
          style: 'destructive' 
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const navigateToControl = (device: SavedDevice) => {
    navigation.navigate('DeviceControl', { device });
  };

  const confirmDelete = (device: SavedDevice) => {
    Alert.alert(
      'Delete Device',
      `Are you sure you want to delete ${device.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', onPress: () => deleteDevice(device.id), style: 'destructive' },
      ]
    );
  };

  const renderDevice = ({ item }: { item: SavedDevice }) => {
    const isConnected = deviceStatuses[item.id];
    
    return (
      <TouchableOpacity 
        style={styles.deviceCard}
        onPress={() => handleDevicePress(item)}
      >
        <View style={styles.deviceHeader}>
          <Text style={styles.deviceName}>{item.name}</Text>
          <View style={[
            styles.statusIndicator, 
            { backgroundColor: isConnected ? '#4CAF50' : '#f44336' }
          ]} />
        </View>
        <Text style={styles.deviceIp}>IP: {item.ip}</Text>
        <Text style={styles.deviceId}>ID: {item.id}</Text>
        <Text style={[
          styles.deviceStatus,
          { color: isConnected ? '#4CAF50' : '#f44336' }
        ]}>
          {isConnected ? 'Online' : 'Offline'}
        </Text>
        
        <View style={styles.deviceActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.controlButton]}
            onPress={() => navigateToControl(item)}
          >
            <Text style={styles.controlButtonText}>Control</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => confirmDelete(item)}
          >
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No devices added yet</Text>
      <Text style={styles.emptySubtitle}>Tap "+ Add Device" to get started</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={renderDevice}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={devices.length === 0 ? styles.emptyContent : styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyContent: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  deviceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  deviceIp: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  deviceId: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  deviceStatus: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  deviceActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  controlButton: {
    backgroundColor: '#2196F3',
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});