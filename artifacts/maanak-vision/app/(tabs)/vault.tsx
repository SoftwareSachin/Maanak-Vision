import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Alert, Platform, Pressable, SectionList, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import StatusBadge from "@/components/StatusBadge";
import C from "@/constants/colors";
import { useInspection } from "@/context/InspectionContext";
import type { Batch } from "@/context/InspectionContext";

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtTime(ts: number) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function VaultScreen() {
  const insets = useSafeAreaInsets();
  const { batches, closeBatch, activeBatchId } = useInspection();
  const [expanded, setExpanded] = useState<string | null>(null);

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 56 : insets.top;
  const bottomPad = isWeb ? 32 : insets.bottom;

  const totalParts = batches.reduce((a, b) => a + b.totalParts, 0);
  const totalPass  = batches.reduce((a, b) => a + b.passed, 0);
  const passRate   = totalParts > 0 ? Math.round((totalPass / totalParts) * 100) : 0;

  return (
    <View style={[S.root, { backgroundColor: C.background }]}>

      {/* Top App Bar */}
      <View style={[S.appBar, { paddingTop: topPad }]}>
        <View style={S.appBarRow}>
          <View>
            <Text style={S.appBarTitle}>Inspection Vault</Text>
            <Text style={S.appBarSub}>BIS 2026 Compliance Records</Text>
          </View>
          {totalParts > 0 && (
            <View style={S.headerPill}>
              <Text style={S.headerPillText}>{passRate}% pass rate</Text>
            </View>
          )}
        </View>

        {/* Summary row */}
        {totalParts > 0 && (
          <View style={S.summaryRow}>
            <SummaryCell label="Batches" value={batches.length} />
            <View style={S.summaryDiv} />
            <SummaryCell label="Total Parts" value={totalParts} />
            <View style={S.summaryDiv} />
            <SummaryCell label="Passed" value={totalPass} color={C.pass} />
          </View>
        )}
      </View>

      {batches.length === 0 ? (
        <View style={S.emptyState}>
          <MaterialCommunityIcons name="certificate-outline" size={48} color={C.outlineVariant} />
          <Text style={S.emptyTitle}>No batches yet</Text>
          <Text style={S.emptyBody}>Complete an inspection batch to generate a BIS-compliant certificate.</Text>
        </View>
      ) : (
        <SectionList
          sections={batches.map((b) => ({
            batch: b,
            data: expanded === b.id ? b.inspections.slice(0, 20) : [],
          }))}
          keyExtractor={(item, i) => item.id ?? String(i)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomPad + 20 }}
          renderSectionHeader={({ section }) => (
            <BatchCard
              batch={section.batch}
              isExpanded={expanded === section.batch.id}
              isActive={section.batch.id === activeBatchId}
              onToggle={() => setExpanded(expanded === section.batch.id ? null : section.batch.id)}
              onCertify={() =>
                Alert.alert("Issue Certificate", `Issue BIS certificate for "${section.batch.productName}"?`, [
                  { text: "Cancel", style: "cancel" },
                  { text: "Issue", onPress: () => closeBatch(section.batch.id) },
                ])
              }
            />
          )}
          renderItem={({ item }) => (
            <View style={S.inspRow}>
              <Text style={S.inspTime}>{fmtTime(item.timestamp)}</Text>
              <Text style={S.inspName} numberOfLines={1}>{item.productName}</Text>
              <StatusBadge result={item.result} />
            </View>
          )}
        />
      )}
    </View>
  );
}

