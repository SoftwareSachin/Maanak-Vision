import { Feather } from "@expo/vector-icons";
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
  "Position first perfect part under camera",
  "अब दूसरा perfect part रखें",
  "Rotate part — show the side profile",
  "Close-up on the surface detail",
  "Final check — full part visible",
];

type Phase = "name" | "capture" | "processing" | "done";

export default function TrainScreen() {
  const insets = useSafeAreaInsets();
  const { products, addProduct, setActiveProduct, deleteProduct } = useTraining();
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<Phase>("name");
  const [productName, setProductName] = useState("");
  const [shots, setShots] = useState<string[]>([]);
  const [capturing, setCapturing] = useState(false);

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom;

  const step = shots.length; // 0–4

  const handleCapture = async () => {
    if (capturing) return;
    setCapturing(true);
    await new Promise((r) => setTimeout(r, 500));
    const uri = `shot_${shots.length + 1}_${Date.now()}`;
    const next = [...shots, uri];
    setShots(next);
    if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCapturing(false);
    if (next.length >= 5) {
      setPhase("processing");
      await new Promise((r) => setTimeout(r, 1800));
      const id = Date.now().toString() + Math.random().toString(36).substring(2, 9);
      addProduct({ id, name: productName, shots: next, createdAt: Date.now(), active: true });
      if (Platform.OS !== "web") await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPhase("done");
    }
  };

  const reset = () => { setPhase("name"); setProductName(""); setShots([]); };

  // PRODUCT LIST SCREEN (default)
  if (phase === "name") {
    return (
      <View style={[S.root, { backgroundColor: "#0f0f0f" }]}>
        {/* Top bar */}
        <View style={[S.topBar, { paddingTop: topPad + 6, borderBottomColor: "#2a2a2a" }]}>
          <Text style={S.title}>TEACH NEW PART</Text>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: bottomPad + 20 }} showsVerticalScrollIndicator={false}>
          {/* Name input */}
          <View style={[S.section, { borderBottomColor: "#2a2a2a" }]}>
            <Text style={S.sectionLabel}>PRODUCT NAME</Text>
            <TextInput
              style={[S.input, { backgroundColor: "#1a1a1a", color: "#fff", borderColor: "#2a2a2a" }]}
              placeholder="e.g. Brass Valve 3/4 inch"
              placeholderTextColor="#6B6B6B"
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
              disabled={!productName.trim()}
              style={({ pressed }) => [S.primaryBtn, { opacity: productName.trim() ? (pressed ? 0.85 : 1) : 0.4 }]}
            >
              <Text style={S.primaryBtnText}>START 5-SHOT TRAINING</Text>
            </Pressable>
          </View>

          {/* Trained products list */}
          {products.length > 0 && (
            <View>
              <View style={[S.listHeader, { borderBottomColor: "#2a2a2a" }]}>
                <Text style={S.sectionLabel}>TRAINED PRODUCTS</Text>
                <Text style={[S.sectionLabel, { color: "#2a2a2a" }]}>{products.length}</Text>
              </View>
              {products.map((p) => (
                <View key={p.id} style={[S.productRow, { borderBottomColor: "#2a2a2a" }]}>
                  <View style={[S.productIcon, { backgroundColor: p.active ? "#F5C518" : "#1a1a1a" }]}>
                    <Feather name="cpu" size={16} color={p.active ? "#000" : "#6B6B6B"} />
                  </View>
                  <View style={S.productCenter}>
                    <Text style={S.productName} numberOfLines={1}>{p.name}</Text>
                    <Text style={S.productMeta}>{p.shots.length} shots · {new Date(p.createdAt).toLocaleDateString("en-IN")}</Text>
                  </View>
                  <View style={S.productRight}>
                    {p.active ? (
                      <View style={S.activeBadge}>
                        <Text style={S.activeBadgeText}>ACTIVE</Text>
                      </View>
                    ) : (
                      <Pressable onPress={() => setActiveProduct(p.id)} style={S.useBtn}>
                        <Text style={S.useBtnText}>USE</Text>
                      </Pressable>
                    )}
                    <Pressable
                      onPress={() =>
                        Alert.alert("Delete", `Remove "${p.name}"?`, [
                          { text: "Cancel", style: "cancel" },
                          { text: "Delete", style: "destructive", onPress: () => deleteProduct(p.id) },
                        ])
                      }
                    >
                      <Feather name="trash-2" size={16} color="#EF4444" />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}

          {products.length === 0 && (
            <View style={S.empty}>
              <Feather name="camera" size={28} color="#2a2a2a" />
              <Text style={S.emptyText}>No trained products yet</Text>
              <Text style={S.emptyHint}>Photograph 5 perfect parts to teach the app your standard</Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  if (phase === "processing") {
    return (
      <View style={[S.center, { backgroundColor: "#0f0f0f" }]}>
        <ActivityIndicator color="#F5C518" size="large" />
        <Text style={S.processingText}>LEARNING STANDARD...</Text>
        <Text style={S.processingMeta}>Analysing {shots.length} reference shots</Text>
      </View>
    );
  }

  if (phase === "done") {
    return (
      <View style={[S.center, { backgroundColor: "#0f0f0f", paddingHorizontal: 24 }]}>
        <Feather name="check-square" size={40} color="#22C55E" />
        <Text style={[S.title, { color: "#22C55E", marginTop: 14 }]}>TRAINING COMPLETE</Text>
        <Text style={S.doneText}>"{productName}" set as active product standard</Text>
        <Pressable onPress={reset} style={({ pressed }) => [S.primaryBtn, { marginTop: 24, width: "100%", opacity: pressed ? 0.85 : 1 }]}>
          <Text style={S.primaryBtnText}>TRAIN ANOTHER PART</Text>
        </Pressable>
      </View>
    );
  }

  // CAPTURE PHASE
  const progress = step / 5;

  return (
    <View style={[S.root, { backgroundColor: "#0f0f0f" }]}>
      {/* Top bar */}
      <View style={[S.topBar, { paddingTop: topPad + 6, borderBottomColor: "#2a2a2a" }]}>
        <Pressable onPress={reset} style={S.backBtn}>
          <Feather name="arrow-left" size={20} color="#6B6B6B" />
        </Pressable>
        <Text style={S.title}>TEACH NEW PART</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Step counter — plain text */}
      <View style={[S.stepRow, { borderBottomColor: "#2a2a2a" }]}>
        <Text style={S.stepText}>Step {step + 1} of 5</Text>
        <View style={S.progressBg}>
          <View style={[S.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      {/* Instruction — single line, 18sp */}
      <View style={[S.instructionRow, { borderBottomColor: "#2a2a2a" }]}>
        <Text style={S.instruction}>{INSTRUCTIONS[step]}</Text>
      </View>

      {/* Photo grid — 5 cells 72x72dp */}
      <View style={[S.photoGrid, { borderBottomColor: "#2a2a2a" }]}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={[
              S.photoCell,
              {
                backgroundColor: i < shots.length ? "#0D2E18" : "#1a1a1a",
                borderColor: i < shots.length ? "#22C55E" : "#2a2a2a",
                borderStyle: i < shots.length ? "solid" : "dashed",
              },
            ]}
          >
            {i < shots.length ? (
              <Feather name="check" size={20} color="#22C55E" />
            ) : i === shots.length ? (
              <Feather name="camera" size={18} color="#F5C518" />
            ) : (
              <Text style={{ color: "#2a2a2a", fontSize: 18, fontFamily: "Rajdhani_400Regular" }}>+</Text>
            )}
          </View>
        ))}
      </View>

      {/* Camera viewfinder — remaining height */}
      <View style={S.cameraArea}>
        {isWeb ? (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "#0a0a0a", alignItems: "center", justifyContent: "center" }]}>
            <Feather name="camera" size={40} color="#1a1a1a" />
          </View>
        ) : (
          <CameraView style={StyleSheet.absoluteFill} facing="back" />
        )}

        {/* Corner reticle */}
        <View style={S.reticle} pointerEvents="none">
          <View style={[S.c, S.cTL]} />
          <View style={[S.c, S.cTR]} />
          <View style={[S.c, S.cBL]} />
          <View style={[S.c, S.cBR]} />
        </View>
      </View>

      {/* CAPTURE button — full width yellow 60dp */}
      <View style={[S.captureBar, { paddingBottom: bottomPad + 12 }]}>
        <Pressable
          onPress={handleCapture}
          disabled={capturing}
          style={({ pressed }) => [S.primaryBtn, { opacity: capturing ? 0.55 : pressed ? 0.85 : 1 }]}
        >
          {capturing
            ? <ActivityIndicator color="#000" />
            : <Text style={S.primaryBtnText}>CAPTURE SHOT {step + 1}</Text>
          }
        </Pressable>
      </View>
    </View>
  );
}

const CT = 3;
const CZ = 18;

const S = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  backBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  title: {
    color: "#F5C518",
    fontSize: 18,
    fontFamily: "Rajdhani_700Bold",
    letterSpacing: 2,
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  sectionLabel: {
    color: "#6B6B6B",
    fontSize: 11,
    fontFamily: "Rajdhani_700Bold",
    letterSpacing: 2,
  },
  input: {
    height: 52,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 4,
    paddingHorizontal: 14,
    fontSize: 16,
    fontFamily: "Rajdhani_500Medium",
  },
  primaryBtn: {
    height: 60,
    backgroundColor: "#F5C518",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    color: "#000",
    fontSize: 18,
    fontFamily: "Rajdhani_700Bold",
    letterSpacing: 2,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  productRow: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  productIcon: { width: 40, height: 40, borderRadius: 4, alignItems: "center", justifyContent: "center" },
  productCenter: { flex: 1 },
  productName: { color: "#FFFFFF", fontSize: 15, fontFamily: "Rajdhani_500Medium" },
  productMeta: { color: "#6B6B6B", fontSize: 12, fontFamily: "Rajdhani_400Regular", marginTop: 1 },
  productRight: { flexDirection: "row", alignItems: "center", gap: 14 },
  activeBadge: { backgroundColor: "#22C55E", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  activeBadgeText: { color: "#fff", fontSize: 10, fontFamily: "Rajdhani_700Bold", letterSpacing: 0.8 },
  useBtn: { borderWidth: 1, borderColor: "#F5C518", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  useBtnText: { color: "#F5C518", fontSize: 12, fontFamily: "Rajdhani_700Bold", letterSpacing: 0.5 },
  empty: { alignItems: "center", paddingVertical: 60, paddingHorizontal: 32, gap: 8 },
  emptyText: { color: "#2a2a2a", fontSize: 15, fontFamily: "Rajdhani_500Medium" },
  emptyHint: { color: "#2a2a2a", fontSize: 13, fontFamily: "Rajdhani_400Regular", textAlign: "center", lineHeight: 20 },
  processingText: { color: "#F0F0F0", fontSize: 18, fontFamily: "Rajdhani_700Bold", letterSpacing: 2, marginTop: 14 },
  processingMeta: { color: "#6B6B6B", fontSize: 13, fontFamily: "Rajdhani_400Regular" },
  doneText: { color: "#A1A1A0", fontSize: 14, fontFamily: "Rajdhani_400Regular", textAlign: "center", lineHeight: 22, marginTop: 6 },
  stepRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  stepText: { color: "#6B6B6B", fontSize: 13, fontFamily: "Rajdhani_500Medium" },
  progressBg: { height: 2, backgroundColor: "#2a2a2a", borderRadius: 1, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#F5C518", borderRadius: 1 },
  instructionRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  instruction: { color: "#FFFFFF", fontSize: 18, fontFamily: "Rajdhani_500Medium" },
  photoGrid: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  photoCell: {
    width: 56,
    height: 56,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cameraArea: { flex: 1, backgroundColor: "#000", overflow: "hidden" },
  reticle: { ...StyleSheet.absoluteFillObject, margin: 48 },
  c: { position: "absolute", width: CZ, height: CZ },
  cTL: { top: 0, left: 0, borderTopWidth: CT, borderLeftWidth: CT, borderColor: "#fff" },
  cTR: { top: 0, right: 0, borderTopWidth: CT, borderRightWidth: CT, borderColor: "#fff" },
  cBL: { bottom: 0, left: 0, borderBottomWidth: CT, borderLeftWidth: CT, borderColor: "#fff" },
  cBR: { bottom: 0, right: 0, borderBottomWidth: CT, borderRightWidth: CT, borderColor: "#fff" },
  captureBar: {
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#2a2a2a",
  },
});
