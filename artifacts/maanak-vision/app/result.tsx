import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import C from "@/constants/colors";
import type { InspectionResult } from "@/context/InspectionContext";

const DEFECT_LABEL: Record<string, string> = {
  crack:           "Surface crack",
  scratch:         "Linear scratch",
  colour_mismatch: "Colour deviation",
  dimensional:     "Dimensional error",
  none:            "—",
};

const RESULT_CONFIG: Record<InspectionResult, {
  color: string;
  containerBg: string;
  label: string;
  support: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  chipDot: string;
  chipBorder: string;
}> = {
  pass: {
    color:       C.pass,
    containerBg: C.passContainer,
    label:       "Pass",
    support:     "No defects detected",
    icon:        "check-circle-outline",
    chipDot:     C.pass,
    chipBorder:  C.passContainer,
  },
  fail: {
    color:       C.fail,
    containerBg: C.failContainer,
    label:       "Fail",
    support:     "Defect detected — reject part",
    icon:        "alert-circle-outline",
    chipDot:     C.fail,
    chipBorder:  C.failContainer,
  },
  warning: {
    color:       C.warn,
    containerBg: C.warnContainer,
    label:       "Caution",
    support:     "Minor issue — manual inspection recommended",
    icon:        "alert-outline",
    chipDot:     C.warn,
    chipBorder:  C.warnContainer,
  },
};

