import { getAuthHeaders } from "./auth";

const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "http://127.0.0.1:8081";

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...getAuthHeaders(), ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export interface ApiToken {
  id: number;
  name: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

export interface MintedToken extends ApiToken {
  token: string;
}

export const listTokens = (): Promise<ApiToken[]> => req("/auth/tokens");
export const mintToken = (name: string): Promise<MintedToken> =>
  req("/auth/tokens", { method: "POST", body: JSON.stringify({ name }) });
export const revokeToken = (id: number): Promise<void> =>
  req(`/auth/tokens/${id}`, { method: "DELETE" });
