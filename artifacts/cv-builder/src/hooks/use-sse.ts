import React, { useState, useEffect, useCallback, useRef } from "react";

export function useSSE() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const stream = useCallback(
    async (
      url: string,
      options: RequestInit,
      onChunk: (content: string) => void,
      onDone?: () => void
    ) => {
      setIsStreaming(true);
      setError(null);
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            Accept: "text/event-stream",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.done) {
                    // end of stream
                  } else if (parsed.content) {
                    onChunk(parsed.content);
                  }
                } catch (e) {
                  console.error("Failed to parse SSE chunk", data);
                }
              }
            }
          }
        }
        if (onDone) onDone();
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsStreaming(false);
      }
    },
    []
  );

  return { stream, isStreaming, error };
}

export function useDebounce<T>(value: T, delay?: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay || 500);
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
