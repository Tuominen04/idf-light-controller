import React, { useEffect, useState, useLayoutEffect } from 'react';
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
import BLEService from './BLEService';

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

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={{ marginRight: 16 }}
          onPress={() => scanning ? stopScan() : startScan()}
        >
          <Text style={styles.scanButton}>{scanning ? "Stop" : "Scan"}</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, scanning, devices]);

  const handleDeviceFound = (device: BLEDevice) => {
    console.log(`Handle device: ${device.name}`);
    // Check if device already exists
    setDevices(prevDevices => {
      const existingIndex = prevDevices.findIndex(d => d.id === device.id);
      console.log(`Device ${device.name} found, existing index: ${existingIndex}`);
      if (existingIndex >= 0) {
        // Update existing device (e.g., RSSI)
        const updatedDevices = [...prevDevices];
        updatedDevices[existingIndex] = device;
        return updatedDevices;
      } else {
        // Add new device
        return [...prevDevices, device];
      }
    });
  };

  const startScan = async () => {
    console.log('Start scan...');
    const timeoutTimeout = 10000;
    try {
      setScanning(true);
      setDevices([]); // Clear previous devices

      BLEService.scanForDevices(
        (device: BLEDevice) => {
          handleDeviceFound(device)
        },
        timeoutTimeout
      );

      // Stop scanning after 10 seconds
      setTimeout(() => {
        setScanning(false);
        BLEService.stopScan();
      }, timeoutTimeout);

    } catch (error) {
      setScanning(false);
      console.error('Scan error:', error);
      Alert.alert('Scan Error', 'Failed to start scanning. Please try again.');
    }
  };

  const stopScan = () => {
    console.log('Stopping scan...');
    try {
      if(scanning) {
        BLEService.stopScan();
      }
    } catch (error) {
      console.error('Error stopping scan:', error);
      Alert.alert('Stop Scan Error', 'Failed to stop scanning. Please try again.');
    } finally {
      console.log('Scan stopped');
      setScanning(false);
    }
  }

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

    if (scanning && devices.length === 0) {
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
        </View>
      );
    }

    return (
      <View style={styles.scanningContainer}>
        <FlatList
          data={devices}
          keyExtractor={(item) => item.id}
          renderItem={renderDevice}
          contentContainerStyle={styles.listContent}
        />
        {scanning && (
          <>
            <Text style={styles.scanningSubtext}>Still Scanning</Text>
            <ActivityIndicator size="large" color="#2196F3" />
          </>
        )}
      </View>
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
  scanningContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 5,
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
    marginBottom: 12,
    alignSelf: 'center',
  },
  noDevicesText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  scanButton: {
    color: '#ffffffff', 
    fontWeight: 'bold',
    fontSize: 18,
    paddingHorizontal: 20,
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