/**
 * @file DeviceControlScreen.test.tsx
 * @description
 * Unit tests for the DeviceControlScreen component, verifying rendering and main UI sections.
 *
 * @remarks
 * - Mocks navigation and device service dependencies for isolated testing.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import DeviceControlScreen from './../../src/screens/DeviceControlScreen';

// Mock useRoute to provide a route object
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useRoute: () => ({
      params: { device: { id: 'test-device-id', name: 'Test Device Name' } },
      name: 'DeviceControl',
      key: 'DeviceControl-key',
    }),
  };
});

jest.mock('./../../src/services/DeviceService', () => ({
  deviceInfo: (_device: any, _setLoading: any, setIsConnected: any, _setLightState: any) => {
    setIsConnected(true);
    return Promise.resolve();
  },
  toggleLight: jest.fn(),
  startOTAUpdate: jest.fn(),
  deviceConnection: (_device: any, setIsConnected: any, _setLoading: any, _setLightState: any, _setOTAProgress: any, _setOtaLoading: any) => {
    setIsConnected(true);
    return Promise.resolve();
  },
}));

function renderDeviceControlScreen() {
  render(
    <NavigationContainer>
      <DeviceControlScreen />
    </NavigationContainer>
  );
}

describe('DeviceControlScreen rendering', () => {
  beforeEach(() => {
    renderDeviceControlScreen();
  });

  test('renders all main UI sections', async () => {
    await waitFor(() => {
      expect(screen.getAllByText(/test device name/i)).toBeTruthy();
      expect(screen.getAllByText(/connected/i)).toBeTruthy();
      expect(screen.getAllByText(/light control/i)).toBeTruthy();
      expect(screen.getAllByText(/device info/i)).toBeTruthy();
      expect(screen.getAllByText(/ota updates/i)).toBeTruthy();
      expect(screen.getAllByText(/delete device/i)).toBeTruthy();
    });
  });
});

  /*
    2. Device Connection
    Should show "connected" status when isConnected is true.
    Should show "disconnected" status when isConnected is false.
    Should poll device connection on focus and update status.
    3. Light Control
    Should display correct light state (on/off).
    Should call toggleLightHandler when toggling light.
    Should disable light control when loading or not connected.
    4. OTA Update
    Should trigger OTA update when requested.
    Should show OTA modal when showOTAModal is true.
    Should update OTA progress in UI.
    5. Refresh Control
    Should trigger refresh when pull-to-refresh is used.
    Should update UI after refresh.
    6. Delete Button
    Should call navigation when delete button is pressed.
    Should disable delete button when loading or not connected.
    7. Error Handling
    Should handle missing device object gracefully.
    Should handle failed service calls (deviceInfo, deviceConnection, etc).
    8. Side Effects
    Should clear intervals on unmount.
    Should call hooks (useOTAMonitor, useFocusEffect) as expected.
  */