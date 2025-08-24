import { Text, TouchableOpacity } from "react-native";
import styles from "../../styles/DeviceControlScreen.styles";
import { confirmDelete } from "../services/DeviceService";
import { SavedDevice } from "../DeviceStorageService";

export const renderDeleteButton = (loading: boolean, isConnected: boolean, device: SavedDevice, navigation: any) => (
    <TouchableOpacity
      style={[styles.deleteButton, { 
        opacity: loading || !isConnected ? 0.5 : 1 
      }]}
      onPress={() => confirmDelete(device, navigation)}
      disabled={loading || !isConnected}
    >
      <Text style={styles.deleteButtonText}>Delete Device</Text>
    </TouchableOpacity>
  );
