import { useState, useEffect, useCallback } from "react";
import type { Profile, Document, Application, Settings, AppStore } from "./types";

// Generic hook for any store key
export function useStoreValue<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.electronAPI.storeGet(key).then((stored) => {
      setValue((stored as T) ?? defaultValue);
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const set = useCallback(async (newValue: T) => {
    setValue(newValue);
    await window.electronAPI.storeSet(key, newValue);
  }, [key]);

  return { value, set, loading };
}

// Typed store hooks
export function useProfile() {
  const { value, set, loading } = useStoreValue<Profile | null>("profile", null);
  return { profile: value, setProfile: set, loading };
}

export function useDocuments() {
  const { value, set, loading } = useStoreValue<Document[]>("documents", []);

  const addDocument = useCallback(async (doc: Omit<Document, "id" | "createdAt">) => {
    const newDoc: Document = {
      ...doc,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    const updated = [...(value ?? []), newDoc];
    await set(updated);
    return newDoc;
  }, [value, set]);

  const updateDocument = useCallback(async (id: string, updates: Partial<Document>) => {
    const updated = (value ?? []).map(d => d.id === id ? { ...d, ...updates } : d);
    await set(updated);
  }, [value, set]);

  const deleteDocument = useCallback(async (id: string) => {
    const updated = (value ?? []).filter(d => d.id !== id);
    await set(updated);
  }, [value, set]);

  return { documents: value ?? [], addDocument, updateDocument, deleteDocument, loading };
}

export function useApplications() {
  const { value, set, loading } = useStoreValue<Application[]>("applications", []);

  const addApplication = useCallback(async (app: Omit<Application, "id" | "createdAt" | "updatedAt" | "generatedDocs">) => {
    const newApp: Application = {
      ...app,
      id: crypto.randomUUID(),
      generatedDocs: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [...(value ?? []), newApp];
    await set(updated);
    return newApp;
  }, [value, set]);

  const updateApplication = useCallback(async (id: string, updates: Partial<Application>) => {
    const updated = (value ?? []).map(a =>
      a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
    );
    await set(updated);
  }, [value, set]);

  const deleteApplication = useCallback(async (id: string) => {
    const updated = (value ?? []).filter(a => a.id !== id);
    await set(updated);
  }, [value, set]);

  const addGeneratedDoc = useCallback(async (
    applicationId: string,
    doc: Omit<import("./types").GeneratedDoc, "id" | "createdAt" | "version">
  ) => {
    const apps = value ?? [];
    const app = apps.find(a => a.id === applicationId);
    if (!app) return;
    const existingSameType = app.generatedDocs.filter(
      d => d.type === doc.type && d.cvType === doc.cvType
    );
    const newDoc: import("./types").GeneratedDoc = {
      ...doc,
      id: crypto.randomUUID(),
      version: existingSameType.length + 1,
      createdAt: new Date().toISOString(),
    };
    const updated = apps.map(a =>
      a.id === applicationId
        ? { ...a, generatedDocs: [...a.generatedDocs, newDoc], updatedAt: new Date().toISOString() }
        : a
    );
    await set(updated);
    return newDoc;
  }, [value, set]);

  const updateGeneratedDoc = useCallback(async (applicationId: string, docId: string, content: string) => {
    const apps = value ?? [];
    const updated = apps.map(a =>
      a.id === applicationId
        ? {
            ...a,
            generatedDocs: a.generatedDocs.map(d =>
              d.id === docId ? { ...d, content } : d
            ),
            updatedAt: new Date().toISOString(),
          }
        : a
    );
    await set(updated);
  }, [value, set]);

  return {
    applications: value ?? [],
    addApplication,
    updateApplication,
    deleteApplication,
    addGeneratedDoc,
    updateGeneratedDoc,
    loading,
  };
}

export function useSettings() {
  const { value, set, loading } = useStoreValue<Settings>("settings", { openaiApiKey: "", model: "gpt-4o" });
  return { settings: value ?? { openaiApiKey: "", model: "gpt-4o" }, setSettings: set, loading };
}

// Whole store for dashboard stats
export function useAppStats() {
  const [stats, setStats] = useState<{
    totalApplications: number;
    totalDocuments: number;
    byStatus: Record<string, number>;
  }>({ totalApplications: 0, totalDocuments: 0, byStatus: {} });

  useEffect(() => {
    Promise.all([
      window.electronAPI.storeGet("applications"),
      window.electronAPI.storeGet("documents"),
    ]).then(([apps, docs]) => {
      const applications = (apps as Application[]) ?? [];
      const documents = (docs as Document[]) ?? [];
      const byStatus: Record<string, number> = {};
      for (const a of applications) {
        byStatus[a.status] = (byStatus[a.status] ?? 0) + 1;
      }
      setStats({
        totalApplications: applications.length,
        totalDocuments: documents.length,
        byStatus,
      });
    });
  }, []);

  return stats;
}
