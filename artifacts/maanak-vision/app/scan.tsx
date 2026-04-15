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

const DEFECTS: DefectDetail[] = [
  { type: "crack", severity: "high", description: "Surface crack detected at edge" },
  { type: "scratch", severity: "medium", description: "Linear scratch on face surface" },
  { type: "colour_mismatch", severity: "low", description: "Colour deviation from reference" },
  { type: "dimensional", severity: "high", description: "Dimension outside tolerance range" },
];

function runQC(): { result: InspectionResult; defects: DefectDetail[] } {
  const r = Math.random();
  if (r > 0.75) {
    const d = DEFECTS[Math.floor(Math.random() * DEFECTS.length)];
    return { result: d.severity === "high" ? "fail" : "warning", defects: [d] };
  }
  return { result: "pass", defects: [{ type: "none", severity: "low", description: "" }] };
}

export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const { activeProduct } = useTraining();
  const { currentBatch, addInspection, activeBatchId } = useInspection();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const flashRef = useRef(new Animated.Value(0)).current;
  const [flashColor, setFlashColor] = useState("transparent");
  const reticleRef = useRef(new Animated.Value(1)).current;
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(reticleRef, { toValue: 0.4, duration: 1100, useNativeDriver: true }),
        Animated.timing(reticleRef, { toValue: 1, duration: 1100, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const doFlash = useCallback((result: InspectionResult) => {
    const c = result === "pass" ? "rgba(34,197,94,0.4)" : result === "fail" ? "rgba(239,68,68,0.4)" : "rgba(245,158,11,0.3)";
    setFlashColor(c);
    Animated.sequence([
      Animated.timing(flashRef, { toValue: 1, duration: 50, useNativeDriver: true }),
      Animated.timing(flashRef, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start(() => setFlashColor("transparent"));
  }, [flashRef]);

  const handleScan = useCallback(async () => {
    if (scanning) return;
    setScanning(true);
    if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await new Promise((r) => setTimeout(r, 750));
    const { result, defects } = runQC();
    if (Platform.OS !== "web") {
      result === "fail"
        ? await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        : await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    doFlash(result);
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
      params: { result, productName: inspection.productName, defectType: defects[0]?.type ?? "none", defectDesc: defects[0]?.description ?? "" },
    });
  }, [scanning, activeProduct, currentBatch, activeBatchId, addInspection, doFlash]);

  if (!permission) return <View style={[S.fill, { backgroundColor: "#0f0f0f" }]}><ActivityIndicator color="#F5C518" /></View>;

  if (!permission.granted) {
    return (
      <View style={[S.fill, { backgroundColor: "#0f0f0f" }]}>
        <Feather name="camera-off" size={36} color="#2a2a2a" />
        <Text style={S.permText}>Camera access needed</Text>
        <Pressable onPress={requestPermission} style={S.permBtn}>
          <Text style={S.permBtnText}>ALLOW CAMERA</Text>
        </Pressable>
      </View>
    );
  }

  const batchLabel = currentBatch?.productName ?? activeProduct?.name;
  const partsLabel = currentBatch ? `${currentBatch.totalParts} PARTS` : null;

  return (
    <View style={[S.root, { backgroundColor: "#000" }]}>

      {/* CAMERA — 65% screen height */}
      <View style={S.cameraArea}>
        {isWeb ? (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "#0a0a0a", alignItems: "center", justifyContent: "center" }]}>
            <Feather name="camera" size={44} color="#1a1a1a" />
          </View>
        ) : (
          <CameraView style={StyleSheet.absoluteFill} facing="back" />
        )}

        {/* Full-screen flash */}
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: flashColor, opacity: flashRef }]}
        />

        {/* Top overlay — minimal text only */}
        <View style={[S.camTop, { paddingTop: topPad + 4 }]}>
          <Pressable onPress={() => router.back()} style={S.camCloseBtn}>
            <Feather name="x" size={18} color="rgba(255,255,255,0.7)" />
          </Pressable>
          <View style={S.camTopMeta}>
            {batchLabel && <Text style={S.camBatchLabel} numberOfLines={1}>{batchLabel}</Text>}
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            {partsLabel && <Text style={S.camPartsLabel}>{partsLabel}</Text>}
            <Pressable
              onPress={() => setVoiceActive((v) => !v)}
              style={[S.camMicBtn, { backgroundColor: voiceActive ? "#F5C518" : "rgba(0,0,0,0.3)" }]}
            >
              <Feather name="mic" size={15} color={voiceActive ? "#000" : "rgba(255,255,255,0.6)"} />
            </Pressable>
          </View>
        </View>

        {/* Reticle — corner brackets only, white, no fill, no glow */}
        <Animated.View style={[S.reticle, { opacity: reticleRef }]} pointerEvents="none">
          <View style={[S.c, S.cTL]} />
          <View style={[S.c, S.cTR]} />
          <View style={[S.c, S.cBL]} />
          <View style={[S.c, S.cBR]} />
        </Animated.View>

        {/* Voice hint */}
        {voiceActive && (
          <View style={S.voiceRow}>
            <Feather name="mic" size={12} color="#F5C518" />
            <Text style={S.voiceText}>या बोलें: "स्कैन करो" · "रोको"</Text>
          </View>
        )}
      </View>

      {/* BOTTOM PANEL — 35% screen, #1a1a1a */}
      <View style={[S.panel, { paddingBottom: bottomPad + 10 }]}>
        {/* Stats row */}
        <View style={S.statsRow}>
          <StatCol label="SCANNED" value={currentBatch?.totalParts ?? 0} color="#A1A1A0" />
          <View style={S.statDiv} />
          <StatCol label="PASS" value={currentBatch?.passed ?? 0} color="#22C55E" />
          <View style={S.statDiv} />
          <StatCol label="FAIL" value={currentBatch?.failed ?? 0} color="#EF4444" />
          <View style={S.statDiv} />
          <StatCol label="WARN" value={currentBatch?.warnings ?? 0} color="#F59E0B" />
        </View>

        {/* Status line */}
        <View style={S.statusLine}>
          <View style={[S.statusDot, { backgroundColor: scanning ? "#F59E0B" : "#22C55E" }]} />
          <Text style={S.statusText}>
            {scanning ? "ANALYSING..." : "POSITION PART IN FRAME"}
          </Text>
        </View>

        {/* SCAN PART — full width, 60dp, yellow */}
        <Pressable
          onPress={handleScan}
          disabled={scanning}
          style={({ pressed }) => [S.scanBtn, { opacity: scanning ? 0.55 : pressed ? 0.85 : 1 }]}
        >
          {scanning
            ? <ActivityIndicator color="#000" />
            : <Text style={S.scanBtnText}>SCAN PART</Text>
          }
        </Pressable>
      </View>
    </View>
  );
}

