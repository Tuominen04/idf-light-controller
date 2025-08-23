import { API_ENDPOINTS } from '../utils/constants';

interface DeviceStatus {
  device: number;
  state: 'on' | 'off';
}

interface FirmwareInfo {
  version: string;
  project_name: string;
  app_elf_sha256: string;
  date: string;
  time: string;
  ota_in_progress: boolean;
}

interface OTAProgress {
  in_progress: boolean;
  progress?: number;
  status?: string;
}

interface OTAUpdateResponse {
  status: string;
}

class HTTPService {
  private readonly timeout = 10000; // 10 seconds timeout

  private async makeRequest<T>(
    ip: string,
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `http://${ip}${endpoint}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        // For text responses like the toggle endpoint
        return (await response.text()) as unknown as T;
      }
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Get the current light connectivity
   */
  async getDeviceOnlineStatus(ip: string): Promise<DeviceStatus> {
    return this.makeRequest<DeviceStatus>(ip, API_ENDPOINTS.ONLINE_STATUS, {
      method: 'GET',
    });
  }

  /**
   * Get the current light status
   */
  async getLightStatus(ip: string): Promise<DeviceStatus> {
    return this.makeRequest<DeviceStatus>(ip, API_ENDPOINTS.LIGHT_STATUS, {
      method: 'GET',
    });
  }

  /**
   * Toggle the light state
   */
  async toggleLight(ip: string): Promise<string> {
    return this.makeRequest<string>(ip, API_ENDPOINTS.TOGGLE_LIGHT, {
      method: 'PUT',
    });
  }

  /**
   * Get firmware information
   */
  async getFirmwareInfo(ip: string): Promise<FirmwareInfo> {
    return this.makeRequest<FirmwareInfo>(ip, API_ENDPOINTS.FIRMWARE_INFO, {
      method: 'GET',
    });
  }

  /**
   * Start OTA update
   */
  async startOTAUpdate(ip: string, firmwareUrl: string): Promise<OTAUpdateResponse> {
    return this.makeRequest<OTAUpdateResponse>(ip, API_ENDPOINTS.OTA_UPDATE, {
      method: 'POST',
      body: JSON.stringify({ url: firmwareUrl }),
    });
  }

  /**
   * Get OTA progress
   */
  async getOTAProgress(ip: string): Promise<OTAProgress> {
    return this.makeRequest<OTAProgress>(ip, API_ENDPOINTS.OTA_PROGRESS, {
      method: 'GET',
    });
  }

  /**
   * Check if device is reachable
   */
  async checkConnection(ip: string): Promise<boolean> {
    try {
      await this.getDeviceOnlineStatus(ip);
      return true;
    } catch (error) {
      console.log(`Device ${ip} unreachable:`, error);
      return false;
    }
  }
}

export default new HTTPService();
export type { DeviceStatus, FirmwareInfo, OTAProgress, OTAUpdateResponse };