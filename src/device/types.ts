import { StackNavigationProp } from "@react-navigation/stack";
import { SavedDevice } from "./services/DeviceStorageService";
import { RouteProp } from "@react-navigation/native";

export interface OTAProgress {
  in_progress: boolean;
  progress?: number;
  status?: string;
}

type RootStackParamList = {
  Home: undefined;
  BLEScan: undefined;
  DeviceSetup: { device: { id: string; name: string; rssi: number | null } };
  DeviceControl: { device: SavedDevice };
};

export type NavigationProp = StackNavigationProp<RootStackParamList, 'DeviceControl'>;
export type RoutePropType = RouteProp<RootStackParamList, 'DeviceControl'>;