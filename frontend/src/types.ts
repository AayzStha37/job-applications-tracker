export const STATUSES = [
  "SAVED",
  "APPLIED",
  "SCREEN",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
] as const;

export type Status = (typeof STATUSES)[number];

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
  createdAt: string;
  updatedAt: string;
  statusChangedAt: string | null;
}

export interface CreateApplicationRequest {
  company: string;
  position: string;
  location?: string;
  url: string;
  source: string;
  externalJobId?: string;
  notes?: string;
}

export interface UpdateApplicationRequest {
  status?: Status;
  notes?: string;
}
