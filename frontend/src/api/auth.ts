let _token: string | null = null;
let _devToken: string | null = import.meta.env.VITE_DEV_TOKEN as string | null ?? null;

export function setAuthToken(token: string | null) {
  _token = token;
}

export function getAuthHeaders(): Record<string, string> {
  if (_token) return { Authorization: `Bearer ${_token}` };
  if (_devToken) return { "X-Dev-Token": _devToken };
  return {};
}
