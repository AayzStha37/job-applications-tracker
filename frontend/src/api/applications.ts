import type {
  Application,
  CompaniesData,
  CreateApplicationRequest,
  StatusHistoryEntry,
  TransitionData,
  UpdateApplicationRequest,
} from "../types";
import { getAuthHeaders } from "./auth";

const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "http://127.0.0.1:8081";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function listApplications(): Promise<Application[]> {
  return request<Application[]>("/applications");
}

export function createApplication(body: CreateApplicationRequest): Promise<Application> {
  return request<Application>("/applications", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateApplication(
  id: number,
  body: UpdateApplicationRequest,
): Promise<Application> {
  return request<Application>(`/applications/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteApplication(id: number): Promise<void> {
  return request<void>(`/applications/${id}`, { method: "DELETE" });
}

export function getTransitions(): Promise<TransitionData[]> {
  return request<TransitionData[]>("/applications/transitions");
}

export function getCompaniesForStatus(status: string): Promise<CompaniesData> {
  return request<CompaniesData>(`/applications/transitions/${status}`);
}

export function getStatusHistory(applicationId: number): Promise<StatusHistoryEntry[]> {
  return request<StatusHistoryEntry[]>(`/applications/${applicationId}/history`);
}
