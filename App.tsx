import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { ESignProvider } from "./src/context/ESignContext";
import LoginScreen from "./src/screens/LoginScreen";
import SignUpScreen from "./src/screens/SignUpScreen";
import PinLoginScreen from "./src/screens/PinLoginScreen";
import PinSetupScreen from "./src/screens/PinSetupScreen";
import DrawerNavigatorOther from "./src/navigation/DrawerNavigatorOther";
import DrawerNavigatorFamily from "./src/navigation/DrawerNavigatorFamily";
import { useVersionCheck } from "./hooks/useVersionCheck";
import UpdateModal from "./components/UpdateModal";
import { useEffect, useState } from "react";
import * as Notifications from "expo-notifications";
import { navigationRef } from "./src/navigation/RootNavigation";
import {
  InboxNotificationActionData,
  RootStackParamList,
} from "./src/navigation/types";
import { getLoginRoute } from "./src/utils/pinStorage";

const Stack = createStackNavigator<RootStackParamList>();

function AppNavigator() {
  const { userData } = useAuth();
  const { forceBlock, updateUrl } = useVersionCheck();
  const [loginRoute, setLoginRoute] = useState<"Login" | "PinLogin" | null>(
    null
  );

  useEffect(() => {
    getLoginRoute().then(setLoginRoute);
  }, []);

  // Wait until we know whether this device has a PIN, so the right login screen opens first.
  if (!loginRoute) return null;

  const getInitialScreen = () => {
    if (!userData) return loginRoute;
    return userData.accountType === "Family Group" ? "Family" : "Other";
  };

  return (
    <>
      <UpdateModal visible={forceBlock} updateUrl={updateUrl} />
      <StatusBar style="dark" />
      <Stack.Navigator
        initialRouteName={getInitialScreen()}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="PinLogin" component={PinLoginScreen} />
        <Stack.Screen name="PinSetup" component={PinSetupScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Other" component={DrawerNavigatorOther} />
        <Stack.Screen name="Family" component={DrawerNavigatorFamily} />
      </Stack.Navigator>
    </>
  );
}

function AppInner() {
  const { userData, setPendingNavigation } = useAuth();
  const isLoggedIn = !!userData?.authToken;
  const userType =
    userData?.accountType === "Family Group" ? "Family" : "Other";

  useEffect(() => {
    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        let actionData: InboxNotificationActionData;

        try {
          actionData =
            typeof data.action_data === "string"
              ? JSON.parse(data.action_data)
              : data.action_data;
        } catch (err) {
          console.error("Failed to parse action_data", err);
          return;
        }

        if (!isLoggedIn) {
          setPendingNavigation({
            userType,
            screen: data.action === "NEW_MESSAGE" ? "InboxList" : "InboxDetail",
            params: {
              queryId: actionData.MessageId,
              title:
                data.action === "NEW_MESSAGE" ? "AAS New Message" : "AAS Reply",
            },
          });

          getLoginRoute().then((route) => navigationRef.navigate(route));
          return;
        }

        navigationRef.navigate(userType, {
          screen: "MainTabs",
          params: {
            screen: "Inbox",
            params: {
              screen:
                data.action === "NEW_MESSAGE" ? "InboxList" : "InboxDetail",
              params: {
                queryId: actionData.MessageId,
                title:
                  data.action === "NEW_MESSAGE"
                    ? "AAS New Message"
                    : "AAS Reply",
              },
            },
          },
        });
      });

    return () => {
      responseListener.remove();
    };
  }, [isLoggedIn, userType]);

  return (
    <NavigationContainer ref={navigationRef}>
      <AppNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ESignProvider>
          <AppInner />
        </ESignProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}