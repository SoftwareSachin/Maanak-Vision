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
            <Text style={S.appBarSub}>BIS 2026 Compliance Archive</Text>
          </View>
          {totalParts > 0 && (
            <View style={[S.ratePill, {
              backgroundColor: passRate >= 90 ? C.passContainer : passRate >= 70 ? C.warnContainer : C.failContainer,
            }]}>
              <Text style={[S.rateText, {
                color: passRate >= 90 ? C.onPassContainer : passRate >= 70 ? C.onWarnContainer : C.onFailContainer,
              }]}>{passRate}%</Text>
              <Text style={[S.rateLabel, {
                color: passRate >= 90 ? C.pass : passRate >= 70 ? C.warn : C.fail,
              }]}>PASS</Text>
            </View>
          )}
        </View>

        {totalParts > 0 && (
          <View style={S.summaryRow}>
            <SummaryCell label="Batches" value={batches.length} />
            <View style={S.summaryDiv} />
            <SummaryCell label="Total Parts" value={totalParts} />
            <View style={S.summaryDiv} />
            <SummaryCell label="Passed" value={totalPass} color={C.pass} />
            <View style={S.summaryDiv} />
            <SummaryCell label="Failed" value={totalParts - totalPass} color={C.fail} />
          </View>
        )}
      </View>

      {batches.length === 0 ? (
        <View style={S.emptyState}>
          <View style={[S.emptyIcon, { backgroundColor: C.surfaceContainer }]}>
            <MaterialCommunityIcons name="certificate-outline" size={40} color={C.outline} />
          </View>
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
  const rateTextColor = passRate >= 90 ? C.onPassContainer : passRate >= 70 ? C.onWarnContainer : C.onFailContainer;

  return (
    <View style={S.batchCard}>
      <Pressable onPress={onToggle} style={S.batchRow}>
        <View style={[S.batchIcon, {
          backgroundColor: batch.certificateId ? C.passContainer : isActive ? C.primaryContainer : C.surfaceContainerHigh,
        }]}>
          <MaterialCommunityIcons
            name={batch.certificateId ? "certificate" : isActive ? "pulse" : "archive-outline"}
            size={22}
            color={batch.certificateId ? C.pass : isActive ? C.primary : C.onSurfaceVariant}
          />
        </View>
        <View style={S.batchBody}>
          <View style={S.batchNameRow}>
            <Text style={S.batchName} numberOfLines={1}>{batch.productName}</Text>
            {isActive && (
              <View style={S.liveChip}>
                <View style={S.liveDot} />
                <Text style={S.liveText}>LIVE</Text>
              </View>
            )}
          </View>
          <Text style={S.batchMeta}>{fmtDate(batch.createdAt)} · {batch.totalParts} parts</Text>
        </View>
        <View style={[S.batchRatePill, { backgroundColor: rateBg }]}>
          <Text style={[S.batchRateText, { color: rateTextColor }]}>{passRate}%</Text>
        </View>
        <MaterialCommunityIcons
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={C.onSurfaceVariant}
          style={{ marginLeft: 6 }}
        />
      </Pressable>

      {isExpanded && (
        <View style={S.detail}>
          <View style={S.countsRow}>
            <CountCell label="PASS"   value={batch.passed}     color={C.pass} bg={C.passContainer} />
            <CountCell label="FAIL"   value={batch.failed}     color={C.fail} bg={C.failContainer} />
            <CountCell label="CAUTION" value={batch.warnings}  color={C.warn} bg={C.warnContainer} />
            <CountCell label="TOTAL"  value={batch.totalParts} color={C.onSurface} bg={C.surfaceContainerHigh} />
          </View>

          <View style={S.progressBg}>
            <View style={[S.progressFill, { width: `${passRate}%` as any, backgroundColor: rateColor }]} />
          </View>

          {batch.certificateId ? (
            <View style={S.certBlock}>
              <QRMock size={52} />
              <View style={{ flex: 1 }}>
                <Text style={S.certLabel}>ISI CERTIFICATE</Text>
                <Text style={S.certId} selectable>{batch.certificateId}</Text>
              </View>
              <View style={[S.certBadge, { backgroundColor: C.passContainer }]}>
                <Text style={[S.certBadgeText, { color: C.onPassContainer }]}>CERTIFIED</Text>
              </View>
            </View>
          ) : isActive ? (
            <View style={S.activeNote}>
              <MaterialCommunityIcons name="information-outline" size={15} color={C.onSurfaceVariant} />
              <Text style={S.activeNoteText}>Batch is active — close it to issue a certificate.</Text>
            </View>
          ) : (
            <Pressable
              onPress={onCertify}
              style={({ pressed }) => [S.certifyBtn, { opacity: pressed ? 0.85 : 1 }]}
            >
              <MaterialCommunityIcons name="certificate-outline" size={20} color={C.onPrimary} />
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

function CountCell({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <View style={[S.countCell, { backgroundColor: bg }]}>
      <Text style={[S.countNum, { color }]}>{value}</Text>
      <Text style={[S.countLabel, { color }]}>{label}</Text>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
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
  },
  ratePill: {
    borderRadius: C.radiusSm,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: "center",
  },
  rateText: {
    fontSize: 20,
    fontFamily: "Rajdhani_700Bold",
    lineHeight: 22,
  },
  rateLabel: {
    fontSize: 9,
    fontFamily: "Rajdhani_700Bold",
    letterSpacing: 1,
    marginTop: -1,
  },

  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: C.outlineVariant,
    paddingVertical: 8,
  },
  summaryDiv: { width: 1, height: 28, backgroundColor: C.outlineVariant },
  summaryCell: { flex: 1, alignItems: "center", paddingVertical: 4 },
  summaryCellNum: { fontSize: 20, fontFamily: "Rajdhani_700Bold", lineHeight: 22 },
  summaryCellLabel: { color: C.outline, fontSize: 10, fontFamily: "Rajdhani_600SemiBold", letterSpacing: 0.6, marginTop: 1 },

  emptyState: {
    flex: 1,
    alignItems: "center",
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
  emptyTitle: { color: C.onSurfaceVariant, fontSize: 17, fontFamily: "Rajdhani_700Bold" },
  emptyBody: { color: C.outline, fontSize: 14, fontFamily: "Rajdhani_500Medium", textAlign: "center", lineHeight: 20 },

  batchCard: {
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.outlineVariant,
  },
  batchRow: {
    height: 72,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 12,
  },
  batchIcon: {
    width: 46,
    height: 46,
    borderRadius: C.radiusSm,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  batchBody: { flex: 1, gap: 4 },
  batchNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  batchName: { color: C.onSurface, fontSize: 15, fontFamily: "Rajdhani_700Bold", letterSpacing: 0.1, flexShrink: 1 },
  liveChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.primaryContainer,
    borderRadius: C.radiusSm,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  liveDot: { width: 5, height: 5, borderRadius: 99, backgroundColor: C.primary },
  liveText: { color: C.primary, fontSize: 10, fontFamily: "Rajdhani_700Bold", letterSpacing: 0.5 },
  batchMeta: { color: C.onSurfaceVariant, fontSize: 12, fontFamily: "Rajdhani_500Medium" },
  batchRatePill: {
    borderRadius: C.radiusSm,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  batchRateText: { fontSize: 14, fontFamily: "Rajdhani_700Bold" },

  detail: {
    backgroundColor: C.surfaceContainerLow,
    borderTopWidth: 1,
    borderTopColor: C.outlineVariant,
    paddingBottom: 16,
    gap: 12,
  },
  countsRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  countCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: C.radiusSm,
  },
  countNum: { fontSize: 22, fontFamily: "Rajdhani_700Bold", lineHeight: 24 },
  countLabel: { fontSize: 10, fontFamily: "Rajdhani_700Bold", letterSpacing: 0.8, marginTop: 2, opacity: 0.8 },

  progressBg: { height: 4, backgroundColor: C.surfaceContainerHigh, marginHorizontal: 16, borderRadius: 2 },
  progressFill: { height: 4, borderRadius: 2 },

  certBlock: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    padding: 14,
    backgroundColor: C.surfaceContainerHigh,
    borderRadius: C.radius,
  },
  certLabel: { color: C.onSurfaceVariant, fontSize: 10, fontFamily: "Rajdhani_700Bold", letterSpacing: 1.5, marginBottom: 4 },
  certId: { color: C.primary, fontSize: 13, fontFamily: "Rajdhani_700Bold", letterSpacing: 0.5 },
  certBadge: {
    borderRadius: C.radiusSm,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  certBadgeText: { fontSize: 11, fontFamily: "Rajdhani_700Bold", letterSpacing: 0.8 },

  activeNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginHorizontal: 16,
    marginTop: 4,
  },
  activeNoteText: { color: C.onSurfaceVariant, fontSize: 13, fontFamily: "Rajdhani_500Medium" },

  certifyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: C.primary,
    height: 52,
    marginHorizontal: 16,
    borderRadius: C.radius,
    elevation: 4,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  certifyBtnText: { color: C.onPrimary, fontSize: 16, fontFamily: "Rajdhani_700Bold", letterSpacing: 0.2 },

  inspRow: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 12,
    backgroundColor: C.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: C.outlineVariant,
  },
  inspTime: { color: C.outline, fontSize: 12, fontFamily: "Rajdhani_600SemiBold", width: 44 },
  inspName: { color: C.onSurfaceVariant, fontSize: 13, fontFamily: "Rajdhani_500Medium", flex: 1 },
});
