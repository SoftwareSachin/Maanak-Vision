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
      <View style={[S.topBar, { paddingTop: topPad + 6, borderBottomColor: "#2a2a2a" }]}>
        <Text style={S.title}>SETTINGS</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: bottomPad + 20 }} showsVerticalScrollIndicator={false}>

        {/* Voice language */}
        <SectionHead label="VOICE LANGUAGE" />
        <View style={[S.langGrid, { borderBottomColor: "#2a2a2a" }]}>
          {LANGS.map((l) => (
            <Pressable
              key={l}
              onPress={() => setLang(l)}
              style={[S.langBtn, { backgroundColor: lang === l ? "#F5C518" : "#1a1a1a", borderColor: lang === l ? "#F5C518" : "#2a2a2a" }]}
            >
              <Text style={[S.langBtnText, { color: lang === l ? "#000" : "#6B6B6B" }]}>{l}</Text>
            </Pressable>
          ))}
        </View>

        {/* Voice commands */}
        <SectionHead label="VOICE COMMANDS" />
        {[
          ["mic", "\"Scan karo\"", "Start scan"],
          ["mic", "\"Check karo\"", "Inspect part"],
          ["mic", "\"Batch band karo\"", "Close batch"],
          ["mic", "\"Report dikho\"", "Open vault"],
        ].map(([icon, phrase, desc], i) => (
          <Row key={i} icon={icon as any} left={phrase} right={desc} leftColor="#F5C518" />
        ))}

        {/* Haptic patterns */}
        <SectionHead label="HAPTIC PATTERNS" />
        {[
          ["·", "1 short pulse", "Scan ready"],
          ["···", "3 rapid pulses", "Defect detected"],
          ["——", "1 long pulse", "Batch complete"],
        ].map(([sym, pat, meaning]) => (
          <View key={pat} style={[S.row, { borderBottomColor: "#2a2a2a" }]}>
            <Text style={S.hapticSym}>{sym}</Text>
            <View style={{ flex: 1 }}>
              <Text style={S.rowPrimary}>{pat}</Text>
              <Text style={S.rowSecondary}>{meaning}</Text>
            </View>
          </View>
        ))}

        {/* Feedback toggles */}
        <SectionHead label="FEEDBACK" />
        <ToggleRow icon="smartphone" label="Haptic Feedback" desc="Vibration on scan result" value={haptics} onChange={setHaptics} />
        <ToggleRow icon="volume-2" label="Sound Alerts" desc="Audible chime on pass/fail" value={sound} onChange={setSound} />
        <ToggleRow icon="zap" label="Screen Flash" desc="Full-screen green/red on result" value={flash} onChange={setFlash} />

        {/* Data */}
        <SectionHead label="DATA" />
        <View style={[S.row, { borderBottomColor: "#2a2a2a" }]}>
          <Feather name="database" size={16} color="#6B6B6B" />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={S.rowPrimary}>Stored inspections</Text>
            <Text style={S.rowSecondary}>{inspections.length} records · {batches.length} batches</Text>
          </View>
        </View>
        <Pressable
          onPress={() => Alert.alert("Clear All", `Delete ${inspections.length} inspections and ${batches.length} batches?`, [
            { text: "Cancel", style: "cancel" },
            { text: "Delete All", style: "destructive", onPress: clearAll },
          ])}
          style={({ pressed }) => [S.row, { borderBottomColor: "#2a2a2a", opacity: pressed ? 0.7 : 1 }]}
        >
          <Feather name="trash-2" size={16} color="#EF4444" />
          <Text style={[S.rowPrimary, { marginLeft: 14, color: "#EF4444" }]}>Clear all data</Text>
        </Pressable>

        {/* About */}
        <SectionHead label="ABOUT" />
        {[
          ["App", "MAANAK VISION"],
          ["Version", "1.0.0"],
          ["Standard", "BIS 2026"],
          ["Target", "Indian MSME"],
        ].map(([label, val]) => (
          <View key={label} style={[S.row, { borderBottomColor: "#2a2a2a" }]}>
            <Text style={S.rowSecondary}>{label}</Text>
            <Text style={[S.rowPrimary, { marginLeft: "auto" }]}>{val}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function SectionHead({ label }: { label: string }) {
  return (
    <View style={S.sectionHead}>
      <Text style={S.sectionLabel}>{label}</Text>
    </View>
  );
}

function Row({ icon, left, right, leftColor }: { icon: any; left: string; right: string; leftColor?: string }) {
  return (
    <View style={[S.row, { borderBottomColor: "#2a2a2a" }]}>
      <Feather name={icon} size={14} color="#6B6B6B" />
      <Text style={[S.rowPrimary, { marginLeft: 14, color: leftColor ?? "#FFFFFF", flex: 1 }]}>{left}</Text>
      <Text style={S.rowSecondary}>{right}</Text>
    </View>
  );
}

function ToggleRow({ icon, label, desc, value, onChange }: {
  icon: any; label: string; desc: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <View style={[S.row, { borderBottomColor: "#2a2a2a" }]}>
      <Feather name={icon} size={16} color="#6B6B6B" />
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={S.rowPrimary}>{label}</Text>
        <Text style={S.rowSecondary}>{desc}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: "#2a2a2a", true: "#F5C518" }}
        thumbColor="#fff"
      />
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { color: "#F5C518", fontSize: 18, fontFamily: "Rajdhani_700Bold", letterSpacing: 2 },
  sectionHead: {
    paddingLeft: 16,
    paddingTop: 20,
    paddingBottom: 6,
  },
  sectionLabel: {
    color: "#6B6B6B",
    fontSize: 11,
    fontFamily: "Rajdhani_700Bold",
    letterSpacing: 2,
  },
  langGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  langBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
  },
  langBtnText: {
    fontSize: 13,
    fontFamily: "Rajdhani_600SemiBold",
  },
  row: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowPrimary: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "Rajdhani_500Medium",
  },
  rowSecondary: {
    color: "#6B6B6B",
    fontSize: 12,
    fontFamily: "Rajdhani_400Regular",
    marginTop: 1,
  },
  hapticSym: {
    color: "#F5C518",
    fontSize: 16,
    fontFamily: "Rajdhani_700Bold",
    width: 40,
    letterSpacing: 2,
  },
});
