import config from "../config.js";
import { makeResult } from "./base.js";

// 从 RSS XML 中提取 torrent 条目
function parseRSS(xml) {
  const results = [];
  const itemRegex =
    /<item>([\s\S]*?)<\/item>/gi;
  const fieldRegex =
    /<(?:nyaa:)?(\w+)>([^<]*)<\/(?:nyaa:)?\1>/gi;

  let itemMatch;
  while ((itemMatch = itemRegex.exec(xml)) !== null) {
    const content = itemMatch[1];
    const fields = {};
    let fieldMatch;
    while ((fieldMatch = fieldRegex.exec(content)) !== null) {
      fields[fieldMatch[1]] = fieldMatch[2].trim();
    }
    // Reset regex
    fieldRegex.lastIndex = 0;

    if (!fields.title || !fields.infoHash) continue;

    results.push(
      makeResult({
        title: fields.title,
        magnet: `magnet:?xt=urn:btih:${fields.infoHash}&dn=${encodeURIComponent(fields.title)}`,
        infoHash: fields.infoHash,
        size: parseNySize(fields.size),
        seeders: parseInt(fields.seeders) || 0,
        leechers: parseInt(fields.leechers) || 0,
        date: fields.pubDate || "",
        source: "nyaa",
        files: 1,
      })
    );
  }

  return results;
}

function parseNySize(str) {
  if (!str) return 0;
  const m = str.match(/([\d.]+)\s*(GiB|MiB|KiB|TiB|GB|MB|KB|TB|B)/i);
  if (!m) return 0;
  const v = parseFloat(m[1]);
  const u = m[2].toUpperCase().replace("I", "");
  const mult = { B: 1, KB: 1024, MB: 1048576, GB: 1073741824, TB: 1099511627776 };
  return Math.round(v * (mult[u] || 1));
}

export async function search(query, page = 1) {
  const url = `https://nyaa.si/?page=rss&q=${encodeURIComponent(query)}&s=seeders&o=desc`;

  const resp = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    signal: AbortSignal.timeout(config.sourceTimeout),
  });

  if (!resp.ok) throw new Error(`nyaa returned ${resp.status}`);
  const xml = await resp.text();
  return parseRSS(xml);
}
