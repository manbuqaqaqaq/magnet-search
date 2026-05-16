// TPB mirror — same parsing logic as tpb.js
import config from "../config.js";
import { makeResult } from "./base.js";

function parseSize(str) {
  if (!str) return 0;
  const clean = str.replace(/&nbsp;/g, " ").trim();
  const m = clean.match(/([\d.,]+)\s*(GiB|MiB|KiB|TiB|GB|MB|KB|TB|B)/i);
  if (!m) return 0;
  const v = parseFloat(m[1].replace(/,/g, ""));
  const unit = m[2].toUpperCase().replace("I", "");
  const mult = { B: 1, KB: 1024, MB: 1048576, GB: 1073741824, TB: 1099511627776 };
  return Math.round(v * (mult[unit] || 1));
}

function decodeTitle(dn) {
  try {
    return decodeURIComponent(dn.replace(/\+/g, " "));
  } catch {
    return dn.replace(/\+/g, " ").replace(/%20/g, " ");
  }
}

export async function search(query, page = 1) {
  const url = `https://thehiddenbay.com/search/${encodeURIComponent(query)}/${page}/99/0`;

  const resp = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    },
    signal: AbortSignal.timeout(config.sourceTimeout),
  });

  if (!resp.ok) throw new Error(`hiddenbay returned ${resp.status}`);
  const html = await resp.text();

  const results = [];
  const seen = new Set();

  const magnetRe =
    /href="magnet:\?xt=urn:btih:([a-fA-F0-9]{40})&dn=([^"&]*)(?:&tr=[^"]*)?"/gi;
  let match;
  while ((match = magnetRe.exec(html)) !== null) {
    const infoHash = match[1].toLowerCase();
    const title = decodeTitle(match[2]);
    if (!infoHash || !title || seen.has(infoHash)) continue;
    seen.add(infoHash);

    const magnetEnd = html.indexOf('"', match.index + 6);
    const magnet = html.slice(match.index + 6, magnetEnd);

    const afterMagnet = html.slice(match.index, match.index + 3000);
    const statsRe =
      /<td\s+align="right">\s*([\d.,]+\s*(?:&nbsp;|\s)*(?:GiB|MiB|KiB|TiB|GB|MB|KB|TB|B))\s*<\/td>\s*<td\s+align="right">\s*(\d+)\s*<\/td>\s*<td\s+align="right">\s*(\d+)\s*<\/td>/i;
    const statsM = afterMagnet.match(statsRe);

    const size = statsM ? parseSize(statsM[1]) : 0;
    const seeders = statsM ? parseInt(statsM[2]) : 0;
    const leechers = statsM ? parseInt(statsM[3]) : 0;

    results.push(
      makeResult({
        title,
        magnet,
        infoHash,
        size,
        seeders,
        leechers,
        date: "",
        source: "hiddenbay",
      })
    );
  }

  return results;
}
