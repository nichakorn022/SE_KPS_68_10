export const API_BASE = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

export const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || "";

export function apiUrl(path) {
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

export function assetUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_ORIGIN}${normalizedPath}`;
}
