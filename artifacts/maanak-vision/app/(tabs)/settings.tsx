import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import C from "@/constants/colors";
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
  const topPad = isWeb ? 56 : insets.top;
  const bottomPad = isWeb ? 32 : insets.bottom;

  return (
    <View style={[S.root, { backgroundColor: C.background }]}>

      {/* Top App Bar */}
      <View style={[S.appBar, { paddingTop: topPad }]}>
        <View style={S.appBarRow}>
          <Text style={S.appBarTitle}>Settings</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomPad + 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* Voice Language */}
        <SectionLabel label="Voice Language" />
        <View style={S.listTile}>
          <View style={[S.tileIcon, { backgroundColor: C.surfaceContainerHigh }]}>
            <MaterialCommunityIcons name="microphone-outline" size={18} color={C.onSurfaceVariant} />
          </View>
          <View style={S.tileBody}>
            <Text style={S.tileTitle}>Voice language</Text>
            <Text style={S.tileSupport}>Language for voice commands</Text>
          </View>
          <Text style={S.tileValue}>{lang}</Text>
        </View>

        <View style={S.chipWrap}>
          {LANGS.map((l) => {
            const sel = lang === l;
            return (
              <Pressable
                key={l}
                onPress={() => setLang(l)}
                style={[S.langChip, sel && S.langChipSelected]}
              >
                {sel && <MaterialCommunityIcons name="check" size={14} color={C.primary} />}
                <Text style={[S.langChipText, sel && S.langChipTextSelected]}>{l}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Voice Commands */}
        <SectionLabel label="Voice Commands" />
        <CommandRow command='"Scan karo"' action="Trigger inspection scan" />
        <CommandRow command='"Check karo"' action="Inspect current part" />
        <CommandRow command='"Batch band karo"' action="Close active batch" />
        <CommandRow command='"Report dikho"' action="Open Vault" />

        {/* Haptic Patterns */}
        <SectionLabel label="Haptic Feedback Patterns" />
        <CommandRow command="· (short pulse)" action="Scan ready" />
        <CommandRow command="··· (3 rapid pulses)" action="Defect detected" />
        <CommandRow command="— (long pulse)" action="Batch closed" />

        {/* Preferences */}
        <SectionLabel label="Preferences" />
        <SwitchTile
          icon="vibrate"
          title="Haptic feedback"
          support="Vibration on scan events"
          value={haptics}
          onChange={setHaptics}
        />
        <SwitchTile
          icon="volume-high"
          title="Sound alerts"
          support="Audio cues for pass / fail"
          value={sound}
          onChange={setSound}
        />
        <SwitchTile
          icon="lightning-bolt"
          title="Screen flash on result"
          support="Full-screen color flash after inspection"
          value={flash}
          onChange={setFlash}
        />

        {/* Data */}
        <SectionLabel label="Data" />
        <View style={[S.listTile, S.listTileLast]}>
          <View style={[S.tileIcon, { backgroundColor: C.surfaceContainerHigh }]}>
            <MaterialCommunityIcons name="database-outline" size={18} color={C.onSurfaceVariant} />
          </View>
          <View style={S.tileBody}>
            <Text style={S.tileTitle}>Stored records</Text>
            <Text style={S.tileSupport}>{inspections.length} scans · {batches.length} batches</Text>
          </View>
        </View>

        {/* Danger zone */}
        <View style={S.dangerCard}>
          <Text style={S.dangerLabel}>Danger Zone</Text>
          <Pressable
            onPress={() =>
              Alert.alert(
                "Clear all data",
                `This will permanently delete ${inspections.length} inspections and ${batches.length} batches.`,
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Delete all", style: "destructive", onPress: clearAll },
                ],
              )
            }
            style={({ pressed }) => [S.dangerBtn, { opacity: pressed ? 0.75 : 1 }]}
          >
            <MaterialCommunityIcons name="delete-outline" size={18} color={C.onFailContainer} />
            <Text style={S.dangerBtnText}>Clear all inspection data</Text>
          </Pressable>
        </View>

        {/* About */}
        <SectionLabel label="About" />
        <InfoRow label="App" value="Maanak Vision 1.0" />
        <InfoRow label="Standard" value="BIS 2026" />
        <InfoRow label="Built for" value="Indian MSME workshops" />
        <InfoRow label="Compliance" value="IS 1367 · IS 4218" last />
      </ScrollView>
    </View>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <View style={S.sectionLabel}>
      <Text style={S.sectionLabelText}>{label}</Text>
    </View>
  );
}

