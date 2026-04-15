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

export function InspectionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        const storedBatches = await AsyncStorage.getItem(BATCHES_KEY);
        if (stored) setInspections(JSON.parse(stored));
        if (storedBatches) setBatches(JSON.parse(storedBatches));
      } catch {}
    })();
  }, []);

  const persist = useCallback(
    async (newInspections: Inspection[], newBatches: Batch[]) => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newInspections));
        await AsyncStorage.setItem(BATCHES_KEY, JSON.stringify(newBatches));
      } catch {}
    },
    []
  );

  const startBatch = useCallback(
    (productName: string) => {
      const id =
        Date.now().toString() + Math.random().toString(36).substring(2, 9);
      const newBatch: Batch = {
        id,
        productName,
        totalParts: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        createdAt: Date.now(),
        inspections: [],
        bisCompliant: false,
      };
      const updated = [newBatch, ...batches];
      setBatches(updated);
      setActiveBatchId(id);
      persist(inspections, updated);
      return id;
    },
    [batches, inspections, persist]
  );

  const addInspection = useCallback(
    (inspection: Inspection) => {
      const updatedInspections = [inspection, ...inspections];
      setInspections(updatedInspections);

      const updatedBatches = batches.map((b) => {
        if (b.id === inspection.batchId) {
          const passed = b.passed + (inspection.result === "pass" ? 1 : 0);
          const failed = b.failed + (inspection.result === "fail" ? 1 : 0);
          const warnings =
            b.warnings + (inspection.result === "warning" ? 1 : 0);
          const total = b.totalParts + 1;
          const bisCompliant = total > 0 && failed === 0;
          return {
            ...b,
            totalParts: total,
            passed,
            failed,
            warnings,
            bisCompliant,
            inspections: [inspection, ...b.inspections],
          };
        }
        return b;
      });

      setBatches(updatedBatches);
      persist(updatedInspections, updatedBatches);
    },
    [inspections, batches, persist]
  );

  const closeBatch = useCallback(
    (batchId: string) => {
      const certId = "BIS-" + Date.now().toString(36).toUpperCase();
      const updated = batches.map((b) =>
        b.id === batchId ? { ...b, certificateId: certId } : b
      );
      setBatches(updated);
      if (activeBatchId === batchId) setActiveBatchId(null);
      persist(inspections, updated);
    },
    [batches, activeBatchId, inspections, persist]
  );

  const clearAll = useCallback(async () => {
    setInspections([]);
    setBatches([]);
    setActiveBatchId(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
    await AsyncStorage.removeItem(BATCHES_KEY);
  }, []);

  const currentBatch = batches.find((b) => b.id === activeBatchId) ?? null;

  return (
    <InspectionContext.Provider
      value={{
        inspections,
        batches,
        currentBatch,
        activeBatchId,
        addInspection,
        startBatch,
        closeBatch,
        clearAll,
      }}
    >
      {children}
    </InspectionContext.Provider>
  );
}

export function useInspection() {
  const ctx = useContext(InspectionContext);
  if (!ctx) throw new Error("useInspection must be used within InspectionProvider");
  return ctx;
}