function BatchCard({
  batch, isExpanded, isActive, onToggle, onCertify,
}: {
  batch: Batch; isExpanded: boolean; isActive: boolean;
  onToggle: () => void; onCertify: () => void;
}) {
  const passRate  = batch.totalParts > 0 ? Math.round((batch.passed / batch.totalParts) * 100) : 0;
  const rateColor = passRate >= 90 ? C.pass : passRate >= 70 ? C.warn : C.fail;
  const rateBg    = passRate >= 90 ? C.passContainer : passRate >= 70 ? C.warnContainer : C.failContainer;

  return (
    <View style={S.batchCard}>
      <Pressable onPress={onToggle} style={S.batchRow} android_ripple={{ color: C.surfaceVariant }}>

        {/* Leading icon container */}
        <View style={[S.batchIcon, {
          backgroundColor: batch.certificateId ? C.passContainer : isActive ? C.primaryContainer : C.surfaceContainerHigh,
        }]}>
          <MaterialCommunityIcons
            name={batch.certificateId ? "certificate" : isActive ? "pulse" : "archive-outline"}
            size={20}
            color={batch.certificateId ? C.pass : isActive ? C.primary : C.onSurfaceVariant}
          />
        </View>

        {/* Body */}
        <View style={S.batchBody}>
          <View style={S.batchNameRow}>
            <Text style={S.batchName} numberOfLines={1}>{batch.productName}</Text>
            {isActive && (
              <View style={S.liveChip}>
                <View style={S.liveDot} />
                <Text style={S.liveText}>Live</Text>
              </View>
            )}
          </View>
          <Text style={S.batchMeta}>{fmtDate(batch.createdAt)} · {batch.totalParts} parts</Text>
        </View>

        {/* Trailing */}
        <View style={[S.ratePill, { backgroundColor: rateBg }]}>
          <Text style={[S.rateText, { color: rateColor }]}>{passRate}%</Text>
        </View>
        <MaterialCommunityIcons
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={18}
          color={C.onSurfaceVariant}
          style={{ marginLeft: 4 }}
        />
      </Pressable>

      {isExpanded && (
        <View style={S.batchDetail}>
          {/* Stats */}
          <View style={S.countsRow}>
            <CountCell label="Pass"  value={batch.passed}    color={C.pass} />
            <View style={S.countDiv} />
            <CountCell label="Fail"  value={batch.failed}    color={C.fail} />
            <View style={S.countDiv} />
            <CountCell label="Caution" value={batch.warnings} color={C.warn} />
            <View style={S.countDiv} />
            <CountCell label="Total" value={batch.totalParts} color={C.onSurfaceVariant} />
          </View>

          {/* Progress bar */}
          <View style={S.progressBg}>
            <View style={[S.progressFill, { width: `${passRate}%` as any, backgroundColor: rateColor }]} />
          </View>

          {/* Certificate section */}
          {batch.certificateId ? (
            <View style={S.certBlock}>
              <QRMock size={48} />
              <View style={{ flex: 1 }}>
                <Text style={S.certLabel}>ISI CERTIFICATE</Text>
                <Text style={S.certId} selectable>{batch.certificateId}</Text>
              </View>
              <View style={S.certifiedChip}>
                <View style={[S.chipDot, { backgroundColor: C.pass }]} />
                <Text style={[S.chipText, { color: C.pass }]}>Certified</Text>
              </View>
            </View>
          ) : isActive ? (
            <View style={S.activeNote}>
              <MaterialCommunityIcons name="information-outline" size={14} color={C.onSurfaceVariant} />
              <Text style={S.activeNoteText}>Batch is active — close it to issue a certificate.</Text>
            </View>
          ) : (
            <Pressable
              onPress={onCertify}
              style={({ pressed }) => [S.certifyBtn, { opacity: pressed ? 0.85 : 1 }]}
            >
              <MaterialCommunityIcons name="certificate-outline" size={18} color={C.onPrimary} />
              <Text style={S.certifyBtnText}>Issue BIS Certificate</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

function SummaryCell({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <View style={S.summaryCell}>
      <Text style={[S.summaryCellNum, { color: color ?? C.onSurface }]}>{value}</Text>
      <Text style={S.summaryCellLabel}>{label}</Text>
    </View>
  );
}

function CountCell({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={{ flex: 1, alignItems: "center", paddingVertical: 10 }}>
      <Text style={{ color, fontSize: 22, fontFamily: "Rajdhani_700Bold" }}>{value}</Text>
      <Text style={{ color: C.outline, fontSize: 10, fontFamily: "Rajdhani_500Medium", letterSpacing: 0.8, marginTop: 1 }}>{label}</Text>
    </View>
  );
}

function QRMock({ size }: { size: number }) {
  const cell = Math.floor(size / 7);
  const p = [
    [1,1,1,0,1,1,1],[1,0,1,0,1,0,1],[1,1,1,0,1,1,1],
    [0,0,1,0,0,0,0],[1,1,1,0,1,1,1],[1,0,0,0,0,0,1],[1,1,1,0,1,1,1],
  ];
  return (
    <View style={{ width: size, height: size, marginRight: 14 }}>
      {p.map((row, ri) => (
        <View key={ri} style={{ flexDirection: "row" }}>
          {row.map((v, ci) => (
            <View key={ci} style={{ width: cell, height: cell, backgroundColor: v ? C.primary : "transparent" }} />
          ))}
        </View>
      ))}
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  appBarTitle: {
    color: C.onSurface,
    fontSize: 22,
    fontFamily: "Rajdhani_600SemiBold",
    letterSpacing: 0.15,
  },
  appBarSub: {
    color: C.onSurfaceVariant,
    fontSize: 12,
    fontFamily: "Rajdhani_400Regular",
    marginTop: 1,
  },
  headerPill: {
    backgroundColor: C.secondaryContainer,
    borderRadius: C.radiusFull,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  headerPillText: {
    color: C.onSecondaryContainer,
    fontSize: 12,
    fontFamily: "Rajdhani_600SemiBold",
  },

  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.outlineVariant,
    paddingVertical: 8,
  },
  summaryCell: { flex: 1, alignItems: "center" },
  summaryCellNum: {
    fontSize: 20,
    fontFamily: "Rajdhani_700Bold",
  },
  summaryCellLabel: {
    color: C.outline,
    fontSize: 10,
    fontFamily: "Rajdhani_500Medium",
    letterSpacing: 0.6,
    marginTop: 1,
  },
  summaryDiv: { width: StyleSheet.hairlineWidth, height: 28, backgroundColor: C.outlineVariant },

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
  },
  emptyBody: {
    color: C.outline,
    fontSize: 14,
    fontFamily: "Rajdhani_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },

  batchCard: {
    backgroundColor: C.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.outlineVariant,
  },
  batchRow: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  batchIcon: {
    width: 44,
    height: 44,
    borderRadius: C.radiusSm,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  batchBody: { flex: 1, gap: 3 },
  batchNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  batchName: {
    color: C.onSurface,
    fontSize: 14,
    fontFamily: "Rajdhani_500Medium",
    letterSpacing: 0.1,
    flexShrink: 1,
  },
  liveChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.primaryContainer,
    borderRadius: C.radiusFull,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  liveDot: { width: 5, height: 5, borderRadius: 99, backgroundColor: C.primary },
  liveText: { color: C.primary, fontSize: 10, fontFamily: "Rajdhani_600SemiBold" },
  batchMeta: {
    color: C.onSurfaceVariant,
    fontSize: 12,
    fontFamily: "Rajdhani_400Regular",
  },
  ratePill: {
    borderRadius: C.radiusFull,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  rateText: { fontSize: 13, fontFamily: "Rajdhani_700Bold" },

  batchDetail: {
    backgroundColor: C.surfaceContainerLow,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.outlineVariant,
    paddingBottom: 16,
    gap: 0,
  },
  countsRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.outlineVariant,
  },
  countDiv: { width: StyleSheet.hairlineWidth, height: 32, backgroundColor: C.outlineVariant },
  progressBg: { height: 3, backgroundColor: C.surfaceContainerHigh, marginHorizontal: 16 },
  progressFill: { height: 3, borderRadius: 2 },

  certBlock: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 14,
    padding: 14,
    backgroundColor: C.surfaceContainerHigh,
    borderRadius: C.radius,
  },
  certLabel: {
    color: C.onSurfaceVariant,
    fontSize: 10,
    fontFamily: "Rajdhani_600SemiBold",
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  certId: {
    color: C.primary,
    fontSize: 13,
    fontFamily: "Rajdhani_700Bold",
    letterSpacing: 0.5,
  },
  certifiedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: C.passContainer,
    borderRadius: C.radiusFull,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  chipDot: { width: 5, height: 5, borderRadius: 99 },
  chipText: { fontSize: 11, fontFamily: "Rajdhani_600SemiBold" },

  activeNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginHorizontal: 16,
    marginTop: 12,
  },
  activeNoteText: {
    color: C.onSurfaceVariant,
    fontSize: 13,
    fontFamily: "Rajdhani_400Regular",
  },
  certifyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: C.primary,
    height: 52,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: C.radius,
  },
  certifyBtnText: {
    color: C.onPrimary,
    fontSize: 15,
    fontFamily: "Rajdhani_700Bold",
    letterSpacing: 0.1,
  },

  inspRow: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 12,
    backgroundColor: C.surfaceContainerLowest,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.outlineVariant,
  },
  inspTime: {
    color: C.outline,
    fontSize: 12,
    fontFamily: "Rajdhani_500Medium",
    width: 44,
  },
  inspName: {
    color: C.onSurfaceVariant,
    fontSize: 13,
    fontFamily: "Rajdhani_400Regular",
    flex: 1,
  },
});
