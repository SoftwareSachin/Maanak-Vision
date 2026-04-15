import { MaterialCommunityIcons } from "@expo/vector-icons";
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
import C from "@/constants/colors";
import { useInspection } from "@/context/InspectionContext";
import { useTraining } from "@/context/TrainingContext";
import type { InspectionResult } from "@/context/InspectionContext";

type Filter = "all" | InspectionResult;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all",     label: "All"     },
  { key: "pass",    label: "Pass"    },
  { key: "fail",    label: "Fail"    },
  { key: "warning", label: "Caution" },
];

export default function InspectScreen() {
  const insets = useSafeAreaInsets();
  const { inspections, currentBatch, startBatch, closeBatch } = useInspection();
  const { activeProduct, products } = useTraining();
  const [filter, setFilter] = useState<Filter>("all");
  const [showSheet, setShowSheet] = useState(false);
  const [batchName, setBatchName] = useState("");

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 56 : insets.top;
  const bottomPad = isWeb ? 32 : insets.bottom;

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
    <View style={[S.root, { backgroundColor: C.background }]}>

      {/* Top App Bar */}
      <View style={[S.appBar, { paddingTop: topPad }]}>
        <View style={S.appBarRow}>
          <Text style={S.appBarTitle}>Maanak Vision</Text>
          {inspections.length > 0 && (
            <View style={S.statCapsules}>
              <StatCapsule value={passCount} color={C.pass} bg={C.passContainer} />
              <StatCapsule value={failCount} color={C.fail} bg={C.failContainer} />
              <StatCapsule value={warnCount} color={C.warn} bg={C.warnContainer} />
            </View>
          )}
        </View>
      </View>

      {/* Active batch banner */}
      {currentBatch && (
        <View style={S.batchBanner}>
          <View style={S.batchBannerLeft}>
            <View style={S.batchActiveDot} />
            <View>
              <Text style={S.batchBannerName} numberOfLines={1}>{currentBatch.productName}</Text>
              <Text style={S.batchBannerMeta}>
                {currentBatch.totalParts} scanned · {currentBatch.passed} pass · {currentBatch.failed} fail
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => closeBatch(currentBatch.id)}
            style={({ pressed }) => [S.closeBatchBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={S.closeBatchText}>Close</Text>
          </Pressable>
        </View>
      )}

      {/* Filter Chip Bar */}
      <View style={S.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.filterBarContent}>
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={[S.filterChip, active && S.filterChipActive]}
              >
                {active && (
                  <MaterialCommunityIcons name="check" size={14} color={C.onSurfaceVariant} />
                )}
                <Text style={[S.filterChipText, active && S.filterChipTextActive]}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
          <Text style={S.filterCount}>{filtered.length} records</Text>
        </ScrollView>
      </View>

      {/* Inspection list */}
      <FlatList
        data={filtered.slice(0, 80)}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <InspectionCard inspection={item} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={S.emptyState}>
            <MaterialCommunityIcons name="magnify-scan" size={40} color={C.outlineVariant} />
            <Text style={S.emptyTitle}>No inspection records</Text>
            <Text style={S.emptyBody}>Start a batch and scan parts to see results here.</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: bottomPad + 100 }}
      />

      {/* Extended FAB */}
      <Pressable
        onPress={handleScan}
        style={({ pressed }) => [S.fab, { bottom: bottomPad + (isWeb ? 80 : 68), opacity: pressed ? 0.88 : 1 }]}
      >
        <MaterialCommunityIcons name="barcode-scan" size={18} color={C.onPrimary} />
        <Text style={S.fabText}>Scan Part</Text>
      </Pressable>

      {/* Bottom sheet — Start batch */}
      <Modal visible={showSheet} transparent animationType="slide" onRequestClose={() => setShowSheet(false)}>
        <Pressable style={S.scrim} onPress={() => setShowSheet(false)} />
        <View style={[S.sheet, { paddingBottom: bottomPad + 20 }]}>
          <View style={S.sheetHandle} />
          <Text style={S.sheetTitle}>New Inspection Batch</Text>

          <View style={S.inputContainer}>
            <MaterialCommunityIcons name="label-outline" size={18} color={C.onSurfaceVariant} style={S.inputIcon} />
            <TextInput
              style={S.sheetInput}
              placeholder="Product or batch name"
              placeholderTextColor={C.outline}
              value={batchName}
              onChangeText={setBatchName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleStart}
            />
          </View>

          {products.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={S.quickChipScroll}>
              {products.map((p) => {
                const sel = batchName === p.name;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => setBatchName(p.name)}
                    style={[S.quickChip, sel && S.quickChipSelected]}
                  >
                    <Text style={[S.quickChipText, sel && S.quickChipTextSelected]}>{p.name}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          <Pressable
            onPress={handleStart}
            style={({ pressed }) => [S.startBtn, { opacity: batchName.trim() ? (pressed ? 0.88 : 1) : 0.38 }]}
            disabled={!batchName.trim()}
          >
            <MaterialCommunityIcons name="play-circle-outline" size={20} color={C.onPrimary} />
            <Text style={S.startBtnText}>Start Batch</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

function StatCapsule({ value, color, bg }: { value: number; color: string; bg: string }) {
  return (
    <View style={[S.statCapsule, { backgroundColor: bg }]}>
      <Text style={[S.statCapsuleNum, { color }]}>{value}</Text>
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1 },

  appBar: {
    backgroundColor: C.surfaceContainerLow,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.outlineVariant,
  },
  appBarRow: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  appBarTitle: {
    color: C.onSurface,
    fontSize: 22,
    fontFamily: "Rajdhani_600SemiBold",
    letterSpacing: 0.15,
  },
  statCapsules: { flexDirection: "row", gap: 6 },
  statCapsule: {
    borderRadius: C.radiusFull,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 32,
    alignItems: "center",
  },
  statCapsuleNum: {
    fontSize: 13,
    fontFamily: "Rajdhani_700Bold",
  },

  batchBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: C.primaryContainer,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.outlineVariant,
  },
  batchBannerLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  batchActiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.primary,
  },
  batchBannerName: {
    color: C.onPrimaryContainer,
    fontSize: 14,
    fontFamily: "Rajdhani_600SemiBold",
  },
  batchBannerMeta: {
    color: C.primary,
    fontSize: 12,
    fontFamily: "Rajdhani_400Regular",
    marginTop: 1,
    opacity: 0.8,
  },
  closeBatchBtn: {
    borderWidth: 1,
    borderColor: C.primary,
    borderRadius: C.radiusFull,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  closeBatchText: {
    color: C.primary,
    fontSize: 12,
    fontFamily: "Rajdhani_600SemiBold",
    letterSpacing: 0.4,
  },

  filterBar: {
    backgroundColor: C.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.outlineVariant,
  },
  filterBarContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    alignItems: "center",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: C.radiusFull,
    borderWidth: 1,
    borderColor: C.outlineVariant,
    backgroundColor: "transparent",
  },
  filterChipActive: {
    backgroundColor: C.secondaryContainer,
    borderColor: "transparent",
  },
  filterChipText: {
    color: C.onSurfaceVariant,
    fontSize: 13,
    fontFamily: "Rajdhani_500Medium",
    letterSpacing: 0.2,
  },
  filterChipTextActive: {
    color: C.onSecondaryContainer,
    fontFamily: "Rajdhani_600SemiBold",
  },
  filterCount: {
    color: C.outline,
    fontSize: 12,
    fontFamily: "Rajdhani_400Regular",
    marginLeft: 4,
  },

  emptyState: {
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    color: C.onSurfaceVariant,
    fontSize: 16,
    fontFamily: "Rajdhani_500Medium",
    letterSpacing: 0.15,
  },
  emptyBody: {
    color: C.outline,
    fontSize: 14,
    fontFamily: "Rajdhani_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },

  fab: {
    position: "absolute",
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.primary,
    paddingHorizontal: 20,
    height: 56,
    borderRadius: C.radiusLg,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: {
    color: C.onPrimary,
    fontSize: 15,
    fontFamily: "Rajdhani_700Bold",
    letterSpacing: 0.1,
  },

  scrim: { flex: 1, backgroundColor: C.scrim },
  sheet: {
    backgroundColor: C.surfaceContainerHigh,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    gap: 16,
  },
  sheetHandle: {
    width: 32,
    height: 4,
    backgroundColor: C.onSurfaceVariant,
    borderRadius: 2,
    alignSelf: "center",
    opacity: 0.4,
    marginBottom: 8,
  },
  sheetTitle: {
    color: C.onSurface,
    fontSize: 20,
    fontFamily: "Rajdhani_600SemiBold",
    letterSpacing: 0.15,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surfaceContainerHighest,
    borderRadius: C.radiusSm,
    paddingHorizontal: 12,
    height: 52,
    gap: 8,
  },
  inputIcon: { opacity: 0.6 },
  sheetInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Rajdhani_400Regular",
    color: C.onSurface,
    height: "100%",
  },
  quickChipScroll: { flexGrow: 0 },
  quickChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: C.radiusFull,
    borderWidth: 1,
    borderColor: C.outlineVariant,
    marginRight: 8,
  },
  quickChipSelected: {
    backgroundColor: C.primaryContainer,
    borderColor: C.primary,
  },
  quickChipText: {
    color: C.onSurfaceVariant,
    fontSize: 13,
    fontFamily: "Rajdhani_500Medium",
  },
  quickChipTextSelected: {
    color: C.onPrimaryContainer,
    fontFamily: "Rajdhani_600SemiBold",
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 56,
    backgroundColor: C.primary,
    borderRadius: C.radius,
  },
  startBtnText: {
    color: C.onPrimary,
    fontSize: 16,
    fontFamily: "Rajdhani_700Bold",
    letterSpacing: 0.1,
  },
});
