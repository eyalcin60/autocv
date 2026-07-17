import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { applicationsTable } from "./applications";

export const generatedDocsTable = pgTable("generated_docs", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull().references(() => applicationsTable.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // cv | cover_letter
  cvSubtype: text("cv_subtype"), // academic | industry | null (only when type === 'cv')
  content: text("content").notNull(),
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertGeneratedDocSchema = createInsertSchema(generatedDocsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertGeneratedDoc = z.infer<typeof insertGeneratedDocSchema>;
export type GeneratedDoc = typeof generatedDocsTable.$inferSelect;
