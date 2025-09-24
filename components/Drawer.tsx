import { StyleSheet, TouchableOpacity, useWindowDimensions, View } from "react-native";
import React from "react";
import { DrawerActions } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";

export default function Drawer() {
  const navigation = useNavigation();
  const { width, height } = useWindowDimensions();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        // style={{
        //   paddingTop: height * 0.02,
        // }}
      >
        <Ionicons name="menu" size={30} color="#1B77BE" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "flex-end",
  },
});
