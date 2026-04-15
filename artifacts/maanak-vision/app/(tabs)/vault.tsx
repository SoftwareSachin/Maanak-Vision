import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import StatusBadge from "@/components/StatusBadge";
import { useInspection } from "@/context/InspectionContext";
import type { Batch } from "@/context/InspectionContext";

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export default function VaultScreen() {
  const insets = useSafeAreaInsets();
  const { batches, closeBatch, activeBatchId } = useInspection();
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom;

  const totalParts = batches.reduce((a, b) => a + b.totalParts, 0);
  const certified = batches.filter((b) => b.certificateId).length;
  const passRate =
    totalParts > 0
      ? Math.round((batches.reduce((a, b) => a + b.passed, 0) / totalParts) * 100)
      : 0;

  return (
    <View style={[styles.root, { backgroundColor: "#000" }]}>
      {/* Header */}
      <View style={[styles.topBar, { paddingTop: topPad + 8, borderBottomColor: "#1E1E1E" }]}>
        <View>
          <Text style={styles.pageTitle}>BIS 2026 VAULT</Text>
          <Text style={styles.pageSub}>Inspection Certificates</Text>
        </View>
        <View style={styles.stampBadge}>
          <Feather name="shield" size={13} color="#F5C518" />
          <Text style={styles.stampText}>CERTIFIED</Text>
        </View>
      </View>

      {/* Summary strip */}
      {batches.length > 0 && (
        <View style={[styles.summaryStrip, { borderBottomColor: "#1E1E1E" }]}>
          <SummCell label="BATCHES" value={batches.length.toString()} />
          <View style={styles.stripDivider} />
          <SummCell label="CERTIFIED" value={certified.toString()} color="#22C55E" />
          <View style={styles.stripDivider} />
          <SummCell label="TOTAL PARTS" value={totalParts.toString()} />
          <View style={styles.stripDivider} />
          <SummCell label="PASS RATE" value={`${passRate}%`} color={passRate >= 90 ? "#22C55E" : passRate >= 70 ? "#F59E0B" : "#EF4444"} />
        </View>
      )}

      {batches.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="shield" size={32} color="#2A2A2A" />
          <Text style={styles.emptyText}>No batches yet</Text>
          <Text style={styles.emptyHint}>Close a batch to generate a certificate</Text>
        </View>
      ) : (
        <SectionList
          sections={batches.map((b) => ({ batch: b, data: expandedBatch === b.id ? b.inspections.slice(0, 8) : [] }))}
          keyExtractor={(item, idx) => item.id ?? idx.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomPad + 30 }}
          renderSectionHeader={({ section }) => (
            <BatchRow
              batch={section.batch}
              isExpanded={expandedBatch === section.batch.id}
              isActive={section.batch.id === activeBatchId}
              onToggle={() => setExpandedBatch(expandedBatch === section.batch.id ? null : section.batch.id)}
              onCertify={() =>
                Alert.alert("Issue Certificate", `Certify batch "${section.batch.productName}"?`, [
                  { text: "Cancel", style: "cancel" },
                  { text: "Issue", onPress: () => closeBatch(section.batch.id) },
                ])
              }
            />
          )}
          renderItem={({ item }) => (
            <View style={[styles.inspRow, { borderBottomColor: "#1A1A1A" }]}>
              <Text style={styles.inspTime}>{formatTime(item.timestamp)}</Text>
              <Text style={styles.inspProduct} numberOfLines={1}>{item.productName}</Text>
              <StatusBadge result={item.result} />
            </View>
          )}
        />
      )}
    </View>
  );
}

