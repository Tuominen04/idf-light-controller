import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import BLEService from '../services/BLEService';

type RootStackParamList = {
  Home: undefined;
  BLEScan: undefined;
  DeviceSetup: { device: BLEDevice };
  DeviceControl: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList, 'BLEScan'>;

interface BLEDevice {
  id: string;
  name: string;
  rssi: number | null;
}

const BLEScanScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [devices, setDevices] = useState<BLEDevice[]>([]);
  const [scanning, setScanning] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    // Start scanning automatically when screen opens
    startScan();

    return () => {
      // Cleanup when component unmounts
      BLEService.stopScan();
    };
  }, []);

  const startScan = async () => {

    try {
      setScanning(true);
      setDevices([]); // Clear previous devices

      await BLEService.scanForDevices((device: BLEDevice) => {
        console.log('Device found in UI:', device);
        setDevices(prevDevices => {
          // Check if device already exists
          const existingIndex = prevDevices.findIndex(d => d.id === device.id);
          if (existingIndex >= 0) {
            // Update existing device (e.g., RSSI value)
            const updatedDevices = [...prevDevices];
            updatedDevices[existingIndex] = device;
            return updatedDevices;
          } else {
            // Add new device
            return [...prevDevices, device];
          }
        });
      });

      // Stop scanning after 10 seconds
      setTimeout(() => {
        setScanning(false);
        BLEService.stopScan();
      }, 10000);

    } catch (error) {
      console.error('Scan error:', error);
      setScanning(false);
      Alert.alert('Scan Error', 'Failed to start scanning. Please try again.');
    }
  };

  const handleDevicePress = async (device: BLEDevice) => {
    try {
      setConnecting(true);
      BLEService.stopScan(); // Stop scanning before connecting
      
    try {
      await BLEService.connectToDevice(device.id);
      // Navigate to setup screen after successful connection
      navigation.navigate('DeviceSetup', { device });
    } catch (error) {
      Alert.alert(
        'Connection Failed',
        'Failed to connect to the device. Please try again.',
        [{ text: 'OK' }]
      );
      console.error('Connection error:', error);
    } finally {
      setConnecting(false);
    }
    } catch (error) {
      setConnecting(false);
      console.error('Error handling device press:', error);
    }
  };

  const renderDevice = ({ item }: { item: BLEDevice }) => (
    <TouchableOpacity 
      style={styles.deviceCard}
      onPress={() => handleDevicePress(item)}
    >
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{item.name}</Text>
        <Text style={styles.deviceId}>ID: {item.id}</Text>
      </View>
      <View style={styles.rssiContainer}>
        <Text style={styles.rssiText}>{item.rssi} dBm</Text>
      </View>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (connecting) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.scanningText}>Connecting to device...</Text>
        </View>
      );
    }

    if (scanning) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.scanningText}>Scanning for ESP-C6-Light devices...</Text>
          <Text style={styles.scanningSubtext}>Make sure your device is powered on</Text>
        </View>
      );
    }

    if (devices.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.noDevicesText}>No devices found</Text>
          <TouchableOpacity style={styles.scanButton} onPress={startScan}>
            <Text style={styles.scanButtonText}>Scan Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={renderDevice}
        contentContainerStyle={styles.listContent}
      />
    );
  };

  return (
    <View style={styles.container}>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scanningText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
  },
  scanningSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  noDevicesText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  scanButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  deviceCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    alignItems: 'center',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  deviceId: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  rssiContainer: {
    marginLeft: 10,
  },
  rssiText: {
    fontSize: 14,
    color: '#999',
  },
});

export default BLEScanScreen;