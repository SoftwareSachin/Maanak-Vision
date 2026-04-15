import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import C from "@/constants/colors";
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
  const topPad = isWeb ? 56 : insets.top;
  const bottomPad = isWeb ? 32 : insets.bottom;
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
      <View style={[S.center, { backgroundColor: C.background, paddingTop: topPad }]}>
        <View style={S.processingCard}>
          <ActivityIndicator color={C.primary} size="large" />
          <Text style={S.processingTitle}>Building Standard Model</Text>
          <Text style={S.processingBody}>Analysing {shots.length} reference shots for "{productName}"</Text>
        </View>
      </View>
    );
  }

  if (phase === "done") {
    return (
      <View style={[S.center, { backgroundColor: C.background, paddingHorizontal: 24, paddingTop: topPad }]}>
        <View style={S.doneCard}>
          <View style={[S.doneIconBox, { backgroundColor: C.passContainer }]}>
            <MaterialCommunityIcons name="check-decagram" size={36} color={C.pass} />
          </View>
          <Text style={S.doneTitle}>Training Complete</Text>
          <Text style={S.doneBody}>"{productName}" is now the active inspection standard.</Text>
          <Pressable
            onPress={reset}
            style={({ pressed }) => [S.primaryBtn, { opacity: pressed ? 0.88 : 1, marginTop: 8 }]}
          >
            <MaterialCommunityIcons name="camera-iris" size={18} color={C.onPrimary} />
            <Text style={S.primaryBtnText}>Train Another Part</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (phase === "capture") {
    return (
      <View style={[S.root, { backgroundColor: C.background }]}>
        {/* App bar */}
        <View style={[S.appBar, { paddingTop: topPad }]}>
          <Pressable onPress={reset} style={S.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={C.onSurface} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={S.appBarTitle} numberOfLines={1}>{productName}</Text>
            <Text style={S.appBarSub}>Step {step + 1} of 5</Text>
          </View>
          <View style={[S.stepPill, { backgroundColor: C.surfaceContainerHigh }]}>
            <Text style={S.stepPillText}>{step}/5</Text>
          </View>
        </View>

        {/* Linear progress */}
        <View style={S.progressBg}>
          <View style={[S.progressFill, { width: `${(step / 5) * 100}%` as any }]} />
        </View>

        {/* Instruction banner */}
        <View style={S.instructionBanner}>
          <MaterialCommunityIcons name="information-outline" size={16} color={C.primary} style={{ marginTop: 1 }} />
          <Text style={S.instructionText}>{INSTRUCTIONS[step]}</Text>
        </View>

        {/* Shot progress cells */}
        <View style={S.shotGrid}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View
              key={i}
              style={[
                S.shotCell,
                {
                  backgroundColor: i < step ? C.passContainer : i === step ? C.primaryContainer : C.surfaceContainerHigh,
                  borderColor: i < step ? C.pass : i === step ? C.primary : "transparent",
                  borderWidth: i <= step ? 1.5 : 0,
                },
              ]}
            >
              {i < step
                ? <MaterialCommunityIcons name="check-circle" size={20} color={C.pass} />
                : i === step
                ? <MaterialCommunityIcons name="camera-iris" size={20} color={C.primary} />
                : <View style={[S.shotEmptyDot, { backgroundColor: C.surfaceContainerHighest }]} />
              }
              <Text style={[S.shotLabel, { color: i <= step ? C.onPrimaryContainer : C.outline }]}>{i + 1}</Text>
            </View>
          ))}
        </View>

        {/* Camera */}
        <View style={S.cameraArea}>
          {isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "#050508" }]} />
          ) : (
            <CameraView style={StyleSheet.absoluteFill} facing="back" />
          )}
          <View style={S.reticle} pointerEvents="none">
            {([S.cTL, S.cTR, S.cBL, S.cBR] as const).map((cs, i) => (
              <View key={i} style={[S.corner, cs]} />
            ))}
          </View>
        </View>

        {/* Capture bar */}
        <View style={[S.captureBar, { paddingBottom: bottomPad + 12 }]}>
          <Pressable
            onPress={handleCapture}
            disabled={capturing}
            style={({ pressed }) => [S.primaryBtn, { opacity: capturing ? 0.5 : pressed ? 0.88 : 1 }]}
          >
            {capturing
              ? <ActivityIndicator color={C.onPrimary} />
              : <>
                  <MaterialCommunityIcons name="camera-iris" size={20} color={C.onPrimary} />
                  <Text style={S.primaryBtnText}>Capture Shot {step + 1}</Text>
                </>
            }
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[S.root, { backgroundColor: C.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{ flex: 1 }}>
      {/* App Bar */}
      <View style={[S.appBar, { paddingTop: topPad }]}>
        <View style={S.appBarRow}>
          <Text style={S.appBarTitle}>5-Shot Training</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomPad + 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* Training form card */}
        <View style={S.formCard}>
          <Text style={S.formCardLabel}>New Inspection Standard</Text>
          <View style={S.inputContainer}>
            <MaterialCommunityIcons name="chip" size={18} color={C.onSurfaceVariant} style={{ opacity: 0.7 }} />
            <TextInput
              style={S.nameInput}
              placeholder="Part name (e.g. M8 Hex Bolt)"
              placeholderTextColor={C.outline}
              value={productName}
              onChangeText={setProductName}
              returnKeyType="done"
              onSubmitEditing={() => {
                if (!productName.trim()) return;
                Keyboard.dismiss();
                if (!permission?.granted) { requestPermission(); return; }
                setPhase("capture");
              }}
            />
          </View>

          <Pressable
            onPress={() => {
              if (!productName.trim()) return;
              Keyboard.dismiss();
              if (!permission?.granted) { requestPermission(); return; }
              setPhase("capture");
            }}
            style={({ pressed }) => [
              S.primaryBtn,
              { opacity: productName.trim() ? (pressed ? 0.88 : 1) : 0.38 },
            ]}
            disabled={!productName.trim()}
          >
            <MaterialCommunityIcons name="camera-iris" size={20} color={C.onPrimary} />
            <Text style={S.primaryBtnText}>Start 5-Shot Training</Text>
          </Pressable>
        </View>

        {/* Trained products list */}
        <View style={S.sectionHeader}>
          <Text style={S.sectionHeaderLabel}>Trained Products</Text>
          <View style={[S.countBadge, { backgroundColor: C.secondaryContainer }]}>
            <Text style={[S.countBadgeText, { color: C.onSecondaryContainer }]}>{products.length}</Text>
          </View>
        </View>

        {products.length === 0 && (
          <View style={S.emptyProducts}>
            <Text style={S.emptyProductsText}>No trained products yet. Train your first part above.</Text>
          </View>
        )}

        {products.map((p) => (
          <View key={p.id} style={S.productItem}>
            <View style={[S.productIcon, {
              backgroundColor: p.active ? C.primaryContainer : C.surfaceContainerHigh,
            }]}>
              <MaterialCommunityIcons
                name="chip"
                size={20}
                color={p.active ? C.primary : C.onSurfaceVariant}
              />
            </View>

            <View style={S.productBody}>
              <Text style={S.productName} numberOfLines={1}>{p.name}</Text>
              <Text style={S.productMeta}>
                {p.shots.length} reference shots · {new Date(p.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
              </Text>
            </View>

            <View style={S.productActions}>
              {p.active ? (
                <View style={S.activeChip}>
                  <Text style={S.chipText}>ACTIVE</Text>
                </View>
              ) : (
                <Pressable
                  onPress={() => setActiveProduct(p.id)}
                  style={({ pressed }) => [S.useBtn, { opacity: pressed ? 0.7 : 1 }]}
                >
                  <Text style={S.useBtnText}>Set Active</Text>
                </Pressable>
              )}
              <Pressable
                onPress={() => Alert.alert("Remove product", `Delete "${p.name}"?`, [
                  { text: "Cancel", style: "cancel" },
                  { text: "Delete", style: "destructive", onPress: () => deleteProduct(p.id) },
                ])}
                style={S.deleteBtn}
              >
                <MaterialCommunityIcons name="delete-outline" size={18} color={C.fail} />
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const CT = 3, CZ = 20;

const S = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  appBar: {
    backgroundColor: C.surfaceContainerLow,
    borderBottomWidth: 1,
    borderBottomColor: C.outlineVariant,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    zIndex: 10,
  },
  appBarRow: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  appBarTitle: { color: C.onSurface, fontSize: 22, fontFamily: "Rajdhani_700Bold", letterSpacing: 0.2, lineHeight: 26 },
  appBarSub: { color: C.primary, fontSize: 11, fontFamily: "Rajdhani_600SemiBold", letterSpacing: 0.8, textTransform: "uppercase" },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center", marginLeft: -4, marginRight: 4 },
  stepPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: C.radiusFull,
  },
  stepPillText: { color: C.onSurfaceVariant, fontSize: 12, fontFamily: "Rajdhani_600SemiBold" },

  progressBg: { height: 3, backgroundColor: C.surfaceContainerHigh },
  progressFill: { height: 3, backgroundColor: C.primary, borderRadius: 2 },

  instructionBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: C.surfaceContainerLow,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.outlineVariant,
  },
  instructionText: {
    color: C.onSurface,
    fontSize: 15,
    fontFamily: "Rajdhani_500Medium",
    flex: 1,
    lineHeight: 22,
  },

  shotGrid: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.outlineVariant,
    backgroundColor: C.surface,
  },
  shotCell: {
    flex: 1,
    height: 64,
    borderRadius: C.radiusSm,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  shotEmptyDot: { width: 10, height: 10, borderRadius: 5 },
  shotLabel: { fontSize: 10, fontFamily: "Rajdhani_600SemiBold" },

  cameraArea: { flex: 1, backgroundColor: "#000", overflow: "hidden" },
  reticle: { ...StyleSheet.absoluteFillObject, margin: 48 },
  corner: { position: "absolute", width: CZ, height: CZ },
  cTL: { top: 0, left: 0, borderTopWidth: CT, borderLeftWidth: CT, borderColor: "#fff" },
  cTR: { top: 0, right: 0, borderTopWidth: CT, borderRightWidth: CT, borderColor: "#fff" },
  cBL: { bottom: 0, left: 0, borderBottomWidth: CT, borderLeftWidth: CT, borderColor: "#fff" },
  cBR: { bottom: 0, right: 0, borderBottomWidth: CT, borderRightWidth: CT, borderColor: "#fff" },

  captureBar: {
    backgroundColor: C.surfaceContainerLow,
    paddingHorizontal: 16,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.outlineVariant,
  },

  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 54,
    backgroundColor: C.primary,
    borderRadius: C.radius,
    elevation: 4,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  primaryBtnText: {
    color: C.onPrimary,
    fontSize: 16,
    fontFamily: "Rajdhani_700Bold",
    letterSpacing: 0.2,
  },

  processingCard: {
    backgroundColor: C.surfaceContainerLow,
    borderRadius: C.radiusLg,
    padding: 32,
    alignItems: "center",
    gap: 16,
    marginHorizontal: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  processingTitle: { color: C.onSurface, fontSize: 20, fontFamily: "Rajdhani_700Bold", letterSpacing: 0.1 },
  processingBody: { color: C.onSurfaceVariant, fontSize: 14, fontFamily: "Rajdhani_500Medium", textAlign: "center" },

  doneCard: {
    backgroundColor: C.surfaceContainerLow,
    borderRadius: C.radiusLg,
    padding: 32,
    alignItems: "center",
    gap: 12,
    width: "100%",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  doneIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  doneTitle: { color: C.onSurface, fontSize: 22, fontFamily: "Rajdhani_700Bold", letterSpacing: 0.15 },
  doneBody: { color: C.onSurfaceVariant, fontSize: 14, fontFamily: "Rajdhani_500Medium", textAlign: "center" },

  formCard: {
    backgroundColor: C.surfaceContainerLow,
    margin: 14,
    borderRadius: C.radiusLg,
    padding: 20,
    gap: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  formCardLabel: {
    color: C.primary,
    fontSize: 11,
    fontFamily: "Rajdhani_700Bold",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surfaceContainerHighest,
    borderRadius: C.radiusSm,
    paddingHorizontal: 14,
    height: 54,
    gap: 10,
  },
  nameInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Rajdhani_500Medium",
    color: C.onSurface,
    height: "100%",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: C.outlineVariant,
    borderBottomWidth: 1,
    borderBottomColor: C.outlineVariant,
    backgroundColor: C.surfaceContainerLow,
  },
  sectionHeaderLabel: {
    color: C.primary,
    fontSize: 11,
    fontFamily: "Rajdhani_700Bold",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  countBadge: {
    borderRadius: C.radiusSm,
    paddingHorizontal: 10,
    paddingVertical: 3,
    minWidth: 28,
    alignItems: "center",
  },
  countBadgeText: { fontSize: 13, fontFamily: "Rajdhani_700Bold" },

  emptyProducts: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  emptyProductsText: {
    color: C.outline,
    fontSize: 14,
    fontFamily: "Rajdhani_500Medium",
  },

  productItem: {
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
  productIcon: {
    width: 44,
    height: 44,
    borderRadius: C.radiusSm,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  productBody: { flex: 1, gap: 4 },
  productName: { color: C.onSurface, fontSize: 15, fontFamily: "Rajdhani_700Bold", letterSpacing: 0.1 },
  productMeta: { color: C.onSurfaceVariant, fontSize: 12, fontFamily: "Rajdhani_500Medium" },
  productActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  activeChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: C.radiusSm,
    backgroundColor: C.primaryContainer,
  },
  chipDot: { width: 5, height: 5, borderRadius: 99 },
  chipText: { fontSize: 11, fontFamily: "Rajdhani_700Bold", color: C.onPrimaryContainer, letterSpacing: 0.5 },
  useBtn: {
    backgroundColor: C.surfaceContainerHigh,
    borderRadius: C.radiusSm,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  useBtnText: {
    color: C.onSurfaceVariant,
    fontSize: 12,
    fontFamily: "Rajdhani_700Bold",
    letterSpacing: 0.3,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
});
