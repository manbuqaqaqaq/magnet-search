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

// Parse title from magnet dn= parameter, decode URL encoding
function decodeTitle(dn) {
  try {
    return decodeURIComponent(dn.replace(/\+/g, " "));
  } catch {
    return dn.replace(/\+/g, " ").replace(/%20/g, " ");
  }
}

export async function search(query, page = 1) {
  const url = `https://tpb.party/search/${encodeURIComponent(query)}/${page}/99/0`;

  const resp = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    },
    signal: AbortSignal.timeout(config.sourceTimeout),
  });

  if (!resp.ok) throw new Error(`tpb returned ${resp.status}`);
  const html = await resp.text();

  const results = [];
  const seen = new Set();

  // Find all magnet links with btih hash and dn= title
  const magnetRe =
    /href="magnet:\?xt=urn:btih:([a-fA-F0-9]{40})&dn=([^"&]*)(?:&tr=[^"]*)?"/gi;
  let match;
  while ((match = magnetRe.exec(html)) !== null) {
    const infoHash = match[1].toLowerCase();
    const title = decodeTitle(match[2]);
    if (!infoHash || !title || seen.has(infoHash)) continue;
    seen.add(infoHash);

    // Full magnet link
    const magnetEnd = html.indexOf('"', match.index + 6);
    const magnet = html.slice(match.index + 6, magnetEnd);

    // Look for size/seeder/leecher after this magnet
    // Pattern: <td align="right">SIZE_UNIT</td><td align="right">SEEDS</td><td align="right">LEECHS</td>
    const afterMagnet = html.slice(match.index, match.index + 3000);
    const statsRe =
      /<td\s+align="right">\s*([\d.,]+\s*(?:&nbsp;|\s)*(?:GiB|MiB|KiB|TiB|GB|MB|KB|TB|B))\s*<\/td>\s*<td\s+align="right">\s*(\d+)\s*<\/td>\s*<td\s+align="right">\s*(\d+)\s*<\/td>/i;
    const statsM = afterMagnet.match(statsRe);

    const size = statsM ? parseSize(statsM[1]) : 0;
    const seeders = statsM ? parseInt(statsM[2]) : 0;
    const leechers = statsM ? parseInt(statsM[3]) : 0;

    // Date: find MM-DD before the magnet in this row
    const beforeMagnet = html.slice(Math.max(0, match.index - 600), match.index);
    const dateM = beforeMagnet.match(
      /<td(?:[^>]*)>\s*(\d{2}-\d{2}(?:\s*(?:&nbsp;)?\s*\d{4})?)\s*<\/td>\s*<td[^>]*>\s*<nobr>/i
    );
    let date = "";
    if (dateM) {
      date = dateM[1].replace(/&nbsp;/g, " ");
    }

    results.push(
      makeResult({
        title,
        magnet,
        infoHash,
        size,
        seeders,
        leechers,
        date,
        source: "tpb",
      })
    );
  }

  return results;
}
