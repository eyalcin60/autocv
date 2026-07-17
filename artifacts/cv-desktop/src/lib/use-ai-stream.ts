import { useState, useCallback, useRef } from "react";
import type { GenerateParams } from "@/lib/types";
import { useSettings } from "./store";

export interface UseAIStreamReturn {
  content: string;
  isGenerating: boolean;
  error: string | null;
  generate: (params: Omit<GenerateParams, "apiKey" | "model">) => Promise<void>;
  reset: () => void;
}

export function useAIStream(): UseAIStreamReturn {
  const [content, setContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { settings } = useSettings();
  const cleanupRef = useRef<(() => void)[]>([]);

  const reset = useCallback(() => {
    setContent("");
    setError(null);
  }, []);

  const generate = useCallback(async (params: Omit<GenerateParams, "apiKey" | "model">) => {
    setContent("");
    setError(null);
    setIsGenerating(true);

    // Remove old listeners
    for (const cleanup of cleanupRef.current) cleanup();
    cleanupRef.current = [];

    return new Promise<void>((resolve, reject) => {
      const offChunk = window.electronAPI.onStreamChunk((chunk) => {
        setContent(prev => prev + chunk);
      });
      const offDone = window.electronAPI.onStreamDone(() => {
        setIsGenerating(false);
        for (const cleanup of cleanupRef.current) cleanup();
        cleanupRef.current = [];
        resolve();
      });
      const offError = window.electronAPI.onStreamError((err) => {
        setError(err);
        setIsGenerating(false);
        for (const cleanup of cleanupRef.current) cleanup();
        cleanupRef.current = [];
        reject(new Error(err));
      });

      cleanupRef.current = [offChunk, offDone, offError];

      window.electronAPI
        .generateAI({ ...params, apiKey: settings.openaiApiKey, model: settings.model })
        .catch(reject);
    });
  }, [settings]);

  return { content, isGenerating, error, generate, reset };
}
