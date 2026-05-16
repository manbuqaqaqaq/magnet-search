import config from "../config.js";
import { makeResult } from "./base.js";

function parseSize(str) {
  if (!str) return 0;
  const clean = str.replace(/&nbsp;/g, " ").trim();
  const m = clean.match(/([\d.,]+)\s*(GB|MB|KB|TB|B)/i);
  if (!m) return 0;
  const v = parseFloat(m[1].replace(/,/g, ""));
  const mult = { B: 1, KB: 1024, MB: 1048576, GB: 1073741824, TB: 1099511627776 };
  return Math.round(v * (mult[m[2]] || 1));
}

export async function search(query, page = 1) {
  const offset = (page - 1) * 30;
  const url = `https://rutor.info/search/${encodeURIComponent(query)}/${offset}`;

  const resp = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      "Accept-Language": "ru,zh-CN,zh;q=0.9,en;q=0.8",
    },
    signal: AbortSignal.timeout(config.sourceTimeout),
  });

  if (!resp.ok) throw new Error(`rutor returned ${resp.status}`);
  const html = await resp.text();

  const results = [];
  const seen = new Set();

  // Find all torrent title links (filter out news items with ID < 100000)
  const titleMatches = [];
  const tRe =
    /<a\s+href="\/torrent\/(\d+)\/[^"]*"[^>]*>([^<]+)<\/a>/gi;
  let tm;
  while ((tm = tRe.exec(html)) !== null) {
    if (parseInt(tm[1]) > 100000) {
      titleMatches.push({ title: tm[2].trim(), pos: tm.index });
    }
  }

  // Find all magnet links
  const magnetMatches = [];
  const mRe =
    /href="(magnet:\?xt=urn:btih:([a-fA-F0-9]{40})&dn=[^"]*)"/gi;
  let mm;
  while ((mm = mRe.exec(html)) !== null) {
    magnetMatches.push({
      magnet: mm[1],
      infoHash: mm[2].toLowerCase(),
      pos: mm.index,
    });
  }

  // Pair each title with nearest magnet link (magnet is BEFORE title in rutor HTML)
  for (const tm of titleMatches) {
    let best = null;
    let bestDist = Infinity;

    for (const mm of magnetMatches) {
      if (seen.has(mm.infoHash)) continue;
      const dist = tm.pos - mm.pos;
      if (dist > 0 && dist < bestDist && dist < 3000) {
        bestDist = dist;
        best = mm;
      }
    }

    if (!best) continue;
    seen.add(best.infoHash);

    // Look for size AFTER the title
    const ctx = html.slice(tm.pos, tm.pos + 1500);
    const sizeM = ctx.match(
      /<td\s+align="right">\s*([\d.,]+\s*(?:&nbsp;|\s)*(?:GB|MB|KB|TB))\s*<\/td>/i
    );
    const sizeStr = sizeM ? sizeM[1].replace(/&nbsp;/g, " ") : "";
    const size = parseSize(sizeStr);

    // Seeders/leechers: after title
    const seedM = ctx.match(
      /<span\s+class="green">[\s\S]*?(\d+)[\s\S]*?<\/span>/i
    );
    const seeders = seedM ? parseInt(seedM[1]) : 0;

    const leechM = ctx.match(
      /<span\s+class="red">[\s\S]*?(\d+)[\s\S]*?<\/span>/i
    );
    const leechers = leechM ? parseInt(leechM[1]) : 0;

    // Date: before the magnet link
    const beforeM = html.slice(Math.max(0, best.pos - 600), best.pos);
    const dateM = beforeM.match(
      /(\d{1,2}\s+(?:Янв|Фев|Мар|Апр|Май|Июн|Июл|Авг|Сен|Окт|Ноя|Дек)\s+\d{2})/i
    );
    const date = dateM ? dateM[1] : "";

    results.push(
      makeResult({
        title: tm.title,
        magnet: best.magnet,
        infoHash: best.infoHash,
        size,
        seeders,
        leechers,
        date,
        source: "rutor",
      })
    );
  }

  return results;
}
