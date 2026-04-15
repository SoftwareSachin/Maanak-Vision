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
  badgeBg: string;
  badgeText: string;
  badgeLabel: string;
}> = {
  pass: {
    icon:        "check-circle",
    iconColor:   C.pass,
    containerBg: C.passContainer,
    badgeBg:     C.passContainer,
    badgeText:   C.onPassContainer,
    badgeLabel:  "PASS",
  },
  fail: {
    icon:        "alert-circle",
    iconColor:   C.fail,
    containerBg: C.failContainer,
    badgeBg:     C.failContainer,
    badgeText:   C.onFailContainer,
    badgeLabel:  "FAIL",
  },
  warning: {
    icon:        "alert",
    iconColor:   C.warn,
    containerBg: C.warnContainer,
    badgeBg:     C.warnContainer,
    badgeText:   C.onWarnContainer,
    badgeLabel:  "CAUTION",
  },
};

export default function InspectionCard({ inspection }: Props) {
  const { result, productName, defects, timestamp } = inspection;
  const defect = defects[0]?.type !== "none" ? defects[0]?.type : null;
  const cfg = RESULT_CONFIG[result] ?? RESULT_CONFIG.pass;

  return (
    <View style={S.item}>
      {/* Leading: filled tonal icon container — 48dp */}
      <View style={[S.leading, { backgroundColor: cfg.containerBg }]}>
        <MaterialCommunityIcons name={cfg.icon} size={22} color={cfg.iconColor} />
      </View>

      {/* Body text */}
      <View style={S.body}>
        <Text style={S.headline} numberOfLines={1}>{productName}</Text>
        <Text style={S.supporting} numberOfLines={1}>
          {dateStr(timestamp)} · {timeStr(timestamp)}
          {defect ? `  ·  ${DEFECT_LABEL[defect] ?? defect}` : ""}
        </Text>
      </View>

      {/* Trailing: filled tonal badge */}
      <View style={[S.badge, { backgroundColor: cfg.badgeBg }]}>
        <Text style={[S.badgeText, { color: cfg.badgeText }]}>{cfg.badgeLabel}</Text>
      </View>
    </View>
  );
}

const S = StyleSheet.create({
  item: {
    height: 72,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 0,
    gap: 14,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.outlineVariant,
  },
  leading: {
    width: 44,
    height: 44,
    borderRadius: C.radiusSm,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  headline: {
    color: C.onSurface,
    fontSize: 15,
    fontFamily: "Rajdhani_700Bold",
    letterSpacing: 0.1,
  },
  supporting: {
    color: C.onSurfaceVariant,
    fontSize: 12,
    fontFamily: "Rajdhani_500Medium",
    letterSpacing: 0.3,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: C.radiusSm,
    alignSelf: "center",
  },
  badgeText: {
    fontFamily: "Rajdhani_700Bold",
    fontSize: 11,
    letterSpacing: 0.8,
  },
});
