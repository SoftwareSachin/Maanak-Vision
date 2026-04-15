import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type InspectionResult = "pass" | "fail" | "warning";

export interface DefectDetail {
  type: "crack" | "scratch" | "colour_mismatch" | "dimensional" | "none";
  severity: "low" | "medium" | "high";
  description: string;
}

export interface Inspection {
  id: string;
  productName: string;
  result: InspectionResult;
  defects: DefectDetail[];
  timestamp: number;
  batchId: string;
  imageUri?: string;
  bisCompliant: boolean;
  inspectorNote?: string;
}

export interface Batch {
  id: string;
  productName: string;
  totalParts: number;
  passed: number;
  failed: number;
  warnings: number;
  createdAt: number;
  inspections: Inspection[];
  certificateId?: string;
  bisCompliant: boolean;
}

interface InspectionContextType {
  inspections: Inspection[];
  batches: Batch[];
  currentBatch: Batch | null;
  activeBatchId: string | null;
  addInspection: (inspection: Inspection) => void;
  startBatch: (productName: string) => string;
  closeBatch: (batchId: string) => void;
  clearAll: () => void;
}

const InspectionContext = createContext<InspectionContextType | null>(null);

const STORAGE_KEY = "@maanak_inspections";
const BATCHES_KEY = "@maanak_batches";
const SEEDED_KEY = "@maanak_seeded_v2";

// Seed data — realistic MSME workshop parts, exactly like PhonePe transaction history
function buildSeedData() {
  const now = Date.now();
  const hr = 3600000;
  const batch1Id = "seed-batch-001";
  const batch2Id = "seed-batch-002";

  const parts: Array<{ name: string; result: InspectionResult; defect?: DefectDetail; ago: number; batchId: string }> = [
    { name: "Brass Valve 3/4\"", result: "pass", ago: 4 * hr + 23 * 60000, batchId: batch1Id },
    { name: "Brass Valve 3/4\"", result: "pass", ago: 4 * hr + 19 * 60000, batchId: batch1Id },
    { name: "Brass Valve 3/4\"", result: "fail", defect: { type: "crack", severity: "high", description: "Surface crack on thread section" }, ago: 4 * hr + 14 * 60000, batchId: batch1Id },
    { name: "Brass Valve 3/4\"", result: "pass", ago: 4 * hr + 10 * 60000, batchId: batch1Id },
    { name: "Brass Valve 3/4\"", result: "warning", defect: { type: "colour_mismatch", severity: "low", description: "Surface oxidation — check annealing" }, ago: 4 * hr + 7 * 60000, batchId: batch1Id },
    { name: "Brass Valve 3/4\"", result: "pass", ago: 4 * hr + 3 * 60000, batchId: batch1Id },
    { name: "Brass Valve 3/4\"", result: "pass", ago: 3 * hr + 58 * 60000, batchId: batch1Id },
    { name: "Brass Valve 3/4\"", result: "pass", ago: 3 * hr + 54 * 60000, batchId: batch1Id },
    { name: "Brass Valve 3/4\"", result: "fail", defect: { type: "dimensional", severity: "high", description: "Thread pitch outside ±0.05mm tolerance" }, ago: 3 * hr + 49 * 60000, batchId: batch1Id },
    { name: "Brass Valve 3/4\"", result: "pass", ago: 3 * hr + 44 * 60000, batchId: batch1Id },
    { name: "Hex Bolt M10×40", result: "pass", ago: 2 * hr + 11 * 60000, batchId: batch2Id },
    { name: "Hex Bolt M10×40", result: "pass", ago: 2 * hr + 8 * 60000, batchId: batch2Id },
    { name: "Hex Bolt M10×40", result: "pass", ago: 2 * hr + 5 * 60000, batchId: batch2Id },
    { name: "Hex Bolt M10×40", result: "warning", defect: { type: "scratch", severity: "medium", description: "Surface scratch on shank, 12mm" }, ago: 2 * hr + 1 * 60000, batchId: batch2Id },
    { name: "Hex Bolt M10×40", result: "pass", ago: 1 * hr + 57 * 60000, batchId: batch2Id },
    { name: "Hex Bolt M10×40", result: "pass", ago: 1 * hr + 53 * 60000, batchId: batch2Id },
    { name: "Hex Bolt M10×40", result: "fail", defect: { type: "dimensional", severity: "high", description: "Head height short by 0.8mm" }, ago: 1 * hr + 49 * 60000, batchId: batch2Id },
    { name: "Hex Bolt M10×40", result: "pass", ago: 1 * hr + 45 * 60000, batchId: batch2Id },
    { name: "Hex Bolt M10×40", result: "pass", ago: 1 * hr + 41 * 60000, batchId: batch2Id },
    { name: "Hex Bolt M10×40", result: "pass", ago: 1 * hr + 38 * 60000, batchId: batch2Id },
  ];

  const inspections: Inspection[] = parts.map((p, i) => ({
    id: `seed-${i}`,
    productName: p.name,
    result: p.result,
    defects: p.defect ? [p.defect] : [{ type: "none", severity: "low", description: "" }],
    timestamp: now - p.ago,
    batchId: p.batchId,
    bisCompliant: p.result === "pass",
  }));

  const b1Inspections = inspections.filter((i) => i.batchId === batch1Id);
  const b2Inspections = inspections.filter((i) => i.batchId === batch2Id);

  const batch1: Batch = {
    id: batch1Id,
    productName: "Brass Valve 3/4\"",
    totalParts: b1Inspections.length,
    passed: b1Inspections.filter((i) => i.result === "pass").length,
    failed: b1Inspections.filter((i) => i.result === "fail").length,
    warnings: b1Inspections.filter((i) => i.result === "warning").length,
    createdAt: now - 5 * hr,
    inspections: b1Inspections,
    certificateId: "BIS-4M7RX9K",
    bisCompliant: false,
  };

  const batch2: Batch = {
    id: batch2Id,
    productName: "Hex Bolt M10×40",
    totalParts: b2Inspections.length,
    passed: b2Inspections.filter((i) => i.result === "pass").length,
    failed: b2Inspections.filter((i) => i.result === "fail").length,
    warnings: b2Inspections.filter((i) => i.result === "warning").length,
    createdAt: now - 3 * hr,
    inspections: b2Inspections,
    bisCompliant: false,
  };

  return { inspections, batches: [batch2, batch1] };
}

