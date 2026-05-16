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

function parseResults(html) {
  const results = [];
  const seen = new Set();

  // Split by t-row, skip first (header) and detail/collapse rows
  const rows = html.split(/<tr class='t-row'>/gi).slice(1);

  for (const row of rows) {
    // Skip detail/collapse rows (contain colspan)
    if (/colspan/i.test(row.slice(0, 500))) continue;

    // Extract title from title attribute of the <a> tag (full title, not truncated <b>)
    const titleM = row.match(/<a\s+title="([^"]+)"\s+href="\/[^"]+\.html"/i);
    if (!titleM) continue;
    const title = titleM[1].trim();
    if (!title) continue;

    // Extract magnet link and hash
    const magnetM = row.match(/href="(magnet:\?xt=urn:btih:([a-fA-F0-9]{40})[^"]*)"/i);
    if (!magnetM) continue;

    const magnet = magnetM[1].replace(/&amp;/g, "&");
    const infoHash = magnetM[2].toLowerCase();
    if (seen.has(infoHash)) continue;
    seen.add(infoHash);

    // Extract size: <td ...>XX.X GB</td>
    const sizeM = row.match(/<td[^>]*>\s*([\d.,]+\s*(?:GB|MB|KB|TB|B))\s*<\/td>/i);
    const size = sizeM ? parseSize(sizeM[1]) : 0;

    // Extract seeders: <font color='green'><b>1,033</b></font>
    const seedM = row.match(/<font\s+color='green'>\s*<b>([\d,]+)<\/b>\s*<\/font>/i);
    const seeders = seedM ? parseInt(seedM[1].replace(/,/g, "")) : 0;

    // Extract leechers: <font color='#ff0000'><b>569</b></font>
    const leechM = row.match(/<font\s+color='#ff0000'>\s*<b>([\d,]+)<\/b>\s*<\/font>/i);
    const leechers = leechM ? parseInt(leechM[1].replace(/,/g, "")) : 0;

    results.push(
      makeResult({
        title,
        magnet,
        infoHash,
        size,
        seeders,
        leechers,
        date: "",
        source: "glodls",
      })
    );
  }

  return results;
}

export async function search(query, page = 1) {
  // glodls.to redirects to gtorrents.site; fetch follows redirects
  const url = `https://glodls.to/search.php?search=${encodeURIComponent(query)}`;
  const resp = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    },
    signal: AbortSignal.timeout(config.sourceTimeout),
  });

  if (!resp.ok) throw new Error(`glodls returned ${resp.status}`);
  const html = await resp.text();
  return parseResults(html);
}
