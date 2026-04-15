import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTraining } from "@/context/TrainingContext";

const INSTRUCTIONS = [
  "Position first perfect part directly under camera",
  "Rotate 90° clockwise — second angle",
  "Side profile — show edge and depth",
  "Close-up on the key surface detail",
  "Final shot — all faces of part visible",
];

type Phase = "list" | "capture" | "processing" | "done";

export default function TrainScreen() {
  const insets = useSafeAreaInsets();
  const { products, addProduct, setActiveProduct, deleteProduct } = useTraining();
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<Phase>("list");
  const [productName, setProductName] = useState("");
  const [shots, setShots] = useState<string[]>([]);
  const [capturing, setCapturing] = useState(false);

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom;
  const step = shots.length;

  const handleCapture = async () => {
    if (capturing) return;
    setCapturing(true);
    await new Promise((r) => setTimeout(r, 480));
    const next = [...shots, `shot_${shots.length + 1}_${Date.now()}`];
    setShots(next);
    if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCapturing(false);
    if (next.length >= 5) {
      setPhase("processing");
      await new Promise((r) => setTimeout(r, 1600));
      addProduct({ id: Date.now().toString(), name: productName, shots: next, createdAt: Date.now(), active: true });
      if (Platform.OS !== "web") await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPhase("done");
    }
  };

  const reset = () => { setPhase("list"); setProductName(""); setShots([]); };

  if (phase === "processing") {
    return (
      <View style={[S.center, { backgroundColor: "#0f0f0f", paddingTop: topPad }]}>
        <ActivityIndicator color="#F5C518" size="large" />
        <Text style={S.processingLabel}>BUILDING STANDARD</Text>
        <Text style={S.processingMeta}>Analysing {shots.length} reference shots</Text>
      </View>
    );
  }

  if (phase === "done") {
    return (
      <View style={[S.center, { backgroundColor: "#0f0f0f", paddingHorizontal: 24, paddingTop: topPad }]}>
        <MaterialCommunityIcons name="check-decagram" size={40} color="#22C55E" />
        <Text style={[S.processingLabel, { color: "#22C55E", marginTop: 12 }]}>TRAINING COMPLETE</Text>
        <Text style={[S.processingMeta, { textAlign: "center", marginTop: 4 }]}>
          "{productName}" is now the active standard
        </Text>
        <Pressable onPress={reset} style={({ pressed }) => [S.primaryBtn, { marginTop: 28, width: "100%", opacity: pressed ? 0.85 : 1 }]}>
          <Text style={S.primaryBtnText}>TRAIN ANOTHER PART</Text>
        </Pressable>
      </View>
    );
  }

  if (phase === "capture") {
    return (
      <View style={[S.root, { backgroundColor: "#0f0f0f" }]}>
        <View style={[S.topBar, { paddingTop: topPad + 6 }]}>
          <Pressable onPress={reset} style={S.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={20} color="#555" />
          </Pressable>
          <View style={{ flex: 1, paddingHorizontal: 10 }}>
            <Text style={S.topBarTitle} numberOfLines={1}>{productName}</Text>
            <Text style={S.topBarSub}>Step {step + 1} of 5</Text>
          </View>
          <View style={S.stepPill}>
            <Text style={S.stepPillText}>{step}/5</Text>
          </View>
        </View>

        {/* 2dp progress bar */}
        <View style={S.progressBg}>
          <View style={[S.progressFill, { width: `${(step / 5) * 100}%` }]} />
        </View>

        {/* Instruction */}
        <View style={S.instructionRow}>
          <Text style={S.instruction}>{INSTRUCTIONS[step]}</Text>
        </View>

        {/* Photo grid — 5 cells */}
        <View style={S.photoGrid}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View
              key={i}
              style={[
                S.photoCell,
                {
                  backgroundColor: i < step ? "#052210" : "#0a0a0a",
                  borderColor: i < step ? "#22C55E" : i === step ? "#F5C518" : "#1a1a1a",
                },
              ]}
            >
              {i < step
                ? <MaterialCommunityIcons name="check-bold" size={18} color="#22C55E" />
                : i === step
                ? <MaterialCommunityIcons name="camera-iris" size={16} color="#F5C518" />
                : <Text style={{ color: "#222", fontSize: 16, fontFamily: "Rajdhani_400Regular" }}>+</Text>
              }
            </View>
          ))}
        </View>

        {/* Camera */}
        <View style={S.cameraArea}>
          {isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "#080808" }]} />
          ) : (
            <CameraView style={StyleSheet.absoluteFill} facing="back" />
          )}
          <View style={S.reticle} pointerEvents="none">
            {([S.cTL, S.cTR, S.cBL, S.cBR] as const).map((cs, i) => (
              <View key={i} style={[S.corner, cs]} />
            ))}
          </View>
        </View>

        <View style={[S.captureBar, { paddingBottom: bottomPad + 10 }]}>
          <Pressable
            onPress={handleCapture}
            disabled={capturing}
            style={({ pressed }) => [S.primaryBtn, { opacity: capturing ? 0.5 : pressed ? 0.85 : 1 }]}
          >
            {capturing
              ? <ActivityIndicator color="#000" />
              : <>
                  <MaterialCommunityIcons name="camera-iris" size={18} color="#000" />
                  <Text style={S.primaryBtnText}>CAPTURE SHOT {step + 1}</Text>
                </>
            }
          </Pressable>
        </View>
      </View>
    );
  }

  // List phase (default)
  return (
    <View style={[S.root, { backgroundColor: "#0f0f0f" }]}>
      <View style={[S.topBar, { paddingTop: topPad + 6 }]}>
        <Text style={S.pageTitle}>FIVE-SHOT TRAINING</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: bottomPad + 20 }} showsVerticalScrollIndicator={false}>
        <TextInput
          style={S.nameInput}
          placeholder="Part name to train"
          placeholderTextColor="#333"
          value={productName}
          onChangeText={setProductName}
          returnKeyType="done"
        />

        <Pressable
          onPress={() => {
            if (!productName.trim()) return;
            if (!permission?.granted) { requestPermission(); return; }
            setPhase("capture");
          }}
          style={({ pressed }) => [S.primaryBtn, { opacity: productName.trim() ? (pressed ? 0.85 : 1) : 0.3, borderRadius: 0 }]}
        >
          <MaterialCommunityIcons name="camera-iris" size={18} color="#000" />
          <Text style={S.primaryBtnText}>START 5-SHOT TRAINING</Text>
        </Pressable>

        {/* Trained products */}
        <View style={S.listSection}>
          <View style={S.listHead}>
            <Text style={S.listHeadLabel}>TRAINED PRODUCTS</Text>
            <Text style={S.listHeadCount}>{products.length}</Text>
          </View>
          {products.map((p) => (
            <View key={p.id} style={S.productRow}>
              <View style={[S.productIconBox, { backgroundColor: p.active ? "#F5C518" : "#111" }]}>
                <MaterialCommunityIcons name="chip" size={16} color={p.active ? "#000" : "#444"} />
              </View>
              <View style={S.productCenter}>
                <Text style={S.productName} numberOfLines={1}>{p.name}</Text>
                <Text style={S.productMeta}>{p.shots.length} ref shots · {new Date(p.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</Text>
              </View>
              <View style={S.productActions}>
                {p.active
                  ? <View style={S.activePill}><Text style={S.activePillText}>ACTIVE</Text></View>
                  : <Pressable onPress={() => setActiveProduct(p.id)} style={S.useBtn}><Text style={S.useBtnText}>USE</Text></Pressable>
                }
                <Pressable onPress={() => Alert.alert("Remove", `Delete "${p.name}"?`, [
                  { text: "Cancel", style: "cancel" },
                  { text: "Delete", style: "destructive", onPress: () => deleteProduct(p.id) },
                ])}>
                  <MaterialCommunityIcons name="delete-outline" size={17} color="#EF4444" />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const CT = 3, CZ = 18;

const S = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  topBar: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#1f1f1f",
    gap: 10,
  },
  pageTitle: { color: "#F5C518", fontSize: 18, fontFamily: "Rajdhani_700Bold", letterSpacing: 2 },
  topBarTitle: { color: "#fff", fontSize: 15, fontFamily: "Rajdhani_600SemiBold" },
  topBarSub: { color: "#555", fontSize: 11, fontFamily: "Rajdhani_400Regular" },
  backBtn: { width: 30, height: 30, alignItems: "center", justifyContent: "center" },
  stepPill: {
    borderWidth: StyleSheet.hairlineWidth, borderColor: "#2a2a2a",
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 3,
  },
  stepPillText: { color: "#555", fontSize: 12, fontFamily: "Rajdhani_700Bold", letterSpacing: 1 },
  nameInput: {
    height: 56,
    backgroundColor: "#0f0f0f",
    borderBottomWidth: 1,
    borderBottomColor: "#1f1f1f",
    paddingHorizontal: 16,
    fontSize: 17,
    fontFamily: "Rajdhani_500Medium",
    color: "#fff",
  },
  primaryBtn: {
    backgroundColor: "#F5C518",
    alignItems: "center",
    justifyContent: "center",
    height: 60,
    flexDirection: "row",
    gap: 10,
    borderRadius: 4,
  },
  primaryBtnText: { color: "#000", fontSize: 18, fontFamily: "Rajdhani_700Bold", letterSpacing: 2 },
  listSection: { marginTop: 0 },
  listHead: {
    flexDirection: "row", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#1f1f1f",
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#1f1f1f",
    marginTop: 24,
  },
  listHeadLabel: { color: "#444", fontSize: 11, fontFamily: "Rajdhani_700Bold", letterSpacing: 2 },
  listHeadCount: { color: "#2a2a2a", fontSize: 11, fontFamily: "Rajdhani_400Regular" },
  productRow: {
    height: 64, flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#1f1f1f",
  },
  productIconBox: { width: 40, height: 40, borderRadius: 4, alignItems: "center", justifyContent: "center" },
  productCenter: { flex: 1 },
  productName: { color: "#E8E8E8", fontSize: 15, fontFamily: "Rajdhani_500Medium" },
  productMeta: { color: "#555", fontSize: 11, fontFamily: "Rajdhani_400Regular", marginTop: 1 },
  productActions: { flexDirection: "row", alignItems: "center", gap: 14 },
  activePill: { backgroundColor: "#22C55E", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 3 },
  activePillText: { color: "#fff", fontSize: 10, fontFamily: "Rajdhani_700Bold", letterSpacing: 0.8 },
  useBtn: { borderWidth: 1, borderColor: "#F5C518", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 3 },
  useBtnText: { color: "#F5C518", fontSize: 11, fontFamily: "Rajdhani_700Bold", letterSpacing: 0.5 },
  processingLabel: { color: "#fff", fontSize: 18, fontFamily: "Rajdhani_700Bold", letterSpacing: 2, marginTop: 12 },
  processingMeta: { color: "#555", fontSize: 13, fontFamily: "Rajdhani_400Regular" },
  progressBg: { height: 2, backgroundColor: "#111" },
  progressFill: { height: 2, backgroundColor: "#F5C518" },
  instructionRow: {
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#1f1f1f",
  },
  instruction: { color: "#E8E8E8", fontSize: 18, fontFamily: "Rajdhani_500Medium" },
  photoGrid: {
    flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12,
    gap: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#1f1f1f",
  },
  photoCell: {
    width: 56, height: 56, borderRadius: 3, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  cameraArea: { flex: 1, backgroundColor: "#000", overflow: "hidden" },
  reticle: { ...StyleSheet.absoluteFillObject, margin: 44 },
  corner: { position: "absolute", width: CZ, height: CZ },
  cTL: { top: 0, left: 0, borderTopWidth: CT, borderLeftWidth: CT, borderColor: "#fff" },
  cTR: { top: 0, right: 0, borderTopWidth: CT, borderRightWidth: CT, borderColor: "#fff" },
  cBL: { bottom: 0, left: 0, borderBottomWidth: CT, borderLeftWidth: CT, borderColor: "#fff" },
  cBR: { bottom: 0, right: 0, borderBottomWidth: CT, borderRightWidth: CT, borderColor: "#fff" },
  captureBar: {
    backgroundColor: "#111", paddingHorizontal: 16, paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#1f1f1f",
  },
});
