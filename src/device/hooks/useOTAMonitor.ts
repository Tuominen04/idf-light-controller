import { useEffect, useRef } from "react";
import HTTPService from "../../http/HTTPService";
import DeviceStorageService, { SavedDevice } from "../services/DeviceStorageService";
import { OTAProgress } from "../types";

export function useOTAMonitor(
  monitoringOTA: boolean,
  setMonitoringOTA: (monitoring: boolean) => void,
  device: SavedDevice,
  setOTAProgress: (progress: OTAProgress | null) => void,
  deviceInfoHandler: () => Promise<void>
) {
  const otaIntervalRef = useRef<NodeJS.Timeout | null>(null);
  let fixedOtaProgress = 0;

  useEffect(() => {
    console.log("MONITOR OTA Effect Triggered");
    console.log("MONITOR OTA State:", { monitoringOTA, device });
    if (!monitoringOTA) return;

    if (otaIntervalRef.current) {
      clearInterval(otaIntervalRef.current);
      otaIntervalRef.current = null;
    }

    otaIntervalRef.current = setInterval(async () => {
      console.log("MONITOR OTA Interval Triggered");
      try {
        const progress = await HTTPService.getOTAProgress(device.ip);
        console.log("MONITOR OTA Progress:", progress);
        if (!progress) {
          console.warn('No OTA progress data received');
          return;
        }

        if (progress?.progress !== undefined && progress.progress > fixedOtaProgress) {
          setOTAProgress(progress);
          fixedOtaProgress = progress?.progress;
        }

        if (!progress.in_progress) {
          if (otaIntervalRef.current) {
            clearInterval(otaIntervalRef.current);
            otaIntervalRef.current = null;
          }
          setOTAProgress(null);
          setMonitoringOTA(false);
          const deviceInfo = await DeviceStorageService.getDevice(device.id);
          if (deviceInfo) {
            await DeviceStorageService.saveDevice({ ...deviceInfo, otaStatus: false });
          }
          setOTAProgress(null);
          setTimeout(deviceInfoHandler, 2000);
        }
      } catch (error) {
        console.warn('Failed to monitoring OTA progress:', error);
      }
    }, 100); // How fast the progressbar updating

    // Cleanup on unmount or when monitoringOTA changes
    return () => {
      if (otaIntervalRef.current) {
        clearInterval(otaIntervalRef.current);
        otaIntervalRef.current = null;
      }
    };
  }, [monitoringOTA, device, setOTAProgress, setMonitoringOTA, deviceInfoHandler]);
}