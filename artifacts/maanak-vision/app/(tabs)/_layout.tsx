import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { F } from "@/constants/fonts";

export default function TabLayout() {
  const isWeb = Platform.OS === "web";
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#F5C518",
        tabBarInactiveTintColor: "#6B6B6B",
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: F.bold,
          letterSpacing: 1,
          textTransform: "uppercase",
          marginTop: 2,
        },
        tabBarStyle: {
          backgroundColor: "#1a1a1a",
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: "#2a2a2a",
          height: isWeb ? 84 : 56,
          paddingBottom: isWeb ? 16 : 6,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarBackground: () => (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "#1a1a1a" }]} />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inspect",
          tabBarIcon: ({ color, size }) => <Feather name="search" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="train"
        options={{
          title: "Train",
          tabBarIcon: ({ color, size }) => <Feather name="camera" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="vault"
        options={{
          title: "Vault",
          tabBarIcon: ({ color, size }) => <Feather name="shield" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => <Feather name="settings" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