function CommandRow({ command, action }: { command: string; action: string }) {
  return (
    <View style={S.listTile}>
      <View style={[S.tileIcon, { backgroundColor: C.surfaceContainerHigh }]}>
        <MaterialCommunityIcons name="microphone" size={16} color={C.onSurfaceVariant} />
      </View>
      <View style={S.tileBody}>
        <Text style={S.commandText}>{command}</Text>
      </View>
      <Text style={S.tileValue}>{action}</Text>
    </View>
  );
}

function SwitchTile({
  icon, title, support, value, onChange,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  support: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={S.listTile}>
      <View style={[S.tileIcon, { backgroundColor: C.surfaceContainerHigh }]}>
        <MaterialCommunityIcons name={icon} size={18} color={C.onSurfaceVariant} />
      </View>
      <View style={S.tileBody}>
        <Text style={S.tileTitle}>{title}</Text>
        <Text style={S.tileSupport}>{support}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: C.surfaceContainerHighest, true: C.primary }}
        thumbColor={value ? C.onPrimary : C.outline}
        ios_backgroundColor={C.surfaceContainerHighest}
      />
    </View>
  );
}

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[S.listTile, last && S.listTileLast]}>
      <View style={S.tileBody}>
        <Text style={S.tileTitle}>{label}</Text>
      </View>
      <Text style={S.tileValue}>{value}</Text>
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1 },

  appBar: {
    backgroundColor: C.surfaceContainerLow,
    borderBottomWidth: 1,
    borderBottomColor: C.outlineVariant,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    zIndex: 10,
  },
  appBarRow: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  appBarTitle: {
    color: C.onSurface,
    fontSize: 22,
    fontFamily: "Rajdhani_700Bold",
    letterSpacing: 0.2,
    lineHeight: 26,
  },

  sectionLabel: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 6,
  },
  sectionLabelText: {
    color: C.primary,
    fontSize: 11,
    fontFamily: "Rajdhani_700Bold",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },

  listTile: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 68,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 14,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.outlineVariant,
  },
  listTileLast: {
    borderBottomWidth: 0,
  },
  tileIcon: {
    width: 44,
    height: 44,
    borderRadius: C.radiusSm,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  tileBody: { flex: 1, gap: 3 },
  tileTitle: {
    color: C.onSurface,
    fontSize: 15,
    fontFamily: "Rajdhani_700Bold",
    letterSpacing: 0.1,
  },
  tileSupport: {
    color: C.onSurfaceVariant,
    fontSize: 12,
    fontFamily: "Rajdhani_500Medium",
    letterSpacing: 0.2,
  },
  tileValue: {
    color: C.onSurfaceVariant,
    fontSize: 13,
    fontFamily: "Rajdhani_600SemiBold",
    textAlign: "right",
    maxWidth: 140,
  },
  commandText: {
    color: C.onSurface,
    fontSize: 14,
    fontFamily: "Rajdhani_600SemiBold",
    fontStyle: "italic",
  },

  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.outlineVariant,
  },
  langChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: C.radiusSm,
    backgroundColor: C.surfaceContainerHigh,
  },
  langChipSelected: {
    backgroundColor: C.primaryContainer,
  },
  langChipText: {
    color: C.onSurfaceVariant,
    fontSize: 13,
    fontFamily: "Rajdhani_600SemiBold",
  },
  langChipTextSelected: {
    color: C.onPrimaryContainer,
    fontFamily: "Rajdhani_700Bold",
  },

  dangerCard: {
    margin: 14,
    marginTop: 20,
    padding: 16,
    backgroundColor: C.errorContainer,
    borderRadius: C.radius,
    gap: 12,
    elevation: 2,
    shadowColor: C.fail,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  dangerLabel: {
    color: C.onErrorContainer,
    fontSize: 11,
    fontFamily: "Rajdhani_700Bold",
    letterSpacing: 1,
    textTransform: "uppercase",
    opacity: 0.8,
  },
  dangerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.failContainer,
    borderRadius: C.radiusSm,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  dangerBtnText: {
    color: C.onFailContainer,
    fontSize: 14,
    fontFamily: "Rajdhani_700Bold",
    letterSpacing: 0.2,
  },
});
