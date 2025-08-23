import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import styles from "../../styles/DeviceControlScreen.styles";

export const renderLightControl = (lightState: string, loading: boolean, refresh: boolean, isConnected: boolean, toggleLight: () => void) => (
    <View style={styles.controlCard}>
      <Text style={styles.cardTitle}>Light Control</Text>
      <View style={styles.lightControl}>
        <View style={styles.lightStatus}>
          <View style={[styles.lightIndicator, { backgroundColor: lightState === 'on' ? '#FFC107' : '#666' }]} />
          <Text style={styles.lightStateText}>Light is {lightState.toUpperCase()}</Text>
        </View>
        <View style={styles.controlButtons}>
          <TouchableOpacity
            style={[styles.controlButton, { opacity: loading || !isConnected ? 0.5 : 1 }]}
            onPress={toggleLight}
            disabled={loading || refresh || !isConnected}
          >
            {loading || refresh ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.controlButtonText}>
                {lightState === 'on' ? 'Turn OFF' : 'Turn ON'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
