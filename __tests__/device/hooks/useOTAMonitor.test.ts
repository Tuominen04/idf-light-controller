import { renderHook, act } from '@testing-library/react-native';
import { useOTAMonitor } from '../../../src/device/hooks/useOTAMonitor';
import HTTPService from '../../../src/services/HTTPService';
import DeviceStorageService, { SavedDevice } from '../../../src/services/DeviceStorageService';

jest.mock('../../../src/services/HTTPService', () => ({
  __esModule: true,
  default: {
    getOTAProgress: jest.fn(),
  },
}));

jest.mock('../../../src/services/DeviceStorageService', () => ({
  __esModule: true,
  default: {
    getDevice: jest.fn(),
    saveDevice: jest.fn(),
  },
}));

const mockHTTP = HTTPService as jest.Mocked<typeof HTTPService>;
const mockStorage = DeviceStorageService as jest.Mocked<typeof DeviceStorageService>;

const device: SavedDevice = {
  id: 'dev-1',
  name: 'Test Light',
  ip: '192.168.1.50',
  version: '1.0.0',
  lastConnected: '2025-01-01T00:00:00Z',
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useOTAMonitor', () => {
  test('does not start polling when monitoringOTA is false', () => {
    const setOTAProgress = jest.fn();
    const deviceInfoHandler = jest.fn();

    renderHook(() => useOTAMonitor(false, device, setOTAProgress, deviceInfoHandler));

    jest.advanceTimersByTime(500);
    expect(mockHTTP.getOTAProgress).not.toHaveBeenCalled();
  });

  test('polls OTA progress when monitoringOTA is true', async () => {
    mockHTTP.getOTAProgress.mockResolvedValue({
      in_progress: true,
      progress: 25,
      status: 'downloading',
    });

    const setOTAProgress = jest.fn();
    const deviceInfoHandler = jest.fn();

    renderHook(() => useOTAMonitor(true, device, setOTAProgress, deviceInfoHandler));

    // Advance past one interval tick (100ms)
    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    expect(mockHTTP.getOTAProgress).toHaveBeenCalled();
    expect(setOTAProgress).toHaveBeenCalledWith(
      expect.objectContaining({ progress: 25 }),
    );
  });

  test('only updates progress when it increases (monotonic)', async () => {
    const setOTAProgress = jest.fn();
    const deviceInfoHandler = jest.fn();

    // First call: progress 50
    mockHTTP.getOTAProgress.mockResolvedValueOnce({
      in_progress: true, progress: 50, status: 'downloading',
    });
    // Second call: progress 30 (stale/lower)
    mockHTTP.getOTAProgress.mockResolvedValueOnce({
      in_progress: true, progress: 30, status: 'downloading',
    });
    // Third call: progress 75
    mockHTTP.getOTAProgress.mockResolvedValueOnce({
      in_progress: true, progress: 75, status: 'downloading',
    });

    renderHook(() => useOTAMonitor(true, device, setOTAProgress, deviceInfoHandler));

    await act(async () => { jest.advanceTimersByTime(100); });
    await act(async () => { jest.advanceTimersByTime(100); });
    await act(async () => { jest.advanceTimersByTime(100); });

    // Should have been called with 50 and 75, but NOT with 30
    const progressCalls = setOTAProgress.mock.calls
      .filter((call) => call[0] !== null && call[0]?.progress !== undefined)
      .map((call) => call[0].progress);

    expect(progressCalls).toContain(50);
    expect(progressCalls).toContain(75);
    expect(progressCalls).not.toContain(30);
  });

  test('clears interval and saves otaStatus=false when OTA completes', async () => {
    mockHTTP.getOTAProgress.mockResolvedValue({
      in_progress: false, progress: 100, status: 'done',
    });
    mockStorage.getDevice.mockResolvedValue(device);
    mockStorage.saveDevice.mockResolvedValue(true);

    const setOTAProgress = jest.fn();
    const deviceInfoHandler = jest.fn().mockResolvedValue(undefined);

    renderHook(() => useOTAMonitor(true, device, setOTAProgress, deviceInfoHandler));

    await act(async () => { jest.advanceTimersByTime(100); });

    expect(setOTAProgress).toHaveBeenCalledWith(null);
    expect(mockStorage.saveDevice).toHaveBeenCalledWith(
      expect.objectContaining({ otaStatus: false }),
    );

    // Should not keep polling after completion
    mockHTTP.getOTAProgress.mockClear();
    await act(async () => { jest.advanceTimersByTime(500); });
    expect(mockHTTP.getOTAProgress).not.toHaveBeenCalled();
  });

  test('cleans up interval on unmount', async () => {
    mockHTTP.getOTAProgress.mockResolvedValue({
      in_progress: true, progress: 10, status: 'downloading',
    });

    const setOTAProgress = jest.fn();
    const deviceInfoHandler = jest.fn();

    const { unmount } = renderHook(() =>
      useOTAMonitor(true, device, setOTAProgress, deviceInfoHandler),
    );

    unmount();

    mockHTTP.getOTAProgress.mockClear();
    await act(async () => { jest.advanceTimersByTime(500); });

    expect(mockHTTP.getOTAProgress).not.toHaveBeenCalled();
  });
});