export default function ResultScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    result: InspectionResult;
    productName: string;
    defectType: string;
    defectDesc: string;
  }>();
  const result = params.result ?? "pass";
  const cfg = RESULT_CONFIG[result];
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 56 : insets.top;
  const bottomPad = isWeb ? 32 : insets.bottom;

  const [phase, setPhase] = useState<"flash" | "card">("flash");
  const flashRef = useRef(new Animated.Value(1)).current;
  const cardRef  = useRef(new Animated.Value(0)).current;

  const hasDefect = params.defectType && params.defectType !== "none";

  useEffect(() => {
    if (Platform.OS !== "web") {
      result === "fail"
        ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const t = setTimeout(() => {
      Animated.timing(flashRef, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
        setPhase("card");
        Animated.timing(cardRef, { toValue: 1, duration: 220, useNativeDriver: true }).start();
      });
    }, 380);
    return () => clearTimeout(t);
  }, []);

  if (phase === "flash") {
    return <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: cfg.color, opacity: flashRef }]} />;
  }

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}:${String(now.getSeconds()).padStart(2,"0")}`;

  return (
    <Animated.View style={[S.root, { opacity: cardRef, backgroundColor: C.background }]}>

      {/* Top App Bar */}
      <View style={[S.appBar, { paddingTop: topPad }]}>
        <Text style={S.appBarTitle}>Inspection Result</Text>
        <Pressable onPress={() => router.replace("/")} style={S.closeBtn}>
          <MaterialCommunityIcons name="close" size={20} color={C.onSurfaceVariant} />
        </Pressable>
      </View>

      {/* Result hero */}
      <View style={[S.heroCard, { backgroundColor: cfg.containerBg }]}>
        <View style={[S.heroIconBox, { backgroundColor: cfg.containerBg }]}>
          <MaterialCommunityIcons name={cfg.icon} size={48} color={cfg.color} />
        </View>
        <View style={S.heroText}>
          <Text style={[S.heroLabel, { color: cfg.color }]}>{cfg.label}</Text>
          <Text style={[S.heroSupport, { color: cfg.color }]}>
            {result === "pass"
              ? cfg.support
              : hasDefect
              ? (DEFECT_LABEL[params.defectType ?? ""] ?? params.defectType)
              : cfg.support}
          </Text>
        </View>
        {/* BIS chip — filled tonal */}
        <View style={[S.bisChip, { backgroundColor: cfg.chipBorder }]}>
          <Text style={[S.bisChipText, { color: cfg.chipDot }]}>
            {result === "pass" ? "BIS COMPLIANT" : "NON-COMPLIANT"}
          </Text>
        </View>
      </View>

      {/* Detail rows */}
      <View style={S.detailSection}>
        <DetailRow label="Product"     value={params.productName ?? "Unknown"} />
        <DetailRow label="Time"        value={timeStr} />
        {hasDefect && (
          <DetailRow
            label="Defect type"
            value={(DEFECT_LABEL[params.defectType ?? ""] ?? params.defectType ?? "").toUpperCase()}
            valueColor={C.warn}
          />
        )}
        {hasDefect && params.defectDesc ? (
          <DetailRow label="Detail" value={params.defectDesc} />
        ) : null}
        <DetailRow label="Defects found" value={hasDefect ? "1" : "0"} />
        <DetailRow
          label="BIS 2026 status"
          value={result === "pass" ? "Compliant" : "Non-compliant"}
          valueColor={result === "pass" ? C.pass : C.fail}
          last
        />
      </View>

      {/* Actions */}
      <View style={[S.actions, { paddingBottom: bottomPad + 12 }]}>
        <Pressable
          onPress={() => router.replace("/scan")}
          style={({ pressed }) => [S.primaryBtn, { opacity: pressed ? 0.88 : 1 }]}
        >
          <MaterialCommunityIcons name="barcode-scan" size={18} color={C.onPrimary} />
          <Text style={S.primaryBtnText}>Log &amp; Scan Next</Text>
        </Pressable>
        <Pressable
          onPress={() => router.replace("/")}
          style={({ pressed }) => [S.secondaryBtn, { opacity: pressed ? 0.7 : 1 }]}
        >
          <MaterialCommunityIcons name="flag-outline" size={16} color={C.onSurfaceVariant} />
          <Text style={S.secondaryBtnText}>Report Defect</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

function DetailRow({
  label, value, valueColor, last,
}: {
  label: string; value: string; valueColor?: string; last?: boolean;
}) {
  return (
    <View style={[S.detailRow, last && { borderBottomWidth: 0 }]}>
      <Text style={S.detailLabel}>{label}</Text>
      <Text style={[S.detailValue, { color: valueColor ?? C.onSurface }]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1 },

  appBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 60,
    backgroundColor: C.surfaceContainerLow,
    borderBottomWidth: 1,
    borderBottomColor: C.outlineVariant,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  appBarTitle: {
    color: C.onSurface,
    fontSize: 20,
    fontFamily: "Rajdhani_700Bold",
    letterSpacing: 0.2,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: C.radiusSm,
    backgroundColor: C.surfaceContainerHigh,
  },

  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 18,
    borderBottomWidth: 1,
    borderBottomColor: C.outlineVariant,
  },
  heroIconBox: {
    width: 72,
    height: 72,
    borderRadius: C.radius,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  heroText: { flex: 1, gap: 5 },
  heroLabel: {
    fontSize: 42,
    fontFamily: "Rajdhani_700Bold",
    letterSpacing: 0.5,
    lineHeight: 46,
  },
  heroSupport: {
    fontSize: 14,
    fontFamily: "Rajdhani_600SemiBold",
    opacity: 0.85,
  },
  bisChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: C.radiusSm,
    alignSelf: "flex-start",
  },
  bisChipDot: { width: 5, height: 5, borderRadius: 99 },
  bisChipText: { fontSize: 11, fontFamily: "Rajdhani_700Bold", letterSpacing: 0.8 },

  detailSection: {
    flex: 1,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.outlineVariant,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.outlineVariant,
    minHeight: 56,
  },
  detailLabel: {
    color: C.onSurfaceVariant,
    fontSize: 13,
    fontFamily: "Rajdhani_600SemiBold",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  detailValue: {
    fontSize: 15,
    fontFamily: "Rajdhani_700Bold",
    textAlign: "right",
    maxWidth: "58%",
    letterSpacing: 0.1,
  },

  actions: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 10,
    backgroundColor: C.surfaceContainerLow,
    borderTopWidth: 1,
    borderTopColor: C.outlineVariant,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  primaryBtn: {
    height: 54,
    backgroundColor: C.primary,
    borderRadius: C.radius,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    elevation: 4,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  primaryBtnText: {
    color: C.onPrimary,
    fontSize: 17,
    fontFamily: "Rajdhani_700Bold",
    letterSpacing: 0.2,
  },
  secondaryBtn: {
    height: 52,
    borderRadius: C.radius,
    backgroundColor: C.surfaceContainerHigh,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  secondaryBtnText: {
    color: C.onSurfaceVariant,
    fontSize: 14,
    fontFamily: "Rajdhani_600SemiBold",
    letterSpacing: 0.1,
  },
});
