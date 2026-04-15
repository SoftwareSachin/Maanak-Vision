import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { Inspection } from "@/context/InspectionContext";
import { useColors } from "@/hooks/useColors";

interface Props {
  inspection: Inspection;
}

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export default function InspectionCard({ inspection }: Props) {
  const colors = useColors();

  const badgeBg =
    inspection.result === "pass"
      ? "#22C55E"
      : inspection.result === "fail"
      ? "#EF4444"
      : "#F59E0B";

  const defectText =
    inspection.defects[0]?.type !== "none"
      ? inspection.defects[0]?.type.replace(/_/g, " ")
      : null;

  return (
    <View style={[styles.row, { borderBottomColor: "#2A2A2A" }]}>
      <View
        style={[
          styles.resultIcon,
          { backgroundColor: inspection.result === "pass" ? "#0D2E18" : inspection.result === "fail" ? "#2E0D0D" : "#2E1800" },
        ]}
      >
        <Feather
          name={inspection.result === "pass" ? "check" : inspection.result === "fail" ? "x" : "alert-triangle"}
          size={14}
          color={badgeBg}
        />
      </View>

      <View style={styles.center}>
        <Text style={[styles.productName, { color: "#F0F0F0" }]} numberOfLines={1}>
          {inspection.productName}
        </Text>
        <Text style={[styles.meta, { color: "#555" }]}>
          {formatTime(inspection.timestamp)}
          {defectText ? `  ·  ${defectText}` : ""}
        </Text>
      </View>

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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    gap: 12,
  },
  resultIcon: {
    width: 32,
    height: 32,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    flex: 1,
    gap: 2,
  },
  productName: {
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
  meta: {
    fontSize: 12,
    fontWeight: "500",
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
    fontWeight: "800",
    letterSpacing: 0.8,
  },
});
