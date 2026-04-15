import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import InspectionCard from "@/components/InspectionCard";
import StatusBadge from "@/components/StatusBadge";
import { useInspection } from "@/context/InspectionContext";
import { useTraining } from "@/context/TrainingContext";
import { useColors } from "@/hooks/useColors";

export default function InspectScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { inspections, batches, currentBatch, startBatch, closeBatch } =
    useInspection();
  const { activeProduct, products } = useTraining();
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchName, setBatchName] = useState(activeProduct?.name ?? "");

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom;

  const recentInspections = inspections.slice(0, 20);

  const handleScan = () => {
    if (!currentBatch) {
      setShowBatchModal(true);
      return;
    }
    router.push("/scan");
  };

  const handleStartBatch = () => {
    if (!batchName.trim()) return;
    startBatch(batchName.trim());
    setShowBatchModal(false);
    router.push("/scan");
  };

  const passRate =
    inspections.length > 0
      ? Math.round(
          (inspections.filter((i) => i.result === "pass").length /
            inspections.length) *
            100
        )
      : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        <View>
          <Text style={[styles.appName, { color: colors.primary }]}>
            MAANAK VISION
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            BIS 2026 Quality Control
          </Text>
        </View>
        <View style={[styles.passRateChip, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.passRateNum, { color: colors.pass }]}>
            {passRate}%
          </Text>
          <Text style={[styles.passRateLabel, { color: colors.mutedForeground }]}>
            PASS RATE
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: bottomPad + 100,
          paddingTop: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        {currentBatch && (
          <View
            style={[
              styles.activeBatch,
              { backgroundColor: colors.card, borderColor: colors.primary },
            ]}
          >
            <View style={styles.activeBatchHeader}>
              <View style={styles.activeBatchLeft}>
                <View style={[styles.liveDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.activeBatchLabel, { color: colors.primary }]}>
                  ACTIVE BATCH
                </Text>
              </View>
              <Pressable
                onPress={() => closeBatch(currentBatch.id)}
                style={({ pressed }) => [
                  styles.closeBatchBtn,
                  { backgroundColor: colors.secondary, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Text style={[styles.closeBatchText, { color: colors.mutedForeground }]}>
                  CLOSE BATCH
                </Text>
              </Pressable>
            </View>
            <Text style={[styles.activeBatchName, { color: colors.foreground }]}>
              {currentBatch.productName}
            </Text>
            <View style={styles.batchStats}>
              <View style={styles.statItem}>
                <Text style={[styles.statNum, { color: colors.foreground }]}>
                  {currentBatch.totalParts}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                  TOTAL
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statNum, { color: colors.pass }]}>
                  {currentBatch.passed}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                  PASS
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statNum, { color: colors.fail }]}>
                  {currentBatch.failed}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                  FAIL
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statNum, { color: colors.warning }]}>
                  {currentBatch.warnings}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                  WARN
                </Text>
              </View>
            </View>
          </View>
        )}

        {activeProduct && (
          <View
            style={[
              styles.activeProductBanner,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Feather name="cpu" size={16} color={colors.primary} />
            <Text style={[styles.activeProductText, { color: colors.foreground }]}>
              {activeProduct.name}
            </Text>
            <Text style={[styles.activeProductSub, { color: colors.mutedForeground }]}>
              {activeProduct.shots.length} REFERENCE SHOTS
            </Text>
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          RECENT INSPECTIONS
        </Text>

        {recentInspections.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="search" size={40} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>
              No inspections yet
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Tap the yellow button below to start scanning
            </Text>
          </View>
        ) : (
          recentInspections.map((item) => (
            <InspectionCard key={item.id} inspection={item} />
          ))
        )}
      </ScrollView>

      <Pressable
        onPress={handleScan}
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: colors.primary,
            bottom: bottomPad + (isWeb ? 84 : 70),
            opacity: pressed ? 0.85 : 1,
            transform: [{ scale: pressed ? 0.96 : 1 }],
          },
        ]}
      >
        <Feather name="zap" size={28} color={colors.primaryForeground} />
        <Text style={[styles.fabText, { color: colors.primaryForeground }]}>
          SCAN
        </Text>
      </Pressable>

      <Modal
        visible={showBatchModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBatchModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              START NEW BATCH
            </Text>
            <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
              Enter the product name for this inspection batch
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: colors.background,
                  color: colors.foreground,
                  borderColor: colors.border,
                },
              ]}
              placeholder={activeProduct?.name ?? "e.g. Brass Valve 3/4 inch"}
              placeholderTextColor={colors.mutedForeground}
              value={batchName}
              onChangeText={setBatchName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleStartBatch}
            />
            {products.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                {products.map((p) => (
                  <Pressable
                    key={p.id}
                    onPress={() => setBatchName(p.name)}
                    style={[
                      styles.productChip,
                      {
                        backgroundColor: batchName === p.name ? colors.primary : colors.secondary,
                        borderColor: batchName === p.name ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.productChipText,
                        { color: batchName === p.name ? colors.primaryForeground : colors.foreground },
                      ]}
                    >
                      {p.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
            <View style={styles.modalButtons}>
              <Pressable
                onPress={() => setShowBatchModal(false)}
                style={[styles.modalCancel, { borderColor: colors.border }]}
              >
                <Text style={[styles.modalCancelText, { color: colors.mutedForeground }]}>
                  CANCEL
                </Text>
              </Pressable>
              <Pressable
                onPress={handleStartBatch}
                style={[
                  styles.modalConfirm,
                  { backgroundColor: colors.primary, opacity: batchName.trim() ? 1 : 0.5 },
                ]}
                disabled={!batchName.trim()}
              >
                <Text style={[styles.modalConfirmText, { color: colors.primaryForeground }]}>
                  START BATCH
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  appName: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 3,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    marginTop: 2,
  },
  passRateChip: {
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  passRateNum: {
    fontSize: 22,
    fontWeight: "900",
  },
  passRateLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  activeBatch: {
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  activeBatchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  activeBatchLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activeBatchLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  closeBatchBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  closeBatchText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  activeBatchName: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  batchStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNum: {
    fontSize: 24,
    fontWeight: "900",
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  statDivider: {
    width: 1,
    height: 36,
  },
  activeProductBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  activeProductText: {
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
  },
  activeProductSub: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 10,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 40,
    lineHeight: 22,
  },
  fab: {
    position: "absolute",
    right: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 18,
    borderRadius: 50,
    elevation: 8,
    shadowColor: "#F5C518",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  fabText: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalCard: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 6,
  },
  modalSub: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
    fontWeight: "600",
  },
  productChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  productChipText: {
    fontSize: 13,
    fontWeight: "700",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1,
  },
  modalConfirm: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
});
