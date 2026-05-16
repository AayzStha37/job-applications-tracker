export const STATUSES = [
  "SAVED",
  "APPLIED",
  "GHOSTED",
  "SCREEN",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
] as const;

export type Status = (typeof STATUSES)[number];

/** Numeric order for forward/backward detection (higher = further along) */
export const STATUS_ORDER: Record<Status, number> = {
  SAVED: 0,
  APPLIED: 1,
  GHOSTED: 2,
  SCREEN: 3,
  INTERVIEW: 4,
  OFFER: 5,
  REJECTED: 6,
};

/** Valid forward transitions from each status */
export const VALID_TRANSITIONS: Record<Status, readonly Status[]> = {
  SAVED: ["APPLIED"],
  APPLIED: ["SCREEN", "REJECTED"],
  GHOSTED: ["SCREEN", "REJECTED"],
  SCREEN: ["INTERVIEW", "REJECTED"],
  INTERVIEW: ["OFFER", "REJECTED"],
  OFFER: ["REJECTED"],
  REJECTED: [],
};

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
  company?: string;
  position?: string;
  location?: string;
  url?: string;
  source?: string;
  externalJobId?: string;
  updatedAt?: string;
}

export interface StatusHistoryEntry {
  id: number;
  applicationId: number;
  fromStatus: Status | null;
  toStatus: Status;
  changedAt: string;
}

export interface TransitionData {
  fromStatus: string;
  toStatus: string;
  count: number;
}

export interface CompaniesData {
  status: string;
  companies: string[];
}
