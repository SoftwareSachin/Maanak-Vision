import React from "react";
import { StyleSheet, Text, View } from "react-native";
import C from "@/constants/colors";
import type { InspectionResult } from "@/context/InspectionContext";

interface Props {
  result: InspectionResult;
  size?: "sm" | "lg";
}

const CONFIG: Record<InspectionResult, { dot: string; border: string; text: string; label: string }> = {
  pass:    { dot: C.pass,  border: C.passContainer,  text: C.onPassContainer,  label: "Pass"    },
  fail:    { dot: C.fail,  border: C.failContainer,  text: C.onFailContainer,  label: "Fail"    },
  warning: { dot: C.warn,  border: C.warnContainer,  text: C.onWarnContainer,  label: "Caution" },
};

export default function StatusBadge({ result, size = "sm" }: Props) {
  const cfg = CONFIG[result];
  const isLg = size === "lg";
  return (
    <View style={[
      styles.chip,
      {
        borderColor: cfg.dot,
        paddingHorizontal: isLg ? 12 : 8,
        paddingVertical: isLg ? 5 : 3,
        gap: isLg ? 6 : 4,
        borderRadius: C.radiusFull,
      },
    ]}>
      <View style={[styles.dot, { backgroundColor: cfg.dot, width: isLg ? 7 : 5, height: isLg ? 7 : 5 }]} />
      <Text style={[
        styles.label,
        {
          color: cfg.dot,
          fontSize: isLg ? 13 : 11,
          letterSpacing: isLg ? 0.5 : 0.4,
        },
      ]}>
        {cfg.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  dot: {
    borderRadius: 99,
  },
  label: {
    fontFamily: "Rajdhani_600SemiBold",
  },
});
