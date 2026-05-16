import config from "../config.js";
import { makeResult } from "./base.js";

const BASE = "https://knaben.org";

function parseSize(str) {
  if (!str) return 0;
  const m = str.trim().match(/([\d.,]+)\s*(GB|MB|KB|TB|B)/i);
  if (!m) return 0;
  const v = parseFloat(m[1].replace(/,/g, ""));
  const mult = { B: 1, KB: 1024, MB: 1048576, GB: 1073741824, TB: 1099511627776 };
  return Math.round(v * (mult[m[2]] || 1));
}

export async function search(query, page = 1) {
  const url = `${BASE}/search?q=${encodeURIComponent(query)}&page=${page}`;
  const resp = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(config.sourceTimeout),
  });

  if (!resp.ok) throw new Error(`knaben returned ${resp.status}`);
  const html = await resp.text();

  const results = [];
  const seen = new Set();

  // Find all magnet links
  const magnetRe = /href="(magnet:\?xt=urn:btih:([a-fA-F0-9]{40})&dn=([^"&]*)[^"]*)"/gi;
  let match;
  while ((match = magnetRe.exec(html)) !== null) {
    const magnet = match[1];
    const infoHash = match[2].toLowerCase();
    const title = decodeURIComponent(match[3] || "")
      .replace(/\+/g, " ")
      .replace(/\.torrent$/i, "")
      .trim();

    if (!infoHash || !title || seen.has(infoHash)) continue;
    seen.add(infoHash);

    // Find the surrounding context for size, seeders, leechers, date
    const pos = match.index;

    // Look backward for size (pattern: XX.X GB/MB with Bytes title attr)
    const beforeCtx = html.slice(Math.max(0, pos - 1000), pos);
    const sizeM = beforeCtx.match(/title="(\d+)\s*Bytes"/);
    const size = sizeM ? parseInt(sizeM[1]) : 0;

    // Look forward for seeders/leechers (cyan colored numbers)
    const afterCtx = html.slice(pos, pos + 2000);
    const statsM = afterCtx.match(
      /style="color:\s*#00bfffff">(\d+)<\/td>\s*<td[^>]*style="color:\s*#00bfffff">(\d+)<\/td>/
    );
    const seeders = statsM ? parseInt(statsM[1]) : 0;
    const leechers = statsM ? parseInt(statsM[2]) : 0;

    // Date
    const dateM = afterCtx.match(/title="(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})"/);
    const date = dateM ? dateM[1].slice(0, 10) : "";

    // Source attribution
    const sourceM = afterCtx.match(/<a\s+href="[^"]*"[^>]*>([^<]{3,30})<\/a>/i);
    const subSource = sourceM ? sourceM[1].trim() : "";

    results.push(
      makeResult({
        title,
        magnet,
        infoHash,
        size,
        seeders,
        leechers,
        date,
        source: subSource ? `knaben/${subSource}` : "knaben",
      })
    );
  }

  return results;
}
