import React from "react";
import { StyleSheet, Text, View } from "react-native";
import C from "@/constants/colors";
import type { InspectionResult } from "@/context/InspectionContext";

interface Props {
  result: InspectionResult;
  size?: "sm" | "lg";
}

// Filled tonal chips — solid background, high contrast text, no borders
const CONFIG: Record<InspectionResult, { bg: string; text: string; label: string }> = {
  pass:    { bg: C.passContainer,  text: C.onPassContainer,  label: "PASS"    },
  fail:    { bg: C.failContainer,  text: C.onFailContainer,  label: "FAIL"    },
  warning: { bg: C.warnContainer,  text: C.onWarnContainer,  label: "CAUTION" },
};

export default function StatusBadge({ result, size = "sm" }: Props) {
  const cfg = CONFIG[result];
  const isLg = size === "lg";
  return (
    <View style={[
      styles.chip,
      {
        backgroundColor: cfg.bg,
        paddingHorizontal: isLg ? 14 : 10,
        paddingVertical: isLg ? 6 : 4,
        borderRadius: C.radiusSm,
      },
    ]}>
      <Text style={[
        styles.label,
        {
          color: cfg.text,
          fontSize: isLg ? 13 : 11,
          letterSpacing: isLg ? 1 : 0.8,
        },
      ]}>
        {cfg.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: "flex-start",
  },
  label: {
    fontFamily: "Rajdhani_700Bold",
  },
});
