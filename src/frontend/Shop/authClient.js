export function getStoredToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("token") || "";
}

export function getAuthHeaders(extraHeaders = {}) {
  const token = getStoredToken();
  return token ? { ...extraHeaders, Authorization: `Bearer ${token}` } : { ...extraHeaders };
}

export function getUserIdFromToken() {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const decoded = JSON.parse(window.atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return decoded?.user_id ?? null;
  } catch {
    return null;
  }
}
