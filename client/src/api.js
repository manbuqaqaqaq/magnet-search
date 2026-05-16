const BASE = "/api";

function buildParams({ q, sort = "heat", page = 1, filters = {} }) {
  const params = new URLSearchParams({ q, sort, page: String(page) });
  if (filters.sources?.length) params.set("sources", filters.sources.join(","));
  if (filters.minSize != null) params.set("minSize", String(filters.minSize));
  if (filters.maxSize != null) params.set("maxSize", String(filters.maxSize));
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  return params;
}

export async function search(opts) {
  const resp = await fetch(`${BASE}/search?${buildParams(opts)}`);
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(body.error || `请求失败 (${resp.status})`);
  }
  return resp.json();
}

// SSE 流式搜索：返回 EventSource 对象，前端逐源接收结果
export function searchStream(opts, { onSource, onComplete, onError }) {
  const params = buildParams(opts);
  const es = new EventSource(`${BASE}/search/stream?${params}`);

  es.addEventListener("source", (e) => {
    try { onSource?.(JSON.parse(e.data)); } catch {}
  });
  es.addEventListener("complete", (e) => {
    try { onComplete?.(JSON.parse(e.data)); } catch {}
    es.close();
  });
  es.addEventListener("error", (e) => {
    try {
      if (e.data) onError?.(JSON.parse(e.data));
    } catch {
      onError?.({ error: "连接中断" });
    }
    es.close();
  });
  return es;
}

export async function fetchSources() {
  const resp = await fetch(`${BASE}/sources`);
  if (!resp.ok) return [];
  return resp.json();
}
