import { contextBridge, ipcRenderer } from "electron";

export interface FileInfo {
  name: string;
  path: string;
  data: string; // base64
  ext: string;
}

export interface DocxHeading {
  level: number;
  text: string;
}

export interface GenerateParams {
  type: "cv" | "cover_letter";
  cvType?: "academic" | "industry";
  profile: Record<string, string>;
  documents: Array<{ title: string; type: string; content: string }>;
  jobTitle: string;
  company: string;
  jobDescription: string;
  templateHeadings?: DocxHeading[];
  userDraft?: string;
  apiKey: string;
  model: string;
}

const electronAPI = {
  // ─── Store ─────────────────────────────────────────────────────────────────
  storeGet: (key: string): Promise<unknown> => ipcRenderer.invoke("store:get", key),
  storeSet: (key: string, value: unknown): Promise<void> => ipcRenderer.invoke("store:set", key, value),
  storeDelete: (key: string): Promise<void> => ipcRenderer.invoke("store:delete", key),

  // ─── File dialogs ───────────────────────────────────────────────────────────
  openFile: (options: { filters: Electron.FileFilter[]; title?: string }): Promise<FileInfo | null> =>
    ipcRenderer.invoke("dialog:open-file", options),

  saveFile: (options: { data: string; defaultName: string; filters: Electron.FileFilter[] }): Promise<string | false> =>
    ipcRenderer.invoke("dialog:save-file", options),

  // ─── Docx ──────────────────────────────────────────────────────────────────
  parseDocx: (base64Data: string): Promise<string> => ipcRenderer.invoke("file:parse-docx", base64Data),
  extractDocxHeadings: (base64Data: string): Promise<DocxHeading[]> => ipcRenderer.invoke("file:extract-headings", base64Data),
  generateDocx: (content: string, title: string): Promise<string> => ipcRenderer.invoke("file:generate-docx", { content, title }),

  // ─── AI generation (streaming) ──────────────────────────────────────────────
  generateAI: (params: GenerateParams): Promise<void> => ipcRenderer.invoke("ai:generate", params),

  onStreamChunk: (callback: (content: string) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, chunk: string) => callback(chunk);
    ipcRenderer.on("ai:stream-chunk", handler);
    return () => ipcRenderer.removeListener("ai:stream-chunk", handler);
  },

  onStreamDone: (callback: (fullContent: string) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, full: string) => callback(full);
    ipcRenderer.on("ai:stream-done", handler);
    return () => ipcRenderer.removeListener("ai:stream-done", handler);
  },

  onStreamError: (callback: (error: string) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, err: string) => callback(err);
    ipcRenderer.on("ai:stream-error", handler);
    return () => ipcRenderer.removeListener("ai:stream-error", handler);
  },
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);

declare global {
  interface Window {
    electronAPI: typeof electronAPI;
  }
}
