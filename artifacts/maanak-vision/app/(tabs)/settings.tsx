import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useInspection } from "@/context/InspectionContext";
import { useColors } from "@/hooks/useColors";

const VOICE_LANGUAGES = ["Hindi", "Hinglish", "Marathi", "Gujarati", "Tamil", "Telugu"];

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { clearAll, inspections, batches } = useInspection();
  const [voiceLang, setVoiceLang] = useState("Hinglish");
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoFlash, setAutoFlash] = useState(true);

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom;

  const handleClearData = () => {
    Alert.alert(
      "Clear All Data",
      `This will permanently delete ${inspections.length} inspections and ${batches.length} batches. This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: clearAll,
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 12, borderBottomColor: colors.border },
        ]}
      >
        <Text style={[styles.pageTitle, { color: colors.primary }]}>SETTINGS</Text>
        <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>
          App Configuration
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: bottomPad + 40,
          gap: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Section title="VOICE LANGUAGE" colors={colors}>
          <Text style={[styles.sectionDesc, { color: colors.mutedForeground }]}>
            Select language for voice command recognition
          </Text>
          <View style={styles.langGrid}>
            {VOICE_LANGUAGES.map((lang) => (
              <Pressable
                key={lang}
                onPress={() => setVoiceLang(lang)}
                style={({ pressed }) => [
                  styles.langChip,
                  {
                    backgroundColor:
                      voiceLang === lang ? colors.primary : colors.card,
                    borderColor:
                      voiceLang === lang ? colors.primary : colors.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Feather
                  name="mic"
                  size={12}
                  color={
                    voiceLang === lang
                      ? colors.primaryForeground
                      : colors.mutedForeground
                  }
                />
                <Text
                  style={[
                    styles.langChipText,
                    {
                      color:
                        voiceLang === lang
                          ? colors.primaryForeground
                          : colors.foreground,
                    },
                  ]}
                >
                  {lang}
                </Text>
              </Pressable>
            ))}
          </View>
          <View
            style={[styles.voiceCmds, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={[styles.voiceCmdsTitle, { color: colors.mutedForeground }]}>
              VOICE COMMANDS
            </Text>
            {[
              ["Scan karo", "Start scanning"],
              ["Check karo", "Inspect current part"],
              ["Batch band karo", "Close current batch"],
              ["Report dikho", "Open vault"],
            ].map(([cmd, desc]) => (
              <View key={cmd} style={styles.voiceCmd}>
                <Text style={[styles.voiceCmdPhrase, { color: colors.primary }]}>
                  "{cmd}"
                </Text>
                <Text style={[styles.voiceCmdDesc, { color: colors.mutedForeground }]}>
                  {desc}
                </Text>
              </View>
            ))}
          </View>
        </Section>

        <Section title="FEEDBACK" colors={colors}>
          <ToggleRow
            icon="smartphone"
            label="Haptic Feedback"
            desc="Vibration on scan results"
            value={hapticsEnabled}
            onChange={setHapticsEnabled}
            colors={colors}
          />
          <ToggleRow
            icon="volume-2"
            label="Sound Alerts"
            desc="Audible chime on pass/fail"
            value={soundEnabled}
            onChange={setSoundEnabled}
            colors={colors}
          />
          <ToggleRow
            icon="zap"
            label="Screen Flash"
            desc="Full-screen green/red flash on result"
            value={autoFlash}
            onChange={setAutoFlash}
            colors={colors}
          />
        </Section>

        <Section title="HAPTIC PATTERNS" colors={colors}>
          <View style={[styles.hapticTable, { borderColor: colors.border }]}>
            {[
              ["·", "1 short pulse", "Scan ready"],
              ["···", "3 rapid pulses", "Defect detected"],
              ["——", "1 long pulse", "Batch complete"],
            ].map(([sym, pat, meaning]) => (
              <View
                key={pat}
                style={[styles.hapticRow, { borderBottomColor: colors.border }]}
              >
                <Text style={[styles.hapticSym, { color: colors.primary }]}>
                  {sym}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.hapticPat, { color: colors.foreground }]}>
                    {pat}
                  </Text>
                  <Text style={[styles.hapticMeaning, { color: colors.mutedForeground }]}>
                    {meaning}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Section>

        <Section title="DATA MANAGEMENT" colors={colors}>
          <View style={[styles.dataRow, { borderColor: colors.border }]}>
            <View style={styles.dataLeft}>
              <Feather name="database" size={16} color={colors.mutedForeground} />
              <View>
                <Text style={[styles.dataLabel, { color: colors.foreground }]}>
                  Inspection Records
                </Text>
                <Text style={[styles.dataMeta, { color: colors.mutedForeground }]}>
                  {inspections.length} inspections · {batches.length} batches
                </Text>
              </View>
            </View>
          </View>
          <Pressable
            onPress={handleClearData}
            style={({ pressed }) => [
              styles.clearBtn,
              {
                borderColor: colors.destructive,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Feather name="trash-2" size={16} color={colors.destructive} />
            <Text style={[styles.clearBtnText, { color: colors.destructive }]}>
              CLEAR ALL DATA
            </Text>
          </Pressable>
        </Section>

        <View style={[styles.aboutCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: colors.mutedForeground }]}>APP</Text>
            <Text style={[styles.aboutValue, { color: colors.primary }]}>MAANAK VISION</Text>
          </View>
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: colors.mutedForeground }]}>VERSION</Text>
            <Text style={[styles.aboutValue, { color: colors.foreground }]}>1.0.0</Text>
          </View>
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: colors.mutedForeground }]}>STANDARD</Text>
            <Text style={[styles.aboutValue, { color: colors.foreground }]}>BIS 2026</Text>
          </View>
          <View style={[styles.aboutRow, { borderBottomWidth: 0 }]}>
            <Text style={[styles.aboutLabel, { color: colors.mutedForeground }]}>MADE FOR</Text>
            <Text style={[styles.aboutValue, { color: colors.foreground }]}>Indian MSME</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Section({
  title,
  children,
  colors,
}: {
  title: string;
  children: React.ReactNode;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View>
      <Text style={[styles.secTitle, { color: colors.mutedForeground }]}>{title}</Text>
      {children}
    </View>
  );
}

function ToggleRow({
  icon,
  label,
  desc,
  value,
  onChange,
  colors,
}: {
  icon: string;
  label: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View
      style={[styles.toggleRow, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={styles.toggleLeft}>
        <Feather name={icon as any} size={18} color={colors.mutedForeground} />
        <View>
          <Text style={[styles.toggleLabel, { color: colors.foreground }]}>{label}</Text>
          <Text style={[styles.toggleDesc, { color: colors.mutedForeground }]}>{desc}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor="#fff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 2,
  },
  pageSub: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  secTitle: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 10,
  },
  sectionDesc: {
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 20,
  },
  langGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  langChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  langChipText: {
    fontSize: 14,
    fontWeight: "700",
  },
  voiceCmds: {
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    gap: 10,
  },
  voiceCmdsTitle: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 4,
  },
  voiceCmd: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  voiceCmdPhrase: {
    fontSize: 14,
    fontWeight: "700",
    width: 130,
  },
  voiceCmdDesc: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  toggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  toggleDesc: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 1,
  },
  hapticTable: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  hapticRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
    borderBottomWidth: 1,
  },
  hapticSym: {
    fontSize: 18,
    fontWeight: "900",
    width: 36,
    textAlign: "center",
    letterSpacing: 2,
  },
  hapticPat: {
    fontSize: 14,
    fontWeight: "700",
  },
  hapticMeaning: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 1,
  },
  dataRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
  },
  dataLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dataLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  dataMeta: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 1,
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  clearBtnText: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  aboutCard: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  aboutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
  },
  aboutLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  aboutValue: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
