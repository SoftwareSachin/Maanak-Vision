import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";

export default function TabLayout() {
  const isWeb = Platform.OS === "web";
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#F5C518",
        tabBarInactiveTintColor: "#444",
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: "Rajdhani_700Bold",
          letterSpacing: 1.2,
          textTransform: "uppercase",
          marginTop: 1,
        },
        tabBarStyle: {
          backgroundColor: "#111",
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: "#222",
          height: isWeb ? 84 : 56,
          paddingBottom: isWeb ? 16 : 6,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarBackground: () => (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "#111" }]} />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inspect",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="magnify-scan" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="train"
        options={{
          title: "Train",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="camera-iris" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="vault"
        options={{
          title: "Vault",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="certificate-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="tune-variant" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
