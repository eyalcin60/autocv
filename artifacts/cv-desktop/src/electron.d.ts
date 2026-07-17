import type { DocxHeading, GenerateParams, Profile } from "./lib/types";

interface FileInfo {
  name: string;
  path: string;
  data: string; // base64
  ext: string;
}

interface ElectronAPI {
  // Store
  storeGet(key: string): Promise<unknown>;
  storeSet(key: string, value: unknown): Promise<void>;
  storeDelete(key: string): Promise<void>;

  // File dialogs
  openFile(options: { filters: { name: string; extensions: string[] }[]; title?: string }): Promise<FileInfo | null>;
  saveFile(options: { data: string; defaultName: string; filters: { name: string; extensions: string[] }[] }): Promise<string | false>;

  // Docx
  parseDocx(base64Data: string): Promise<string>;
  extractDocxHeadings(base64Data: string): Promise<DocxHeading[]>;
  generateDocx(content: string, title: string): Promise<string>;

  // AI streaming
  generateAI(params: GenerateParams & { apiKey: string; model: string }): Promise<void>;
  onStreamChunk(callback: (content: string) => void): () => void;
  onStreamDone(callback: (fullContent: string) => void): () => void;
  onStreamError(callback: (error: string) => void): () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
