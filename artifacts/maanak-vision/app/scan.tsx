import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useInspection } from "@/context/InspectionContext";
import { useTraining } from "@/context/TrainingContext";
import { useColors } from "@/hooks/useColors";
import type { DefectDetail, InspectionResult } from "@/context/InspectionContext";

const DEFECT_POOL: DefectDetail[] = [
  { type: "crack", severity: "high", description: "Surface crack detected at edge" },
  { type: "scratch", severity: "medium", description: "Linear scratch on face surface" },
  { type: "colour_mismatch", severity: "low", description: "Colour deviation from reference" },
  { type: "dimensional", severity: "high", description: "Dimension outside tolerance range" },
];

function simulateInspection(): { result: InspectionResult; defects: DefectDetail[] } {
  const rand = Math.random();
  if (rand > 0.75) {
    const defect = DEFECT_POOL[Math.floor(Math.random() * DEFECT_POOL.length)];
    const result: InspectionResult = defect.severity === "high" ? "fail" : "warning";
    return { result, defects: [defect] };
  }
  return {
    result: "pass",
    defects: [{ type: "none", severity: "low", description: "No defects detected" }],
  };
}

export default function ScanScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { activeProduct } = useTraining();
  const { currentBatch, addInspection, activeBatchId } = useInspection();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [guideOpacity] = useState(new Animated.Value(1));
  const [voiceActive, setVoiceActive] = useState(false);
  const flashAnim = useRef(new Animated.Value(0)).current;
  const [resultColor, setResultColor] = useState("transparent");
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(guideOpacity, { toValue: 0.4, duration: 900, useNativeDriver: true }),
        Animated.timing(guideOpacity, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const triggerFlash = useCallback(
    (result: InspectionResult) => {
      const flashColor =
        result === "pass" ? "#30D15830" : result === "fail" ? "#FF3B3040" : "#FF9F0A30";
      setResultColor(flashColor);
      Animated.sequence([
        Animated.timing(flashAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
        Animated.timing(flashAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start(() => setResultColor("transparent"));
    },
    [flashAnim]
  );

  const handleCapture = useCallback(async () => {
    if (scanning) return;
    setScanning(true);

    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    await new Promise((r) => setTimeout(r, 800));

    const { result, defects } = simulateInspection();

    if (Platform.OS !== "web") {
      if (result === "fail") {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else if (result === "pass") {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }

    triggerFlash(result);

    const inspection = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      productName: activeProduct?.name ?? currentBatch?.productName ?? "Unknown Part",
      result,
      defects,
      timestamp: Date.now(),
      batchId: activeBatchId ?? "no-batch",
      bisCompliant: result === "pass",
    };

    addInspection(inspection);
    setScanning(false);

    router.replace({
      pathname: "/result",
      params: {
        result,
        productName: inspection.productName,
        defectType: defects[0]?.type ?? "none",
        defectDesc: defects[0]?.description ?? "",
        inspectionId: inspection.id,
      },
    });
  }, [scanning, activeProduct, currentBatch, activeBatchId, addInspection, triggerFlash]);

  if (!permission) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Feather name="camera-off" size={48} color={colors.mutedForeground} />
        <Text style={[styles.permText, { color: colors.foreground }]}>
          Camera access needed
        </Text>
        <Pressable
          onPress={requestPermission}
          style={[styles.permBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.permBtnText, { color: colors.primaryForeground }]}>
            ALLOW CAMERA
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: "#000" }]}>
      {isWeb ? (
        <View style={[styles.webCameraPlaceholder, { backgroundColor: "#111" }]}>
          <Feather name="camera" size={60} color="#333" />
          <Text style={{ color: "#444", marginTop: 12, fontSize: 14 }}>
            Camera preview available on device
          </Text>
        </View>
      ) : (
        <CameraView style={StyleSheet.absoluteFill} facing="back" />
      )}

      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: resultColor, opacity: flashAnim },
        ]}
        pointerEvents="none"
      />

      <View style={[styles.topBar, { paddingTop: topPad + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backBtn,
            { backgroundColor: "rgba(0,0,0,0.5)", opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Feather name="x" size={22} color="#fff" />
        </Pressable>
        <View style={styles.topCenter}>
          <Text style={styles.scanTitle}>GUIDED SCAN</Text>
          {currentBatch && (
            <Text style={styles.batchLabel} numberOfLines={1}>
              {currentBatch.productName}
            </Text>
          )}
        </View>
        <Pressable
          onPress={() => setVoiceActive((v) => !v)}
          style={({ pressed }) => [
            styles.voiceBtn,
            {
              backgroundColor: voiceActive ? "#F5C518" : "rgba(0,0,0,0.5)",
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Feather name="mic" size={20} color={voiceActive ? "#1C1C1E" : "#fff"} />
        </Pressable>
      </View>

      <View style={styles.viewfinderArea}>
        <Animated.View style={[styles.cornerTL, { opacity: guideOpacity }]} />
        <Animated.View style={[styles.cornerTR, { opacity: guideOpacity }]} />
        <Animated.View style={[styles.cornerBL, { opacity: guideOpacity }]} />
        <Animated.View style={[styles.cornerBR, { opacity: guideOpacity }]} />
        <Text style={styles.viewfinderHint}>
          {scanning ? "ANALYSING..." : "POSITION PART INSIDE FRAME"}
        </Text>
      </View>

      {voiceActive && (
        <View style={styles.voiceBanner}>
          <Feather name="mic" size={14} color="#F5C518" />
          <Text style={styles.voiceBannerText}>
            Voice active · Say "Scan karo" or "Check karo"
          </Text>
        </View>
      )}

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + (isWeb ? 34 : 16) }]}>
        <View style={styles.scanStats}>
          <View style={styles.scanStatItem}>
            <Text style={styles.scanStatNum}>
              {currentBatch?.totalParts ?? 0}
            </Text>
            <Text style={styles.scanStatLabel}>SCANNED</Text>
          </View>
          <View style={styles.scanStatItem}>
            <Text style={[styles.scanStatNum, { color: "#30D158" }]}>
              {currentBatch?.passed ?? 0}
            </Text>
            <Text style={styles.scanStatLabel}>PASS</Text>
          </View>
          <View style={styles.scanStatItem}>
            <Text style={[styles.scanStatNum, { color: "#FF3B30" }]}>
              {currentBatch?.failed ?? 0}
            </Text>
            <Text style={styles.scanStatLabel}>FAIL</Text>
          </View>
        </View>

        <Pressable
          onPress={handleCapture}
          disabled={scanning}
          style={({ pressed }) => [
            styles.captureBtn,
            {
              backgroundColor: scanning ? "#555" : "#F5C518",
              opacity: pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.94 : 1 }],
            },
          ]}
        >
          {scanning ? (
            <ActivityIndicator color="#1C1C1E" size="large" />
          ) : (
            <Feather name="zap" size={32} color="#1C1C1E" />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const CORNER_SIZE = 28;
const CORNER_THICKNESS = 4;
const CORNER_COLOR = "#F5C518";

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  permText: {
    fontSize: 18,
    fontWeight: "700",
  },
  permBtn: {
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 8,
  },
  permBtnText: {
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  webCameraPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingBottom: 12,
    justifyContent: "space-between",
    zIndex: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  topCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 12,
  },
  scanTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 3,
  },
  batchLabel: {
    color: "#F5C518",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  voiceBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  viewfinderArea: {
    flex: 1,
    marginHorizontal: 40,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  cornerTL: {
    position: "absolute",
    top: 40,
    left: 0,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderColor: CORNER_COLOR,
  },
  cornerTR: {
    position: "absolute",
    top: 40,
    right: 0,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderColor: CORNER_COLOR,
  },
  cornerBL: {
    position: "absolute",
    bottom: 40,
    left: 0,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderColor: CORNER_COLOR,
  },
  cornerBR: {
    position: "absolute",
    bottom: 40,
    right: 0,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderColor: CORNER_COLOR,
  },
  viewfinderHint: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.5,
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  voiceBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.7)",
    marginHorizontal: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#F5C518",
    marginBottom: 8,
  },
  voiceBannerText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  bottomBar: {
    alignItems: "center",
    paddingTop: 12,
    paddingHorizontal: 24,
    gap: 20,
  },
  scanStats: {
    flexDirection: "row",
    gap: 32,
  },
  scanStatItem: {
    alignItems: "center",
  },
  scanStatNum: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
  },
  scanStatLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  captureBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#F5C518",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    marginBottom: 16,
  },
});
