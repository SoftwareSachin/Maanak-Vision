import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import C from "@/constants/colors";
import type { Inspection } from "@/context/InspectionContext";

interface Props {
  inspection: Inspection;
}

function timeStr(ts: number) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function dateStr(ts: number) {
  const d = new Date(ts);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

const DEFECT_LABEL: Record<string, string> = {
  crack:           "Surface crack",
  scratch:         "Linear scratch",
  colour_mismatch: "Colour deviation",
  dimensional:     "Dimensional error",
  none:            "",
};

const RESULT_CONFIG: Record<string, {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor: string;
  containerBg: string;
  chipText: string;
  chipDot: string;
}> = {
  pass: {
    icon:        "check-circle-outline",
    iconColor:   C.pass,
    containerBg: C.passContainer,
    chipText:    "Pass",
    chipDot:     C.pass,
  },
  fail: {
    icon:        "alert-circle-outline",
    iconColor:   C.fail,
    containerBg: C.failContainer,
    chipText:    "Fail",
    chipDot:     C.fail,
  },
  warning: {
    icon:        "alert-outline",
    iconColor:   C.warn,
    containerBg: C.warnContainer,
    chipText:    "Caution",
    chipDot:     C.warn,
  },
};

export default function InspectionCard({ inspection }: Props) {
  const { result, productName, defects, timestamp } = inspection;
  const defect = defects[0]?.type !== "none" ? defects[0]?.type : null;
  const cfg = RESULT_CONFIG[result] ?? RESULT_CONFIG.pass;

  return (
    <View style={S.item}>
      {/* Leading tonal icon container */}
      <View style={[S.leading, { backgroundColor: cfg.containerBg }]}>
        <MaterialCommunityIcons name={cfg.icon} size={20} color={cfg.iconColor} />
      </View>

      {/* Text block */}
      <View style={S.body}>
        <Text style={S.headline} numberOfLines={1}>{productName}</Text>
        <Text style={S.supporting} numberOfLines={1}>
          {dateStr(timestamp)} · {timeStr(timestamp)}
          {defect ? `  ·  ${DEFECT_LABEL[defect] ?? defect}` : ""}
        </Text>
      </View>

      {/* Trailing: outlined status chip */}
      <View style={[S.chip, { borderColor: cfg.chipDot }]}>
        <View style={[S.chipDot, { backgroundColor: cfg.chipDot }]} />
        <Text style={[S.chipText, { color: cfg.chipDot }]}>{cfg.chipText}</Text>
      </View>
    </View>
  );
}

const S = StyleSheet.create({
  item: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 16,
    backgroundColor: C.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.outlineVariant,
  },
  leading: {
    width: 40,
    height: 40,
    borderRadius: C.radiusSm,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  body: {
    flex: 1,
    gap: 3,
  },
  headline: {
    color: C.onSurface,
    fontSize: 14,
    fontFamily: "Rajdhani_500Medium",
    letterSpacing: 0.15,
  },
  supporting: {
    color: C.onSurfaceVariant,
    fontSize: 12,
    fontFamily: "Rajdhani_400Regular",
    letterSpacing: 0.4,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: C.radiusFull,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  chipDot: {
    width: 5,
    height: 5,
    borderRadius: 99,
  },
  chipText: {
    fontFamily: "Rajdhani_600SemiBold",
    fontSize: 11,
    letterSpacing: 0.4,
  },
});
