import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { InspectionResult } from "@/context/InspectionContext";

export default function ResultScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    result: InspectionResult;
    productName: string;
    defectType: string;
    defectDesc: string;
  }>();
  const result = params.result ?? "pass";
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom;

  const [phase, setPhase] = useState<"flash" | "card">("flash");
  const flashOpacity = useRef(new Animated.Value(1)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;

  const resultColor =
    result === "pass" ? "#22C55E" : result === "fail" ? "#EF4444" : "#F59E0B";
  const resultBg =
    result === "pass" ? "#0D2E18" : result === "fail" ? "#2E0D0D" : "#2E1A00";
  const resultLabel =
    result === "pass" ? "PASS" : result === "fail" ? "FAIL" : "CAUTION";
  const resultMsg =
    result === "pass"
      ? "Part meets all quality standards"
      : result === "fail"
      ? "Defect detected — remove from batch"
      : "Minor issue — inspect manually";
  const hasDefect =
    params.defectType && params.defectType !== "none";

  useEffect(() => {
    if (Platform.OS !== "web") {
      if (result === "fail") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }

    // Flash for 400ms, then transition to card
    const t = setTimeout(() => {
      Animated.timing(flashOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        setPhase("card");
        Animated.timing(cardAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      });
    }, 400);

    return () => clearTimeout(t);
  }, []);

  if (phase === "flash") {
    return (
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: resultColor, opacity: flashOpacity }]}
      />
    );
  }

  return (
    <Animated.View
      style={[styles.container, { opacity: cardAnim }]}
    >
      {/* Result header block */}
      <View style={[styles.resultHeader, { backgroundColor: resultBg, paddingTop: topPad + 16 }]}>
        <Text style={[styles.resultLabel, { color: resultColor }]}>{resultLabel}</Text>
        <Text style={[styles.resultMsg, { color: resultColor }]}>{resultMsg}</Text>
      </View>

      {/* Detail rows — tight like a receipt */}
      <View style={styles.rows}>
        <Row label="PRODUCT" value={params.productName ?? "Unknown"} />
        {hasDefect && (
          <Row label="DEFECT" value={(params.defectType ?? "").replace(/_/g, " ").toUpperCase()} valueColor="#F59E0B" />
        )}
        {hasDefect && params.defectDesc && (
          <Row label="DETAIL" value={params.defectDesc} />
        )}
        <Row
          label="BIS STATUS"
          value={result === "pass" ? "COMPLIANT" : "NON-COMPLIANT"}
          valueColor={result === "pass" ? "#22C55E" : "#EF4444"}
        />
        <Row
          label="TIME"
          value={new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        />
      </View>

      {/* Actions */}
      <View style={[styles.actions, { paddingBottom: bottomPad + 12 }]}>
        <Pressable
          onPress={() => router.replace("/scan")}
          style={({ pressed }) => [styles.primaryBtn, { opacity: pressed ? 0.85 : 1 }]}
        >
          <Feather name="zap" size={18} color="#1C1C1E" />
          <Text style={styles.primaryBtnText}>LOG &amp; NEXT</Text>
        </Pressable>
        <Pressable
          onPress={() => router.replace("/")}
          style={({ pressed }) => [styles.secondaryBtn, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={styles.secondaryBtnText}>BACK TO HOME</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

function Row({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, { color: valueColor ?? "#F0F0F0" }]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  resultHeader: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  resultLabel: {
    fontSize: 56,
    fontWeight: "900",
    letterSpacing: 6,
    marginBottom: 6,
  },
  resultMsg: {
    fontSize: 15,
    fontWeight: "600",
    opacity: 0.75,
    letterSpacing: 0.2,
  },
  rows: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A1A",
  },
  rowLabel: {
    color: "#444",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "right",
    maxWidth: "65%",
    textTransform: "capitalize",
  },
  actions: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 10,
  },
  primaryBtn: {
    backgroundColor: "#F5C518",
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 18,
    minHeight: 60,
  },
  primaryBtnText: {
    color: "#1C1C1E",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 2,
  },
  secondaryBtn: {
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryBtnText: {
    color: "#444",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
});
