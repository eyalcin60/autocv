"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const electronAPI = {
    // ─── Store ─────────────────────────────────────────────────────────────────
    storeGet: (key) => electron_1.ipcRenderer.invoke("store:get", key),
    storeSet: (key, value) => electron_1.ipcRenderer.invoke("store:set", key, value),
    storeDelete: (key) => electron_1.ipcRenderer.invoke("store:delete", key),
    // ─── File dialogs ───────────────────────────────────────────────────────────
    openFile: (options) => electron_1.ipcRenderer.invoke("dialog:open-file", options),
    saveFile: (options) => electron_1.ipcRenderer.invoke("dialog:save-file", options),
    // ─── Docx ──────────────────────────────────────────────────────────────────
    parseDocx: (base64Data) => electron_1.ipcRenderer.invoke("file:parse-docx", base64Data),
    extractDocxHeadings: (base64Data) => electron_1.ipcRenderer.invoke("file:extract-headings", base64Data),
    generateDocx: (content, title) => electron_1.ipcRenderer.invoke("file:generate-docx", { content, title }),
    // ─── AI generation (streaming) ──────────────────────────────────────────────
    generateAI: (params) => electron_1.ipcRenderer.invoke("ai:generate", params),
    onStreamChunk: (callback) => {
        const handler = (_, chunk) => callback(chunk);
        electron_1.ipcRenderer.on("ai:stream-chunk", handler);
        return () => electron_1.ipcRenderer.removeListener("ai:stream-chunk", handler);
    },
    onStreamDone: (callback) => {
        const handler = (_, full) => callback(full);
        electron_1.ipcRenderer.on("ai:stream-done", handler);
        return () => electron_1.ipcRenderer.removeListener("ai:stream-done", handler);
    },
    onStreamError: (callback) => {
        const handler = (_, err) => callback(err);
        electron_1.ipcRenderer.on("ai:stream-error", handler);
        return () => electron_1.ipcRenderer.removeListener("ai:stream-error", handler);
    },
};
electron_1.contextBridge.exposeInMainWorld("electronAPI", electronAPI);
