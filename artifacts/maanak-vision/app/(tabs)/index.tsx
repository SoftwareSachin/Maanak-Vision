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
import { F } from "@/constants/fonts";
import { useInspection } from "@/context/InspectionContext";
import { useTraining } from "@/context/TrainingContext";
import type { InspectionResult } from "@/context/InspectionContext";

type Filter = "all" | InspectionResult;

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

  const filtered =
    filter === "all" ? inspections : inspections.filter((i) => i.result === filter);

  const passCount = inspections.filter((i) => i.result === "pass").length;
  const failCount = inspections.filter((i) => i.result === "fail").length;

  const handleScan = () => {
    if (!currentBatch) {
      setBatchName(activeProduct?.name ?? "");
      setShowSheet(true);
    } else {
      router.push("/scan");
    }
  };

  const handleStart = () => {
    if (!batchName.trim()) return;
    startBatch(batchName.trim());
    setShowSheet(false);
    router.push("/scan");
  };

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pass", label: "Pass" },
    { key: "fail", label: "Fail" },
    { key: "warning", label: "Warn" },
  ];

  return (
    <View style={[S.root, { backgroundColor: "#0f0f0f" }]}>
      {/* Top bar */}
      <View style={[S.topBar, { paddingTop: topPad + 6 }]}>
        <View>
          <Text style={S.appName}>MAANAK VISION</Text>
          <Text style={S.appSub}>BIS 2026 Quality Control</Text>
        </View>
        {inspections.length > 0 && (
          <View style={S.topStats}>
            <Text style={[S.topStatNum, { color: "#22C55E" }]}>{passCount}</Text>
            <Text style={S.topStatSlash}>/</Text>
            <Text style={[S.topStatNum, { color: "#EF4444" }]}>{failCount}</Text>
            <Text style={S.topStatLabel}>P/F</Text>
          </View>
        )}
      </View>

      {/* Active batch strip */}
      {currentBatch && (
        <View style={[S.batchStrip, { borderBottomColor: "#2a2a2a", borderTopColor: "#2a2a2a" }]}>
          <View style={[S.liveBar, { backgroundColor: "#F5C518" }]} />
          <View style={S.batchStripMid}>
            <Text style={S.batchName} numberOfLines={1}>{currentBatch.productName}</Text>
            <Text style={S.batchMeta}>
              {currentBatch.totalParts} parts · {currentBatch.passed} pass · {currentBatch.failed} fail
            </Text>
          </View>
          <Pressable onPress={() => closeBatch(currentBatch.id)} style={S.closeBtn}>
            <Text style={S.closeBtnText}>CLOSE</Text>
          </Pressable>
        </View>
      )}

      {/* Active product row */}
      {activeProduct && !currentBatch && (
        <View style={[S.productRow, { borderBottomColor: "#2a2a2a" }]}>
          <Feather name="cpu" size={13} color="#6B6B6B" />
          <Text style={S.productRowText} numberOfLines={1}>{activeProduct.name}</Text>
          <Text style={S.productRowMeta}>{activeProduct.shots.length} ref shots</Text>
        </View>
      )}

      {/* Filter tabs — text only, yellow underline on active */}
      <View style={[S.filterRow, { borderBottomColor: "#2a2a2a" }]}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={S.filterTab}
          >
            <Text style={[S.filterText, { color: filter === f.key ? "#F5C518" : "#6B6B6B" }]}>
              {f.label}
            </Text>
            {filter === f.key && <View style={S.filterUnderline} />}
          </Pressable>
        ))}
        {filtered.length > 0 && (
          <Text style={S.filterCount}>{filtered.length}</Text>
        )}
      </View>

      {/* Flat list — no cards */}
      {filtered.length === 0 ? (
        <View style={S.empty}>
          <Feather name="search" size={28} color="#2a2a2a" />
          <Text style={S.emptyText}>
            {inspections.length === 0 ? "No inspections yet" : "Nothing matches filter"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered.slice(0, 60)}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <InspectionCard inspection={item} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomPad + 80 }}
        />
      )}

      {/* SCAN FAB */}
      <Pressable
        onPress={handleScan}
        style={({ pressed }) => [
          S.fab,
          { bottom: bottomPad + (isWeb ? 84 : 66), opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Feather name="zap" size={16} color="#000" />
        <Text style={S.fabText}>SCAN PART</Text>
      </Pressable>

      {/* Start batch bottom sheet */}
      <Modal visible={showSheet} transparent animationType="slide" onRequestClose={() => setShowSheet(false)}>
        <Pressable style={S.overlay} onPress={() => setShowSheet(false)} />
        <View style={[S.sheet, { paddingBottom: bottomPad + 16, backgroundColor: "#252525" }]}>
          <View style={S.sheetHandle} />
          <Text style={S.sheetTitle}>START BATCH</Text>
          <TextInput
            style={[S.sheetInput, { backgroundColor: "#1a1a1a", color: "#fff", borderColor: "#2a2a2a" }]}
            placeholder="Product name"
            placeholderTextColor="#6B6B6B"
            value={batchName}
            onChangeText={setBatchName}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleStart}
          />
          {products.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {products.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => setBatchName(p.name)}
                  style={[S.quickChip, { backgroundColor: batchName === p.name ? "#F5C518" : "#1a1a1a" }]}
                >
                  <Text style={{ color: batchName === p.name ? "#000" : "#A1A1A0", fontSize: 13, fontFamily: F.medium }}>
                    {p.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
          <Pressable
            onPress={handleStart}
            disabled={!batchName.trim()}
            style={({ pressed }) => [S.sheetBtn, { opacity: batchName.trim() ? (pressed ? 0.85 : 1) : 0.4 }]}
          >
            <Text style={S.sheetBtnText}>START BATCH</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
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
  appSub: {
    color: "#6B6B6B",
    fontSize: 11,
    fontFamily: "Rajdhani_400Regular",
    letterSpacing: 0.6,
    marginTop: 1,
  },
  topStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  topStatNum: {
    fontSize: 20,
    fontFamily: "Rajdhani_700Bold",
  },
  topStatSlash: {
    color: "#2a2a2a",
    fontSize: 18,
    fontFamily: "Rajdhani_400Regular",
  },
  topStatLabel: {
    color: "#6B6B6B",
    fontSize: 11,
    fontFamily: "Rajdhani_700Bold",
    letterSpacing: 1,
    marginLeft: 2,
  },
  batchStrip: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopWidth: StyleSheet.hairlineWidth,
    backgroundColor: "#0f0f0f",
    gap: 10,
  },
  liveBar: { width: 3, height: "100%" },
  batchStripMid: { flex: 1 },
  batchName: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Rajdhani_600SemiBold",
    letterSpacing: 0.3,
  },
  batchMeta: {
    color: "#6B6B6B",
    fontSize: 11,
    fontFamily: "Rajdhani_400Regular",
  },
  closeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 12,
    backgroundColor: "#1a1a1a",
    borderRadius: 4,
  },
  closeBtnText: {
    color: "#6B6B6B",
    fontSize: 11,
    fontFamily: "Rajdhani_700Bold",
    letterSpacing: 1,
  },
  productRow: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  productRowText: {
    color: "#6B6B6B",
    fontSize: 13,
    fontFamily: "Rajdhani_400Regular",
    flex: 1,
  },
  productRowMeta: {
    color: "#2a2a2a",
    fontSize: 12,
    fontFamily: "Rajdhani_400Regular",
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 38,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 20,
  },
  filterTab: {
    alignItems: "center",
    position: "relative",
    paddingBottom: 2,
  },
  filterText: {
    fontSize: 13,
    fontFamily: "Rajdhani_600SemiBold",
    letterSpacing: 0.8,
  },
  filterUnderline: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "#F5C518",
  },
  filterCount: {
    color: "#2a2a2a",
    fontSize: 12,
    fontFamily: "Rajdhani_400Regular",
    marginLeft: "auto",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  emptyText: {
    color: "#2a2a2a",
    fontSize: 15,
    fontFamily: "Rajdhani_500Medium",
  },
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
  fabText: {
    color: "#000",
    fontSize: 16,
    fontFamily: "Rajdhani_700Bold",
    letterSpacing: 2,
  },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#2a2a2a",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sheetHandle: {
    width: 36,
    height: 3,
    backgroundColor: "#2a2a2a",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  sheetTitle: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Rajdhani_700Bold",
    letterSpacing: 2,
    marginBottom: 14,
  },
  sheetInput: {
    height: 52,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 4,
    paddingHorizontal: 14,
    fontSize: 16,
    fontFamily: "Rajdhani_500Medium",
    marginBottom: 14,
  },
  quickChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 4,
    marginRight: 8,
  },
  sheetBtn: {
    height: 60,
    backgroundColor: "#F5C518",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetBtnText: {
    color: "#000",
    fontSize: 18,
    fontFamily: "Rajdhani_700Bold",
    letterSpacing: 2,
  },
});
