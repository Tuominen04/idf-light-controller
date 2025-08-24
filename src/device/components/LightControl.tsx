/**
 * @file LightControl.tsx
 * @description
 * UI helper for rendering the Light Control card, including status, color indicator, and control button.
 * 
 * @remarks
 * - Used to display and interact with the light state of a device.
 * - Button disables and shows loading indicator based on device and UI state.
 */

import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import styles from "../../styles/DeviceControlScreen.styles";

/**
 * Renders the Light Control UI card.
 * 
 * @param lightState - Current light state ('on' or 'off')
 * @param loading - Whether the control is loading
 * @param refresh - Whether the control is refreshing
 * @param isConnected - Whether the device is connected
 * @param otaLoading - Whether OTA update is in progress
 * @param toggleLight - Handler to toggle light state
 * @returns JSX.Element
 */
export const renderLightControl = (
  lightState: string, 
  loading: boolean, 
  refresh: boolean, 
  isConnected: boolean, 
  otaLoading: boolean, 
  toggleLight: () => void
) => (
    <View style={styles.controlCard}>
      {/* Card Title */}
      <Text style={styles.cardTitle}>Light Control</Text>
      <View style={styles.lightControl}>
        <View style={styles.lightStatus}>
          {/* Light status indicator color */}
          <View 
            style={[
              styles.lightIndicator, 
              { backgroundColor: lightState === 'on' ? '#FFC107' : '#666' }
            ]} 
            testID="light-indicator"
          />
          {/* Light state text */}
          <Text style={styles.lightStateText}>
            Light is {lightState.toUpperCase()}
          </Text>
        </View>
        <View style={styles.controlButtons}>
          {/* Control button: disables and shows loader based on state */}
          <TouchableOpacity
            style={[
              styles.controlButton, 
              { opacity: loading || !isConnected ? 0.5 : 1 }
            ]}
            onPress={toggleLight}
            disabled={loading || refresh || !isConnected || otaLoading}
            testID="light-control-button"
          >
            {loading || refresh ? (
              // Show loading indicator if loading or refreshing
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              // Show button text based on light state
              <Text style={styles.controlButtonText}>
                {lightState === 'on' ? 'Turn OFF' : 'Turn ON'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
