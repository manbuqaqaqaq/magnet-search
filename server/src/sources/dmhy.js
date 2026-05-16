import config from "../config.js";
import { makeResult } from "./base.js";

function parseSize(str) {
  if (!str) return 0;
  const m = str.trim().match(/([\d.,]+)\s*(GB|MB|KB|TB|B)/i);
  if (!m) return 0;
  const v = parseFloat(m[1].replace(/,/g, ""));
  const mult = { B: 1, KB: 1024, MB: 1048576, GB: 1073741824, TB: 1099511627776 };
  return Math.round(v * (mult[m[2]] || 1));
}

export async function search(query, page = 1) {
  const url = `https://dmhy.org/topics/list?keyword=${encodeURIComponent(query)}&page=${page}`;
  const resp = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      "Accept-Language": "zh-CN,zh;q=0.9",
    },
    signal: AbortSignal.timeout(config.sourceTimeout),
  });

  if (!resp.ok) throw new Error(`dmhy returned ${resp.status}`);
  const html = await resp.text();

  const results = [];
  const seen = new Set();

  // Split by table rows
  const rows = html.split(/<tr\b/gi);
  for (const row of rows) {
    // Must have a magnet link
    const magnetM = row.match(
      /class="download-arrow arrow-magnet"[^>]*href="(magnet:\?xt=urn:btih:([a-fA-F0-9]{40}|[A-Z2-7]{32})[^"]*)"/i
    );
    if (!magnetM) continue;

    const magnet = magnetM[1];
    let infoHash = magnetM[2].toLowerCase();

    // Must have a title link
    const titleM = row.match(
      /href="\/topics\/view\/\d+[^"]*"[^>]*>\s*([\s\S]*?)\s*<\/a>/i
    );
    if (!titleM) continue;

    const title = titleM[1].replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
    if (!title) continue;

    if (seen.has(infoHash)) continue;
    seen.add(infoHash);

    // Size
    const sizeM = row.match(/([\d.,]+\s*(?:GB|MB|KB|TB|B))/i);
    const size = sizeM ? parseSize(sizeM[1]) : 0;

    // Seeders: span with class btl_N
    const seedM = row.match(/<span\s+class="btl_\d*">(\d+)<\/span>/i);
    const seeders = seedM ? parseInt(seedM[1]) : 0;

    // Leechers: span with class bts_N
    const leechM = row.match(/<span\s+class="bts_\d*">(\d+)<\/span>/i);
    const leechers = leechM ? parseInt(leechM[1]) : 0;

    // Date: YYYY/MM/DD or YYYY-MM-DD in first td
    const dateM = row.match(/(\d{4}[-\/]\d{2}[-\/]\d{2})/);
    const date = dateM ? dateM[1] : "";

    results.push(
      makeResult({
        title,
        magnet,
        infoHash,
        size,
        seeders,
        leechers,
        date,
        source: "dmhy",
      })
    );
  }

  return results;
}
