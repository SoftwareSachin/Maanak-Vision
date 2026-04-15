import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import type { InspectionResult } from "@/context/InspectionContext";

interface Props {
  result: InspectionResult;
  size?: "sm" | "lg";
}

const LABELS: Record<InspectionResult, string> = {
  pass: "PASS",
  fail: "FAIL",
  warning: "CAUTION",
};

export default function StatusBadge({ result, size = "sm" }: Props) {
  const colors = useColors();

  const bg =
    result === "pass"
      ? colors.passBackground
      : result === "fail"
      ? colors.failBackground
      : colors.warningBackground;

  const fg =
    result === "pass"
      ? colors.pass
      : result === "fail"
      ? colors.fail
      : colors.warning;

  const fontSize = size === "lg" ? 22 : 13;
  const paddingH = size === "lg" ? 20 : 10;
  const paddingV = size === "lg" ? 10 : 4;

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bg, paddingHorizontal: paddingH, paddingVertical: paddingV },
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: fg, fontSize, letterSpacing: size === "lg" ? 3 : 1.5 },
        ]}
      >
        {LABELS[result]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  label: {
    fontWeight: "800",
  },
});
