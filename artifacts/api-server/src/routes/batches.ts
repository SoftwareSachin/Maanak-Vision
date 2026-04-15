import { Router } from "express";
import { z } from "zod";

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

interface Batch {
  id: string;
  productName: string;
  totalParts: number;
  passed: number;
  failed: number;
  warnings: number;
  createdAt: number;
  closedAt?: number;
  inspections: Inspection[];
  certificateId?: string;
  bisCompliant: boolean;
}

const batchStore: Map<string, Batch> = new Map();

const CreateBatchSchema = z.object({
  id: z.string().optional(),
  productName: z.string().min(1),
});

router.get("/batches", (_req, res) => {
  const batches = Array.from(batchStore.values()).sort((a, b) => b.createdAt - a.createdAt);
  res.json({ data: batches });
});

router.post("/batches", (req, res) => {
  const parsed = CreateBatchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }
  const id = parsed.data.id ?? (Date.now().toString() + Math.random().toString(36).substring(2, 9));
  const batch: Batch = {
    id,
    productName: parsed.data.productName,
    totalParts: 0,
    passed: 0,
    failed: 0,
    warnings: 0,
    createdAt: Date.now(),
    inspections: [],
    bisCompliant: false,
  };
  batchStore.set(id, batch);
  res.status(201).json({ data: batch });
});

router.get("/batches/:id", (req, res) => {
  const batch = batchStore.get(req.params.id!);
  if (!batch) {
    res.status(404).json({ error: "Batch not found" });
    return;
  }
  res.json({ data: batch });
});

router.post("/batches/:id/close", (req, res) => {
  const batch = batchStore.get(req.params.id!);
  if (!batch) {
    res.status(404).json({ error: "Batch not found" });
    return;
  }
  if (batch.certificateId) {
    res.status(409).json({ error: "Batch already closed", certificateId: batch.certificateId });
    return;
  }
  const certId = "BIS-" + Date.now().toString(36).toUpperCase();
  batch.certificateId = certId;
  batch.closedAt = Date.now();
  res.json({ data: batch, certificateId: certId });
});

router.get("/batches/:id/inspections", (req, res) => {
  const batch = batchStore.get(req.params.id!);
  if (!batch) {
    res.status(404).json({ error: "Batch not found" });
    return;
  }
  res.json({ data: batch.inspections });
});

export { batchStore };
export default router;
