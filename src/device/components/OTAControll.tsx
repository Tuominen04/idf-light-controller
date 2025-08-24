import { ActivityIndicator, Modal, Text, TouchableOpacity, View } from "react-native";
import styles from "../../styles/DeviceControlScreen.styles";
import { OTAProgress } from "../../types";
import { otaUrl } from "../../credentials";

export const renderOTAControl = (
  loading: boolean,
  isConnected: boolean,
  otaProgress: OTAProgress | null,
  setShowOTAModal: (show: boolean) => void
) => {
  console.log("Render OTA Control");
  console.log("Render OTA progress", otaProgress);
  return (
    <View style={styles.controlCard}>
      <Text style={styles.cardTitle}>OTA Updates</Text>
      <Text style={styles.cardDescription}>
        Upload new firmware to your device over WiFi
      </Text>
        
        {otaProgress?.in_progress && (
          <View style={styles.otaProgress}>
            <Text style={styles.otaStatusText}>{otaProgress.status}</Text>
            {otaProgress.progress && (
              <View style={styles.progressBar}>
                <View 
                  style={[styles.progressFill, { width: `${otaProgress.progress}%` }]} 
                />
                <Text style={styles.progressText}>{otaProgress.progress.toFixed(0)}%</Text>
              </View>
            )}
          </View>
        )}
        
        <TouchableOpacity
          style={[styles.secondaryButton, { 
            opacity: loading || !isConnected || (otaProgress?.in_progress) ? 0.5 : 1 
          }]}
          onPress={() => setShowOTAModal(true)}
          disabled={loading || !isConnected || (otaProgress?.in_progress)}
        >
          <Text style={styles.secondaryButtonText}>Start OTA Update</Text>
        </TouchableOpacity>
      </View>

  )
};

export const renderOTAModal = (
  showOTAModal: boolean, 
  setShowOTAModal: (show: boolean) => void, 
  startOTAUpdate: () => void, 
  loading: boolean, 
  refresh: boolean, 
  otaLoading: boolean
) => {
  return (
    <Modal
      visible={showOTAModal}
      animationType="slide"
      transparent={true}
            onRequestClose={() => setShowOTAModal(false)}
        >
            <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>OTA Update</Text>
                <Text style={styles.modalDescription}>
                Start ota from URL {otaUrl}
                </Text>          
                <View style={styles.modalButtons}>
                <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setShowOTAModal(false)}
                >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.modalButton, styles.confirmButton]}
                    onPress={startOTAUpdate}
                    disabled={loading || refresh || otaLoading}
                >
                    {loading || refresh || otaLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.confirmButtonText}>Start Update</Text>
                    )}
                </TouchableOpacity>
                </View>
            </View>
            </View>
        </Modal>
    )
};