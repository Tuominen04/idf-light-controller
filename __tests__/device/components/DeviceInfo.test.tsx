/**
 * @file DeviceInfo.test.tsx
 * @description
 * Unit tests for DeviceInfo component helpers: renderConnectionStatus and renderDeviceInfo.
 * 
 * @remarks
 * - Verifies correct rendering of connection status and device information.
 * - Includes snapshot and style tests for comprehensive coverage.
 * 
 * @note
 * - If the UI changes intentionally, update the snapshot by running `npm test -- -u` (on Windows) and commit the new snapshot.
 */

import { render, screen, waitFor } from "@testing-library/react-native";
import { renderConnectionStatus, renderDeviceInfo } from '../../../src/device/components/DeviceInfo';
import { SavedDevice } from "../../../src/device/services/DeviceStorageService";
import timezone_mock from 'timezone-mock';

timezone_mock.register('UTC');

// Tests for the renderConnectionStatus helper
describe('DeviceInfo renderConnectionStatus', () => {
  /**
   * Should show "Connected" status when isConnected is true.
   */
  test('shows connected status when isConnected is true', async () => {
    render(renderConnectionStatus(true));

    await waitFor(() => {
      expect(screen.getByText(/connected/i)).toBeTruthy();
    });
  });

  /**
   * Should show "Offline" status when isConnected is false.
   */
  test('shows offline status when isConnected is false', async () => {
    render(renderConnectionStatus(false));

    await waitFor(() => {
      expect(screen.getByText(/offline/i)).toBeTruthy();
    });
  });
});

// Tests for the renderDeviceInfo helper
describe('DeviceInfo renderDeviceInfo', () => {
  // Default device mock for tests
  const defaultDevice: SavedDevice = {
    id: '1',
    name: 'Test Device',
    ip: '192.168.1.1',
    projectName: 'Test Project',
    version: '1.0.0',
    lastConnected: '2025-01-01T00:00:00Z',
    buildDate: '2025-02-02T00:00:00Z',
    otaStatus: false
  };

  /**
   * Should render the device information card even with empty device data.
   */
  test('renders device information screen', async () => {
    render(renderDeviceInfo({} as SavedDevice));

    await waitFor(() => {
      expect(screen.getByText(/Device Information/i)).toBeTruthy();
    });
  });

  /**
   * Should render all device information fields and values correctly.
   */
  test('renders device information correctly', async () => {
    render(renderDeviceInfo(defaultDevice));

    await waitFor(() => {
      expect(screen.getByText(/Name:/i)).toBeTruthy();
      expect(screen.getByText(/Test Device/i)).toBeTruthy();
      expect(screen.getByText(/ID:/i)).toBeTruthy();
      expect(screen.getByText(/^1$/i)).toBeTruthy();
      expect(screen.getByText(/IP Address:/i)).toBeTruthy();
      expect(screen.getByText(/192.168.1.1/i)).toBeTruthy();
      expect(screen.getByText(/Project:/i)).toBeTruthy();
      expect(screen.getByText(/Test Project/i)).toBeTruthy();
      expect(screen.getByText(/Version:/i)).toBeTruthy();
      expect(screen.getByText(/1.0.0/i)).toBeTruthy();
      expect(screen.getByText(/Last Connected:/i)).toBeTruthy();
      expect(screen.getByText(/2025-01-01 00:00/i)).toBeTruthy();
      expect(screen.getByText(/Build Date:/i)).toBeTruthy();
      expect(screen.getByText(/2025-02-02 00:00/i)).toBeTruthy();
      expect(screen.getByText(/OTA Status:/i)).toBeTruthy();
      expect(screen.getByText(/Ready/i)).toBeTruthy();
    });
  });

  /**
   * Snapshot test for the device info card.
   * Ensures the rendered output matches the saved snapshot.
   */
  test('matches snapshot for device info', () => {
    const device: SavedDevice = {
      id: '1',
      name: 'Test Device',
      ip: '192.168.1.1',
      projectName: 'Test Project',
      version: '1.0.0',
      lastConnected: '2025-01-01T00:00:00Z',
      buildDate: '2025-02-02T00:00:00Z',
      otaStatus: false
    };
    const tree = render(renderDeviceInfo(device)).toJSON();
    expect(tree).toMatchSnapshot();
  });

  /**
   * Should render "In Progress" when otaStatus is true.
   */
  test('renders "In Progress" when otaStatus is true', () => {
    const device = { ...defaultDevice, otaStatus: true };
    render(renderDeviceInfo(device));
    expect(screen.getByText(/In Progress/i)).toBeTruthy();
  });

  /**
   * Should render correct color style for OTA status when in progress.
   */
  test('renders correct color for OTA status', () => {
    const device = { ...defaultDevice, otaStatus: true };
    render(renderDeviceInfo(device));
    const otaText = screen.getByText(/In Progress/i);
    expect(otaText.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ color: '#FF9800' })
      ])
    );
  });
});