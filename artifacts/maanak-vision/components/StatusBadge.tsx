import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { InspectionResult } from "@/context/InspectionContext";

interface Props {
  result: InspectionResult;
  size?: "sm" | "lg";
}

const BG: Record<InspectionResult, string> = {
  pass: "#22C55E",
  fail: "#EF4444",
  warning: "#F59E0B",
};
const LABELS: Record<InspectionResult, string> = {
  pass: "PASS",
  fail: "FAIL",
  warning: "WARN",
};

export default function StatusBadge({ result, size = "sm" }: Props) {
  const isLg = size === "lg";
  return (
    <View style={[
      styles.badge,
      {
        backgroundColor: BG[result],
        paddingHorizontal: isLg ? 14 : 9,
        paddingVertical: isLg ? 5 : 3,
        borderRadius: 3,
      },
    ]}>
      <Text style={[styles.text, { fontSize: isLg ? 16 : 10, letterSpacing: isLg ? 1.5 : 1 }]}>
        {LABELS[result]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: "flex-start" },
  text: { color: "#fff", fontFamily: "Rajdhani_700Bold" },
});
