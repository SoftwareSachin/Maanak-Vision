import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Alert, Platform, Pressable, SectionList, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import StatusBadge from "@/components/StatusBadge";
import { useInspection } from "@/context/InspectionContext";
import type { Batch } from "@/context/InspectionContext";

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export default function VaultScreen() {
  const insets = useSafeAreaInsets();
  const { batches, closeBatch, activeBatchId } = useInspection();
  const [expanded, setExpanded] = useState<string | null>(null);

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom;

  const totalParts = batches.reduce((a, b) => a + b.totalParts, 0);
  const certified = batches.filter((b) => b.certificateId).length;
  const totalPass = batches.reduce((a, b) => a + b.passed, 0);
  const passRate = totalParts > 0 ? Math.round((totalPass / totalParts) * 100) : 0;

  return (
    <View style={[S.root, { backgroundColor: "#0f0f0f" }]}>
      {/* Top bar */}
      <View style={[S.topBar, { paddingTop: topPad + 6, borderBottomColor: "#2a2a2a" }]}>
        <View>
          <Text style={S.title}>BIS 2026 VAULT</Text>
          <Text style={S.sub}>Inspection Certificates</Text>
        </View>
        <View style={S.stampBox}>
          <Feather name="shield" size={12} color="#F5C518" />
          <Text style={S.stampText}>CERTIFIED</Text>
        </View>
      </View>

      {/* Summary row — PhonePe style horizontal stats */}
      {batches.length > 0 && (
        <View style={[S.summRow, { borderBottomColor: "#2a2a2a" }]}>
          <SummCell label="BATCHES" value={batches.length} />
          <View style={S.vDiv} />
          <SummCell label="CERTIFIED" value={certified} color="#22C55E" />
          <View style={S.vDiv} />
          <SummCell label="TOTAL PARTS" value={totalParts} />
          <View style={S.vDiv} />
          <SummCell label="PASS RATE" value={`${passRate}%`} color={passRate >= 90 ? "#22C55E" : passRate >= 70 ? "#F59E0B" : "#EF4444"} />
        </View>
      )}

      {batches.length === 0 ? (
        <View style={S.empty}>
          <Feather name="shield" size={28} color="#2a2a2a" />
          <Text style={S.emptyText}>No batches yet</Text>
          <Text style={S.emptyHint}>Complete inspection batches to generate certificates</Text>
        </View>
      ) : (
        <SectionList
          sections={batches.map((b) => ({
            batch: b,
            data: expanded === b.id ? b.inspections.slice(0, 10) : [],
          }))}
          keyExtractor={(item, i) => item.id ?? String(i)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomPad + 20 }}
          renderSectionHeader={({ section }) => (
            <BatchRow
              batch={section.batch}
              isExpanded={expanded === section.batch.id}
              isActive={section.batch.id === activeBatchId}
              onToggle={() => setExpanded(expanded === section.batch.id ? null : section.batch.id)}
              onCertify={() =>
                Alert.alert("Issue Certificate", `Certify batch "${section.batch.productName}"?`, [
                  { text: "Cancel", style: "cancel" },
                  { text: "Issue", onPress: () => closeBatch(section.batch.id) },
                ])
              }
            />
          )}
          renderItem={({ item }) => (
            <View style={[S.inspRow, { borderBottomColor: "#1a1a1a", backgroundColor: "#080808" }]}>
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

function BatchRow({ batch, isExpanded, isActive, onToggle, onCertify }: {
  batch: Batch; isExpanded: boolean; isActive: boolean; onToggle: () => void; onCertify: () => void;
}) {
  const passRate = batch.totalParts > 0 ? Math.round((batch.passed / batch.totalParts) * 100) : 0;
  return (
    <View style={[S.batchBlock, { borderBottomColor: "#2a2a2a" }]}>
      <Pressable onPress={onToggle} style={S.batchRow}>
        {isActive && <View style={[S.liveBar, { backgroundColor: "#F5C518" }]} />}
        <View style={S.batchCenter}>
          <Text style={S.batchName} numberOfLines={1}>{batch.productName}</Text>
          <Text style={S.batchDate}>{fmtDate(batch.createdAt)}</Text>
        </View>
        <View style={S.batchRight}>
          <Text style={[S.batchPass, { color: "#22C55E" }]}>{batch.passed}</Text>
          <Text style={S.batchSlash}>/</Text>
          <Text style={[S.batchFail, { color: "#EF4444" }]}>{batch.failed}</Text>
          <Text style={S.batchTotal}>/{batch.totalParts}</Text>
        </View>
        {batch.certificateId && <Feather name="shield" size={14} color="#22C55E" style={{ marginLeft: 8 }} />}
        <Feather name={isExpanded ? "chevron-up" : "chevron-down"} size={14} color="#6B6B6B" style={{ marginLeft: 6 }} />
      </Pressable>

      {isExpanded && (
        <View style={[S.batchDetail, { borderTopColor: "#2a2a2a" }]}>
          {/* Progress bar */}
          <View style={{ paddingHorizontal: 16, paddingTop: 10, gap: 4 }}>
            <View style={S.barBg}>
              <View style={[S.barFill, { width: `${passRate}%`, backgroundColor: passRate >= 90 ? "#22C55E" : passRate >= 70 ? "#F59E0B" : "#EF4444" }]} />
            </View>
            <Text style={S.barLabel}>{passRate}% pass rate · {batch.totalParts} parts inspected</Text>
          </View>

          {/* Certificate block or certify action */}
          {batch.certificateId ? (
            <View style={[S.certBlock, { borderColor: "#2a2a2a" }]}>
              <QRMock size={48} />
              <View style={{ flex: 1 }}>
                <Text style={S.certTitle}>ISI CERTIFICATE</Text>
                <Text style={S.certId}>{batch.certificateId}</Text>
                <Text style={S.certMeta}>{batch.productName} · {fmtDate(batch.createdAt)}</Text>
              </View>
              <View style={[S.certPill, { backgroundColor: "#22C55E" }]}>
                <Text style={S.certPillText}>CERTIFIED</Text>
              </View>
            </View>
          ) : isActive ? (
            <Text style={[S.barLabel, { paddingHorizontal: 16, paddingBottom: 10 }]}>Batch is active — close batch to certify</Text>
          ) : (
            <Pressable onPress={onCertify} style={({ pressed }) => [S.certifyBtn, { opacity: pressed ? 0.8 : 1 }]}>
              <Feather name="shield" size={15} color="#000" />
              <Text style={S.certifyBtnText}>ISSUE BIS CERTIFICATE</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

function SummCell({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Text style={{ color: color ?? "#FFFFFF", fontSize: 18, fontFamily: "Rajdhani_700Bold" }}>{value}</Text>
      <Text style={{ color: "#6B6B6B", fontSize: 9, fontFamily: "Rajdhani_700Bold", letterSpacing: 1.2 }}>{label}</Text>
    </View>
  );
}

function QRMock({ size }: { size: number }) {
  const cell = Math.floor(size / 7);
  const p = [[1,1,1,0,1,1,1],[1,0,1,0,1,0,1],[1,1,1,0,1,1,1],[0,0,1,0,0,0,0],[1,1,1,0,1,1,1],[1,0,0,0,0,0,1],[1,1,1,0,1,1,1]];
  return (
    <View style={{ width: size, height: size, marginRight: 12 }}>
      {p.map((row, ri) => (
        <View key={ri} style={{ flexDirection: "row" }}>
          {row.map((v, ci) => <View key={ci} style={{ width: cell, height: cell, backgroundColor: v ? "#F5C518" : "transparent" }} />)}
        </View>
      ))}
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
  },
  title: { color: "#F5C518", fontSize: 18, fontFamily: "Rajdhani_700Bold", letterSpacing: 2 },
  sub: { color: "#6B6B6B", fontSize: 11, fontFamily: "Rajdhani_400Regular", letterSpacing: 0.6, marginTop: 1 },
  stampBox: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: StyleSheet.hairlineWidth, borderColor: "#F5C518", paddingHorizontal: 8, paddingVertical: 5, borderRadius: 4 },
  stampText: { color: "#F5C518", fontSize: 10, fontFamily: "Rajdhani_700Bold", letterSpacing: 1.5 },
  summRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  vDiv: { width: StyleSheet.hairlineWidth, height: 28, backgroundColor: "#2a2a2a" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  emptyText: { color: "#2a2a2a", fontSize: 15, fontFamily: "Rajdhani_500Medium" },
  emptyHint: { color: "#2a2a2a", fontSize: 13, fontFamily: "Rajdhani_400Regular", textAlign: "center", paddingHorizontal: 40 },
  batchBlock: { borderBottomWidth: StyleSheet.hairlineWidth },
  batchRow: { height: 60, flexDirection: "row", alignItems: "center", paddingRight: 16, gap: 0 },
  liveBar: { width: 3, height: "100%", marginRight: 13 },
  batchCenter: { flex: 1, paddingLeft: 16 },
  batchName: { color: "#FFFFFF", fontSize: 15, fontFamily: "Rajdhani_500Medium" },
  batchDate: { color: "#6B6B6B", fontSize: 11, fontFamily: "Rajdhani_400Regular", marginTop: 1 },
  batchRight: { flexDirection: "row", alignItems: "center" },
  batchPass: { fontSize: 14, fontFamily: "Rajdhani_700Bold" },
  batchSlash: { color: "#2a2a2a", fontSize: 13, marginHorizontal: 1 },
  batchFail: { fontSize: 14, fontFamily: "Rajdhani_700Bold" },
  batchTotal: { color: "#6B6B6B", fontSize: 13, fontFamily: "Rajdhani_400Regular" },
  batchDetail: { borderTopWidth: StyleSheet.hairlineWidth, paddingBottom: 12 },
  barBg: { height: 2, backgroundColor: "#2a2a2a", borderRadius: 1, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 1 },
  barLabel: { color: "#6B6B6B", fontSize: 11, fontFamily: "Rajdhani_400Regular" },
  certBlock: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginTop: 10, padding: 12, borderWidth: StyleSheet.hairlineWidth, borderRadius: 4, backgroundColor: "#0a0a0a" },
  certTitle: { color: "#6B6B6B", fontSize: 9, fontFamily: "Rajdhani_700Bold", letterSpacing: 2 },
  certId: { color: "#F5C518", fontSize: 14, fontFamily: "Rajdhani_700Bold", letterSpacing: 1, marginTop: 1 },
  certMeta: { color: "#6B6B6B", fontSize: 11, fontFamily: "Rajdhani_400Regular", marginTop: 2 },
  certPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  certPillText: { color: "#fff", fontSize: 10, fontFamily: "Rajdhani_700Bold", letterSpacing: 0.8 },
  certifyBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#F5C518", height: 60, borderRadius: 6, marginHorizontal: 16, marginTop: 10 },
  certifyBtnText: { color: "#000", fontSize: 18, fontFamily: "Rajdhani_700Bold", letterSpacing: 2 },
  inspRow: { height: 48, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  inspTime: { color: "#6B6B6B", fontSize: 12, fontFamily: "Rajdhani_500Medium", width: 50 },
  inspName: { color: "#A1A1A0", fontSize: 13, fontFamily: "Rajdhani_400Regular", flex: 1 },
});
