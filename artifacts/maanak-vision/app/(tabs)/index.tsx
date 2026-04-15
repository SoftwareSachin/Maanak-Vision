import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
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

      {/* Top App Bar — elevated, bold */}
      <View style={[S.appBar, { paddingTop: topPad }]}>
        <View style={S.appBarRow}>
          <View>
            <Text style={S.appBarTitle}>Maanak Vision</Text>
            <Text style={S.appBarSub}>Industrial QC · BIS 2026</Text>
          </View>
          {inspections.length > 0 && (
            <View style={S.statRow}>
              <StatPill value={passCount} bg={C.passContainer} color={C.onPassContainer} />
              <StatPill value={failCount} bg={C.failContainer} color={C.onFailContainer} />
              <StatPill value={warnCount} bg={C.warnContainer} color={C.onWarnContainer} />
            </View>
          )}
        </View>
      </View>

      {/* Active batch banner */}
      {currentBatch && (
        <View style={S.batchBanner}>
          <View style={S.batchBannerDot} />
          <View style={{ flex: 1 }}>
            <Text style={S.batchBannerName} numberOfLines={1}>{currentBatch.productName}</Text>
            <Text style={S.batchBannerMeta}>
              {currentBatch.totalParts} scanned · {currentBatch.passed} pass · {currentBatch.failed} fail
            </Text>
          </View>
          <Pressable
            onPress={() => closeBatch(currentBatch.id)}
            style={({ pressed }) => [S.closeBatchBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={S.closeBatchText}>Close Batch</Text>
          </Pressable>
        </View>
      )}

      {/* Filter chips — filled tonal, not outlined */}
      <View style={S.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.filterScroll}>
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={[S.chip, active && S.chipActive]}
              >
                {active && <MaterialCommunityIcons name="check" size={14} color={C.onSurface} />}
                <Text style={[S.chipText, active && S.chipTextActive]}>{f.label}</Text>
              </Pressable>
            );
          })}
          <View style={S.filterDivider} />
          <Text style={S.recordCount}>{filtered.length} records</Text>
        </ScrollView>
      </View>

      {/* List */}
      <FlatList
        data={filtered.slice(0, 80)}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <InspectionCard inspection={item} />}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={S.emptyState}>
            <View style={[S.emptyIcon, { backgroundColor: C.surfaceContainer }]}>
              <MaterialCommunityIcons name="magnify-scan" size={36} color={C.outline} />
            </View>
            <Text style={S.emptyTitle}>No inspection records</Text>
            <Text style={S.emptyBody}>Start a batch and scan parts to see results here.</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: bottomPad + 100, flexGrow: 1 }}
      />

      {/* Extended FAB — elevated, heavy */}
      <Pressable
        onPress={handleScan}
        style={({ pressed }) => [S.fab, { bottom: bottomPad + (isWeb ? 76 : 70), opacity: pressed ? 0.9 : 1 }]}
      >
        <MaterialCommunityIcons name="barcode-scan" size={20} color={C.onPrimary} />
        <Text style={S.fabText}>Scan Part</Text>
      </Pressable>

      {/* Bottom sheet */}
      <Modal visible={showSheet} transparent animationType="slide" onRequestClose={() => setShowSheet(false)}>
        <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); setShowSheet(false); }}>
          <View style={S.scrim} />
        </TouchableWithoutFeedback>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
        <View style={[S.sheet, { paddingBottom: bottomPad + 24 }]}>
          <View style={S.sheetHandle} />
          <Text style={S.sheetTitle}>New Inspection Batch</Text>
          <Text style={S.sheetSub}>Name this batch to begin scanning</Text>

          <View style={S.inputRow}>
            <MaterialCommunityIcons name="label-outline" size={20} color={C.outline} />
            <TextInput
              style={S.input}
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
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={S.quickScroll}>
              {products.map((p) => {
                const sel = batchName === p.name;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => setBatchName(p.name)}
                    style={[S.quickChip, sel && S.quickChipActive]}
                  >
                    <Text style={[S.quickChipText, sel && S.quickChipTextActive]}>{p.name}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          <Pressable
            onPress={handleStart}
            style={({ pressed }) => [S.startBtn, { opacity: batchName.trim() ? (pressed ? 0.9 : 1) : 0.35 }]}
            disabled={!batchName.trim()}
          >
            <MaterialCommunityIcons name="play-circle" size={22} color={C.onPrimary} />
            <Text style={S.startBtnText}>Start Batch</Text>
          </Pressable>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function StatPill({ value, bg, color }: { value: number; bg: string; color: string }) {
  return (
    <View style={[S.statPill, { backgroundColor: bg }]}>
      <Text style={[S.statPillNum, { color }]}>{value}</Text>
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1 },

  appBar: {
    backgroundColor: C.surfaceContainerLow,
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  appBarTitle: {
    color: C.onSurface,
    fontSize: 22,
    fontFamily: "Rajdhani_700Bold",
    letterSpacing: 0.2,
    lineHeight: 26,
  },
  appBarSub: {
    color: C.primary,
    fontSize: 11,
    fontFamily: "Rajdhani_600SemiBold",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    lineHeight: 14,
  },
  statRow: { flexDirection: "row", gap: 5 },
  statPill: {
    borderRadius: C.radiusSm,
    paddingHorizontal: 10,
    paddingVertical: 5,
    minWidth: 34,
    alignItems: "center",
  },
  statPillNum: {
    fontSize: 14,
    fontFamily: "Rajdhani_700Bold",
    letterSpacing: 0.2,
  },

  batchBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.primaryContainer,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.outlineVariant,
  },
  batchBannerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.primary,
  },
  batchBannerName: {
    color: C.onPrimaryContainer,
    fontSize: 14,
    fontFamily: "Rajdhani_700Bold",
    letterSpacing: 0.1,
    flex: 1,
  },
  batchBannerMeta: {
    color: C.primary,
    fontSize: 11,
    fontFamily: "Rajdhani_600SemiBold",
    letterSpacing: 0.4,
    opacity: 0.9,
  },
  closeBatchBtn: {
    backgroundColor: C.surface,
    borderRadius: C.radiusSm,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  closeBatchText: {
    color: C.onSurface,
    fontSize: 12,
    fontFamily: "Rajdhani_700Bold",
    letterSpacing: 0.4,
  },

  filterBar: {
    backgroundColor: C.surfaceContainerLow,
    borderBottomWidth: 1,
    borderBottomColor: C.outlineVariant,
  },
  filterScroll: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    alignItems: "center",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 30,
    paddingHorizontal: 12,
    borderRadius: C.radiusSm,
    backgroundColor: C.surfaceContainerHigh,
  },
  chipActive: {
    backgroundColor: C.secondaryContainer,
  },
  chipText: {
    color: C.onSurfaceVariant,
    fontSize: 13,
    fontFamily: "Rajdhani_600SemiBold",
    letterSpacing: 0.2,
  },
  chipTextActive: {
    color: C.onSecondaryContainer,
    fontFamily: "Rajdhani_700Bold",
  },
  filterDivider: {
    width: 1,
    height: 18,
    backgroundColor: C.outlineVariant,
    marginHorizontal: 4,
  },
  recordCount: {
    color: C.outline,
    fontSize: 12,
    fontFamily: "Rajdhani_500Medium",
  },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: C.radiusLg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    color: C.onSurfaceVariant,
    fontSize: 17,
    fontFamily: "Rajdhani_700Bold",
    letterSpacing: 0.1,
  },
  emptyBody: {
    color: C.outline,
    fontSize: 14,
    fontFamily: "Rajdhani_500Medium",
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
    paddingHorizontal: 22,
    height: 56,
    borderRadius: C.radiusLg,
    elevation: 8,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  fabText: {
    color: C.onPrimary,
    fontSize: 16,
    fontFamily: "Rajdhani_700Bold",
    letterSpacing: 0.2,
  },

  scrim: { flex: 1, backgroundColor: C.scrim },
  sheet: {
    backgroundColor: C.surfaceContainerHigh,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 14,
    elevation: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: C.outline,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 4,
    opacity: 0.5,
  },
  sheetTitle: {
    color: C.onSurface,
    fontSize: 22,
    fontFamily: "Rajdhani_700Bold",
    letterSpacing: 0.1,
  },
  sheetSub: {
    color: C.onSurfaceVariant,
    fontSize: 13,
    fontFamily: "Rajdhani_500Medium",
    marginTop: -6,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surfaceContainerHighest,
    borderRadius: C.radiusSm,
    paddingHorizontal: 14,
    height: 54,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Rajdhani_500Medium",
    color: C.onSurface,
    height: "100%",
  },
  quickScroll: { flexGrow: 0 },
  quickChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: C.radiusSm,
    backgroundColor: C.surfaceContainerHigh,
    marginRight: 6,
  },
  quickChipActive: {
    backgroundColor: C.primaryContainer,
  },
  quickChipText: {
    color: C.onSurfaceVariant,
    fontSize: 13,
    fontFamily: "Rajdhani_600SemiBold",
  },
  quickChipTextActive: {
    color: C.onPrimaryContainer,
    fontFamily: "Rajdhani_700Bold",
  },
  startBtn: {
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
  startBtnText: {
    color: C.onPrimary,
    fontSize: 17,
    fontFamily: "Rajdhani_700Bold",
    letterSpacing: 0.2,
  },
});
