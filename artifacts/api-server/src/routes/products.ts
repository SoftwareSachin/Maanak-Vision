import { Router } from "express";
import { z } from "zod";

const router = Router();

interface TrainedProduct {
  id: string;
  name: string;
  shots: string[];
  createdAt: number;
  active: boolean;
}

const store: Map<string, TrainedProduct> = new Map();

const CreateProductSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  shots: z.array(z.string()),
  createdAt: z.number(),
  active: z.boolean().optional().default(false),
});

const SetActiveSchema = z.object({ id: z.string() });

router.get("/products", (_req, res) => {
  const products = Array.from(store.values()).sort((a, b) => b.createdAt - a.createdAt);
  res.json({ data: products });
});

router.post("/products", (req, res) => {
  const parsed = CreateProductSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }
  const product: TrainedProduct = { ...parsed.data, active: parsed.data.active ?? false };
  if (parsed.data.active) {
    for (const p of store.values()) p.active = false;
  }
  store.set(product.id, product);
  res.status(201).json({ data: product });
});

router.get("/products/:id", (req, res) => {
  const product = store.get(req.params.id!);
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json({ data: product });
});

router.put("/products/:id/activate", (req, res) => {
  const product = store.get(req.params.id!);
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  for (const p of store.values()) p.active = false;
  product.active = true;
  res.json({ data: product });
});

router.delete("/products/:id", (req, res) => {
  if (!store.has(req.params.id!)) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  store.delete(req.params.id!);
  res.status(204).send();
});

export default router;
