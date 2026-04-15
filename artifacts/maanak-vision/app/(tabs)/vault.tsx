import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import StatusBadge from "@/components/StatusBadge";
import { useInspection } from "@/context/InspectionContext";
import { useColors } from "@/hooks/useColors";

export default function VaultScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { batches, closeBatch, activeBatchId } = useInspection();
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom;

  const totalBatches = batches.length;
  const certifiedBatches = batches.filter((b) => b.certificateId).length;
  const totalParts = batches.reduce((a, b) => a + b.totalParts, 0);

  function formatDate(ts: number) {
    return new Date(ts).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatTime(ts: number) {
    return new Date(ts).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 12, borderBottomColor: colors.border },
        ]}
      >
        <View>
          <Text style={[styles.pageTitle, { color: colors.primary }]}>
            BIS 2026 VAULT
          </Text>
          <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>
            Compliance Records & Certificates
          </Text>
        </View>
        <View style={[styles.headerStamp, { borderColor: colors.primary }]}>
          <Feather name="shield" size={18} color={colors.primary} />
          <Text style={[styles.stampText, { color: colors.primary }]}>CERTIFIED</Text>
        </View>
      </View>

      <View style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
        <SummaryItem label="BATCHES" value={`${totalBatches}`} colors={colors} />
        <View style={[styles.summDivider, { backgroundColor: colors.border }]} />
        <SummaryItem label="CERTIFIED" value={`${certifiedBatches}`} valueColor={colors.pass} colors={colors} />
        <View style={[styles.summDivider, { backgroundColor: colors.border }]} />
        <SummaryItem label="TOTAL PARTS" value={`${totalParts}`} colors={colors} />
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: bottomPad + 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {batches.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="shield" size={48} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>
              No Records Yet
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Complete inspection batches to generate BIS compliance certificates
            </Text>
          </View>
        ) : (
          batches.map((batch) => {
            const passRate =
              batch.totalParts > 0
                ? Math.round((batch.passed / batch.totalParts) * 100)
                : 0;
            const isExpanded = expandedBatch === batch.id;
            const isActive = batch.id === activeBatchId;

            return (
              <View
                key={batch.id}
                style={[
                  styles.batchCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: batch.certificateId
                      ? colors.pass
                      : isActive
                      ? colors.primary
                      : colors.border,
                    borderLeftColor: batch.certificateId
                      ? colors.pass
                      : isActive
                      ? colors.primary
                      : colors.border,
                  },
                ]}
              >
                <Pressable
                  onPress={() =>
                    setExpandedBatch(isExpanded ? null : batch.id)
                  }
                >
                  <View style={styles.batchTop}>
                    <View style={styles.batchTopLeft}>
                      {isActive && (
                        <View
                          style={[
                            styles.liveTag,
                            { backgroundColor: colors.primary },
                          ]}
                        >
                          <Text
                            style={[
                              styles.liveTagText,
                              { color: colors.primaryForeground },
                            ]}
                          >
                            LIVE
                          </Text>
                        </View>
                      )}
                      <Text
                        style={[styles.batchName, { color: colors.foreground }]}
                        numberOfLines={1}
                      >
                        {batch.productName}
                      </Text>
                    </View>
                    <Feather
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={18}
                      color={colors.mutedForeground}
                    />
                  </View>

                  <Text
                    style={[styles.batchDate, { color: colors.mutedForeground }]}
                  >
                    {formatDate(batch.createdAt)} · {formatTime(batch.createdAt)}
                  </Text>

                  <View style={styles.batchStatsRow}>
                    <MiniStat
                      label="TOTAL"
                      value={batch.totalParts}
                      color={colors.foreground}
                    />
                    <MiniStat label="PASS" value={batch.passed} color={colors.pass} />
                    <MiniStat label="FAIL" value={batch.failed} color={colors.fail} />
                    <MiniStat label="WARN" value={batch.warnings} color={colors.warning} />
                    <View style={styles.passRatePill}>
                      <Text
                        style={[
                          styles.passRateVal,
                          {
                            color: passRate >= 90 ? colors.pass : passRate >= 70 ? colors.warning : colors.fail,
                          },
                        ]}
                      >
                        {passRate}%
                      </Text>
                      <Text
                        style={[styles.passRateLbl, { color: colors.mutedForeground }]}
                      >
                        PASS
                      </Text>
                    </View>
                  </View>

                  {batch.certificateId ? (
                    <View style={styles.certRow}>
                      <Feather name="check-circle" size={14} color={colors.pass} />
                      <Text style={[styles.certId, { color: colors.pass }]}>
                        {batch.certificateId}
                      </Text>
                      <Text style={[styles.certLabel, { color: colors.mutedForeground }]}>
                        BIS CERTIFIED
                      </Text>
                    </View>
                  ) : (
                    !isActive && (
                      <Text
                        style={[styles.noCert, { color: colors.mutedForeground }]}
                      >
                        Batch closed · No certificate issued
                      </Text>
                    )
                  )}
                </Pressable>

                {isExpanded && (
                  <View style={{ marginTop: 14 }}>
                    <View
                      style={[
                        styles.divider,
                        { backgroundColor: colors.border },
                      ]}
                    />

                    {!batch.certificateId && !isActive && (
                      <View style={styles.actionRow}>
                        <Pressable
                          onPress={() => {
                            Alert.alert(
                              "Generate Certificate",
                              "Issue a BIS 2026 compliant certificate for this batch?",
                              [
                                { text: "Cancel", style: "cancel" },
                                {
                                  text: "Generate",
                                  onPress: () => closeBatch(batch.id),
                                },
                              ]
                            );
                          }}
                          style={({ pressed }) => [
                            styles.certBtn,
                            {
                              backgroundColor: colors.primary,
                              opacity: pressed ? 0.85 : 1,
                            },
                          ]}
                        >
                          <Feather
                            name="shield"
                            size={16}
                            color={colors.primaryForeground}
                          />
                          <Text
                            style={[
                              styles.certBtnText,
                              { color: colors.primaryForeground },
                            ]}
                          >
                            ISSUE CERTIFICATE
                          </Text>
                        </Pressable>
                      </View>
                    )}

                    {isActive && (
                      <Pressable
                        onPress={() => closeBatch(batch.id)}
                        style={({ pressed }) => [
                          styles.certBtn,
                          {
                            backgroundColor: colors.secondary,
                            marginTop: 8,
                            opacity: pressed ? 0.8 : 1,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.certBtnText,
                            { color: colors.foreground },
                          ]}
                        >
                          CLOSE BATCH & CERTIFY
                        </Text>
                      </Pressable>
                    )}

                    {batch.certificateId && (
                      <View
                        style={[
                          styles.qrBox,
                          {
                            backgroundColor: colors.background,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <View style={styles.qrContent}>
                          <QRMockup size={72} color={colors.foreground} />
                          <View style={styles.qrDetails}>
                            <Text
                              style={[
                                styles.qrTitle,
                                { color: colors.foreground },
                              ]}
                            >
                              ISI LABEL
                            </Text>
                            <Text
                              style={[
                                styles.qrCertId,
                                { color: colors.primary },
                              ]}
                            >
                              {batch.certificateId}
                            </Text>
                            <Text
                              style={[
                                styles.qrProduct,
                                { color: colors.mutedForeground },
                              ]}
                            >
                              {batch.productName}
                            </Text>
                            <Text
                              style={[
                                styles.qrMeta,
                                { color: colors.mutedForeground },
                              ]}
                            >
                              {batch.totalParts} parts · {formatDate(batch.createdAt)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    )}

                    {batch.inspections.slice(0, 5).map((ins) => (
                      <View
                        key={ins.id}
                        style={[
                          styles.inspRow,
                          { borderTopColor: colors.border },
                        ]}
                      >
                        <Text
                          style={[
                            styles.inspTime,
                            { color: colors.mutedForeground },
                          ]}
                        >
                          {formatTime(ins.timestamp)}
                        </Text>
                        <StatusBadge result={ins.result} />
                        {ins.defects[0]?.type !== "none" && (
                          <Text
                            style={[
                              styles.inspDefect,
                              { color: colors.warning },
                            ]}
                          >
                            {ins.defects[0]?.type.replace("_", " ")}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

function SummaryItem({
  label,
  value,
  valueColor,
  colors,
}: {
  label: string;
  value: string;
  valueColor?: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.summItem}>
      <Text style={[styles.summValue, { color: valueColor ?? colors.foreground }]}>
        {value}
      </Text>
      <Text style={[styles.summLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
    </View>
  );
}

function MiniStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={styles.miniStat}>
      <Text style={[styles.miniStatNum, { color }]}>{value}</Text>
      <Text style={[styles.miniStatLabel, { color: "rgba(255,255,255,0.4)" }]}>
        {label}
      </Text>
    </View>
  );
}

function QRMockup({ size, color }: { size: number; color: string }) {
  const cell = size / 7;
  const pattern = [
    [1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 1, 0, 1],
    [1, 0, 0, 1, 0, 0, 1],
    [1, 0, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1],
  ];
  return (
    <View style={{ width: size, height: size }}>
      {pattern.map((row, ri) => (
        <View key={ri} style={{ flexDirection: "row" }}>
          {row.map((cell_val, ci) => (
            <View
              key={ci}
              style={{
                width: cell,
                height: cell,
                backgroundColor: cell_val ? color : "transparent",
              }}
            />
          ))}
        </View>
      ))}
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
  pageTitle: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 2,
  },
  pageSub: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  headerStamp: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 2,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  stampText: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  summItem: { flex: 1, alignItems: "center" },
  summValue: { fontSize: 24, fontWeight: "900" },
  summLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 1.5, marginTop: 2 },
  summDivider: { width: 1, height: 36 },
  emptyState: {
    alignItems: "center",
    paddingVertical: 80,
    gap: 12,
    paddingHorizontal: 32,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 22 },
  batchCard: {
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  batchTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  batchTopLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  liveTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  liveTagText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
  batchName: {
    fontSize: 16,
    fontWeight: "800",
    flex: 1,
  },
  batchDate: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 10,
  },
  batchStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
  },
  miniStat: { flex: 1, alignItems: "center" },
  miniStatNum: { fontSize: 20, fontWeight: "900" },
  miniStatLabel: { fontSize: 9, fontWeight: "700", letterSpacing: 1 },
  passRatePill: {
    flex: 1,
    alignItems: "center",
  },
  passRateVal: { fontSize: 20, fontWeight: "900" },
  passRateLbl: { fontSize: 9, fontWeight: "700", letterSpacing: 1 },
  certRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  certId: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1,
  },
  certLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  noCert: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: "500",
  },
  divider: { height: 1, marginVertical: 12 },
  actionRow: { marginBottom: 4 },
  certBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
  },
  certBtnText: {
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  qrBox: {
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    marginTop: 10,
  },
  qrContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  qrDetails: { flex: 1 },
  qrTitle: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 2,
  },
  qrCertId: {
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1,
  },
  qrProduct: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  qrMeta: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },
  inspRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  inspTime: {
    fontSize: 12,
    fontWeight: "600",
    width: 56,
  },
  inspDefect: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
    flex: 1,
  },
});
