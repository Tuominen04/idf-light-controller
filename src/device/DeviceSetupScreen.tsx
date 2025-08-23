import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import BLEService from '../ble/BLEService';
import DeviceStorageService from './DeviceStorageService';
import { CREDENTIALS } from '../credentials';
import styles from '../styles/DeviceSetupScreen.styles';

// Constants for storage (not needed anymore as it's in the service)
// const DEVICES_STORAGE_KEY = '@saved_devices';

type RootStackParamList = {
  Home: undefined;
  BLEScan: undefined;
  DeviceSetup: { device: { id: string; name: string; rssi: number | null } };
  DeviceControl: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList, 'DeviceSetup'>;
type RoutePropType = RouteProp<RootStackParamList, 'DeviceSetup'>;

const DeviceSetupScreen = () => {
  const route = useRoute<RoutePropType>();
  const navigation = useNavigation<NavigationProp>();
  const { device } = route.params;

  const [ssid, setSsid] = useState(CREDENTIALS.wifiSsid || '');
  const [password, setPassword] = useState(CREDENTIALS.wifiPassword || '');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleSendCredentials = async () => {
    if (!ssid || !password) {
      Alert.alert('Missing Information', 'Please enter both WiFi name and password');
      return;
    }

    try {
      setLoading(true);
      setStatus('handleSendCredentials Sending WiFi credentials...');

      // Send WiFi credentials
      await BLEService.sendWiFiCredentials(ssid, password);
      
      setStatus('Credentials sent! Waiting for device to connect to WiFi...');

      // Optionally, try a single read before monitoring
      // Poll for device info since notifications aren't working
      let pollCount = 0;
      const maxPolls = 10;
      const pollInterval = setInterval(async () => {
        try {
          const characteristic = await BLEService.readCharacteristicForService();
          console.log(`Poll attempt ${pollCount + 1}:`, characteristic);
          
          if (characteristic && characteristic.trim() !== '') {
            const deviceInfo = JSON.parse(characteristic);
            if (deviceInfo.ip) {
              clearInterval(pollInterval); // Stop polling
              setStatus('Device connected to WiFi! Sending confirmation...');
              
              // Handle the device info (same code as in your monitor callback)
              BLEService.sendConfirmation(true)
                .then(async () => {
                  // Save device info locally using the storage service
                  const saved = await DeviceStorageService.saveDevice(deviceInfo);
                  
                  setLoading(false);
                  
                  if (saved) {
                    // Disconnect BLE as we don't need it anymore
                    BLEService.disconnect();
                    // Navigate back to home
                    navigation.navigate('Home');
                  } else {
                    Alert.alert(
                      'Partial Success',
                      'Device connected but failed to save locally. You may need to set it up again.',
                      [{ text: 'OK' }]
                    );
                  }
                })
                .catch((error) => {
                  console.error('Failed to send confirmation:', error);
                  Alert.alert('Error', 'Device connected but failed to send confirmation.');
                });
            }
          }
        } catch (err) {
          console.log('Poll failed:', err);
        }
        
        pollCount++;
        if (pollCount >= maxPolls) {
          clearInterval(pollInterval);
          setLoading(false);
          setStatus('');
          Alert.alert(
            'Timeout',
            'Device did not respond in time. Please make sure the WiFi credentials are correct and try again.',
            [{ text: 'OK' }]
          );
        }
      }, 3000);

      // Monitor for device response
      const unsubscribe = BLEService.monitorDeviceInfo((deviceInfo) => {
        console.log('Received device info:', deviceInfo);
        
        // Device info format from firmware:
        // {
        //   "name": "ESP-C6-Light-A1B2C3D4",
        //   "id": "A1B2C3D4",
        //   "ip": "192.168.1.100",
        //   "version": "0.0.1"
        // }
        
        if (deviceInfo.ip) {
          setStatus('Device connected to WiFi! Sending confirmation...');
          
          // Send confirmation back to device
          BLEService.sendConfirmation(true)
            .then(async () => {
              unsubscribe(); // Stop monitoring
                
              // Save device info locally using the storage service
              const saved = await DeviceStorageService.saveDevice(deviceInfo);
              
              setLoading(false);
              
              if (saved) {
                // Disconnect BLE as we don't need it anymore
                BLEService.disconnect();
                // Navigate back to home
                navigation.navigate('Home');
              } else {
                Alert.alert(
                'Partial Success',
                'Device connected but failed to save locally. You may need to set it up again.',
                [{ text: 'OK' }]
                );
              }
          }).catch((error) => {
            console.error('Failed to send confirmation:', error);
            Alert.alert('Error', 'Device connected but failed to send confirmation.');
          });
        }
      });

      //Timeout after 30 seconds
      setTimeout(() => {
        unsubscribe();
        if (loading) {
          setLoading(false);
          setStatus('');
          Alert.alert(
            'Timeout',
            'Device did not respond in time. Please make sure the WiFi credentials are correct and try again.',
            [{ text: 'OK' }]
          );
        }
      }, 30000);

    } catch (error) {
      console.error('Failed to send credentials:', error);
      Alert.alert(
        'Error',
        'Failed to send WiFi credentials. Please try again.',
        [{ text: 'OK' }]
      );
      setLoading(false);
      setStatus('');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName}>{device.name}</Text>
          <Text style={styles.deviceId}>ID: {device.id}</Text>
          <View style={styles.connectionStatus}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Connected</Text>
          </View>
        </View>

        <View style={styles.form}>
          <Text style={styles.title}>WiFi Configuration</Text>
          <Text style={styles.subtitle}>
            Enter your WiFi credentials to connect the device to your network
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>WiFi Network Name (SSID)</Text>
            <TextInput
              style={styles.input}
              value={ssid}
              onChangeText={setSsid}
              placeholder="Enter WiFi name"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>WiFi Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter WiFi password"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2196F3" />
              <Text style={styles.statusMessage}>{status}</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSendCredentials}
            >
              <Text style={styles.sendButtonText}>Send WiFi Credentials</Text>
            </TouchableOpacity>
          )}

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              ℹ️ Make sure you're using a 2.4GHz WiFi network. The device will restart after receiving the credentials.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default DeviceSetupScreen;