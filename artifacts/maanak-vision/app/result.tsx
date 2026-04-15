import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { InspectionResult } from "@/context/InspectionContext";

export default function ResultScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ result: InspectionResult; productName: string; defectType: string; defectDesc: string }>();
  const result = params.result ?? "pass";
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom;

  const [phase, setPhase] = useState<"flash" | "card">("flash");
  const flashRef = useRef(new Animated.Value(1)).current;
  const cardRef = useRef(new Animated.Value(0)).current;

  const statusColor = result === "pass" ? "#22C55E" : result === "fail" ? "#EF4444" : "#F59E0B";
  const statusBg = result === "pass" ? "#0D2E18" : result === "fail" ? "#2E0D0D" : "#2E1A00";
  const hasDefect = params.defectType && params.defectType !== "none";

  useEffect(() => {
    if (Platform.OS !== "web") {
      result === "fail"
        ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    // 400ms full-screen flash, then card
    const t = setTimeout(() => {
      Animated.timing(flashRef, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
        setPhase("card");
        Animated.timing(cardRef, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      });
    }, 400);
    return () => clearTimeout(t);
  }, []);

  if (phase === "flash") {
    return <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: statusColor, opacity: flashRef }]} />;
  }

  return (
    <Animated.View style={[S.root, { opacity: cardRef }]}>
      {/* TOP BAR */}
      <View style={[S.topBar, { paddingTop: topPad + 8 }]}>
        <Text style={S.topTitle}>RESULT</Text>
        <Pressable onPress={() => router.replace("/")} style={S.closeBtn}>
          <Feather name="x" size={20} color="#6B6B6B" />
        </Pressable>
      </View>

      {/* RESULT BLOCK */}
      <View style={[S.resultBlock, { backgroundColor: statusBg }]}>
        <View style={{ flex: 1 }}>
          <Text style={[S.resultLabel, { color: statusColor }]}>
            {result === "pass" ? "PASS" : result === "fail" ? "FAIL" : "CAUTION"}
          </Text>
          <Text style={S.resultSub}>
            {result === "pass"
              ? "No defects found"
              : hasDefect
              ? (params.defectType ?? "").replace(/_/g, " ")
              : "Inspect manually"}
          </Text>
        </View>
        {/* Part thumbnail placeholder — 80x80dp square */}
        <View style={[S.thumb, { backgroundColor: statusBg, borderColor: statusColor }]}>
          <Feather
            name={result === "pass" ? "check" : result === "fail" ? "x" : "alert-triangle"}
            size={28}
            color={statusColor}
          />
        </View>
      </View>

      {/* RECEIPT — left label, right value, repeated */}
      <View style={S.receipt}>
        <ReceiptRow label="Product" value={params.productName ?? "Unknown"} />
        {hasDefect && (
          <ReceiptRow
            label="Defect"
            value={(params.defectType ?? "").replace(/_/g, " ").toUpperCase()}
            valueColor="#F59E0B"
          />
        )}
        {hasDefect && params.defectDesc ? (
          <ReceiptRow label="Detail" value={params.defectDesc} />
        ) : null}
        <ReceiptRow
          label="BIS Status"
          value={result === "pass" ? "COMPLIANT" : "NON-COMPLIANT"}
          valueColor={result === "pass" ? "#22C55E" : "#EF4444"}
        />
        <ReceiptRow
          label="Check time"
          value={new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        />
        <ReceiptRow label="Defects found" value={hasDefect ? "1 (surface)" : "0"} />
      </View>

      {/* ACTIONS */}
      <View style={[S.actions, { paddingBottom: bottomPad + 12 }]}>
        <Pressable
          onPress={() => router.replace("/scan")}
          style={({ pressed }) => [S.primaryBtn, { opacity: pressed ? 0.85 : 1 }]}
        >
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
      <Text style={[S.receiptValue, { color: valueColor ?? "#FFFFFF" }]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0f0f0f" },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#2a2a2a",
  },
  topTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "Rajdhani_600SemiBold",
    letterSpacing: 1.5,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  resultBlock: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#2a2a2a",
  },
  resultLabel: {
    fontSize: 52,
    fontFamily: "Rajdhani_700Bold",
    letterSpacing: 4,
    lineHeight: 56,
  },
  resultSub: {
    color: "#A1A1A0",
    fontSize: 15,
    fontFamily: "Rajdhani_400Regular",
    marginTop: 2,
    textTransform: "capitalize",
  },
  thumb: {
    width: 80,
    height: 80,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  receipt: { flex: 1 },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#1a1a1a",
  },
  receiptLabel: {
    color: "#6B6B6B",
    fontSize: 14,
    fontFamily: "Rajdhani_400Regular",
  },
  receiptValue: {
    fontSize: 14,
    fontFamily: "Rajdhani_600SemiBold",
    textAlign: "right",
    maxWidth: "60%",
    textTransform: "capitalize",
  },
  actions: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 10,
  },
  primaryBtn: {
    height: 60,
    backgroundColor: "#F5C518",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    color: "#000",
    fontSize: 18,
    fontFamily: "Rajdhani_700Bold",
    letterSpacing: 2,
  },
  secondaryBtn: {
    height: 60,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#F5C518",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: {
    color: "#F5C518",
    fontSize: 16,
    fontFamily: "Rajdhani_500Medium",
    letterSpacing: 1,
  },
});
