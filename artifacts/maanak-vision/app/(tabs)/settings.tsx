import { MaterialCommunityIcons } from "@expo/vector-icons";
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

        {/* Voice language */}
        <Row icon="microphone-outline" label="Voice language" right={<Text style={S.rVal}>{lang}</Text>} />
        <View style={S.chipRow}>
          {LANGS.map((l) => (
            <Pressable
              key={l}
              onPress={() => setLang(l)}
              style={[S.langChip, { backgroundColor: lang === l ? "#F5C518" : "#111" }]}
            >
              <Text style={[S.langChipText, { color: lang === l ? "#000" : "#555" }]}>{l}</Text>
            </Pressable>
          ))}
        </View>

        <Sep />

        {/* Voice commands */}
        <Row icon="microphone" label='"Scan karo"' right={<Text style={S.rDim}>Start scan</Text>} />
        <Row icon="microphone" label='"Check karo"' right={<Text style={S.rDim}>Inspect part</Text>} />
        <Row icon="microphone" label='"Batch band karo"' right={<Text style={S.rDim}>Close batch</Text>} />
        <Row icon="microphone" label='"Report dikho"' right={<Text style={S.rDim}>Open vault</Text>} />

        <Sep />

        {/* Haptic patterns */}
        <Row icon="vibrate" label='"·" — scan ready' right={<Text style={S.rDim}>1 short pulse</Text>} />
        <Row icon="vibrate" label='"···" — defect detected' right={<Text style={S.rDim}>3 rapid pulses</Text>} />
        <Row icon="vibrate" label='"——" — batch closed' right={<Text style={S.rDim}>1 long pulse</Text>} />

        <Sep />

        <Row icon="vibrate" label="Haptic feedback"
          right={<Switch value={haptics} onValueChange={setHaptics} trackColor={{ false: "#1a1a1a", true: "#F5C518" }} thumbColor="#fff" />}
        />
        <Row icon="volume-high" label="Sound alerts"
          right={<Switch value={sound} onValueChange={setSound} trackColor={{ false: "#1a1a1a", true: "#F5C518" }} thumbColor="#fff" />}
        />
        <Row icon="lightning-bolt" label="Screen flash on result"
          right={<Switch value={flash} onValueChange={setFlash} trackColor={{ false: "#1a1a1a", true: "#F5C518" }} thumbColor="#fff" />}
        />

        <Sep />

        <Row icon="database-outline" label="Stored records"
          right={<Text style={S.rDim}>{inspections.length} scans · {batches.length} batches</Text>}
        />
        <Pressable
          onPress={() => Alert.alert("Clear all data", `Delete ${inspections.length} inspections and ${batches.length} batches?`, [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: clearAll },
          ])}
          style={({ pressed }) => [S.row, { opacity: pressed ? 0.7 : 1 }]}
        >
          <View style={[S.iconBox, { backgroundColor: "#1f0404" }]}>
            <MaterialCommunityIcons name="delete-outline" size={16} color="#EF4444" />
          </View>
          <Text style={[S.rowLabel, { color: "#EF4444", marginLeft: 12 }]}>Clear all data</Text>
        </Pressable>

        <Sep />

        <Row icon="information-outline" label="App" right={<Text style={S.rDim}>MAANAK VISION 1.0</Text>} />
        <Row icon="shield-check-outline" label="Standard" right={<Text style={S.rDim}>BIS 2026</Text>} />
        <Row icon="factory" label="Built for" right={<Text style={S.rDim}>Indian MSME workshops</Text>} />

      </ScrollView>
    </View>
  );
}

function Sep() {
  return <View style={{ height: 20, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#1f1f1f" }} />;
}

function Row({ icon, label, right }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; right: React.ReactNode }) {
  return (
    <View style={S.row}>
      <View style={S.iconBox}>
        <MaterialCommunityIcons name={icon} size={16} color="#555" />
      </View>
      <Text style={S.rowLabel}>{label}</Text>
      <View style={S.rowRight}>{right}</View>
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    paddingHorizontal: 16, paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#1f1f1f",
  },
  title: { color: "#F5C518", fontSize: 20, fontFamily: "Rajdhani_700Bold", letterSpacing: 2 },
  row: {
    minHeight: 56, flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#1f1f1f",
  },
  iconBox: {
    width: 30, height: 30, borderRadius: 3,
    backgroundColor: "#111", alignItems: "center", justifyContent: "center",
  },
  rowLabel: { color: "#E8E8E8", fontSize: 15, fontFamily: "Rajdhani_500Medium", marginLeft: 12, flex: 1 },
  rowRight: { alignItems: "flex-end" },
  rVal: { color: "#A1A1A0", fontSize: 14, fontFamily: "Rajdhani_400Regular" },
  rDim: { color: "#555", fontSize: 13, fontFamily: "Rajdhani_400Regular", textAlign: "right", maxWidth: 160 },
  chipRow: {
    flexDirection: "row", flexWrap: "wrap",
    paddingHorizontal: 16, paddingVertical: 10, gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#1f1f1f",
  },
  langChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 3 },
  langChipText: { fontSize: 13, fontFamily: "Rajdhani_600SemiBold" },
});
