"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Store = require("electron-store");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const mammoth = require("mammoth");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Document, Paragraph, TextRun, HeadingLevel, Packer, AlignmentType, BorderStyle } = require("docx");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const OpenAI = require("openai").default;
const isDev = process.env.NODE_ENV === "development";
const store = new Store({
    name: "cv-builder-data",
    defaults: {
        profile: null,
        documents: [],
        applications: [],
        settings: { openaiApiKey: "", model: "gpt-4o" },
    },
});
let mainWindow = null;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1024,
        minHeight: 700,
        titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false,
        },
        backgroundColor: "#0f1117",
        show: false,
    });
    if (isDev) {
        mainWindow.loadURL("http://localhost:5174");
        mainWindow.webContents.openDevTools({ mode: "detach" });
    }
    else {
        mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
    }
    mainWindow.once("ready-to-show", () => {
        mainWindow?.show();
    });
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        electron_1.shell.openExternal(url);
        return { action: "deny" };
    });
    mainWindow.on("closed", () => {
        mainWindow = null;
    });
}
// ─── Store IPC ───────────────────────────────────────────────────────────────
electron_1.ipcMain.handle("store:get", (_event, key) => {
    return store.get(key);
});
electron_1.ipcMain.handle("store:set", (_event, key, value) => {
    store.set(key, value);
});
electron_1.ipcMain.handle("store:delete", (_event, key) => {
    store.delete(key);
});
// ─── File Dialogs ─────────────────────────────────────────────────────────────
electron_1.ipcMain.handle("dialog:open-file", async (_event, options) => {
    if (!mainWindow)
        return null;
    const result = await electron_1.dialog.showOpenDialog(mainWindow, {
        title: options.title || "Select File",
        filters: options.filters,
        properties: ["openFile"],
    });
    if (result.canceled || !result.filePaths.length)
        return null;
    const filePath = result.filePaths[0];
    const data = fs.readFileSync(filePath);
    return {
        name: path.basename(filePath),
        path: filePath,
        data: data.toString("base64"),
        ext: path.extname(filePath).toLowerCase(),
    };
});
electron_1.ipcMain.handle("dialog:save-file", async (_event, options) => {
    if (!mainWindow)
        return false;
    const result = await electron_1.dialog.showSaveDialog(mainWindow, {
        defaultPath: options.defaultName,
        filters: options.filters,
    });
    if (result.canceled || !result.filePath)
        return false;
    fs.writeFileSync(result.filePath, Buffer.from(options.data, "base64"));
    return result.filePath;
});
// ─── Docx Parsing ────────────────────────────────────────────────────────────
electron_1.ipcMain.handle("file:parse-docx", async (_event, base64Data) => {
    const buffer = Buffer.from(base64Data, "base64");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
});
electron_1.ipcMain.handle("file:extract-headings", async (_event, base64Data) => {
    const buffer = Buffer.from(base64Data, "base64");
    const result = await mammoth.convertToHtml({ buffer });
    const html = result.value;
    const headings = [];
    const headingRegex = /<h([1-6])[^>]*>(.*?)<\/h\1>/gi;
    let match;
    while ((match = headingRegex.exec(html)) !== null) {
        const text = match[2].replace(/<[^>]+>/g, "").trim();
        if (text)
            headings.push({ level: parseInt(match[1], 10), text });
    }
    return headings;
});
// ─── Docx Generation ─────────────────────────────────────────────────────────
function parseMarkdownToDocxChildren(markdown) {
    const lines = markdown.split("\n");
    const children = [];
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
            children.push(new Paragraph({ text: "" }));
            continue;
        }
        if (trimmed.startsWith("# ")) {
            children.push(new Paragraph({
                text: trimmed.slice(2),
                heading: HeadingLevel.HEADING_1,
            }));
        }
        else if (trimmed.startsWith("## ")) {
            children.push(new Paragraph({
                text: trimmed.slice(3),
                heading: HeadingLevel.HEADING_2,
            }));
        }
        else if (trimmed.startsWith("### ")) {
            children.push(new Paragraph({
                text: trimmed.slice(4),
                heading: HeadingLevel.HEADING_3,
            }));
        }
        else if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
            children.push(new Paragraph({
                text: trimmed.slice(2),
                bullet: { level: 0 },
            }));
        }
        else if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
            children.push(new Paragraph({
                children: [new TextRun({ text: trimmed.slice(2, -2), bold: true })],
            }));
        }
        else {
            // Handle inline bold
            const parts = trimmed.split(/(\*\*[^*]+\*\*)/g);
            if (parts.length > 1) {
                children.push(new Paragraph({
                    children: parts.map((p) => {
                        if (p.startsWith("**") && p.endsWith("**")) {
                            return new TextRun({ text: p.slice(2, -2), bold: true });
                        }
                        return new TextRun({ text: p });
                    }),
                }));
            }
            else {
                children.push(new Paragraph({ text: trimmed }));
            }
        }
    }
    return children;
}
electron_1.ipcMain.handle("file:generate-docx", async (_event, { content, title }) => {
    const doc = new Document({
        creator: "CV Builder",
        title,
        description: "Generated by CV Builder",
        sections: [{
                properties: {},
                children: parseMarkdownToDocxChildren(content),
            }],
    });
    const buffer = await Packer.toBuffer(doc);
    return buffer.toString("base64");
});
function buildSystemPrompt(params) {
    const { type, cvType, templateHeadings } = params;
    if (type === "cover_letter") {
        return `You are writing a cover letter ON BEHALF of a candidate, in their own voice and writing style.

CRITICAL — DO NOT sound like AI. Avoid these patterns:
- Do not use: "leveraged", "spearheaded", "dynamic", "passionate", "synergy", "robust", "scalable", "cutting-edge", "innovative", "drive results", "track record of", "I am excited to", "I am writing to express"
- Do not start with "I am applying for"
- Do not use hollow phrases or corporate buzzwords
- Write like an educated professional, not like a marketing brochure
- Use specific, concrete details from the candidate's actual experience
- Vary sentence length naturally — mix short punchy sentences with longer explanatory ones
- The opening paragraph must hook the reader immediately with something specific and relevant

Structure: 3-4 paragraphs. Opening hook → core fit argument with 1-2 concrete examples → brief closing with call to action.

Output: Plain text, no markdown, no headers.`;
    }
    const includeAcademic = cvType === "academic";
    const hasSections = templateHeadings && templateHeadings.length > 0;
    let prompt = `You are writing a CV ON BEHALF of a candidate, in their own voice and style.

CRITICAL — DO NOT sound like AI:
- Avoid: "leveraged", "spearheaded", "dynamic", "results-driven", "passionate", "synergy", "team player", "hard worker", "go-getter"
- Use specific numbers and facts, not vague claims
- Write action verbs naturally: "Built", "Ran", "Wrote", "Managed", "Reduced", "Grew" — not always at the start if it sounds forced
- Mirror the tone and register of the candidate's own materials
- Every bullet point must be concrete and specific, not generic

ATS OPTIMIZATION:
- Mirror exact keywords and phrases from the job description (ATS systems do exact matching)
- Use standard section headings that ATS systems recognize
- Spell out acronyms at least once`;
    if (includeAcademic) {
        prompt += `

CV TYPE: ACADEMIC
- Include all publications (with full citation format), research projects, grants, conference presentations, teaching experience
- Organize chronologically within sections
- Academic tone — more formal and comprehensive than industry CV
- Standard academic CV sections: Education, Research Experience, Publications, Conference Presentations, Teaching Experience, Grants & Awards, Professional Service`;
    }
    else {
        prompt += `

CV TYPE: INDUSTRY / SECTOR
- DO NOT include academic publications or research projects (unless directly relevant to the role)
- Focus on: work experience with measurable impact, technical skills, notable achievements, relevant education
- Keep it concise — ideally 1-2 pages
- Prioritize the most relevant experience for THIS specific job
- Standard industry sections: Professional Summary, Work Experience, Skills, Education (+ certifications if relevant)`;
    }
    if (hasSections) {
        const headingList = (templateHeadings ?? []).map(h => `${"  ".repeat(h.level - 1)}- ${h.text}`).join("\n");
        prompt += `

TEMPLATE STRUCTURE: The user has provided their own CV template. You MUST use EXACTLY these section headings in this exact order — do not add or remove sections, do not rename them:
${headingList}

Generate content for each section using the candidate's actual information. Keep headings as-is.`;
    }
    prompt += `

Output format: Markdown with # for H1 headings, ## for H2, ### for H3, - for bullets, **bold** for emphasis. Use the exact section headings specified above if a template was provided.`;
    return prompt;
}
function buildUserPrompt(params) {
    const { profile, documents, jobTitle, company, jobDescription, userDraft } = params;
    const profileText = profile
        ? Object.entries(profile)
            .filter(([, v]) => v && v.trim())
            .map(([k, v]) => `${k}: ${v}`)
            .join("\n")
        : "No profile provided.";
    const docsText = documents.length > 0
        ? documents.map(d => `--- ${d.title} (${d.type}) ---\n${d.content}`).join("\n\n")
        : "No source documents provided.";
    const draftText = userDraft
        ? `\nCANDIDATE'S OWN WRITING SAMPLE (match this tone and style):\n${userDraft}`
        : "";
    return `TARGET ROLE: ${jobTitle} at ${company}

JOB DESCRIPTION:
${jobDescription}

CANDIDATE PROFILE:
${profileText}

SOURCE MATERIALS (past CVs, publications, projects — extract relevant info):
${docsText}
${draftText}

Generate the document now. Use ONLY information from the candidate's actual materials — do not invent experience, qualifications, or achievements.`;
}
electron_1.ipcMain.handle("ai:generate", async (event, params) => {
    const { apiKey, model } = params;
    if (!apiKey) {
        event.sender.send("ai:stream-error", "OpenAI API key is not configured. Go to Settings to add it.");
        return;
    }
    const openai = new OpenAI({ apiKey });
    const systemPrompt = buildSystemPrompt(params);
    const userPrompt = buildUserPrompt(params);
    try {
        const stream = await openai.chat.completions.create({
            model: model || "gpt-4o",
            max_tokens: 8192,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            stream: true,
        });
        let fullContent = "";
        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
                fullContent += content;
                event.sender.send("ai:stream-chunk", content);
            }
        }
        event.sender.send("ai:stream-done", fullContent);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        event.sender.send("ai:stream-error", message);
    }
});
// ─── App lifecycle ────────────────────────────────────────────────────────────
electron_1.app.whenReady().then(() => {
    createWindow();
    electron_1.app.on("activate", () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});
electron_1.app.on("window-all-closed", () => {
    if (process.platform !== "darwin")
        electron_1.app.quit();
});
