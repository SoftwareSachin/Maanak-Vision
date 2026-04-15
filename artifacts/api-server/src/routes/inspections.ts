import { Router } from "express";
import { z } from "zod";
import { batchStore } from "./batches";

const router = Router();

interface Inspection {
  id: string;
  productName: string;
  result: "pass" | "fail" | "warning";
  defects: Array<{ type: string; severity: string; description: string }>;
  timestamp: number;
  batchId: string;
  bisCompliant: boolean;
  inspectorNote?: string;
}

const inspectionStore: Map<string, Inspection> = new Map();

const ResultEnum = z.enum(["pass", "fail", "warning"]);

const DefectSchema = z.object({
  type: z.string(),
  severity: z.string(),
  description: z.string(),
});

const CreateInspectionSchema = z.object({
  id: z.string().optional(),
  productName: z.string().min(1),
  result: ResultEnum,
  defects: z.array(DefectSchema).default([]),
  timestamp: z.number().optional(),
  batchId: z.string(),
  bisCompliant: z.boolean(),
  inspectorNote: z.string().optional(),
});

router.get("/inspections", (req, res) => {
  const { batchId, result, limit } = req.query as Record<string, string | undefined>;
  let list = Array.from(inspectionStore.values());
  if (batchId) list = list.filter((i) => i.batchId === batchId);
  if (result) list = list.filter((i) => i.result === result);
  list.sort((a, b) => b.timestamp - a.timestamp);
  if (limit) list = list.slice(0, Number(limit));
  res.json({ data: list, total: list.length });
});

router.post("/inspections", (req, res) => {
  const parsed = CreateInspectionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }
  const id = parsed.data.id ?? (Date.now().toString() + Math.random().toString(36).substring(2, 9));
  const inspection: Inspection = {
    ...parsed.data,
    id,
    timestamp: parsed.data.timestamp ?? Date.now(),
  };
  inspectionStore.set(id, inspection);

  const batch = batchStore.get(parsed.data.batchId);
  if (batch) {
    batch.inspections.unshift(inspection);
    batch.totalParts += 1;
    if (inspection.result === "pass") batch.passed += 1;
    else if (inspection.result === "fail") batch.failed += 1;
    else batch.warnings += 1;
    batch.bisCompliant = batch.totalParts > 0 && batch.failed === 0;
  }

  res.status(201).json({ data: inspection });
});

router.get("/inspections/:id", (req, res) => {
  const inspection = inspectionStore.get(req.params.id!);
  if (!inspection) {
    res.status(404).json({ error: "Inspection not found" });
    return;
  }
  res.json({ data: inspection });
});

router.get("/inspections/stats/summary", (_req, res) => {
  const all = Array.from(inspectionStore.values());
  const total = all.length;
  const passed = all.filter((i) => i.result === "pass").length;
  const failed = all.filter((i) => i.result === "fail").length;
  const warnings = all.filter((i) => i.result === "warning").length;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
  res.json({ data: { total, passed, failed, warnings, passRate } });
});

export default router;
