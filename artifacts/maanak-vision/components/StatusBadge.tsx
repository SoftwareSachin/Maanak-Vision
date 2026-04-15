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
  const fontSize = size === "lg" ? 18 : 11;
  const paddingH = size === "lg" ? 16 : 10;
  const paddingV = size === "lg" ? 6 : 4;
  return (
    <View style={[styles.pill, { backgroundColor: BG[result], paddingHorizontal: paddingH, paddingVertical: paddingV }]}>
      <Text style={[styles.text, { fontSize, letterSpacing: size === "lg" ? 2 : 0.8 }]}>
        {LABELS[result]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { borderRadius: 20, alignSelf: "flex-start" },
  text: { color: "#fff", fontFamily: "Rajdhani_700Bold" },
});
