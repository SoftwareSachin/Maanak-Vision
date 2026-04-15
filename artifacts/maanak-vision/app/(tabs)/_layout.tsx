import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import C from "@/constants/colors";

export default function TabLayout() {
  const isWeb = Platform.OS === "web";
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.outline,
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: "Rajdhani_700Bold",
          letterSpacing: 0.6,
          marginTop: 1,
        },
        tabBarStyle: {
          backgroundColor: C.surfaceContainerLow,
          borderTopWidth: 1,
          borderTopColor: C.outlineVariant,
          height: isWeb ? 76 : 62,
          paddingBottom: isWeb ? 14 : 8,
          paddingTop: 6,
          elevation: 12,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
        },
        tabBarBackground: () => (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: C.surfaceContainerLow }]} />
        ),
        tabBarItemStyle: { paddingVertical: 0 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inspect",
          tabBarIcon: ({ color, focused }) => (
            <View style={[S.pill, focused && S.pillActive]}>
              <MaterialCommunityIcons
                name={focused ? "magnify-scan" : "magnify-scan"}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="train"
        options={{
          title: "Train",
          tabBarIcon: ({ color, focused }) => (
            <View style={[S.pill, focused && S.pillActive]}>
              <MaterialCommunityIcons name={focused ? "camera-iris" : "camera-iris"} size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="vault"
        options={{
          title: "Vault",
          tabBarIcon: ({ color, focused }) => (
            <View style={[S.pill, focused && S.pillActive]}>
              <MaterialCommunityIcons name={focused ? "certificate" : "certificate-outline"} size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, focused }) => (
            <View style={[S.pill, focused && S.pillActive]}>
              <MaterialCommunityIcons name={focused ? "tune" : "tune-variant"} size={24} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const S = StyleSheet.create({
  pill: {
    width: 60,
    height: 30,
    borderRadius: C.radiusFull,
    alignItems: "center",
    justifyContent: "center",
  },
  pillActive: {
    backgroundColor: C.primaryContainer,
  },
});
