import { MaterialCommunityIcons } from "@expo/vector-icons";
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
  { type: "crack", severity: "high", description: "Surface crack on thread section" },
  { type: "scratch", severity: "medium", description: "Linear scratch on shank — 12mm" },
  { type: "colour_mismatch", severity: "low", description: "Surface oxidation — check annealing" },
  { type: "dimensional", severity: "high", description: "Thread pitch outside ±0.05mm tolerance" },
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
        Animated.timing(reticleRef, { toValue: 0.45, duration: 1200, useNativeDriver: true }),
        Animated.timing(reticleRef, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const doFlash = useCallback((result: InspectionResult) => {
    const c = result === "pass" ? "rgba(34,197,94,0.38)" : result === "fail" ? "rgba(239,68,68,0.38)" : "rgba(245,158,11,0.28)";
    setFlashColor(c);
    Animated.sequence([
      Animated.timing(flashRef, { toValue: 1, duration: 50, useNativeDriver: true }),
      Animated.timing(flashRef, { toValue: 0, duration: 380, useNativeDriver: true }),
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

  if (!permission) return (
    <View style={[S.fill, { backgroundColor: "#0f0f0f" }]}>
      <ActivityIndicator color="#F5C518" />
    </View>
  );

  if (!permission.granted) {
    return (
      <View style={[S.fill, { backgroundColor: "#0f0f0f" }]}>
        <MaterialCommunityIcons name="camera-off" size={36} color="#2a2a2a" />
        <Text style={S.permText}>Camera access required</Text>
        <Pressable onPress={requestPermission} style={S.permBtn}>
          <Text style={S.permBtnText}>ALLOW CAMERA</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[S.root, { backgroundColor: "#000" }]}>

      {/* CAMERA — 65% height */}
      <View style={S.cameraArea}>
        {isWeb ? (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "#0a0a0a" }]} />
        ) : (
          <CameraView style={StyleSheet.absoluteFill} facing="back" />
        )}

        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: flashColor, opacity: flashRef }]}
        />

        {/* Top overlay: minimal text only */}
        <View style={[S.camTop, { paddingTop: topPad + 4 }]}>
          <Pressable onPress={() => router.back()} style={S.camBtn}>
            <MaterialCommunityIcons name="close" size={18} color="rgba(255,255,255,0.6)" />
          </Pressable>

          <View style={S.camTopCenter}>
            {currentBatch && (
              <Text style={S.camBatchLabel} numberOfLines={1}>{currentBatch.productName}</Text>
            )}
          </View>

          <Pressable
            onPress={() => setVoiceActive((v) => !v)}
            style={[S.camBtn, { backgroundColor: voiceActive ? "#F5C518" : "rgba(0,0,0,0.35)" }]}
          >
            <MaterialCommunityIcons
              name={voiceActive ? "microphone" : "microphone-outline"}
              size={17}
              color={voiceActive ? "#000" : "rgba(255,255,255,0.6)"}
            />
          </Pressable>
        </View>

        {/* Corner reticle — white, no fill, no glow */}
        <Animated.View style={[S.reticle, { opacity: reticleRef }]} pointerEvents="none">
          <View style={[S.c, S.cTL]} />
          <View style={[S.c, S.cTR]} />
          <View style={[S.c, S.cBL]} />
          <View style={[S.c, S.cBR]} />
        </Animated.View>

        {voiceActive && (
          <View style={S.voiceBar}>
            <MaterialCommunityIcons name="microphone" size={12} color="#F5C518" />
            <Text style={S.voiceText}>या बोलें: "स्कैन करो"  ·  "रोको"</Text>
          </View>
        )}
      </View>

      {/* BOTTOM PANEL — 35%, #1a1a1a */}
      <View style={[S.panel, { paddingBottom: bottomPad + 10 }]}>
        <View style={S.statsRow}>
          <StatCol label="SCANNED" value={currentBatch?.totalParts ?? 0} color="#A1A1A0" />
          <View style={S.statDiv} />
          <StatCol label="PASS" value={currentBatch?.passed ?? 0} color="#22C55E" />
          <View style={S.statDiv} />
          <StatCol label="FAIL" value={currentBatch?.failed ?? 0} color="#EF4444" />
          <View style={S.statDiv} />
          <StatCol label="WARN" value={currentBatch?.warnings ?? 0} color="#F59E0B" />
        </View>

        <View style={S.statusLine}>
          <View style={[S.statusDot, { backgroundColor: scanning ? "#F59E0B" : "#22C55E" }]} />
          <Text style={S.statusText}>
            {scanning ? "ANALYSING PART..." : "POSITION PART IN FRAME"}
          </Text>
        </View>

        <Pressable
          onPress={handleScan}
          disabled={scanning}
          style={({ pressed }) => [S.scanBtn, { opacity: scanning ? 0.5 : pressed ? 0.85 : 1 }]}
        >
          {scanning
            ? <ActivityIndicator color="#000" />
            : <>
                <MaterialCommunityIcons name="barcode-scan" size={20} color="#000" />
                <Text style={S.scanBtnText}>SCAN PART</Text>
              </>
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
      <Text style={{ color: "#444", fontSize: 9, fontFamily: "Rajdhani_700Bold", letterSpacing: 1.2 }}>{label}</Text>
    </View>
  );
}

