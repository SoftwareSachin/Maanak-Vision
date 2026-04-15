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
import C from "@/constants/colors";
import { useInspection } from "@/context/InspectionContext";
import { useTraining } from "@/context/TrainingContext";
import type { DefectDetail, InspectionResult } from "@/context/InspectionContext";

const DEFECTS: DefectDetail[] = [
  { type: "crack",           severity: "high",   description: "Surface crack on thread section" },
  { type: "scratch",         severity: "medium", description: "Linear scratch on shank — 12mm" },
  { type: "colour_mismatch", severity: "low",    description: "Surface oxidation — check annealing" },
  { type: "dimensional",     severity: "high",   description: "Thread pitch outside ±0.05mm tolerance" },
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
  const topPad = isWeb ? 56 : insets.top;
  const bottomPad = isWeb ? 32 : insets.bottom;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(reticleRef, { toValue: 0.5, duration: 1400, useNativeDriver: true }),
        Animated.timing(reticleRef, { toValue: 1,   duration: 1400, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const doFlash = useCallback((result: InspectionResult) => {
    const c =
      result === "pass"    ? "rgba(109,214,114,0.30)" :
      result === "fail"    ? "rgba(255,180,171,0.30)" :
                             "rgba(255,184,108,0.25)";
    setFlashColor(c);
    Animated.sequence([
      Animated.timing(flashRef, { toValue: 1, duration: 50,  useNativeDriver: true }),
      Animated.timing(flashRef, { toValue: 0, duration: 400, useNativeDriver: true }),
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
      id:          Date.now().toString() + Math.random().toString(36).substring(2, 9),
      productName: activeProduct?.name ?? currentBatch?.productName ?? "Unknown Part",
      result,
      defects,
      timestamp:   Date.now(),
      batchId:     activeBatchId ?? "no-batch",
      bisCompliant: result === "pass",
    };
    addInspection(inspection);
    setScanning(false);
    router.replace({
      pathname: "/result",
      params: {
        result,
        productName: inspection.productName,
        defectType:  defects[0]?.type ?? "none",
        defectDesc:  defects[0]?.description ?? "",
      },
    });
  }, [scanning, activeProduct, currentBatch, activeBatchId, addInspection, doFlash]);

  if (!permission) {
    return (
      <View style={[S.permScreen, { backgroundColor: C.background }]}>
        <ActivityIndicator color={C.primary} size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[S.permScreen, { backgroundColor: C.background }]}>
        <View style={[S.permCard, { backgroundColor: C.surfaceContainerLow }]}>
          <View style={[S.permIconBox, { backgroundColor: C.surfaceContainerHigh }]}>
            <MaterialCommunityIcons name="camera-off" size={32} color={C.onSurfaceVariant} />
          </View>
          <Text style={S.permTitle}>Camera access required</Text>
          <Text style={S.permBody}>Maanak Vision needs camera permission to inspect parts.</Text>
          <Pressable onPress={requestPermission} style={S.permBtn}>
            <Text style={S.permBtnText}>Allow Camera</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[S.root, { backgroundColor: "#000" }]}>

      {/* Camera viewport — 65% */}
      <View style={S.cameraArea}>
        {isWeb ? (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "#050508" }]} />
        ) : (
          <CameraView style={StyleSheet.absoluteFill} facing="back" />
        )}

        {/* Result flash overlay */}
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: flashColor, opacity: flashRef }]}
        />

        {/* Top HUD */}
        <View style={[S.camHud, { paddingTop: topPad + 6 }]}>
          <Pressable onPress={() => router.back()} style={S.hudBtn}>
            <MaterialCommunityIcons name="close" size={20} color="rgba(255,255,255,0.8)" />
          </Pressable>

          <View style={S.hudCenter}>
            {currentBatch && (
              <View style={S.batchPill}>
                <View style={S.batchPillDot} />
                <Text style={S.batchPillText} numberOfLines={1}>{currentBatch.productName}</Text>
              </View>
            )}
          </View>

          <Pressable
            onPress={() => setVoiceActive((v) => !v)}
            style={[S.hudBtn, voiceActive && S.hudBtnActive]}
          >
            <MaterialCommunityIcons
              name={voiceActive ? "microphone" : "microphone-outline"}
              size={18}
              color={voiceActive ? C.onPrimary : "rgba(255,255,255,0.8)"}
            />
          </Pressable>
        </View>

        {/* Reticle corners */}
        <Animated.View style={[S.reticle, { opacity: reticleRef }]} pointerEvents="none">
          <View style={[S.corner, S.cTL]} />
          <View style={[S.corner, S.cTR]} />
          <View style={[S.corner, S.cBL]} />
          <View style={[S.corner, S.cBR]} />
        </Animated.View>

        {/* Voice indicator */}
        {voiceActive && (
          <View style={S.voicePill}>
            <MaterialCommunityIcons name="microphone" size={12} color={C.primary} />
            <Text style={S.voicePillText}>Say: "स्कैन करो" · "रोको"</Text>
          </View>
        )}
      </View>

      {/* Control panel — 35% */}
      <View style={[S.panel, { paddingBottom: bottomPad + 12 }]}>

        {/* Live batch stats */}
        <View style={S.statsRow}>
          <StatCell label="Scanned" value={currentBatch?.totalParts ?? 0} color={C.onSurfaceVariant} />
          <View style={S.statDiv} />
          <StatCell label="Pass"    value={currentBatch?.passed  ?? 0} color={C.pass} />
          <View style={S.statDiv} />
          <StatCell label="Fail"    value={currentBatch?.failed  ?? 0} color={C.fail} />
          <View style={S.statDiv} />
          <StatCell label="Caution" value={currentBatch?.warnings ?? 0} color={C.warn} />
        </View>

        {/* Status line */}
        <View style={S.statusLine}>
          <View style={[S.statusDot, {
            backgroundColor: scanning ? C.warn : C.pass,
          }]} />
          <Text style={S.statusText}>
            {scanning ? "Analysing part…" : "Position part in frame"}
          </Text>
        </View>

        {/* Scan button */}
        <Pressable
          onPress={handleScan}
          disabled={scanning}
          style={({ pressed }) => [S.scanBtn, { opacity: scanning ? 0.5 : pressed ? 0.88 : 1 }]}
        >
          {scanning ? (
            <ActivityIndicator color={C.onPrimary} size="small" />
          ) : (
            <>
              <MaterialCommunityIcons name="barcode-scan" size={20} color={C.onPrimary} />
              <Text style={S.scanBtnText}>Scan Part</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function StatCell({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={{ flex: 1, alignItems: "center", paddingVertical: 6 }}>
      <Text style={{ color, fontSize: 22, fontFamily: "Rajdhani_700Bold" }}>{value}</Text>
      <Text style={{ color: C.outline, fontSize: 10, fontFamily: "Rajdhani_500Medium", letterSpacing: 0.8, marginTop: 1 }}>{label}</Text>
    </View>
  );
}

const CT = 3, CZ = 22;

const S = StyleSheet.create({
  root: { flex: 1 },

  permScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  permCard: {
    borderRadius: C.radiusLg,
    padding: 28,
    alignItems: "center",
    gap: 12,
    width: "100%",
    maxWidth: 360,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.outlineVariant,
  },
  permIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  permTitle: {
    color: C.onSurface,
    fontSize: 18,
    fontFamily: "Rajdhani_600SemiBold",
    textAlign: "center",
  },
  permBody: {
    color: C.onSurfaceVariant,
    fontSize: 14,
    fontFamily: "Rajdhani_400Regular",
    textAlign: "center",
  },
  permBtn: {
    backgroundColor: C.primary,
    borderRadius: C.radius,
    paddingHorizontal: 24,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    width: "100%",
  },
  permBtnText: {
    color: C.onPrimary,
    fontSize: 15,
    fontFamily: "Rajdhani_700Bold",
    letterSpacing: 0.1,
  },

  cameraArea: { flex: 65, backgroundColor: "#000", overflow: "hidden" },

  camHud: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 12,
    paddingBottom: 10,
    justifyContent: "space-between",
  },
  hudBtn: {
    width: 40,
    height: 40,
    borderRadius: C.radiusSm,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  hudBtnActive: {
    backgroundColor: C.primary,
  },
  hudCenter: { flex: 1, alignItems: "center", paddingTop: 6 },
  batchPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: C.radiusFull,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  batchPillDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.primary },
  batchPillText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontFamily: "Rajdhani_500Medium",
    maxWidth: 160,
  },

  reticle: { ...StyleSheet.absoluteFillObject, margin: 52 },
  corner: { position: "absolute", width: CZ, height: CZ },
  cTL: { top: 0, left: 0, borderTopWidth: CT, borderLeftWidth: CT, borderColor: "rgba(255,255,255,0.8)" },
  cTR: { top: 0, right: 0, borderTopWidth: CT, borderRightWidth: CT, borderColor: "rgba(255,255,255,0.8)" },
  cBL: { bottom: 0, left: 0, borderBottomWidth: CT, borderLeftWidth: CT, borderColor: "rgba(255,255,255,0.8)" },
  cBR: { bottom: 0, right: 0, borderBottomWidth: CT, borderRightWidth: CT, borderColor: "rgba(255,255,255,0.8)" },

  voicePill: {
    position: "absolute",
    bottom: 14,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(0,0,0,0.70)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: C.radiusFull,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.outlineVariant,
  },
  voicePillText: {
    color: C.onSurfaceVariant,
    fontSize: 12,
    fontFamily: "Rajdhani_400Regular",
  },

  panel: {
    flex: 35,
    backgroundColor: C.surfaceContainerLow,
    borderTopWidth: 2,
    borderTopColor: C.outlineVariant,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 14,
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surfaceContainerHigh,
    borderRadius: C.radiusSm,
    overflow: "hidden",
  },
  statDiv: { width: 1, height: 40, backgroundColor: C.outlineVariant },
  statusLine: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: {
    color: C.onSurfaceVariant,
    fontSize: 13,
    fontFamily: "Rajdhani_600SemiBold",
    letterSpacing: 0.4,
  },
  scanBtn: {
    height: 54,
    backgroundColor: C.primary,
    borderRadius: C.radius,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    elevation: 6,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  scanBtnText: {
    color: C.onPrimary,
    fontSize: 17,
    fontFamily: "Rajdhani_700Bold",
    letterSpacing: 0.2,
  },
});
