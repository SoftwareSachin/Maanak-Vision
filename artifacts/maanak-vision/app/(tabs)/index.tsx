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
import type { InspectionResult } from "@/context/InspectionContext";

type Filter = "all" | InspectionResult;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pass", label: "Pass" },
  { key: "fail", label: "Fail" },
  { key: "warning", label: "Warn" },
];

export default function InspectScreen() {
  const insets = useSafeAreaInsets();
  const { inspections, currentBatch, startBatch, closeBatch } = useInspection();
  const { activeProduct, products } = useTraining();
  const [filter, setFilter] = useState<Filter>("all");
  const [showSheet, setShowSheet] = useState(false);
  const [batchName, setBatchName] = useState("");

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom;

  const filtered = filter === "all" ? inspections : inspections.filter((i) => i.result === filter);
  const passCount = inspections.filter((i) => i.result === "pass").length;
  const failCount = inspections.filter((i) => i.result === "fail").length;
  const warnCount = inspections.filter((i) => i.result === "warning").length;

  const handleScan = () => {
    if (!currentBatch) { setBatchName(activeProduct?.name ?? ""); setShowSheet(true); }
    else router.push("/scan");
  };

  const handleStart = () => {
    if (!batchName.trim()) return;
    startBatch(batchName.trim());
    setShowSheet(false);
    router.push("/scan");
  };

  return (
    <View style={[S.root, { backgroundColor: "#0f0f0f" }]}>

      {/* Header row — app name left, live stats right */}
      <View style={[S.header, { paddingTop: topPad + 8 }]}>
        <Text style={S.appName}>MAANAK VISION</Text>
        {inspections.length > 0 && (
          <View style={S.statRow}>
            <Text style={[S.statNum, { color: "#22C55E" }]}>{passCount}</Text>
            <Text style={S.statSep}>/</Text>
            <Text style={[S.statNum, { color: "#EF4444" }]}>{failCount}</Text>
            <Text style={S.statSep}>/</Text>
            <Text style={[S.statNum, { color: "#F59E0B" }]}>{warnCount}</Text>
            <Text style={S.statLabel}>  P/F/W</Text>
          </View>
        )}
      </View>

      {/* Active batch — pinned strip below header */}
      {currentBatch && (
        <View style={[S.batchStrip]}>
          <View style={[S.activePip, { backgroundColor: "#F5C518" }]} />
          <View style={{ flex: 1 }}>
            <Text style={S.batchName} numberOfLines={1}>{currentBatch.productName}</Text>
            <Text style={S.batchMeta}>{currentBatch.totalParts} scanned · {currentBatch.passed} pass · {currentBatch.failed} fail</Text>
          </View>
          <Pressable onPress={() => closeBatch(currentBatch.id)} style={S.closeChip}>
            <Text style={S.closeChipText}>CLOSE BATCH</Text>
          </Pressable>
        </View>
      )}

      {/* Filter tabs */}
      <View style={S.filterBar}>
        {FILTERS.map((f) => (
          <Pressable key={f.key} onPress={() => setFilter(f.key)} style={S.filterTab}>
            <Text style={[S.filterText, { color: filter === f.key ? "#F5C518" : "#6B6B6B" }]}>{f.label}</Text>
            {filter === f.key && <View style={S.activeUnderline} />}
          </Pressable>
        ))}
        <Text style={S.filterTotal}>{filtered.length}</Text>
      </View>

      {/* Inspection list — flat, no cards, no empty state illustration */}
      <FlatList
        data={filtered.slice(0, 80)}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <InspectionCard inspection={item} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={S.emptyRow}>
            <Text style={S.emptyText}>No records</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: bottomPad + 90 }}
      />

      {/* SCAN FAB */}
      <Pressable
        onPress={handleScan}
        style={({ pressed }) => [S.fab, { bottom: bottomPad + (isWeb ? 84 : 70), opacity: pressed ? 0.85 : 1 }]}
      >
        <Feather name="zap" size={16} color="#000" />
        <Text style={S.fabText}>SCAN PART</Text>
      </Pressable>

      {/* Start batch sheet */}
      <Modal visible={showSheet} transparent animationType="slide" onRequestClose={() => setShowSheet(false)}>
        <Pressable style={S.overlay} onPress={() => setShowSheet(false)} />
        <View style={[S.sheet, { paddingBottom: bottomPad + 16 }]}>
          <View style={S.sheetHandle} />
          <TextInput
            style={S.sheetInput}
            placeholder="Product or batch name"
            placeholderTextColor="#444"
            value={batchName}
            onChangeText={setBatchName}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleStart}
          />
          {products.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {products.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => setBatchName(p.name)}
                  style={[S.quickChip, { backgroundColor: batchName === p.name ? "#F5C518" : "#1a1a1a" }]}
                >
                  <Text style={{ color: batchName === p.name ? "#000" : "#6B6B6B", fontSize: 13, fontFamily: "Rajdhani_500Medium" }}>
                    {p.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
          <Pressable
            onPress={handleStart}
            style={({ pressed }) => [S.startBtn, { opacity: batchName.trim() ? (pressed ? 0.85 : 1) : 0.35 }]}
          >
            <Text style={S.startBtnText}>START BATCH</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#2a2a2a",
  },
  appName: {
    color: "#F5C518",
    fontSize: 20,
    fontFamily: "Rajdhani_700Bold",
    letterSpacing: 3,
  },
  statRow: { flexDirection: "row", alignItems: "center" },
  statNum: { fontSize: 18, fontFamily: "Rajdhani_700Bold" },
  statSep: { color: "#2a2a2a", fontSize: 16, marginHorizontal: 1 },
  statLabel: { color: "#6B6B6B", fontSize: 10, fontFamily: "Rajdhani_700Bold", letterSpacing: 1 },
  batchStrip: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#2a2a2a",
    gap: 0,
  },
  activePip: { width: 3, height: "100%", marginRight: 13 },
  batchName: { color: "#fff", fontSize: 14, fontFamily: "Rajdhani_600SemiBold" },
  batchMeta: { color: "#6B6B6B", fontSize: 11, fontFamily: "Rajdhani_400Regular" },
  closeChip: {
    marginRight: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#1a1a1a",
    borderRadius: 3,
  },
  closeChipText: { color: "#6B6B6B", fontSize: 10, fontFamily: "Rajdhani_700Bold", letterSpacing: 1 },
  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 36,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#2a2a2a",
    gap: 20,
  },
  filterTab: { alignItems: "center", position: "relative", paddingBottom: 1 },
  filterText: { fontSize: 13, fontFamily: "Rajdhani_600SemiBold", letterSpacing: 0.6 },
  activeUnderline: { position: "absolute", bottom: 0, left: 0, right: 0, height: 2, backgroundColor: "#F5C518" },
  filterTotal: { marginLeft: "auto", color: "#2a2a2a", fontSize: 12, fontFamily: "Rajdhani_400Regular" },
  // Empty state — plain left-aligned text only, no icon
  emptyRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#2a2a2a",
  },
  emptyText: { color: "#2a2a2a", fontSize: 13, fontFamily: "Rajdhani_400Regular" },
  fab: {
    position: "absolute",
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F5C518",
    paddingHorizontal: 20,
    height: 52,
    borderRadius: 6,
    elevation: 0,
    shadowOpacity: 0,
  },
  fabText: { color: "#000", fontSize: 16, fontFamily: "Rajdhani_700Bold", letterSpacing: 2 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: {
    backgroundColor: "#111",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#2a2a2a",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sheetHandle: { width: 36, height: 3, backgroundColor: "#2a2a2a", borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  sheetInput: {
    height: 52,
    backgroundColor: "#1a1a1a",
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
    paddingHorizontal: 14,
    fontSize: 16,
    fontFamily: "Rajdhani_500Medium",
    color: "#fff",
    marginBottom: 12,
  },
  quickChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 3, marginRight: 8 },
  startBtn: { height: 60, backgroundColor: "#F5C518", borderRadius: 6, alignItems: "center", justifyContent: "center" },
  startBtnText: { color: "#000", fontSize: 18, fontFamily: "Rajdhani_700Bold", letterSpacing: 2 },
});
