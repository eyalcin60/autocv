import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit", month: "short", year: "numeric",
  }).format(new Date(iso));
}

export const STATUS_LABELS: Record<string, string> = {
  draft: "Taslak",
  applied: "Başvuruldu",
  interview: "Mülakat",
  offer: "Teklif",
  rejected: "Reddedildi",
  withdrawn: "Geri Çekildi",
};

export const STATUS_COLORS: Record<string, string> = {
  draft:     "text-muted-foreground bg-muted/60",
  applied:   "text-blue-400 bg-blue-400/10",
  interview: "text-yellow-400 bg-yellow-400/10",
  offer:     "text-green-400 bg-green-400/10",
  rejected:  "text-red-400 bg-red-400/10",
  withdrawn: "text-muted-foreground bg-muted/40",
};

export const DOC_TYPE_LABELS: Record<string, string> = {
  cv: "CV",
  publication: "Yayın",
  project: "Proje",
  other: "Diğer",
};