const CT = 3;
const CZ = 20;

const S = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14 },
  permText: { color: "#A1A1A0", fontSize: 16, fontFamily: "Rajdhani_500Medium" },
  permBtn: { backgroundColor: "#F5C518", borderRadius: 4, paddingHorizontal: 24, height: 60, alignItems: "center", justifyContent: "center" },
  permBtnText: { color: "#000", fontSize: 18, fontFamily: "Rajdhani_700Bold", letterSpacing: 2 },
  cameraArea: { flex: 65, backgroundColor: "#000", overflow: "hidden" },
  camTop: { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 12, paddingBottom: 8, justifyContent: "space-between" },
  camBtn: { width: 36, height: 36, borderRadius: 3, backgroundColor: "rgba(0,0,0,0.3)", alignItems: "center", justifyContent: "center" },
  camTopCenter: { flex: 1, alignItems: "center", paddingTop: 8 },
  camBatchLabel: { color: "rgba(255,255,255,0.45)", fontSize: 12, fontFamily: "Rajdhani_500Medium" },
  reticle: { ...StyleSheet.absoluteFillObject, margin: 52 },
  c: { position: "absolute", width: CZ, height: CZ },
  cTL: { top: 0, left: 0, borderTopWidth: CT, borderLeftWidth: CT, borderColor: "#fff" },
  cTR: { top: 0, right: 0, borderTopWidth: CT, borderRightWidth: CT, borderColor: "#fff" },
  cBL: { bottom: 0, left: 0, borderBottomWidth: CT, borderLeftWidth: CT, borderColor: "#fff" },
  cBR: { bottom: 0, right: 0, borderBottomWidth: CT, borderRightWidth: CT, borderColor: "#fff" },
  voiceBar: {
    position: "absolute", bottom: 10, alignSelf: "center",
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(0,0,0,0.65)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 3,
  },
  voiceText: { color: "#888", fontSize: 12, fontFamily: "Rajdhani_400Regular" },
  panel: {
    flex: 35, backgroundColor: "#141414",
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#222",
    paddingHorizontal: 16, paddingTop: 14, gap: 12,
  },
  statsRow: { flexDirection: "row", alignItems: "center" },
  statDiv: { width: StyleSheet.hairlineWidth, height: 28, backgroundColor: "#222" },
  statusLine: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { color: "#555", fontSize: 11, fontFamily: "Rajdhani_700Bold", letterSpacing: 1 },
  scanBtn: {
    height: 60, backgroundColor: "#F5C518", borderRadius: 4,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
  },
  scanBtnText: { color: "#000", fontSize: 18, fontFamily: "Rajdhani_700Bold", letterSpacing: 2 },
});