function BatchRow({
  batch,
  isExpanded,
  isActive,
  onToggle,
  onCertify,
}: {
  batch: Batch;
  isExpanded: boolean;
  isActive: boolean;
  onToggle: () => void;
  onCertify: () => void;
}) {
  const passRate =
    batch.totalParts > 0
      ? Math.round((batch.passed / batch.totalParts) * 100)
      : 0;

  return (
    <View style={[styles.batchBlock, { borderBottomColor: "#1E1E1E" }]}>
      <Pressable onPress={onToggle} style={styles.batchHeaderRow}>
        <View style={styles.batchLeft}>
          {isActive && (
            <View style={[styles.liveDot, { backgroundColor: "#F5C518" }]} />
          )}
          {batch.certificateId && (
            <Feather name="shield" size={13} color="#22C55E" style={{ marginRight: 6 }} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.batchName} numberOfLines={1}>{batch.productName}</Text>
            <Text style={styles.batchDate}>{formatDate(batch.createdAt)}</Text>
          </View>
        </View>

        <View style={styles.batchRight}>
          <View style={styles.batchStatsRow}>
            <MiniStat value={batch.totalParts} color="#F0F0F0" />
            <Text style={styles.batchSlash}>/</Text>
            <MiniStat value={batch.passed} color="#22C55E" />
            <Text style={styles.batchSlash}>/</Text>
            <MiniStat value={batch.failed} color="#EF4444" />
          </View>
          <Feather name={isExpanded ? "chevron-up" : "chevron-down"} size={16} color="#444" />
        </View>
      </Pressable>

      {isExpanded && (
        <View style={styles.batchExpanded}>
          {/* Pass rate bar */}
          <View style={styles.barWrap}>
            <View style={[styles.barBg, { backgroundColor: "#1A1A1A" }]}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${passRate}%`,
                    backgroundColor: passRate >= 90 ? "#22C55E" : passRate >= 70 ? "#F59E0B" : "#EF4444",
                  },
                ]}
              />
            </View>
            <Text style={styles.barLabel}>{passRate}% pass rate</Text>
          </View>

          {/* Certificate or certify button */}
          {batch.certificateId ? (
            <View style={styles.certRow}>
              <View style={styles.certLeft}>
                <QRMock size={52} />
                <View>
                  <Text style={styles.certIdLabel}>ISI CERTIFICATE</Text>
                  <Text style={styles.certId}>{batch.certificateId}</Text>
                  <Text style={styles.certMeta}>{batch.totalParts} parts · {formatDate(batch.createdAt)}</Text>
                </View>
              </View>
              <View style={[styles.certBadge, { backgroundColor: "#22C55E" }]}>
                <Text style={styles.certBadgeText}>CERTIFIED</Text>
              </View>
            </View>
          ) : !isActive ? (
            <Pressable
              onPress={onCertify}
              style={({ pressed }) => [styles.certifyBtn, { opacity: pressed ? 0.8 : 1 }]}
            >
              <Feather name="shield" size={15} color="#1C1C1E" />
              <Text style={styles.certifyBtnText}>ISSUE BIS CERTIFICATE</Text>
            </Pressable>
          ) : (
            <Text style={styles.activeNote}>Batch is active — close batch to certify</Text>
          )}
        </View>
      )}
    </View>
  );
}

function SummCell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Text style={[styles.summValue, { color: color ?? "#F0F0F0" }]}>{value}</Text>
      <Text style={styles.summLabel}>{label}</Text>
    </View>
  );
}

function MiniStat({ value, color }: { value: number; color: string }) {
  return <Text style={{ color, fontSize: 15, fontWeight: "800" }}>{value}</Text>;
}

function QRMock({ size }: { size: number }) {
  const cell = Math.floor(size / 7);
  const pat = [
    [1,1,1,0,1,1,1],
    [1,0,1,0,1,0,1],
    [1,1,1,0,1,1,1],
    [0,0,0,1,0,0,0],
    [1,1,1,0,1,1,1],
    [1,0,1,0,1,0,1],
    [1,1,1,0,1,1,1],
  ];
  return (
    <View style={{ width: size, height: size, marginRight: 12 }}>
      {pat.map((row, ri) => (
        <View key={ri} style={{ flexDirection: "row" }}>
          {row.map((v, ci) => (
            <View key={ci} style={{ width: cell, height: cell, backgroundColor: v ? "#F5C518" : "transparent" }} />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  pageTitle: { color: "#F5C518", fontSize: 18, fontWeight: "900", letterSpacing: 2 },
  pageSub: { color: "#444", fontSize: 11, fontWeight: "600", letterSpacing: 0.8, marginTop: 1 },
  stampBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: "#F5C518",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 4,
  },
  stampText: { color: "#F5C518", fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  summaryStrip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  stripDivider: { width: 1, height: 28, backgroundColor: "#1E1E1E" },
  summValue: { fontSize: 18, fontWeight: "900" },
  summLabel: { color: "#444", fontSize: 9, fontWeight: "700", letterSpacing: 1.5, marginTop: 1 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  emptyText: { color: "#333", fontSize: 16, fontWeight: "700", marginTop: 8 },
  emptyHint: { color: "#2A2A2A", fontSize: 13, fontWeight: "500" },
  batchBlock: { borderBottomWidth: 1 },
  batchHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 10,
  },
  batchLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 0 },
  liveDot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
  batchName: { color: "#F0F0F0", fontSize: 15, fontWeight: "700" },
  batchDate: { color: "#444", fontSize: 11, fontWeight: "500", marginTop: 1 },
  batchRight: { flexDirection: "row", alignItems: "center", gap: 14 },
  batchStatsRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  batchSlash: { color: "#333", fontSize: 13, fontWeight: "400" },
  batchExpanded: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 12,
  },
  barWrap: { gap: 4 },
  barBg: { height: 3, borderRadius: 2, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 2 },
  barLabel: { color: "#444", fontSize: 11, fontWeight: "600" },
  certRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0D0D0D",
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#1E1E1E",
  },
  certLeft: { flexDirection: "row", alignItems: "center" },
  certIdLabel: { color: "#444", fontSize: 9, fontWeight: "800", letterSpacing: 2 },
  certId: { color: "#F5C518", fontSize: 14, fontWeight: "900", letterSpacing: 1, marginTop: 1 },
  certMeta: { color: "#444", fontSize: 11, fontWeight: "500", marginTop: 2 },
  certBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  certBadgeText: { color: "#fff", fontSize: 11, fontWeight: "800", letterSpacing: 0.8 },
  certifyBtn: {
    backgroundColor: "#F5C518",
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  certifyBtnText: { color: "#1C1C1E", fontSize: 14, fontWeight: "900", letterSpacing: 1.5 },
  activeNote: { color: "#444", fontSize: 12, fontWeight: "500", textAlign: "center" },
  inspRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 10,
    backgroundColor: "#080808",
  },
  inspTime: { color: "#444", fontSize: 12, fontWeight: "600", width: 52 },
  inspProduct: { color: "#888", fontSize: 13, fontWeight: "600", flex: 1 },
});
