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
import { useFocusEffect } from '@react-navigation/native';
import DeviceStorageService, { SavedDevice } from '../services/DeviceStorageService';

const HomeScreen = () => {
  const [devices, setDevices] = useState<SavedDevice[]>([]);
  const [refreshing, setRefreshing] = useState(false);

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
    } catch (error) {
      console.error('Failed to load devices:', error);
    }
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
      } else {
        Alert.alert('Error', 'Failed to delete device');
      }
    } catch (error) {
      console.error('Failed to delete device:', error);
      Alert.alert('Error', 'Failed to delete device');
    }
  };

  const handleDevicePress = (device: SavedDevice) => {
    Alert.alert(
      device.name,
      `IP: ${device.ip}\nVersion: ${device.version}\nLast Connected: ${new Date(device.lastConnected).toLocaleString()}`,
      [
        { text: 'Control', onPress: () => console.log('Navigate to control') },
        { text: 'Delete', onPress: () => confirmDelete(device), style: 'destructive' },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
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

  const renderDevice = ({ item }: { item: SavedDevice }) => (
    <TouchableOpacity 
      style={styles.deviceCard}
      onPress={() => handleDevicePress(item)}
    >
      <View style={styles.deviceHeader}>
        <Text style={styles.deviceName}>{item.name}</Text>
        <View style={styles.statusIndicator} />
      </View>
      <Text style={styles.deviceIp}>IP: {item.ip}</Text>
      <Text style={styles.deviceId}>ID: {item.id}</Text>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.title}>No devices added yet</Text>
      <Text style={styles.subtitle}>Tap "+ Add Device" to get started</Text>
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
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
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
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
  },
  deviceIp: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  deviceId: {
    fontSize: 12,
    color: '#999',
  },
});

export default HomeScreen;