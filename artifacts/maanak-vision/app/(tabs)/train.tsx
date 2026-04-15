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
import { useColors } from "@/hooks/useColors";

type Step = "name" | "capture" | "training" | "done";

const SHOT_LABELS = [
  "Front View",
  "Side View",
  "Top View",
  "Detail Close-up",
  "Final Check",
];

export default function TrainScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { products, addProduct, setActiveProduct, deleteProduct } = useTraining();
  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep] = useState<Step>("name");
  const [productName, setProductName] = useState("");
  const [shots, setShots] = useState<string[]>([]);
  const [capturing, setCapturing] = useState(false);

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom;

  const handleCapture = async () => {
    if (capturing) return;
    setCapturing(true);
    await new Promise((r) => setTimeout(r, 600));
    const fakeUri = `shot_${shots.length + 1}_${Date.now()}`;
    const newShots = [...shots, fakeUri];
    setShots(newShots);
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setCapturing(false);
    if (newShots.length >= 5) {
      setStep("training");
      await simulateTraining(newShots);
    }
  };

  const simulateTraining = async (capturedShots: string[]) => {
    await new Promise((r) => setTimeout(r, 2000));
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 9);
    addProduct({
      id,
      name: productName,
      shots: capturedShots,
      createdAt: Date.now(),
      active: true,
    });
    if (Platform.OS !== "web") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setStep("done");
  };

  const handleReset = () => {
    setStep("name");
    setProductName("");
    setShots([]);
  };

  if (step === "name") {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
          <Text style={[styles.pageTitle, { color: colors.primary }]}>FIVE-SHOT TRAINING</Text>
          <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>
            Teach a new product standard
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={{
            padding: 20,
            paddingBottom: bottomPad + 40,
          }}
        >
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="camera" size={32} color={colors.primary} />
            <Text style={[styles.infoTitle, { color: colors.foreground }]}>
              Photograph 5 Perfect Parts
            </Text>
            <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
              Show the app what a "good" part looks like from 5 angles. The app learns your standard automatically.
            </Text>
          </View>

          <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>
            PRODUCT NAME
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                color: colors.foreground,
                borderColor: colors.border,
              },
            ]}
            placeholder="e.g. Brass Valve 3/4 inch"
            placeholderTextColor={colors.mutedForeground}
            value={productName}
            onChangeText={setProductName}
            returnKeyType="done"
          />

          <Pressable
            onPress={() => {
              if (!productName.trim()) return;
              if (!permission?.granted) {
                requestPermission();
                return;
              }
              setStep("capture");
            }}
            style={({ pressed }) => [
              styles.startBtn,
              {
                backgroundColor: productName.trim() ? colors.primary : colors.secondary,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Feather
              name="camera"
              size={20}
              color={productName.trim() ? colors.primaryForeground : colors.mutedForeground}
            />
            <Text
              style={[
                styles.startBtnText,
                {
                  color: productName.trim()
                    ? colors.primaryForeground
                    : colors.mutedForeground,
                },
              ]}
            >
              START TRAINING
            </Text>
          </Pressable>

          {products.length > 0 && (
            <View style={{ marginTop: 32 }}>
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
                TRAINED PRODUCTS ({products.length})
              </Text>
              {products.map((p) => (
                <View
                  key={p.id}
                  style={[
                    styles.productCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: p.active ? colors.primary : colors.border,
                      borderLeftColor: p.active ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <View style={styles.productCardLeft}>
                    <Feather
                      name="cpu"
                      size={16}
                      color={p.active ? colors.primary : colors.mutedForeground}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.productCardName, { color: colors.foreground }]}>
                        {p.name}
                      </Text>
                      <Text style={[styles.productCardMeta, { color: colors.mutedForeground }]}>
                        {p.shots.length} shots · {new Date(p.createdAt).toLocaleDateString("en-IN")}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.productCardActions}>
                    {!p.active && (
                      <Pressable
                        onPress={() => setActiveProduct(p.id)}
                        style={[styles.activateBtn, { borderColor: colors.primary }]}
                      >
                        <Text style={[styles.activateBtnText, { color: colors.primary }]}>
                          USE
                        </Text>
                      </Pressable>
                    )}
                    {p.active && (
                      <View style={[styles.activeTag, { backgroundColor: colors.passBackground }]}>
                        <Text style={[styles.activeTagText, { color: colors.pass }]}>ACTIVE</Text>
                      </View>
                    )}
                    <Pressable
                      onPress={() =>
                        Alert.alert("Delete Product", `Remove "${p.name}"?`, [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Delete",
                            style: "destructive",
                            onPress: () => deleteProduct(p.id),
                          },
                        ])
                      }
                    >
                      <Feather name="trash-2" size={18} color={colors.destructive} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  if (step === "capture") {
    const currentShotIndex = shots.length;
    const progress = shots.length / 5;

    return (
      <View style={[styles.container, { backgroundColor: "#000" }]}>
        {isWeb ? (
          <View style={[styles.webCam, { backgroundColor: "#111" }]}>
            <Feather name="camera" size={60} color="#333" />
          </View>
        ) : (
          <CameraView style={StyleSheet.absoluteFill} facing="back" />
        )}

        <View style={[styles.captureTop, { paddingTop: topPad + 8 }]}>
          <Pressable
            onPress={handleReset}
            style={[styles.closeBtn, { backgroundColor: "rgba(0,0,0,0.5)" }]}
          >
            <Feather name="x" size={20} color="#fff" />
          </Pressable>
          <View style={styles.captureTopCenter}>
            <Text style={styles.captureTopTitle}>
              SHOT {currentShotIndex + 1} OF 5
            </Text>
            <Text style={styles.captureTopSub}>
              {SHOT_LABELS[currentShotIndex]}
            </Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.progressBarWrap}>
          <View style={[styles.progressBarBg, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
            <View
              style={[
                styles.progressBarFill,
                { backgroundColor: "#F5C518", width: `${progress * 100}%` },
              ]}
            />
          </View>
          <View style={styles.shotDots}>
            {[0, 1, 2, 3, 4].map((i) => (
              <View
                key={i}
                style={[
                  styles.shotDot,
                  {
                    backgroundColor:
                      i < shots.length
                        ? "#F5C518"
                        : i === shots.length
                        ? "rgba(245,197,24,0.4)"
                        : "rgba(255,255,255,0.2)",
                  },
                ]}
              />
            ))}
          </View>
        </View>

        <View style={[styles.captureBottom, { paddingBottom: insets.bottom + (isWeb ? 34 : 20) }]}>
          <Pressable
            onPress={handleCapture}
            disabled={capturing}
            style={({ pressed }) => [
              styles.captureBtnLarge,
              {
                backgroundColor: capturing ? "#555" : "#F5C518",
                opacity: pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.94 : 1 }],
              },
            ]}
          >
            {capturing ? (
              <ActivityIndicator color="#1C1C1E" size="large" />
            ) : (
              <Feather name="camera" size={36} color="#1C1C1E" />
            )}
          </Pressable>
          <Text style={styles.captureHint}>
            {capturing ? "Processing..." : "Tap to capture this shot"}
          </Text>
        </View>
      </View>
    );
  }

  if (step === "training") {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={[styles.trainingTitle, { color: colors.foreground }]}>
          LEARNING PRODUCT STANDARD
        </Text>
        <Text style={[styles.trainingText, { color: colors.mutedForeground }]}>
          Analysing {shots.length} reference shots...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.center, { backgroundColor: colors.background, padding: 32 }]}>
      <Feather name="check-circle" size={72} color={colors.pass} />
      <Text style={[styles.doneTitle, { color: colors.foreground }]}>
        TRAINING COMPLETE
      </Text>
      <Text style={[styles.doneText, { color: colors.mutedForeground }]}>
        "{productName}" has been trained and set as the active product standard.
      </Text>
      <Pressable
        onPress={handleReset}
        style={({ pressed }) => [
          styles.doneBtn,
          { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Text style={[styles.doneBtnText, { color: colors.primaryForeground }]}>
          TRAIN ANOTHER PRODUCT
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 2,
  },
  pageSub: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  infoCard: {
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    gap: 10,
    marginBottom: 28,
    borderWidth: 1,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  infoText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 20,
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    borderRadius: 10,
    minHeight: 60,
  },
  startBtnText: {
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 10,
  },
  productCard: {
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderLeftWidth: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  productCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  productCardName: {
    fontSize: 15,
    fontWeight: "700",
  },
  productCardMeta: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  productCardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  activateBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
    borderWidth: 1,
  },
  activateBtnText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  activeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  activeTagText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  webCam: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  captureTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingBottom: 12,
    justifyContent: "space-between",
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  captureTopCenter: { flex: 1, alignItems: "center" },
  captureTopTitle: {
    color: "#F5C518",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 2,
  },
  captureTopSub: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  progressBarWrap: {
    paddingHorizontal: 32,
    gap: 10,
  },
  progressBarBg: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  shotDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  shotDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  captureBottom: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
  },
  captureBtnLarge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#F5C518",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
  },
  captureHint: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 10,
  },
  trainingTitle: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 2,
    textAlign: "center",
  },
  trainingText: {
    fontSize: 15,
    textAlign: "center",
  },
  doneTitle: {
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 3,
    textAlign: "center",
    marginTop: 12,
  },
  doneText: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 24,
  },
  doneBtn: {
    paddingHorizontal: 28,
    paddingVertical: 18,
    borderRadius: 10,
    marginTop: 8,
    minWidth: 200,
    alignItems: "center",
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
});
