import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { Inspection } from "@/context/InspectionContext";

interface Props {
  inspection: Inspection;
}

function timeStr(ts: number) {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}
function dateStr(ts: number) {
  const d = new Date(ts);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

const DEFECT_LABEL: Record<string, string> = {
  crack: "Crack",
  scratch: "Scratch",
  colour_mismatch: "Colour",
  dimensional: "Dim. error",
  none: "",
};

const RESULT_ICON: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  pass: "check-bold",
  fail: "close-thick",
  warning: "alert",
};
const RESULT_BG: Record<string, string> = {
  pass: "#052210",
  fail: "#1f0404",
  warning: "#1f1100",
};
const RESULT_COLOR: Record<string, string> = {
  pass: "#22C55E",
  fail: "#EF4444",
  warning: "#F59E0B",
};
const BADGE_LABEL: Record<string, string> = {
  pass: "PASS",
  fail: "FAIL",
  warning: "WARN",
};

export default function InspectionCard({ inspection }: Props) {
  const { result, productName, defects, timestamp } = inspection;
  const defect = defects[0]?.type !== "none" ? defects[0]?.type : null;
  const iconBg = RESULT_BG[result];
  const iconColor = RESULT_COLOR[result];
  const badgeBg = RESULT_COLOR[result];

  return (
    <View style={styles.row}>
      {/* Left: 36×36 result icon */}
      <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
        <MaterialCommunityIcons
          name={RESULT_ICON[result]}
          size={15}
          color={iconColor}
        />
      </View>

      {/* Center */}
      <View style={styles.center}>
        <Text style={styles.name} numberOfLines={1}>{productName}</Text>
        <Text style={styles.meta}>
          {dateStr(timestamp)} {timeStr(timestamp)}
          {defect ? `  ·  ${DEFECT_LABEL[defect] ?? defect}` : ""}
        </Text>
      </View>

      {/* Right: filled pill badge */}
      <View style={[styles.badge, { backgroundColor: badgeBg }]}>
        <Text style={styles.badgeText}>{BADGE_LABEL[result]}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#1f1f1f",
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  center: { flex: 1, gap: 2 },
  name: {
    color: "#E8E8E8",
    fontSize: 15,
    fontFamily: "Rajdhani_500Medium",
    letterSpacing: 0.2,
  },
  meta: {
    color: "#555",
    fontSize: 11,
    fontFamily: "Rajdhani_400Regular",
  },
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 3,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "Rajdhani_700Bold",
    letterSpacing: 1,
  },
});
