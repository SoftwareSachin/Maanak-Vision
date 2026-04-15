import { pgTable, text, integer, boolean, bigint, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const productsTable = pgTable("products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  shots: jsonb("shots").$type<string[]>().notNull().default([]),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  active: boolean("active").notNull().default(false),
});

export const insertProductSchema = createInsertSchema(productsTable);
export const selectProductSchema = createSelectSchema(productsTable);
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;

export const batchesTable = pgTable("batches", {
  id: text("id").primaryKey(),
  productName: text("product_name").notNull(),
  totalParts: integer("total_parts").notNull().default(0),
  passed: integer("passed").notNull().default(0),
  failed: integer("failed").notNull().default(0),
  warnings: integer("warnings").notNull().default(0),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  closedAt: bigint("closed_at", { mode: "number" }),
  certificateId: text("certificate_id"),
  bisCompliant: boolean("bis_compliant").notNull().default(false),
});

export const insertBatchSchema = createInsertSchema(batchesTable);
export const selectBatchSchema = createSelectSchema(batchesTable);
export type InsertBatch = z.infer<typeof insertBatchSchema>;
export type Batch = typeof batchesTable.$inferSelect;

export const inspectionsTable = pgTable("inspections", {
  id: text("id").primaryKey(),
  productName: text("product_name").notNull(),
  result: text("result", { enum: ["pass", "fail", "warning"] }).notNull(),
  defects: jsonb("defects")
    .$type<Array<{ type: string; severity: string; description: string }>>()
    .notNull()
    .default([]),
  timestamp: bigint("timestamp", { mode: "number" }).notNull(),
  batchId: text("batch_id")
    .notNull()
    .references(() => batchesTable.id),
  bisCompliant: boolean("bis_compliant").notNull().default(false),
  inspectorNote: text("inspector_note"),
});

export const insertInspectionSchema = createInsertSchema(inspectionsTable);
export const selectInspectionSchema = createSelectSchema(inspectionsTable);
export type InsertInspection = z.infer<typeof insertInspectionSchema>;
export type Inspection = typeof inspectionsTable.$inferSelect;
