import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, applicationsTable, generatedDocsTable, documentsTable, profileTable } from "@workspace/db";
import {
  CreateApplicationBody,
  UpdateApplicationBody,
  GetApplicationParams,
  UpdateApplicationParams,
  DeleteApplicationParams,
  GenerateCvParams,
  GenerateCoverLetterParams,
} from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

router.get("/applications", async (_req, res): Promise<void> => {
  const apps = await db
    .select()
    .from(applicationsTable)
    .orderBy(applicationsTable.createdAt);
  res.json(apps);
});

router.post("/applications", async (req, res): Promise<void> => {
  const parsed = CreateApplicationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [app] = await db.insert(applicationsTable).values(parsed.data).returning();
  res.status(201).json(app);
});

router.get("/applications/:id", async (req, res): Promise<void> => {
  const params = GetApplicationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [app] = await db
    .select()
    .from(applicationsTable)
    .where(eq(applicationsTable.id, params.data.id));
  if (!app) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  const docs = await db
    .select()
    .from(generatedDocsTable)
    .where(eq(generatedDocsTable.applicationId, params.data.id))
    .orderBy(generatedDocsTable.createdAt);
  res.json({ ...app, generatedDocs: docs });
});

router.patch("/applications/:id", async (req, res): Promise<void> => {
  const params = UpdateApplicationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateApplicationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [app] = await db
    .update(applicationsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(applicationsTable.id, params.data.id))
    .returning();
  if (!app) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  res.json(app);
});

router.delete("/applications/:id", async (req, res): Promise<void> => {
  const params = DeleteApplicationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [app] = await db
    .delete(applicationsTable)
    .where(eq(applicationsTable.id, params.data.id))
    .returning();
  if (!app) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  res.sendStatus(204);
});

// AI: Generate ATS-optimized CV
router.post("/applications/:id/generate-cv", async (req, res): Promise<void> => {
  const params = GenerateCvParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [app] = await db
    .select()
    .from(applicationsTable)
    .where(eq(applicationsTable.id, params.data.id));
  if (!app) {
    res.status(404).json({ error: "Application not found" });
    return;
  }

  const [profile] = await db.select().from(profileTable).limit(1);
  const sourceDocs = await db.select().from(documentsTable).orderBy(documentsTable.createdAt);

  const profileText = profile
    ? `Name: ${profile.fullName}\nEmail: ${profile.email}\nPhone: ${profile.phone ?? ""}\nLocation: ${profile.location ?? ""}\nLinkedIn: ${profile.linkedinUrl ?? ""}\nGitHub: ${profile.githubUrl ?? ""}\nWebsite: ${profile.websiteUrl ?? ""}\nSummary: ${profile.summary ?? ""}\nSkills: ${profile.skills ?? ""}\nLanguages: ${profile.languages ?? ""}`
    : "No profile provided.";

  const sourceText = sourceDocs.length > 0
    ? sourceDocs.map(d => `--- ${d.title} (${d.type}) ---\n${d.content}`).join("\n\n")
    : "No source documents provided.";

  const systemPrompt = `You are an expert career consultant and CV writer who specializes in creating ATS-optimized CVs that get candidates shortlisted. 

Your task is to generate a complete, professional, ATS-optimized CV tailored to the specific job posting. 

Rules:
1. Mirror exact keywords and phrases from the job description (ATS requires exact matches)
2. Use standard section headings: Professional Summary, Work Experience, Education, Skills, Projects, Publications (only include sections with real data)
3. Use bullet points starting with strong action verbs
4. Quantify achievements where possible
5. Keep it concise and relevant — every word must earn its place
6. Output clean plain text / markdown that can be copied directly
7. Do NOT make up experiences or credentials — only use what's provided
8. Tailor the professional summary directly to the job requirements`;

  const userPrompt = `JOB TITLE: ${app.jobTitle}
COMPANY: ${app.company}

JOB DESCRIPTION:
${app.jobDescription}

CANDIDATE PROFILE:
${profileText}

SOURCE DOCUMENTS / PAST EXPERIENCE:
${sourceText}

Generate a complete ATS-optimized CV tailored to this specific job posting. Use the candidate's real information only.`;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullContent = "";

  const stream = await openai.chat.completions.create({
    model: "gpt-5.6-terra",
    max_completion_tokens: 8192,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      fullContent += content;
      res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }
  }

  // Determine next version number
  const existingDocs = await db
    .select()
    .from(generatedDocsTable)
    .where(eq(generatedDocsTable.applicationId, params.data.id));
  const cvDocs = existingDocs.filter(d => d.type === "cv");
  const nextVersion = cvDocs.length + 1;

  await db.insert(generatedDocsTable).values({
    applicationId: params.data.id,
    type: "cv",
    content: fullContent,
    version: nextVersion,
  });

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
});

// AI: Generate tailored cover letter
router.post("/applications/:id/generate-cover-letter", async (req, res): Promise<void> => {
  const params = GenerateCoverLetterParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [app] = await db
    .select()
    .from(applicationsTable)
    .where(eq(applicationsTable.id, params.data.id));
  if (!app) {
    res.status(404).json({ error: "Application not found" });
    return;
  }

  const [profile] = await db.select().from(profileTable).limit(1);
  const sourceDocs = await db.select().from(documentsTable).orderBy(documentsTable.createdAt);

  const profileText = profile
    ? `Name: ${profile.fullName}\nEmail: ${profile.email}\nLocation: ${profile.location ?? ""}\nLinkedIn: ${profile.linkedinUrl ?? ""}`
    : "No profile provided.";

  const sourceText = sourceDocs.length > 0
    ? sourceDocs.map(d => `--- ${d.title} (${d.type}) ---\n${d.content}`).join("\n\n")
    : "No source documents provided.";

  const systemPrompt = `You are an expert career consultant who writes compelling, personalized cover letters that get candidates shortlisted.

Your cover letters:
1. Open with a powerful, specific hook (not "I am applying for...")
2. Mirror key requirements from the job description naturally
3. Connect the candidate's real experience to the company's specific needs
4. Show genuine enthusiasm for the company, not generic flattery
5. Are concise (3-4 paragraphs maximum)
6. End with a confident, specific call to action
7. Sound human, intelligent, and direct — not templated
8. Do NOT make up experiences — only use what's provided`;

  const userPrompt = `JOB TITLE: ${app.jobTitle}
COMPANY: ${app.company}

JOB DESCRIPTION:
${app.jobDescription}

CANDIDATE PROFILE:
${profileText}

SOURCE DOCUMENTS / PAST EXPERIENCE:
${sourceText}

Write a tailored, compelling cover letter for this application.`;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullContent = "";

  const stream = await openai.chat.completions.create({
    model: "gpt-5.6-terra",
    max_completion_tokens: 8192,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      fullContent += content;
      res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }
  }

  // Determine next version number
  const existingDocs = await db
    .select()
    .from(generatedDocsTable)
    .where(eq(generatedDocsTable.applicationId, params.data.id));
  const clDocs = existingDocs.filter(d => d.type === "cover_letter");
  const nextVersion = clDocs.length + 1;

  await db.insert(generatedDocsTable).values({
    applicationId: params.data.id,
    type: "cover_letter",
    content: fullContent,
    version: nextVersion,
  });

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
});

export default router;
