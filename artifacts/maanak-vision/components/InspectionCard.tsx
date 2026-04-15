import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import StatusBadge from "./StatusBadge";
import type { Inspection } from "@/context/InspectionContext";
import { useColors } from "@/hooks/useColors";

interface Props {
  inspection: Inspection;
}

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(ts: number) {
  const d = new Date(ts);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function InspectionCard({ inspection }: Props) {
  const colors = useColors();

  const borderColor =
    inspection.result === "pass"
      ? colors.pass
      : inspection.result === "fail"
      ? colors.fail
      : colors.warning;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderLeftColor: borderColor,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.top}>
        <View style={styles.titleRow}>
          <Feather name="cpu" size={14} color={colors.mutedForeground} />
          <Text style={[styles.productName, { color: colors.foreground }]}>
            {inspection.productName}
          </Text>
        </View>
        <StatusBadge result={inspection.result} />
      </View>

      <View style={styles.meta}>
        <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
          {formatDate(inspection.timestamp)} · {formatTime(inspection.timestamp)}
        </Text>
        {inspection.defects.length > 0 && inspection.defects[0].type !== "none" && (
          <View style={styles.defectRow}>
            <Feather name="alert-triangle" size={12} color={colors.warning} />
            <Text style={[styles.defectText, { color: colors.warning }]}>
              {inspection.defects.map((d) => d.type.replace("_", " ")).join(", ")}
            </Text>
          </View>
        )}
      </View>

      {inspection.bisCompliant && (
        <View style={styles.bisRow}>
          <Feather name="shield" size={12} color={colors.pass} />
          <Text style={[styles.bisText, { color: colors.pass }]}>BIS 2026 Compliant</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
    flex: 1,
  },
  meta: {
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    fontWeight: "500",
  },
  defectRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  defectText: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  bisRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  bisText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
