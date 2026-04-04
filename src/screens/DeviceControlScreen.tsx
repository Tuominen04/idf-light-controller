import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useRoute, useFocusEffect, useNavigation } from '@react-navigation/native';
import styles from '../styles/DeviceControlScreen.styles';
import { renderConnectionStatus, renderDeviceInfo } from './components/DeviceInfo';
import { renderLightControl } from './components/LightControl';
import { RoutePropType } from './deviceTypes';
import { renderOTAControl, renderOTAModal } from './components/OTAControl';
import { renderDeleteButton } from './components/DeleteButton';
import { deviceInfo, toggleLight, startOTAUpdate, deviceConnection, } from './services/DeviceService';
import { useOTAMonitor } from './hooks/useOTAMonitor';
import { onRefresh } from './hooks/useDeviceConnection';
import { OTAProgress } from '../types';

const DeviceControlScreen = () => {
  const route = useRoute<RoutePropType>();
  const { device } = route.params;
  const navigation = useNavigation();
  
  // State management
  const [lightState, setLightState] = useState<'on' | 'off'>('off');
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otaLoading, setOtaLoading] = useState(false);
  const [refresh, setRefreshing] = useState(false);
  const [otaProgress, setOTAProgress] = useState<OTAProgress | null>(null);
  const [showOTAModal, setShowOTAModal] = useState(false);
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
      deviceConnectionHandler();
      interval = setInterval(deviceConnectionHandler, 10000);
      return () => {
        if (interval) clearInterval(interval);
      };
    }, [device])
  );

  const startOTAUpdateHandler = async () => {
    await startOTAUpdate(
      device,
      setLoading,
      setShowOTAModal
    );
  };

  const deviceInfoHandler = async () => {
    await deviceInfo(device, setLoading, setIsConnected, setLightState);
  };

  const deviceConnectionHandler = async () => {
    await deviceConnection(
      device, 
      setIsConnected, 
      setLoading, 
      setLightState, 
      setOTAProgress, 
      setOtaLoading
    );
  };

  const toggleLightHandler = async () => {
    await toggleLight(
      isConnected,
      device,
      setLoading,
      setLightState
    );
  };

  useOTAMonitor(
    otaProgress?.in_progress ?? false,
    device,
    setOTAProgress,
    deviceInfoHandler
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
         refreshing={refresh}
          onRefresh={() => onRefresh(setRefreshing, deviceConnectionHandler)}
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

      {renderLightControl(
        lightState, 
        loading, 
        refresh, 
        isConnected, 
        otaLoading, 
        toggleLightHandler
      )}
      {renderDeviceInfo(device)}
      {renderOTAControl(loading, 
        isConnected, 
        otaProgress, 
        setShowOTAModal
      )}
      {renderOTAModal(
        showOTAModal, 
        setShowOTAModal, 
        startOTAUpdateHandler, 
        loading, 
        refresh, 
        otaLoading
      )}
      {renderDeleteButton(
        loading, 
        isConnected, 
        device, 
        navigation
      )}
    </ScrollView>
  );
};

export default DeviceControlScreen;