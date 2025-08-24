import React, { useEffect, useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HomeScreen } from './src/home/HomeScreen';
import BLEScanScreen from './src/ble/BLEScanScreen';
import DeviceSetupScreen from './src/device/DeviceSetupScreen';
import DeviceControlScreen from './src/device/DeviceControlScreen';
import BLEService from './src/ble/BLEService';
import { SavedDevice } from './src/device/services/DeviceStorageService';
import styles from './src/styles/App.styles';

const Stack = createStackNavigator();

// Define stack param types
export type RootStackParamList = {
  Home: undefined;
  BLEScan: undefined;
  DeviceSetup: { device: { id: string; name: string; rssi: number | null } };
  DeviceControl: { device: SavedDevice };
};

const App = () => {
  const [bleInitialized, setBleInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize BLE when app starts
    initializeBLE();

    // Cleanup when app closes
    return () => {
      BLEService.destroy();
    };
  }, []);

  const initializeBLE = async () => {
    try {
      console.log('App: Initializing BLE service...');
      await BLEService.initialize();
      setBleInitialized(true);
      console.log('App: BLE service initialized successfully');
    } catch (error) {
      console.error('App: Failed to initialize BLE:', error);
      setInitError(error instanceof Error ? error.message : 'Unknown error');
      // Still allow app to load, but BLE features won't work
      setBleInitialized(true);
    }
  };

  // Show loading screen while initializing
  if (!bleInitialized) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Initializing Bluetooth...</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#2196F3',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={({ navigation }) => ({
              title: 'My Devices',
              headerRight: () => (
                <TouchableOpacity
                  onPress={() => navigation.navigate('BLEScan')}
                  style={styles.headerButton}
                >
                  <Text style={styles.headerButtonText}>+ Add Device</Text>
                </TouchableOpacity>
              ),
            })}
            initialParams={{ bleError: initError }}
          />
          <Stack.Screen 
            name="BLEScan" 
            component={BLEScanScreen} 
            options={{
              title: 'Add Device',
              headerShown: true
            }}
          />
          <Stack.Screen 
            name="DeviceSetup" 
            component={DeviceSetupScreen} 
            options={{
              title: 'Setup Device',
            }}
          />
          <Stack.Screen 
            name="DeviceControl" 
            component={DeviceControlScreen} 
            options={() => ({
              title: 'Control Device',
              // You can also use the device name in the title
              // title: route.params.device.name,
            })}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;