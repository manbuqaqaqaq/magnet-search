const BASE = "/api";

export async function search({ q, sort = "heat", page = 1, filters = {} }) {
  const params = new URLSearchParams({ q, sort, page: String(page) });
  if (filters.sources?.length) params.set("sources", filters.sources.join(","));
  if (filters.minSize != null) params.set("minSize", String(filters.minSize));
  if (filters.maxSize != null) params.set("maxSize", String(filters.maxSize));
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  const resp = await fetch(`${BASE}/search?${params}`);
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(body.error || `请求失败 (${resp.status})`);
  }
  return resp.json();
}

export async function fetchSources() {
  const resp = await fetch(`${BASE}/sources`);
  if (!resp.ok) return [];
  return resp.json();
}
