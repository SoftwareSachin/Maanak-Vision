import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { InspectionResult } from "@/context/InspectionContext";

const DEFECT_LABEL: Record<string, string> = {
  crack: "Surface crack",
  scratch: "Linear scratch",
  colour_mismatch: "Colour deviation",
  dimensional: "Dimensional error",
  none: "—",
};

const RESULT_CONFIG: Record<InspectionResult, { color: string; bg: string; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }> = {
  pass: { color: "#22C55E", bg: "#052210", label: "PASS", icon: "check-decagram" },
  fail: { color: "#EF4444", bg: "#1f0404", label: "FAIL", icon: "alert-decagram" },
  warning: { color: "#F59E0B", bg: "#1f1100", label: "CAUTION", icon: "alert-rhombus" },
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
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom;

  const [phase, setPhase] = useState<"flash" | "card">("flash");
  const flashRef = useRef(new Animated.Value(1)).current;
  const cardRef = useRef(new Animated.Value(0)).current;

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
        Animated.timing(cardRef, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      });
    }, 400);
    return () => clearTimeout(t);
  }, []);

  if (phase === "flash") {
    return <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: cfg.color, opacity: flashRef }]} />;
  }

  return (
    <Animated.View style={[S.root, { opacity: cardRef }]}>

      {/* Top bar */}
      <View style={[S.topBar, { paddingTop: topPad + 8 }]}>
        <Text style={S.topBarTitle}>RESULT</Text>
        <Pressable onPress={() => router.replace("/")} style={S.closeBtn}>
          <MaterialCommunityIcons name="close" size={20} color="#444" />
        </Pressable>
      </View>

      {/* Result block — icon + large label */}
      <View style={[S.resultBlock, { backgroundColor: cfg.bg }]}>
        <View style={{ flex: 1 }}>
          <Text style={[S.resultLabel, { color: cfg.color }]}>{cfg.label}</Text>
          <Text style={[S.resultSub, { color: cfg.color }]}>
            {result === "pass" ? "No defects detected" : hasDefect ? (DEFECT_LABEL[params.defectType ?? ""] ?? params.defectType) : "Inspect manually"}
          </Text>
        </View>
        <MaterialCommunityIcons name={cfg.icon} size={52} color={cfg.color} style={{ opacity: 0.25 }} />
      </View>

      {/* Receipt rows */}
      <View style={S.receipt}>
        <ReceiptRow label="Product" value={params.productName ?? "Unknown"} />
        {hasDefect && (
          <ReceiptRow
            label="Defect"
            value={(DEFECT_LABEL[params.defectType ?? ""] ?? params.defectType ?? "").toUpperCase()}
            valueColor="#F59E0B"
          />
        )}
        {hasDefect && params.defectDesc ? (
          <ReceiptRow label="Detail" value={params.defectDesc} />
        ) : null}
        <ReceiptRow
          label="BIS 2026"
          value={result === "pass" ? "COMPLIANT" : "NON-COMPLIANT"}
          valueColor={result === "pass" ? "#22C55E" : "#EF4444"}
        />
        <ReceiptRow
          label="Time"
          value={(() => {
            const d = new Date();
            return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}:${String(d.getSeconds()).padStart(2,"0")}`;
          })()}
        />
        <ReceiptRow label="Defects found" value={hasDefect ? "1" : "0"} />
      </View>

      {/* Actions */}
      <View style={[S.actions, { paddingBottom: bottomPad + 12 }]}>
        <Pressable
          onPress={() => router.replace("/scan")}
          style={({ pressed }) => [S.primaryBtn, { opacity: pressed ? 0.85 : 1 }]}
        >
          <MaterialCommunityIcons name="barcode-scan" size={18} color="#000" />
          <Text style={S.primaryBtnText}>LOG &amp; NEXT</Text>
        </Pressable>
        <Pressable
          onPress={() => router.replace("/")}
          style={({ pressed }) => [S.secondaryBtn, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={S.secondaryBtnText}>REPORT DEFECT</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

function ReceiptRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={S.receiptRow}>
      <Text style={S.receiptLabel}>{label}</Text>
      <Text style={[S.receiptValue, { color: valueColor ?? "#E8E8E8" }]} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0f0f0f" },
  topBar: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, height: 56,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#1f1f1f",
  },
  topBarTitle: { color: "#E8E8E8", fontSize: 16, fontFamily: "Rajdhani_600SemiBold", letterSpacing: 2 },
  closeBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  resultBlock: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#1f1f1f",
  },
  resultLabel: { fontSize: 52, fontFamily: "Rajdhani_700Bold", letterSpacing: 4, lineHeight: 56 },
  resultSub: { fontSize: 14, fontFamily: "Rajdhani_400Regular", marginTop: 4, opacity: 0.7 },
  receipt: { flex: 1 },
  receiptRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#1a1a1a",
  },
  receiptLabel: { color: "#555", fontSize: 13, fontFamily: "Rajdhani_400Regular" },
  receiptValue: { fontSize: 14, fontFamily: "Rajdhani_600SemiBold", textAlign: "right", maxWidth: "60%" },
  actions: { paddingHorizontal: 16, paddingTop: 14, gap: 10 },
  primaryBtn: {
    height: 60, backgroundColor: "#F5C518", borderRadius: 4,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
  },
  primaryBtnText: { color: "#000", fontSize: 18, fontFamily: "Rajdhani_700Bold", letterSpacing: 2 },
  secondaryBtn: {
    height: 60, borderRadius: 4, borderWidth: 1, borderColor: "#2a2a2a",
    alignItems: "center", justifyContent: "center",
  },
  secondaryBtnText: { color: "#555", fontSize: 14, fontFamily: "Rajdhani_500Medium", letterSpacing: 1 },
});
