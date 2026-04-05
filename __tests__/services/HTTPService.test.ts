import HTTPService from '../../src/services/HTTPService';
import { API_ENDPOINTS } from '../../src/utils/constants';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

function jsonResponse(body: object, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: { get: () => 'application/json' },
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  });
}

function textResponse(body: string, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    statusText: 'OK',
    headers: { get: () => 'text/plain' },
    text: () => Promise.resolve(body),
  });
}

describe('HTTPService', () => {
  const ip = '192.168.1.100';

  describe('checkConnection', () => {
    test('returns true when device responds', async () => {
      mockFetch.mockReturnValueOnce(jsonResponse({ device: 1, state: 'on' }));
      const result = await HTTPService.checkConnection(ip);
      expect(result).toBe(true);
    });

    test('returns false when device is unreachable', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      const result = await HTTPService.checkConnection(ip);
      expect(result).toBe(false);
    });
  });

  describe('getLightStatus', () => {
    test('returns device status JSON', async () => {
      const status = { device: 1, state: 'on' };
      mockFetch.mockReturnValueOnce(jsonResponse(status));

      const result = await HTTPService.getLightStatus(ip);
      expect(result).toEqual(status);
      expect(mockFetch).toHaveBeenCalledWith(
        `http://${ip}${API_ENDPOINTS.LIGHT_STATUS}`,
        expect.objectContaining({ method: 'GET' }),
      );
    });
  });

  describe('toggleLight', () => {
    test('returns text response for toggle', async () => {
      mockFetch.mockReturnValueOnce(textResponse('On'));

      const result = await HTTPService.toggleLight(ip);
      expect(result).toBe('On');
    });
  });

  describe('getFirmwareInfo', () => {
    test('returns firmware info JSON', async () => {
      const info = {
        version: '1.0.0',
        project_name: 'light_client',
        app_elf_sha256: 'abc123',
        date: 'Jul 19 2025',
        time: '20:29:21',
        ota_in_progress: false,
      };
      mockFetch.mockReturnValueOnce(jsonResponse(info));

      const result = await HTTPService.getFirmwareInfo(ip);
      expect(result).toEqual(info);
    });
  });

  describe('startOTAUpdate', () => {
    test('sends POST with firmware URL body', async () => {
      mockFetch.mockReturnValueOnce(jsonResponse({ status: 'started' }));

      const result = await HTTPService.startOTAUpdate(ip, 'http://host/fw.bin');
      expect(result).toEqual({ status: 'started' });
      expect(mockFetch).toHaveBeenCalledWith(
        `http://${ip}${API_ENDPOINTS.OTA_UPDATE}`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ url: 'http://host/fw.bin' }),
        }),
      );
    });
  });

  describe('getOTAProgress', () => {
    test('returns OTA progress JSON', async () => {
      const progress = { in_progress: true, progress: 42, status: 'downloading' };
      mockFetch.mockReturnValueOnce(jsonResponse(progress));

      const result = await HTTPService.getOTAProgress(ip);
      expect(result).toEqual(progress);
    });
  });

  describe('error handling', () => {
    test('throws on HTTP error status', async () => {
      mockFetch.mockReturnValueOnce(
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          headers: { get: () => 'application/json' },
        }),
      );

      await expect(HTTPService.getLightStatus(ip)).rejects.toThrow('HTTP 500');
    });

    test('throws on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network request failed'));

      await expect(HTTPService.getFirmwareInfo(ip)).rejects.toThrow('Network request failed');
    });
  });
});
