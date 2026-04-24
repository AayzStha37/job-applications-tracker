export const STATUSES = [
  "APPLIED",
  "SCREEN",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "WITHDRAWN",
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
}

export interface UpdateApplicationRequest {
  status?: Status;
  notes?: string;
}
