import type { Application, UpdateApplicationRequest } from "../types";

const BASE = "http://127.0.0.1:8080";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
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
