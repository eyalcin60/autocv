import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, generatedDocsTable } from "@workspace/db";
import {
  GetGeneratedDocParams,
  UpdateGeneratedDocParams,
  UpdateGeneratedDocBody,
  DeleteGeneratedDocParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/generated-docs", async (_req, res): Promise<void> => {
  const docs = await db
    .select()
    .from(generatedDocsTable)
    .orderBy(generatedDocsTable.createdAt);
  res.json(docs);
});

router.get("/generated-docs/:id", async (req, res): Promise<void> => {
  const params = GetGeneratedDocParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [doc] = await db
    .select()
    .from(generatedDocsTable)
    .where(eq(generatedDocsTable.id, params.data.id));
  if (!doc) {
    res.status(404).json({ error: "Generated document not found" });
    return;
  }
  res.json(doc);
});

router.patch("/generated-docs/:id", async (req, res): Promise<void> => {
  const params = UpdateGeneratedDocParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateGeneratedDocBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [doc] = await db
    .update(generatedDocsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(generatedDocsTable.id, params.data.id))
    .returning();
  if (!doc) {
    res.status(404).json({ error: "Generated document not found" });
    return;
  }
  res.json(doc);
});

router.delete("/generated-docs/:id", async (req, res): Promise<void> => {
  const params = DeleteGeneratedDocParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [doc] = await db
    .delete(generatedDocsTable)
    .where(eq(generatedDocsTable.id, params.data.id))
    .returning();
  if (!doc) {
    res.status(404).json({ error: "Generated document not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
