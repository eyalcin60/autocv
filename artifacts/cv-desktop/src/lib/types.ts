export interface Profile {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedinUrl: string;
  githubUrl: string;
  websiteUrl: string;
  summary: string;
  skills: string; // comma-separated
  languages: string; // comma-separated
}

export type DocumentType = "cv" | "publication" | "project" | "other";

export interface Document {
  id: string;
  title: string;
  type: DocumentType;
  content: string;
  description: string;
  createdAt: string;
}

export type ApplicationStatus = "draft" | "applied" | "interview" | "offer" | "rejected" | "withdrawn";
export type CvType = "academic" | "industry";

export interface DocxHeading {
  level: number;
  text: string;
}

export interface GeneratedDoc {
  id: string;
  type: "cv" | "cover_letter";
  cvType?: CvType;
  content: string;
  version: number;
  templateHeadings?: DocxHeading[];
  createdAt: string;
}

export interface Application {
  id: string;
  jobTitle: string;
  company: string;
  jobDescription: string;
  jobUrl: string;
  status: ApplicationStatus;
  notes: string;
  generatedDocs: GeneratedDoc[];
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  openaiApiKey: string;
  model: string;
}

export interface AppStore {
  profile: Profile | null;
  documents: Document[];
  applications: Application[];
  settings: Settings;
}

export interface GenerateParams {
  type: "cv" | "cover_letter";
  cvType?: "academic" | "industry";
  profile: Profile | null;
  documents: Array<{ title: string; type: string; content: string }>;
  jobTitle: string;
  company: string;
  jobDescription: string;
  templateHeadings?: DocxHeading[];
  userDraft?: string;
}
