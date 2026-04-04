import { Text, TouchableOpacity } from "react-native";
import styles from "../../styles/DeviceControlScreen.styles";
import { confirmDelete } from "../../services/DeviceService";
import { SavedDevice } from "../../services/DeviceStorageService";

export const renderDeleteButton = (loading: boolean, isConnected: boolean, device: SavedDevice, navigation: any) => (
    <TouchableOpacity
      style={styles.deleteButton}
      onPress={() => confirmDelete(device, navigation)}
    >
      <Text style={styles.deleteButtonText}>Delete Device</Text>
    </TouchableOpacity>
  );
