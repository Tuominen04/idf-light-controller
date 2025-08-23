import { Text, View } from "react-native";
import styles from "../../styles/DeviceControlScreen.styles";
import { SavedDevice } from "../DeviceStorageService";
import { formatDateTime } from "../../utils/formatDateTime";

export const renderConnectionStatus = (isConnected: boolean) => (
    <View style={styles.statusContainer}>
      <View style={[styles.statusDot, { backgroundColor: isConnected ? '#4CAF50' : '#f44336' }]} />
      <Text style={[styles.statusText, { color: isConnected ? '#4CAF50' : '#f44336' }]}>
        {isConnected ? 'Connected' : 'Offline'}
      </Text>
    </View>
  );

export const renderDeviceInfo = (device: SavedDevice) => (
    <View style={styles.controlCard}>
      <Text style={styles.cardTitle}>Device Information</Text>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Name:</Text>
        <Text style={styles.infoValue}>{device.name}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>ID:</Text>
        <Text style={styles.infoValue}>{device.id}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>IP Address:</Text>
        <Text style={styles.infoValue}>{device.ip}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Project:</Text>
        <Text style={styles.infoValue}>{device.projectName}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Version:</Text>
        <Text style={styles.infoValue}>{device.version}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Last Connected:</Text>
        <Text style={styles.infoValue}>{formatDateTime(device.lastConnected)}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Build Date:</Text>
        <Text style={styles.infoValue}>{formatDateTime(device.buildDate ?? '')}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>OTA Status:</Text>
        <Text style={[styles.infoValue, { color: device.otaStatus ? '#FF9800' : '#4CAF50' }]}>
          {device.otaStatus ? 'In Progress' : 'Ready'}
        </Text>
      </View>
    </View>
  );