const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

export type Session = {
  accessToken: string;
  refreshToken: string;
};

export function getSession(): Session | null {
  const raw = localStorage.getItem("ultracrm.session");
  return raw ? (JSON.parse(raw) as Session) : null;
}

export function setSession(session: Session) {
  localStorage.setItem("ultracrm.session", JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem("ultracrm.session");
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getSession()?.accessToken;
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {})
    }
  });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      clearSession();
      if (window.location.pathname !== "/login") window.location.assign("/login");
    }
    throw new Error(await response.text());
  }
  return response.json() as Promise<T>;
}

export async function uploadDocument(file: File) {
  const token = getSession()?.accessToken;
  const data = new FormData();
  data.append("file", file);
  const response = await fetch(`${API_URL}/rag/documents`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: data
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}
