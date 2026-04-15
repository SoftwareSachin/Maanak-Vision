import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import InspectionCard from "@/components/InspectionCard";
import { useInspection } from "@/context/InspectionContext";
import { useTraining } from "@/context/TrainingContext";
import { useColors } from "@/hooks/useColors";

export default function InspectScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { inspections, currentBatch, startBatch, closeBatch } = useInspection();
  const { activeProduct, products } = useTraining();
  const [showBatchSheet, setShowBatchSheet] = useState(false);
  const [batchName, setBatchName] = useState(activeProduct?.name ?? "");

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom;

  const passed = inspections.filter((i) => i.result === "pass").length;
  const failed = inspections.filter((i) => i.result === "fail").length;
  const total = inspections.length;

  const handleScan = () => {
    if (!currentBatch) {
      setBatchName(activeProduct?.name ?? "");
      setShowBatchSheet(true);
      return;
    }
    router.push("/scan");
  };

  const handleStartBatch = () => {
    if (!batchName.trim()) return;
    startBatch(batchName.trim());
    setShowBatchSheet(false);
    router.push("/scan");
  };

  return (
    <View style={[styles.root, { backgroundColor: "#000" }]}>
      {/* Top header */}
      <View style={[styles.topBar, { paddingTop: topPad + 8, borderBottomColor: "#1E1E1E" }]}>
        <View>
          <Text style={styles.appName}>MAANAK VISION</Text>
          <Text style={styles.appSub}>BIS 2026 Quality Control</Text>
        </View>
        {total > 0 && (
          <View style={styles.summaryChips}>
            <View style={[styles.chip, { backgroundColor: "#0D2E18" }]}>
              <Text style={[styles.chipNum, { color: "#22C55E" }]}>{passed}</Text>
              <Text style={[styles.chipLabel, { color: "#22C55E" }]}>PASS</Text>
            </View>
            <View style={[styles.chip, { backgroundColor: "#2E0D0D" }]}>
              <Text style={[styles.chipNum, { color: "#EF4444" }]}>{failed}</Text>
              <Text style={[styles.chipLabel, { color: "#EF4444" }]}>FAIL</Text>
            </View>
          </View>
        )}
      </View>

      {/* Active batch strip */}
      {currentBatch && (
        <View style={[styles.batchStrip, { borderBottomColor: "#1E1E1E" }]}>
          <View style={[styles.liveIndicator, { backgroundColor: colors.primary }]} />
          <View style={styles.batchStripCenter}>
            <Text style={styles.batchStripName} numberOfLines={1}>
              {currentBatch.productName}
            </Text>
            <Text style={styles.batchStripMeta}>
              {currentBatch.totalParts} scanned · {currentBatch.passed} pass · {currentBatch.failed} fail
            </Text>
          </View>
          <Pressable
            onPress={() => closeBatch(currentBatch.id)}
            style={({ pressed }) => [styles.closeStripBtn, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Text style={styles.closeStripText}>CLOSE</Text>
          </Pressable>
        </View>
      )}

      {/* Product active row */}
      {activeProduct && !currentBatch && (
        <View style={[styles.productRow, { borderBottomColor: "#1E1E1E" }]}>
          <Feather name="cpu" size={14} color="#555" />
          <Text style={styles.productRowText} numberOfLines={1}>
            {activeProduct.name}
          </Text>
          <Text style={styles.productRowMeta}>{activeProduct.shots.length} ref shots</Text>
        </View>
      )}

      {/* Section label */}
      <View style={[styles.sectionHeader, { borderBottomColor: "#1E1E1E" }]}>
        <Text style={styles.sectionLabel}>RECENT INSPECTIONS</Text>
        {total > 0 && (
          <Text style={styles.sectionCount}>{total}</Text>
        )}
      </View>

      {/* Inspection list */}
      {inspections.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="search" size={32} color="#2A2A2A" />
          <Text style={styles.emptyText}>No inspections yet</Text>
          <Text style={styles.emptyHint}>Tap SCAN to start a batch</Text>
        </View>
      ) : (
        <FlatList
          data={inspections.slice(0, 40)}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <InspectionCard inspection={item} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomPad + 90 }}
        />
      )}

      {/* SCAN FAB */}
      <Pressable
        onPress={handleScan}
        style={({ pressed }) => [
          styles.fab,
          {
            bottom: bottomPad + (isWeb ? 84 : 66),
            opacity: pressed ? 0.85 : 1,
            transform: [{ scale: pressed ? 0.96 : 1 }],
          },
        ]}
      >
        <Feather name="zap" size={20} color="#1C1C1E" />
        <Text style={styles.fabText}>SCAN PART</Text>
      </Pressable>

      {/* Batch bottom sheet */}
      <Modal visible={showBatchSheet} transparent animationType="slide" onRequestClose={() => setShowBatchSheet(false)}>
        <Pressable style={styles.sheetOverlay} onPress={() => setShowBatchSheet(false)} />
        <View style={[styles.sheet, { paddingBottom: bottomPad + 20 }]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>START BATCH</Text>
          <Text style={styles.sheetSub}>Name this inspection batch</Text>

          <TextInput
            style={styles.sheetInput}
            placeholder="e.g. Brass Valve 3/4 inch"
            placeholderTextColor="#444"
            value={batchName}
            onChangeText={setBatchName}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleStartBatch}
          />

          {products.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {products.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => setBatchName(p.name)}
                  style={[
                    styles.productChip,
                    { backgroundColor: batchName === p.name ? colors.primary : "#1E1E1E" },
                  ]}
                >
                  <Text style={[styles.productChipText, { color: batchName === p.name ? "#1C1C1E" : "#999" }]}>
                    {p.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}

          <Pressable
            onPress={handleStartBatch}
            disabled={!batchName.trim()}
            style={({ pressed }) => [
              styles.sheetBtn,
              { opacity: batchName.trim() ? (pressed ? 0.85 : 1) : 0.4 },
            ]}
          >
            <Text style={styles.sheetBtnText}>START BATCH</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  appName: {
    color: "#F5C518",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 3,
  },
  appSub: {
    color: "#444",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.8,
    marginTop: 1,
  },
  summaryChips: {
    flexDirection: "row",
    gap: 6,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  chipNum: {
    fontSize: 16,
    fontWeight: "900",
  },
  chipLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  batchStrip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 10,
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  batchStripCenter: { flex: 1 },
  batchStripName: {
    color: "#F0F0F0",
    fontSize: 14,
    fontWeight: "700",
  },
  batchStripMeta: {
    color: "#555",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 1,
  },
  closeStripBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    backgroundColor: "#1E1E1E",
  },
  closeStripText: {
    color: "#666",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
  },
  productRowText: {
    color: "#888",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  productRowMeta: {
    color: "#444",
    fontSize: 12,
    fontWeight: "500",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  sectionLabel: {
    color: "#444",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
  },
  sectionCount: {
    color: "#444",
    fontSize: 11,
    fontWeight: "700",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 8,
  },
  emptyHint: {
    color: "#2A2A2A",
    fontSize: 13,
    fontWeight: "500",
  },
  fab: {
    position: "absolute",
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F5C518",
    paddingHorizontal: 22,
    paddingVertical: 16,
    borderRadius: 6,
    elevation: 0,
    shadowOpacity: 0,
  },
  fabText: {
    color: "#1C1C1E",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheet: {
    backgroundColor: "#111",
    borderTopWidth: 1,
    borderTopColor: "#2A2A2A",
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sheetHandle: {
    width: 36,
    height: 3,
    backgroundColor: "#333",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  sheetTitle: {
    color: "#F0F0F0",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 4,
  },
  sheetSub: {
    color: "#555",
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 20,
  },
  sheetInput: {
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: "#F0F0F0",
    fontWeight: "600",
    marginBottom: 14,
  },
  chipScroll: {
    marginBottom: 20,
  },
  productChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  productChipText: {
    fontSize: 13,
    fontWeight: "700",
  },
  sheetBtn: {
    backgroundColor: "#F5C518",
    paddingVertical: 18,
    borderRadius: 6,
    alignItems: "center",
  },
  sheetBtnText: {
    color: "#1C1C1E",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 2,
  },
});