export function InspectionProvider({ children }: { children: React.ReactNode }) {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const seeded = await AsyncStorage.getItem(SEEDED_KEY);
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        const storedBatches = await AsyncStorage.getItem(BATCHES_KEY);

        if (stored && storedBatches) {
          setInspections(JSON.parse(stored));
          setBatches(JSON.parse(storedBatches));
        } else if (!seeded) {
          // First install — seed with realistic data
          const { inspections: si, batches: sb } = buildSeedData();
          setInspections(si);
          setBatches(sb);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(si));
          await AsyncStorage.setItem(BATCHES_KEY, JSON.stringify(sb));
          await AsyncStorage.setItem(SEEDED_KEY, "1");
        }
      } catch {}
    })();
  }, []);

  const persist = useCallback(async (i: Inspection[], b: Batch[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(i));
      await AsyncStorage.setItem(BATCHES_KEY, JSON.stringify(b));
    } catch {}
  }, []);

  const startBatch = useCallback((productName: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 9);
    const newBatch: Batch = {
      id, productName,
      totalParts: 0, passed: 0, failed: 0, warnings: 0,
      createdAt: Date.now(), inspections: [], bisCompliant: false,
    };
    const updated = [newBatch, ...batches];
    setBatches(updated);
    setActiveBatchId(id);
    persist(inspections, updated);
    return id;
  }, [batches, inspections, persist]);

  const addInspection = useCallback((inspection: Inspection) => {
    const updatedInspections = [inspection, ...inspections];
    setInspections(updatedInspections);
    const updatedBatches = batches.map((b) => {
      if (b.id !== inspection.batchId) return b;
      const passed = b.passed + (inspection.result === "pass" ? 1 : 0);
      const failed = b.failed + (inspection.result === "fail" ? 1 : 0);
      const warnings = b.warnings + (inspection.result === "warning" ? 1 : 0);
      const total = b.totalParts + 1;
      return { ...b, totalParts: total, passed, failed, warnings, bisCompliant: total > 0 && failed === 0, inspections: [inspection, ...b.inspections] };
    });
    setBatches(updatedBatches);
    persist(updatedInspections, updatedBatches);
  }, [inspections, batches, persist]);

  const closeBatch = useCallback((batchId: string) => {
    const certId = "BIS-" + Date.now().toString(36).toUpperCase();
    const updated = batches.map((b) => b.id === batchId ? { ...b, certificateId: certId } : b);
    setBatches(updated);
    if (activeBatchId === batchId) setActiveBatchId(null);
    persist(inspections, updated);
  }, [batches, activeBatchId, inspections, persist]);

  const clearAll = useCallback(async () => {
    setInspections([]);
    setBatches([]);
    setActiveBatchId(null);
    await AsyncStorage.multiRemove([STORAGE_KEY, BATCHES_KEY, SEEDED_KEY]);
  }, []);

  const currentBatch = batches.find((b) => b.id === activeBatchId) ?? null;

  return (
    <InspectionContext.Provider value={{ inspections, batches, currentBatch, activeBatchId, addInspection, startBatch, closeBatch, clearAll }}>
      {children}
    </InspectionContext.Provider>
  );
}

export function useInspection() {
  const ctx = useContext(InspectionContext);
  if (!ctx) throw new Error("useInspection must be used within InspectionProvider");
  return ctx;
}
