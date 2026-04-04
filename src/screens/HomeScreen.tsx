import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import DeviceStorageService, { SavedDevice } from '../device/services/DeviceStorageService';
import HTTPService, { FirmwareInfo } from '../http/HTTPService';
import styles from '../styles/HomeScreen.styles';

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
      
      // Check device connectivity
      await checkDeviceConnectivity(savedDevices);

      // Fetch device details
      await fetchDeviceDetails(savedDevices);
    } catch (error) {
      console.error('Failed to load devices:', error);
    }
  };

  /**
 * Checks the connectivity status of each device in the provided list.
 * Devices are checked in batches to limit the number of concurrent requests.
 * Updates the deviceStatuses state with the result for each device.
 * 
 * @param deviceList Array of SavedDevice objects to check connectivity for.
 */
  const checkDeviceConnectivity = async (deviceList: SavedDevice[]) => {
    const batchSize = 5; // Limit to 5 concurrent requests for performance
    let statuses: { [key: string]: boolean } = {};

    // Process devices in batches to avoid overwhelming the network
    for (let i = 0; i < deviceList.length; i += batchSize) {
      const batch = deviceList.slice(i, i + batchSize);

      // For each device in the batch, check its connection status
      const batchPromises = batch.map(async (device) => {
        try {
          // Attempt to check if the device is connected via its IP
          const isConnected = await HTTPService.checkConnection(device.ip);
          return { [device.id]: isConnected };
        } catch (error) {
          // If an error occurs, mark the device as offline
          return { [device.id]: false };
        }
      });

      // Wait for all checks in the batch to complete
      const batchResults = await Promise.all(batchPromises);

      // Merge batch results into the overall statuses object
      batchResults.forEach((status) => {
        statuses = { ...statuses, ...status };
      });
    }

    // Update state with the latest connectivity statuses
    setDeviceStatuses(statuses);
  };

  const fetchDeviceDetails = async (deviceList: SavedDevice[]) => {
    try {
      const batchSize = 5; // Limit to 5 concurrent requests for performance

      // Process devices in batches to avoid overwhelming the network
      for (let i = 0; i < deviceList.length; i += batchSize) {
        const batch = deviceList.slice(i, i + batchSize);

        // For each device in the batch, check its connection status
        const batchPromises = batch.map(async (device) => {
          try {
            // Attempt to check if the device is connected via its IP
            const firmwareInfo = await HTTPService.getFirmwareInfo(device.ip);
            return { [device.id]: firmwareInfo };
          } catch (error) {
            // If an error occurs, mark the device as offline
            return { [device.id]: {} };
          }
        });
        
        // Wait for all checks in the batch to complete
        const batchResults = await Promise.all(batchPromises);

        // Merge batch results into the overall statuses object
        for (const info of batchResults) {
          const id = Object.keys(info)[0];
          const device = await DeviceStorageService.getDevice(id);

          if (!device || !device.id) {
            console.warn(`Device with id ${id} is missing required properties and will be skipped.`);
            continue;
          }

          const deviceToSave: SavedDevice = {
            ...device,
            projectName: (info[id] && typeof info[id] === 'object' && 'project_name' in info[id])
              ? (info[id] as FirmwareInfo).project_name
              : device.projectName ?? '',
            buildDate: (info[id] && typeof info[id] === 'object' && 'date' in info[id])
              ? (info[id] as FirmwareInfo).date
              : device.buildDate ?? '',
          }

          await DeviceStorageService.saveDevice(deviceToSave);
        }
      }
    } catch (error) {
      console.error('Failed to fetch device details:', error);
    }
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDevices();
    setRefreshing(false);
  };

  const handleDevicePress = (device: SavedDevice) => {
    navigation.navigate('DeviceControl', { device })
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