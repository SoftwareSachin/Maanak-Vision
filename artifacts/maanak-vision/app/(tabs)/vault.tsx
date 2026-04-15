import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Alert, Platform, Pressable, SectionList, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import StatusBadge from "@/components/StatusBadge";
import { useInspection } from "@/context/InspectionContext";
import type { Batch } from "@/context/InspectionContext";

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
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
  const totalPass = batches.reduce((a, b) => a + b.passed, 0);
  const passRate = totalParts > 0 ? Math.round((totalPass / totalParts) * 100) : 0;

  return (
    <View style={[S.root, { backgroundColor: "#0f0f0f" }]}>
      {/* Header — no subtitle, no stamp badge */}
      <View style={[S.topBar, { paddingTop: topPad + 8 }]}>
        <Text style={S.title}>BIS 2026 VAULT</Text>
        {totalParts > 0 && (
          <Text style={S.headerMeta}>{passRate}% pass · {batches.length} batches · {totalParts} parts</Text>
        )}
      </View>

      {/* Flat list of batches — no empty state illustration */}
      {batches.length === 0 ? (
        <View style={[S.emptyRow]}>
          <Text style={S.emptyText}>No batches — complete an inspection batch to generate a certificate</Text>
        </View>
      ) : (
        <SectionList
          sections={batches.map((b) => ({
            batch: b,
            data: expanded === b.id ? b.inspections.slice(0, 12) : [],
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
            <View style={[S.inspRow, { backgroundColor: "#080808" }]}>
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
  const passColor = passRate >= 90 ? "#22C55E" : passRate >= 70 ? "#F59E0B" : "#EF4444";

  return (
    <View style={[S.batchBlock]}>
      {/* Batch row — 60dp, PhonePe transaction row format */}
      <Pressable onPress={onToggle} style={S.batchRow}>
        {isActive && <View style={[S.livePip, { backgroundColor: "#F5C518" }]} />}

        {/* Left: pass/fail/total counts */}
        <View style={[S.batchIconBox, { backgroundColor: batch.certificateId ? "#0D2E18" : "#111" }]}>
          <Feather
            name={batch.certificateId ? "shield" : isActive ? "activity" : "archive"}
            size={16}
            color={batch.certificateId ? "#22C55E" : isActive ? "#F5C518" : "#444"}
          />
        </View>

        {/* Center: name + date */}
        <View style={S.batchCenter}>
          <Text style={S.batchName} numberOfLines={1}>{batch.productName}</Text>
          <Text style={S.batchMeta}>{fmtDate(batch.createdAt)} · {batch.totalParts} parts</Text>
        </View>

        {/* Right: pass rate + chevron */}
        <Text style={[S.passRate, { color: passColor }]}>{passRate}%</Text>
        <Feather name={isExpanded ? "chevron-up" : "chevron-down"} size={14} color="#444" style={{ marginLeft: 8 }} />
      </Pressable>

      {/* Expanded detail */}
      {isExpanded && (
        <View style={[S.detail, { borderTopColor: "#1a1a1a" }]}>
          {/* Pass/Fail/Warn counts — inline, no cards */}
          <View style={S.countsRow}>
            <CountCell label="PASS" value={batch.passed} color="#22C55E" />
            <View style={S.countDiv} />
            <CountCell label="FAIL" value={batch.failed} color="#EF4444" />
            <View style={S.countDiv} />
            <CountCell label="WARN" value={batch.warnings} color="#F59E0B" />
            <View style={S.countDiv} />
            <CountCell label="TOTAL" value={batch.totalParts} color="#A1A1A0" />
          </View>

          {/* Progress bar — thin 2dp */}
          <View style={S.barBg}>
            <View style={[S.barFill, { width: `${passRate}%`, backgroundColor: passColor }]} />
          </View>

          {/* Certificate */}
          {batch.certificateId ? (
            <View style={[S.certBlock]}>
              <QRMock size={44} />
              <View style={{ flex: 1 }}>
                <Text style={S.certLabel}>ISI CERTIFICATE</Text>
                <Text style={S.certId}>{batch.certificateId}</Text>
              </View>
              <View style={[S.certPill, { backgroundColor: "#22C55E" }]}>
                <Text style={S.certPillText}>CERTIFIED</Text>
              </View>
            </View>
          ) : isActive ? (
            <Text style={S.activeNote}>Active batch — scan more parts or close to certify</Text>
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

function CountCell({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Text style={{ color, fontSize: 20, fontFamily: "Rajdhani_700Bold" }}>{value}</Text>
      <Text style={{ color: "#6B6B6B", fontSize: 9, fontFamily: "Rajdhani_700Bold", letterSpacing: 1.5 }}>{label}</Text>
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
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#2a2a2a",
  },
  title: { color: "#F5C518", fontSize: 20, fontFamily: "Rajdhani_700Bold", letterSpacing: 2 },
  headerMeta: { color: "#6B6B6B", fontSize: 11, fontFamily: "Rajdhani_400Regular", marginTop: 1 },
  emptyRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#2a2a2a",
  },
  emptyText: { color: "#2a2a2a", fontSize: 13, fontFamily: "Rajdhani_400Regular" },
  batchBlock: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#2a2a2a",
  },
  batchRow: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 16,
  },
  livePip: { width: 3, height: "100%", marginRight: 0 },
  batchIconBox: {
    width: 40, height: 40, borderRadius: 4,
    alignItems: "center", justifyContent: "center",
    marginLeft: 16, marginRight: 12,
  },
  batchCenter: { flex: 1 },
  batchName: { color: "#fff", fontSize: 15, fontFamily: "Rajdhani_500Medium" },
  batchMeta: { color: "#6B6B6B", fontSize: 11, fontFamily: "Rajdhani_400Regular", marginTop: 1 },
  passRate: { fontSize: 16, fontFamily: "Rajdhani_700Bold" },
  detail: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingBottom: 12,
    gap: 10,
  },
  countsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  countDiv: { width: StyleSheet.hairlineWidth, height: 24, backgroundColor: "#2a2a2a" },
  barBg: { height: 2, backgroundColor: "#1a1a1a", marginHorizontal: 16 },
  barFill: { height: 2 },
  certBlock: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#1a1a1a",
  },
  certLabel: { color: "#6B6B6B", fontSize: 9, fontFamily: "Rajdhani_700Bold", letterSpacing: 2 },
  certId: { color: "#F5C518", fontSize: 14, fontFamily: "Rajdhani_700Bold", letterSpacing: 1, marginTop: 2 },
  certPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  certPillText: { color: "#fff", fontSize: 10, fontFamily: "Rajdhani_700Bold", letterSpacing: 0.8 },
  certifyBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: "#F5C518", height: 60, marginHorizontal: 16, borderRadius: 6,
  },
  certifyBtnText: { color: "#000", fontSize: 18, fontFamily: "Rajdhani_700Bold", letterSpacing: 2 },
  activeNote: { color: "#444", fontSize: 12, fontFamily: "Rajdhani_400Regular", paddingHorizontal: 16 },
  inspRow: {
    height: 48, flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#1a1a1a",
  },
  inspTime: { color: "#6B6B6B", fontSize: 12, fontFamily: "Rajdhani_500Medium", width: 48 },
  inspName: { color: "#A1A1A0", fontSize: 13, fontFamily: "Rajdhani_400Regular", flex: 1 },
});
