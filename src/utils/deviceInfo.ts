import { Platform } from "react-native";
import * as Application from "expo-application";
import * as Device from "expo-device";
import { getDeviceId } from "./pinStorage";
import { getPushTokenIfPermitted } from "./notification";
import { DeviceInfo } from "../navigation/types";

// On iOS Platform.Version is already the OS version string ("18.1").
const getOsVersion = (): string => String(Platform.Version);

// iOS has no model in Platform.constants, so it comes from expo-device ("iPhone 15").
const getDeviceModel = (): string => Device.modelName || "Unknown";

// Builds the deviceInfo object the /mobile-auth endpoints expect.
export const buildDeviceInfo = async (): Promise<DeviceInfo> => {
  const [deviceId, pushToken] = await Promise.all([
    getDeviceId(),
    getPushTokenIfPermitted(),
  ]);

  return {
    deviceId,
    platform: Platform.OS,
    osVersion: getOsVersion(),
    deviceModel: getDeviceModel(),
    appVersion: Application.nativeApplicationVersion ?? "Unknown",
    buildNumber: Application.nativeBuildVersion ?? "Unknown",
    pushToken,
  };
};
