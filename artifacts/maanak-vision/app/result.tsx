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
        {/* BIS chip */}
        <View style={[S.bisChip, { borderColor: cfg.chipDot }]}>
          <View style={[S.bisChipDot, { backgroundColor: cfg.chipDot }]} />
          <Text style={[S.bisChipText, { color: cfg.chipDot }]}>
            {result === "pass" ? "BIS Compliant" : "Non-compliant"}
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
    height: 56,
    backgroundColor: C.surfaceContainerLow,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.outlineVariant,
  },
  appBarTitle: {
    color: C.onSurface,
    fontSize: 18,
    fontFamily: "Rajdhani_600SemiBold",
    letterSpacing: 0.15,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: C.radiusFull,
  },

  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.outlineVariant,
  },
  heroIconBox: {
    width: 64,
    height: 64,
    borderRadius: C.radius,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  heroText: { flex: 1, gap: 4 },
  heroLabel: {
    fontSize: 36,
    fontFamily: "Rajdhani_700Bold",
    letterSpacing: 0.5,
    lineHeight: 40,
  },
  heroSupport: {
    fontSize: 13,
    fontFamily: "Rajdhani_400Regular",
    opacity: 0.8,
  },
  bisChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: C.radiusFull,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: "flex-start",
  },
  bisChipDot: { width: 5, height: 5, borderRadius: 99 },
  bisChipText: { fontSize: 11, fontFamily: "Rajdhani_600SemiBold" },

  detailSection: {
    flex: 1,
    backgroundColor: C.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.outlineVariant,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.outlineVariant,
    minHeight: 52,
  },
  detailLabel: {
    color: C.onSurfaceVariant,
    fontSize: 13,
    fontFamily: "Rajdhani_400Regular",
    letterSpacing: 0.25,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: "Rajdhani_600SemiBold",
    textAlign: "right",
    maxWidth: "58%",
    letterSpacing: 0.1,
  },

  actions: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 10,
    backgroundColor: C.surfaceContainerLow,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.outlineVariant,
  },
  primaryBtn: {
    height: 52,
    backgroundColor: C.primary,
    borderRadius: C.radius,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  primaryBtnText: {
    color: C.onPrimary,
    fontSize: 15,
    fontFamily: "Rajdhani_700Bold",
    letterSpacing: 0.1,
  },
  secondaryBtn: {
    height: 52,
    borderRadius: C.radius,
    borderWidth: 1,
    borderColor: C.outlineVariant,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  secondaryBtnText: {
    color: C.onSurfaceVariant,
    fontSize: 14,
    fontFamily: "Rajdhani_500Medium",
    letterSpacing: 0.1,
  },
});
