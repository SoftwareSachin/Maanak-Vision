import { Feather } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
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
  const insets = useSafeAreaInsets();
  const { activeProduct } = useTraining();
  const { currentBatch, addInspection, activeBatchId } = useInspection();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState<"ready" | "scanning">("ready");
  const [voiceActive, setVoiceActive] = useState(false);
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const [flashColor, setFlashColor] = useState("transparent");
  const reticleAnim = useRef(new Animated.Value(1)).current;
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom;

  // Subtle reticle pulse — opacity only, no color change
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(reticleAnim, { toValue: 0.5, duration: 1000, useNativeDriver: true }),
        Animated.timing(reticleAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const triggerFlash = useCallback(
    (result: InspectionResult) => {
      const color =
        result === "pass" ? "rgba(34,197,94,0.35)" : result === "fail" ? "rgba(239,68,68,0.35)" : "rgba(245,158,11,0.25)";
      setFlashColor(color);
      Animated.sequence([
        Animated.timing(flashOpacity, { toValue: 1, duration: 60, useNativeDriver: true }),
        Animated.timing(flashOpacity, { toValue: 0, duration: 340, useNativeDriver: true }),
      ]).start(() => setFlashColor("transparent"));
    },
    [flashOpacity]
  );

  const handleCapture = useCallback(async () => {
    if (scanning) return;
    setScanning(true);
    setStatus("scanning");

    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    await new Promise((r) => setTimeout(r, 700));
    const { result, defects } = simulateInspection();

    if (Platform.OS !== "web") {
      if (result === "fail") {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
    setStatus("ready");

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
      <View style={styles.center}>
        <ActivityIndicator color="#F5C518" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Feather name="camera-off" size={40} color="#444" />
        <Text style={styles.permText}>Camera access needed</Text>
        <Pressable onPress={requestPermission} style={styles.permBtn}>
          <Text style={styles.permBtnText}>ALLOW CAMERA</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera — 70% of screen */}
      <View style={styles.cameraArea}>
        {isWeb ? (
          <View style={styles.webCamera}>
            <Feather name="camera" size={48} color="#222" />
          </View>
        ) : (
          <CameraView style={StyleSheet.absoluteFill} facing="back" />
        )}

        {/* Flash overlay */}
        <Animated.View
          style={[StyleSheet.absoluteFill, { backgroundColor: flashColor, opacity: flashOpacity }]}
          pointerEvents="none"
        />

        {/* Top bar over camera */}
        <View style={[styles.camTopBar, { paddingTop: topPad + 4 }]}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.camIconBtn, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Feather name="x" size={20} color="#fff" />
          </Pressable>

          <View style={styles.camTopCenter}>
            {currentBatch && (
              <Text style={styles.camBatchLabel} numberOfLines={1}>
                {currentBatch.productName}
              </Text>
            )}
          </View>

          <Pressable
            onPress={() => setVoiceActive((v) => !v)}
            style={({ pressed }) => [
              styles.camIconBtn,
              { backgroundColor: voiceActive ? "#F5C518" : "rgba(0,0,0,0.4)", opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Feather name="mic" size={18} color={voiceActive ? "#1C1C1E" : "#fff"} />
          </Pressable>
        </View>

        {/* Reticle — corner brackets only, no glow */}
        <Animated.View style={[styles.reticle, { opacity: reticleAnim }]} pointerEvents="none">
          <View style={styles.cornerTL} />
          <View style={styles.cornerTR} />
          <View style={styles.cornerBL} />
          <View style={styles.cornerBR} />
        </Animated.View>

        {/* Voice hint */}
        {voiceActive && (
          <View style={styles.voiceHint}>
            <Feather name="mic" size={12} color="#F5C518" />
            <Text style={styles.voiceHintText}>"Scan karo" · "Check karo" · "Band karo"</Text>
          </View>
        )}
      </View>

      {/* Bottom panel — 30% of screen, charcoal */}
      <View style={[styles.bottomPanel, { paddingBottom: bottomPad + 12 }]}>
        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatItem label="SCANNED" value={currentBatch?.totalParts ?? 0} color="#F0F0F0" />
          <View style={styles.statsDivider} />
          <StatItem label="PASS" value={currentBatch?.passed ?? 0} color="#22C55E" />
          <View style={styles.statsDivider} />
          <StatItem label="FAIL" value={currentBatch?.failed ?? 0} color="#EF4444" />
          <View style={styles.statsDivider} />
          <StatItem label="WARN" value={currentBatch?.warnings ?? 0} color="#F59E0B" />
        </View>

        {/* Status row */}
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: scanning ? "#F59E0B" : "#22C55E" }]} />
          <Text style={styles.statusText}>
            {scanning ? "ANALYSING PART..." : "POSITION PART IN FRAME · TAP TO SCAN"}
          </Text>
        </View>

        {/* Scan button — full width pill */}
        <Pressable
          onPress={handleCapture}
          disabled={scanning}
          style={({ pressed }) => [
            styles.scanBtn,
            { opacity: scanning ? 0.6 : pressed ? 0.85 : 1 },
          ]}
        >
          {scanning ? (
            <ActivityIndicator color="#1C1C1E" />
          ) : (
            <>
              <Feather name="zap" size={18} color="#1C1C1E" />
              <Text style={styles.scanBtnText}>SCAN PART</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function StatItem({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={{ alignItems: "center", flex: 1 }}>
      <Text style={{ color, fontSize: 20, fontWeight: "900" }}>{value}</Text>
      <Text style={{ color: "#444", fontSize: 9, fontWeight: "700", letterSpacing: 1.5 }}>{label}</Text>
    </View>
  );
}

const C = "#F5C518";
const THICK = 3;
const SZ = 22;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  center: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  permText: { color: "#F0F0F0", fontSize: 16, fontWeight: "700" },
  permBtn: {
    backgroundColor: "#F5C518",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 6,
  },
  permBtnText: { color: "#1C1C1E", fontSize: 14, fontWeight: "900", letterSpacing: 1.5 },
  cameraArea: {
    flex: 7,
    backgroundColor: "#000",
    overflow: "hidden",
  },
  webCamera: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0A0A0A",
    alignItems: "center",
    justifyContent: "center",
  },
  camTopBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  camIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  camTopCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  camBatchLabel: {
    color: "#F5C518",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 3,
  },
  reticle: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    margin: 48,
    justifyContent: "space-between",
  },
  cornerTL: {
    position: "absolute",
    top: 0,
    left: 0,
    width: SZ,
    height: SZ,
    borderTopWidth: THICK,
    borderLeftWidth: THICK,
    borderColor: C,
  },
  cornerTR: {
    position: "absolute",
    top: 0,
    right: 0,
    width: SZ,
    height: SZ,
    borderTopWidth: THICK,
    borderRightWidth: THICK,
    borderColor: C,
  },
  cornerBL: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: SZ,
    height: SZ,
    borderBottomWidth: THICK,
    borderLeftWidth: THICK,
    borderColor: C,
  },
  cornerBR: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: SZ,
    height: SZ,
    borderBottomWidth: THICK,
    borderRightWidth: THICK,
    borderColor: C,
  },
  voiceHint: {
    position: "absolute",
    bottom: 12,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#333",
  },
  voiceHintText: {
    color: "#aaa",
    fontSize: 12,
    fontWeight: "600",
  },
  bottomPanel: {
    flex: 3,
    backgroundColor: "#1C1C1E",
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 14,
    borderTopWidth: 1,
    borderTopColor: "#2A2A2A",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statsDivider: {
    width: 1,
    height: 28,
    backgroundColor: "#2A2A2A",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    color: "#666",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    flex: 1,
  },
  scanBtn: {
    backgroundColor: "#F5C518",
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 18,
    minHeight: 60,
  },
  scanBtnText: {
    color: "#1C1C1E",
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 2,
  },
});
