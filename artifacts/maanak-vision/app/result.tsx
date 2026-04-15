import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import type { InspectionResult } from "@/context/InspectionContext";

export default function ResultScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    result: InspectionResult;
    productName: string;
    defectType: string;
    defectDesc: string;
    inspectionId: string;
  }>();
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom;

  const result = params.result ?? "pass";
  const scaleAnim = React.useRef(new Animated.Value(0.5)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    if (Platform.OS !== "web") {
      if (result === "fail") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else if (result === "pass") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  }, []);

  const bgColor =
    result === "pass"
      ? colors.passBackground
      : result === "fail"
      ? colors.failBackground
      : colors.warningBackground;

  const accentColor =
    result === "pass"
      ? colors.pass
      : result === "fail"
      ? colors.fail
      : colors.warning;

  const iconName =
    result === "pass"
      ? "check-circle"
      : result === "fail"
      ? "x-circle"
      : "alert-circle";

  const resultLabel =
    result === "pass" ? "PASS" : result === "fail" ? "FAIL" : "CAUTION";

  const resultMessage =
    result === "pass"
      ? "Part meets all quality standards"
      : result === "fail"
      ? "Defect detected — remove from batch"
      : "Minor issue found — inspect manually";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.resultHeader,
          { backgroundColor: bgColor, paddingTop: topPad + 12 },
        ]}
      >
        <Animated.View
          style={{
            alignItems: "center",
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          }}
        >
          <Feather name={iconName} size={80} color={accentColor} />
          <Text style={[styles.resultLabel, { color: accentColor }]}>
            {resultLabel}
          </Text>
          <Text style={[styles.resultMessage, { color: accentColor }]}>
            {resultMessage}
          </Text>
        </Animated.View>
      </View>

      <View style={styles.detailSection}>
        <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <DetailRow
            icon="cpu"
            label="PRODUCT"
            value={params.productName ?? "Unknown Part"}
            colors={colors}
          />
          {params.defectType && params.defectType !== "none" && (
            <DetailRow
              icon="alert-triangle"
              label="DEFECT"
              value={params.defectType.replace(/_/g, " ").toUpperCase()}
              valueColor={accentColor}
              colors={colors}
            />
          )}
          {params.defectDesc && params.defectDesc !== "" && params.defectType !== "none" && (
            <DetailRow
              icon="info"
              label="DETAIL"
              value={params.defectDesc}
              colors={colors}
            />
          )}
          <DetailRow
            icon="shield"
            label="BIS STATUS"
            value={result === "pass" ? "COMPLIANT" : "NON-COMPLIANT"}
            valueColor={result === "pass" ? colors.pass : colors.fail}
            colors={colors}
          />
          <DetailRow
            icon="clock"
            label="TIME"
            value={new Date().toLocaleTimeString("en-IN")}
            colors={colors}
          />
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={() => router.replace("/scan")}
            style={({ pressed }) => [
              styles.scanNextBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Feather name="zap" size={20} color={colors.primaryForeground} />
            <Text style={[styles.scanNextText, { color: colors.primaryForeground }]}>
              SCAN NEXT PART
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.replace("/")}
            style={({ pressed }) => [
              styles.doneBtn,
              {
                borderColor: colors.border,
                backgroundColor: colors.card,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Text style={[styles.doneBtnText, { color: colors.mutedForeground }]}>
              DONE
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function DetailRow({
  icon,
  label,
  value,
  valueColor,
  colors,
}: {
  icon: string;
  label: string;
  value: string;
  valueColor?: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
      <View style={styles.detailLeft}>
        <Feather name={icon as any} size={14} color={colors.mutedForeground} />
        <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
          {label}
        </Text>
      </View>
      <Text
        style={[
          styles.detailValue,
          { color: valueColor ?? colors.foreground },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  resultHeader: {
    paddingBottom: 36,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  resultLabel: {
    fontSize: 52,
    fontWeight: "900",
    letterSpacing: 8,
    marginTop: 12,
  },
  resultMessage: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 8,
    letterSpacing: 0.3,
    opacity: 0.8,
  },
  detailSection: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  detailCard: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  detailLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "700",
    maxWidth: "60%",
    textAlign: "right",
  },
  actions: {
    gap: 12,
  },
  scanNextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    borderRadius: 10,
    minHeight: 60,
  },
  scanNextText: {
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 2,
  },
  doneBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 56,
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 2,
  },
});