function StatCol({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Text style={{ color, fontSize: 22, fontFamily: "Rajdhani_700Bold" }}>{value}</Text>
      <Text style={{ color: "#6B6B6B", fontSize: 9, fontFamily: "Rajdhani_700Bold", letterSpacing: 1.2 }}>{label}</Text>
    </View>
  );
}

const THICK = 3;
const SZ = 20;

const S = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14 },
  permText: { color: "#A1A1A0", fontSize: 16, fontFamily: "Rajdhani_500Medium" },
  permBtn: { backgroundColor: "#F5C518", borderRadius: 6, paddingHorizontal: 24, height: 60, alignItems: "center", justifyContent: "center" },
  permBtnText: { color: "#000", fontSize: 18, fontFamily: "Rajdhani_700Bold", letterSpacing: 2 },
  cameraArea: { flex: 65, backgroundColor: "#000", overflow: "hidden" },
  camTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 12,
    paddingBottom: 8,
    justifyContent: "space-between",
  },
  camCloseBtn: {
    width: 36, height: 36, borderRadius: 4,
    backgroundColor: "rgba(0,0,0,0.3)", alignItems: "center", justifyContent: "center",
  },
  camTopMeta: { flex: 1, alignItems: "center", paddingHorizontal: 8, paddingTop: 8 },
  camBatchLabel: { color: "rgba(255,255,255,0.5)", fontSize: 12, fontFamily: "Rajdhani_500Medium", letterSpacing: 0.5 },
  camPartsLabel: { color: "rgba(255,255,255,0.4)", fontSize: 11, fontFamily: "Rajdhani_700Bold", letterSpacing: 1, paddingTop: 10 },
  camMicBtn: {
    width: 34, height: 34, borderRadius: 4,
    marginTop: 6, alignItems: "center", justifyContent: "center",
  },
  reticle: { ...StyleSheet.absoluteFillObject, margin: 52 },
  c: { position: "absolute", width: SZ, height: SZ },
  cTL: { top: 0, left: 0, borderTopWidth: THICK, borderLeftWidth: THICK, borderColor: "#fff" },
  cTR: { top: 0, right: 0, borderTopWidth: THICK, borderRightWidth: THICK, borderColor: "#fff" },
  cBL: { bottom: 0, left: 0, borderBottomWidth: THICK, borderLeftWidth: THICK, borderColor: "#fff" },
  cBR: { bottom: 0, right: 0, borderBottomWidth: THICK, borderRightWidth: THICK, borderColor: "#fff" },
  voiceRow: {
    position: "absolute",
    bottom: 10,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  voiceText: { color: "#A1A1A0", fontSize: 12, fontFamily: "Rajdhani_400Regular" },
  panel: {
    flex: 35,
    backgroundColor: "#1a1a1a",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#2a2a2a",
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 12,
  },
  statsRow: { flexDirection: "row", alignItems: "center" },
  statDiv: { width: StyleSheet.hairlineWidth, height: 28, backgroundColor: "#2a2a2a" },
  statusLine: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { color: "#6B6B6B", fontSize: 12, fontFamily: "Rajdhani_700Bold", letterSpacing: 1 },
  scanBtn: {
    height: 60,
    backgroundColor: "#F5C518",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  scanBtnText: { color: "#000", fontSize: 18, fontFamily: "Rajdhani_700Bold", letterSpacing: 2 },
});
