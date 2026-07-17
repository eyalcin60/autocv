import { Router, type IRouter } from "express";
import { db, applicationsTable, documentsTable } from "@workspace/db";
import { sql, gte } from "drizzle-orm";
import { desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/dashboard/stats", async (_req, res): Promise<void> => {
  const [{ totalApplications }] = await db
    .select({ totalApplications: sql<number>`count(*)::int` })
    .from(applicationsTable);

  const [{ totalDocuments }] = await db
    .select({ totalDocuments: sql<number>`count(*)::int` })
    .from(documentsTable);

  const statusRows = await db
    .select({
      status: applicationsTable.status,
      count: sql<number>`count(*)::int`,
    })
    .from(applicationsTable)
    .groupBy(applicationsTable.status);

  const applicationsByStatus = {
    draft: 0,
    applied: 0,
    interview: 0,
    offer: 0,
    rejected: 0,
    withdrawn: 0,
  };
  for (const row of statusRows) {
    const key = row.status as keyof typeof applicationsByStatus;
    if (key in applicationsByStatus) {
      applicationsByStatus[key] = row.count;
    }
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const [{ recentActivityCount }] = await db
    .select({ recentActivityCount: sql<number>`count(*)::int` })
    .from(applicationsTable)
    .where(gte(applicationsTable.createdAt, sevenDaysAgo));

  res.json({
    totalApplications,
    totalDocuments,
    recentActivityCount,
    applicationsByStatus,
  });
});

router.get("/dashboard/recent-applications", async (_req, res): Promise<void> => {
  const apps = await db
    .select()
    .from(applicationsTable)
    .orderBy(desc(applicationsTable.createdAt))
    .limit(5);
  res.json(apps);
});

export default router;
