import { NavigationProp } from "@react-navigation/native";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLoginRoute } from "./pinStorage";
import { logoutAllDevices } from "./pimsApi";

export const handleLogout = async (
  navigation: NavigationProp<any>,
  showConfirmation: boolean = true,
  authContextReset?: () => void,
  authToken?: string
) => {
  if (showConfirmation) {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: async () => {
          await performLogout(navigation, authContextReset, authToken);
        },
      },
    ]);
  } else {
    await performLogout(navigation, authContextReset, authToken);
  }
};

const performLogout = async (
  navigation: NavigationProp<any>,
  authContextReset?: () => void,
  authToken?: string
) => {
  // Not awaited: it only updates a status on the server, so logout never waits on the network.
  if (authToken) logoutAllDevices(authToken);

  try {
    await AsyncStorage.clear();

    if (authContextReset) {
      authContextReset();
    }

    // The PIN registration lives in SecureStore, so it survives the AsyncStorage clear above.
    const loginRoute = await getLoginRoute();

    navigation.reset({
      index: 0,
      routes: [{ name: loginRoute }],
    });
  } catch (error) {
    console.error("Logout failed:", error);
  }
};
