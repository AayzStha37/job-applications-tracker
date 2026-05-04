export const STATUSES = [
  "SAVED",
  "APPLIED",
  "SCREEN",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
] as const;

export type Status = (typeof STATUSES)[number];

export const TAILOR_STATUSES = [
  "PENDING",
  "TAILORED",
  "FAILED",
  "SKIPPED",
] as const;

export type TailorStatus = (typeof TAILOR_STATUSES)[number];

export interface Application {
  id: number;
  company: string;
  position: string;
  location: string | null;
  url: string;
  source: string;
  externalJobId: string | null;
  status: Status;
  notes: string | null;
  locCode: string | null;
  mailAlias: string | null;
  tailorStatus: TailorStatus;
  tailoredCvPath: string | null;
  tailorError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApplicationRequest {
  company: string;
  position: string;
  location?: string;
  url: string;
  source: string;
  externalJobId?: string;
  notes?: string;
  jobDescription?: string;
  locCode?: string;
  mailAlias?: string;
}

export interface UpdateApplicationRequest {
  status?: Status;
  notes?: string;
}
