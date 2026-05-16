import { makeResult } from "./base.js";

const BASE = "https://kittyspdy.com";

// 解析搜索结果 JSON，kitty 返回 JSON 格式
function parseResults(json, query) {
  if (!json || !Array.isArray(json)) return [];

  return json.slice(0, 30).map((item) =>
    makeResult({
      title: (item.name || "").trim(),
      magnet: item.magnet || `magnet:?xt=urn:btih:${item.hash || ""}`,
      infoHash: item.hash?.toLowerCase() || "",
      size: parseInt(item.size) || 0,
      seeders: parseInt(item.seeders) || 0,
      leechers: parseInt(item.leechers) || 0,
      date: item.created || item.date || "",
      source: "kittyspdy",
      files: parseInt(item.files) || 0,
    })
  );
}

export async function search(query, page = 1) {
  const url = `${BASE}/search/${encodeURIComponent(query)}/${page}`;
  const resp = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!resp.ok) throw new Error(`kittyspdy returned ${resp.status}`);

  const text = await resp.text();
  try {
    const json = JSON.parse(text);
    return parseResults(json, query);
  } catch {
    // 有些情况下返回的是 HTML
    return [];
  }
}
