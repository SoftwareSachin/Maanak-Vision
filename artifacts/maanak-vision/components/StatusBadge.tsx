import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { InspectionResult } from "@/context/InspectionContext";

interface Props {
  result: InspectionResult;
  size?: "sm" | "lg";
}

const LABELS: Record<InspectionResult, string> = {
  pass: "PASS",
  fail: "FAIL",
  warning: "WARN",
};

const BG: Record<InspectionResult, string> = {
  pass: "#22C55E",
  fail: "#EF4444",
  warning: "#F59E0B",
};

export default function StatusBadge({ result, size = "sm" }: Props) {
  const fontSize = size === "lg" ? 20 : 11;
  const paddingH = size === "lg" ? 18 : 8;
  const paddingV = size === "lg" ? 8 : 3;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: BG[result],
          paddingHorizontal: paddingH,
          paddingVertical: paddingV,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          { fontSize, letterSpacing: size === "lg" ? 2 : 0.8 },
        ]}
      >
        {LABELS[result]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  label: {
    color: "#fff",
    fontWeight: "800",
  },
});
