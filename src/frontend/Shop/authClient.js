export function getStoredToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("token") || "";
}

export function getTokenPayload() {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    return JSON.parse(window.atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

export function getAuthHeaders(extraHeaders = {}) {
  const token = getStoredToken();
  return token ? { ...extraHeaders, Authorization: `Bearer ${token}` } : { ...extraHeaders };
}

export function getUserIdFromToken() {
  return getTokenPayload()?.user_id ?? null;
}

export function getUserRoleFromToken() {
  return getTokenPayload()?.role ?? null;
}
