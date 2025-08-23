import { Text, TouchableOpacity } from "react-native";
import styles from "../../styles/DeviceControlScreen.styles";

export const renderDeleteButton = (loading: boolean, isConnected: boolean, confirmDelete: (device: any) => void, device: any) => (
    <TouchableOpacity
      style={[styles.deleteButton, { 
        opacity: loading || !isConnected ? 0.5 : 1 
      }]}
      onPress={() => confirmDelete(device)}
      disabled={loading || !isConnected}
    >
      <Text style={styles.deleteButtonText}>Delete Device</Text>
    </TouchableOpacity>
  );
