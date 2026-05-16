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

const BASE = "https://torrentz2.nz";

// Parse search result listing
function parseSearchResults(html) {
  const results = [];

  // Each result is a <dl> block
  const dlRe = /<dl>([\s\S]*?)<\/dl>/gi;
  let match;
  while ((match = dlRe.exec(html)) !== null) {
    const block = match[1];

    // Title: <a href="/torrent/ID">TITLE</a>
    const titleM = block.match(
      /<a\s+href="(\/torrent\/([a-f0-9]{24}))">([^<]+)<\/a>/i
    );
    if (!titleM) continue;

    const torrentPath = titleM[1];
    const title = titleM[3].trim();

    // Size: <span class="s">SIZE</span>
    const sizeM = block.match(/<span\s+class="s">([^<]+)<\/span>/i);
    const size = sizeM ? parseSize(sizeM[1]) : 0;

    // Seeders: <span class="u">NUMBER</span>
    const seedM = block.match(/<span\s+class="u">(\d+)<\/span>/i);
    const seeders = seedM ? parseInt(seedM[1]) : 0;

    // Leechers: <span class="d">NUMBER</span>
    const leechM = block.match(/<span\s+class="d">(\d+)<\/span>/i);
    const leechers = leechM ? parseInt(leechM[1]) : 0;

    // Date: <span class="a"><span title="DATE">RELATIVE</span></span>
    const dateM = block.match(
      /<span\s+class="a">\s*<span[^>]*title="([^"]+)">/
    );
    const date = dateM ? dateM[1] : "";

    results.push({
      title,
      torrentPath,
      size,
      seeders,
      leechers,
      date,
    });
  }

  return results;
}

// Fetch a detail page to get the magnet link
async function fetchMagnet(torrentPath) {
  try {
    const resp = await fetch(`${BASE}${torrentPath}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      signal: AbortSignal.timeout(5000),
    });
    if (!resp.ok) return "";
    const html = await resp.text();

    // Magnet link: magnet:?xt&#x3D;urn:btih:HASH&amp;dn&#x3D;...
    const m = html.match(
      /magnet:\?xt(?:&#x3D;|=)urn:btih:([a-fA-F0-9]{40})(?:&|&amp;)dn(?:&#x3D;|=)([^"&]*)/i
    );
    if (m) {
      const infoHash = m[1].toLowerCase();
      const dn = decodeURIComponent(m[2].replace(/&#x3D;/g, "="));
      return `magnet:?xt=urn:btih:${infoHash}&dn=${encodeURIComponent(dn)}`;
    }

    // Fallback: just find the hash
    const hashM = html.match(
      /btih(?:&#x3D;|=)([a-fA-F0-9]{40})/i
    );
    if (hashM) {
      return `magnet:?xt=urn:btih:${hashM[1].toLowerCase()}`;
    }
  } catch {
    // Detail page fetch failed - skip magnet
  }
  return "";
}

export async function search(query, page = 1) {
  const url = `${BASE}/search?q=${encodeURIComponent(query)}&page=${page}`;
  const resp = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    },
    signal: AbortSignal.timeout(config.sourceTimeout),
  });

  if (!resp.ok) throw new Error(`torrentz2 returned ${resp.status}`);
  const html = await resp.text();
  const items = parseSearchResults(html);

  // Fetch magnets for first 15 results in parallel
  const magnetPromises = items.slice(0, 15).map((item) =>
    fetchMagnet(item.torrentPath).catch(() => "")
  );
  const magnets = await Promise.all(magnetPromises);

  const results = [];
  const seen = new Set();

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const magnet = i < magnets.length ? magnets[i] : "";
    const infoHash = extractHash(magnet);

    if (!infoHash || seen.has(infoHash)) continue;
    seen.add(infoHash);

    results.push(
      makeResult({
        title: item.title,
        magnet,
        infoHash,
        size: item.size,
        seeders: item.seeders,
        leechers: item.leechers,
        date: item.date,
        source: "torrentz2",
      })
    );
  }

  return results;
}

function extractHash(magnet) {
  const m = magnet?.match(/btih:([a-fA-F0-9]{40})/i);
  return m ? m[1].toLowerCase() : "";
}
