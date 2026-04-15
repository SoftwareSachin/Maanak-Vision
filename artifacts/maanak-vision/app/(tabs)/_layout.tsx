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
        tabBarInactiveTintColor: C.onSurfaceVariant,
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: "Rajdhani_600SemiBold",
          letterSpacing: 0.5,
          marginTop: 2,
        },
        tabBarStyle: {
          backgroundColor: C.surfaceContainerLow,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: C.outlineVariant,
          height: isWeb ? 80 : 64,
          paddingBottom: isWeb ? 16 : 8,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarBackground: () => (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: C.surfaceContainerLow }]} />
        ),
        tabBarIconStyle: { marginBottom: 0 },
        tabBarItemStyle: { paddingVertical: 0 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inspect",
          tabBarIcon: ({ color, focused }) => (
            <View style={[S.indicator, focused && S.indicatorActive]}>
              <MaterialCommunityIcons
                name={focused ? "magnify-scan" : "magnify-scan"}
                size={22}
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
            <View style={[S.indicator, focused && S.indicatorActive]}>
              <MaterialCommunityIcons name="camera-iris" size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="vault"
        options={{
          title: "Vault",
          tabBarIcon: ({ color, focused }) => (
            <View style={[S.indicator, focused && S.indicatorActive]}>
              <MaterialCommunityIcons name="certificate-outline" size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, focused }) => (
            <View style={[S.indicator, focused && S.indicatorActive]}>
              <MaterialCommunityIcons name="tune-variant" size={22} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const S = StyleSheet.create({
  indicator: {
    width: 64,
    height: 32,
    borderRadius: C.radiusFull,
    alignItems: "center",
    justifyContent: "center",
  },
  indicatorActive: {
    backgroundColor: C.primaryContainer,
  },
});
