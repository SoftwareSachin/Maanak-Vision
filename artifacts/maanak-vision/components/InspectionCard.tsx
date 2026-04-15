import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { Inspection } from "@/context/InspectionContext";
import { F } from "@/constants/fonts";

interface Props {
  inspection: Inspection;
}

function timeStr(ts: number) {
  return new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}
function dateStr(ts: number) {
  const d = new Date(ts);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export default function InspectionCard({ inspection }: Props) {
  const badgeBg =
    inspection.result === "pass" ? "#22C55E" : inspection.result === "fail" ? "#EF4444" : "#F59E0B";
  const defect =
    inspection.defects[0]?.type !== "none"
      ? inspection.defects[0]?.type.replace(/_/g, " ")
      : null;
  const iconName =
    inspection.result === "pass" ? "check" : inspection.result === "fail" ? "x" : "alert-triangle";
  const iconBg =
    inspection.result === "pass" ? "#0D2E18" : inspection.result === "fail" ? "#2E0D0D" : "#2E1A00";

  return (
    <View style={styles.row}>
      {/* Left: 40x40 icon */}
      <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
        <Feather name={iconName as any} size={16} color={badgeBg} />
      </View>

      {/* Center: name + meta */}
      <View style={styles.center}>
        <Text style={styles.name} numberOfLines={1}>
          {inspection.productName}
        </Text>
        <Text style={styles.meta}>
          {dateStr(inspection.timestamp)} {timeStr(inspection.timestamp)}
          {defect ? `  ·  ${defect}` : ""}
        </Text>
      </View>

      {/* Right: badge */}
      <View style={[styles.badge, { backgroundColor: badgeBg }]}>
        <Text style={styles.badgeText}>
          {inspection.result === "pass" ? "PASS" : inspection.result === "fail" ? "FAIL" : "WARN"}
        </Text>
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
    borderBottomColor: "#2a2a2a",
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  center: { flex: 1, gap: 2 },
  name: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "Rajdhani_500Medium",
    letterSpacing: 0.3,
  },
  meta: {
    color: "#6B6B6B",
    fontSize: 12,
    fontFamily: "Rajdhani_400Regular",
    textTransform: "capitalize",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "Rajdhani_700Bold",
    letterSpacing: 0.8,
  },
});
