import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useInspection } from "@/context/InspectionContext";

const LANGS = ["Hinglish", "Hindi", "Marathi", "Gujarati", "Tamil", "Telugu"];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { clearAll, inspections, batches } = useInspection();
  const [lang, setLang] = useState("Hinglish");
  const [haptics, setHaptics] = useState(true);
  const [sound, setSound] = useState(true);
  const [flash, setFlash] = useState(true);

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom;

  return (
    <View style={[S.root, { backgroundColor: "#0f0f0f" }]}>
      <View style={[S.topBar, { paddingTop: topPad + 8 }]}>
        <Text style={S.title}>SETTINGS</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: bottomPad + 20 }} showsVerticalScrollIndicator={false}>

        {/* Section: Voice */}
        <Row icon="mic" label="Voice language" right={
          <Text style={S.rowRightText}>{lang}</Text>
        } />

        {/* Language selector — flat chips, no border, inline */}
        <View style={[S.chipRow]}>
          {LANGS.map((l) => (
            <Pressable
              key={l}
              onPress={() => setLang(l)}
              style={[S.langChip, { backgroundColor: lang === l ? "#F5C518" : "#1a1a1a" }]}
            >
              <Text style={[S.langChipText, { color: lang === l ? "#000" : "#6B6B6B" }]}>{l}</Text>
            </Pressable>
          ))}
        </View>

        <Divider />

        <Row icon="mic" label='"Scan karo"' right={<Text style={S.rowRightText}>Start scan</Text>} rightDim />
        <Row icon="mic" label='"Check karo"' right={<Text style={S.rowRightText}>Inspect part</Text>} rightDim />
        <Row icon="mic" label='"Batch band karo"' right={<Text style={S.rowRightText}>Close batch</Text>} rightDim />
        <Row icon="mic" label='"Report dikho"' right={<Text style={S.rowRightText}>Open vault</Text>} rightDim />

        <Divider />

        <Row
          icon="smartphone"
          label="Haptic feedback"
          right={<Switch value={haptics} onValueChange={setHaptics} trackColor={{ false: "#2a2a2a", true: "#F5C518" }} thumbColor="#fff" />}
        />
        <Row
          icon="volume-2"
          label="Sound alerts"
          right={<Switch value={sound} onValueChange={setSound} trackColor={{ false: "#2a2a2a", true: "#F5C518" }} thumbColor="#fff" />}
        />
        <Row
          icon="zap"
          label="Screen flash on result"
          right={<Switch value={flash} onValueChange={setFlash} trackColor={{ false: "#2a2a2a", true: "#F5C518" }} thumbColor="#fff" />}
        />

        <Divider />

        <Row
          icon="database"
          label="Stored data"
          right={<Text style={S.rowRightText}>{inspections.length} scans · {batches.length} batches</Text>}
          rightDim
        />
        <Pressable
          onPress={() =>
            Alert.alert(
              "Clear all data",
              `Delete ${inspections.length} inspections and ${batches.length} batches?`,
              [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: clearAll }]
            )
          }
          style={({ pressed }) => [S.row, { borderBottomColor: "#2a2a2a", opacity: pressed ? 0.7 : 1 }]}
        >
          <View style={[S.rowIcon, { backgroundColor: "#2E0D0D" }]}>
            <Feather name="trash-2" size={14} color="#EF4444" />
          </View>
          <Text style={[S.rowLabel, { color: "#EF4444", marginLeft: 12 }]}>Clear all data</Text>
        </Pressable>

        <Divider />

        <Row icon="info" label="App" right={<Text style={S.rowRightText}>MAANAK VISION</Text>} rightDim />
        <Row icon="tag" label="Version" right={<Text style={S.rowRightText}>1.0.0</Text>} rightDim />
        <Row icon="shield" label="Standard" right={<Text style={S.rowRightText}>BIS 2026</Text>} rightDim />
        <Row icon="map-pin" label="Built for" right={<Text style={S.rowRightText}>Indian MSME</Text>} rightDim />

      </ScrollView>
    </View>
  );
}

function Divider() {
  return <View style={{ height: 24, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#2a2a2a" }} />;
}

function Row({ icon, label, right, rightDim }: { icon: any; label: string; right: React.ReactNode; rightDim?: boolean }) {
  return (
    <View style={[S.row, { borderBottomColor: "#2a2a2a" }]}>
      <View style={S.rowIcon}>
        <Feather name={icon} size={14} color="#6B6B6B" />
      </View>
      <Text style={S.rowLabel}>{label}</Text>
      <View style={S.rowRight}>{right}</View>
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#2a2a2a",
  },
  title: { color: "#F5C518", fontSize: 20, fontFamily: "Rajdhani_700Bold", letterSpacing: 2 },
  row: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowIcon: {
    width: 28, height: 28, borderRadius: 4,
    backgroundColor: "#1a1a1a",
    alignItems: "center", justifyContent: "center",
  },
  rowLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "Rajdhani_500Medium",
    marginLeft: 12,
    flex: 1,
  },
  rowRight: { alignItems: "flex-end" },
  rowRightText: {
    color: "#6B6B6B",
    fontSize: 14,
    fontFamily: "Rajdhani_400Regular",
    textAlign: "right",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#2a2a2a",
  },
  langChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 3,
  },
  langChipText: { fontSize: 13, fontFamily: "Rajdhani_600SemiBold" },
});
