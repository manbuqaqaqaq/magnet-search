import config from "../config.js";
import { makeResult } from "./base.js";

const BASE = "https://bitsearch.eu";

function parseSize(str) {
  if (!str) return 0;
  const m = str.trim().match(/([\d.,]+)\s*(GB|MB|KB|TB|B)/i);
  if (!m) return 0;
  const v = parseFloat(m[1].replace(/,/g, ""));
  const mult = { B: 1, KB: 1024, MB: 1048576, GB: 1073741824, TB: 1099511627776 };
  return Math.round(v * (mult[m[2]] || 1));
}

// 解码 HTML 实体
function decodeHTMLEntities(str) {
  return str
    .replace(/&#x3D;/g, "=")
    .replace(/&#x3D;/gi, "=")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(parseInt(d, 10)))
    .replace(/&#x([a-f0-9]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

function parseResults(html) {
  const results = [];
  const seen = new Set();

  // 匹配磁力链接及其上下文
  const magnetRe = /<a\s+href="(magnet:\?xt(?:&#x3D;|=)urn:btih:([a-fA-F0-9]{40})(?:&|&amp;)dn(?:&#x3D;|=)[^"]*)"/gi;
  const magnets = [];
  let m;
  while ((m = magnetRe.exec(html)) !== null) {
    magnets.push({
      href: m[1],
      infoHash: m[2].toLowerCase(),
      pos: m.index,
    });
  }

  for (const mag of magnets) {
    if (seen.has(mag.infoHash)) continue;
    seen.add(mag.infoHash);

    const magnet = decodeHTMLEntities(mag.href)
      .replace(/&amp;/g, "&");

    // 向前搜索标题：<a href="/torrent/...">TITLE</a>
    const before = html.slice(Math.max(0, mag.pos - 1500), mag.pos);
    const titleM = before.match(/<a\s+href="\/torrent\/[a-f0-9]{24}"[^>]*>([^<]+)<\/a>/);
    const title = titleM
      ? titleM[1].trim()
      : decodeURIComponent(mag.href.match(/dn(?:&#x3D;|=)([^"&]*)/i)?.[1] || "").replace(/\+/g, " ");

    // 向前搜索大小：<span>XX.X GB</span>
    const sizeM = before.match(/<span>([\d.,]+\s*(?:GB|MB|KB|TB|B))<\/span>/);
    const size = sizeM ? parseSize(sizeM[1]) : 0;

    // 向前搜索日期：<span>MM/DD/YYYY</span>
    const dateM = before.match(/<span>(\d{1,2}\/\d{1,2}\/\d{4})<\/span>/);
    const date = dateM ? dateM[1] : "";

    // 向前搜索做种数：text-green-600 之后的 <span class="font-medium">N</span>
    const seederM = before.match(/text-green-600[\s\S]*?<span\s+class="font-medium">(\d+)<\/span>/);
    const seeders = seederM ? parseInt(seederM[1]) : 0;

    // 向前搜索下载数：text-red-600 之后的 <span class="font-medium">N</span>
    const leechM = before.match(/text-red-600[\s\S]*?<span\s+class="font-medium">(\d+)<\/span>/);
    const leechers = leechM ? parseInt(leechM[1]) : 0;

    results.push(
      makeResult({
        title,
        magnet,
        infoHash: mag.infoHash,
        size,
        seeders,
        leechers,
        date,
        source: "bitsearch",
      })
    );
  }

  return results;
}

export async function search(query, page = 1) {
  const url = `${BASE}/search?q=${encodeURIComponent(query)}&page=${page}`;
  const resp = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    },
    signal: AbortSignal.timeout(config.sourceTimeout),
  });

  if (!resp.ok) throw new Error(`bitsearch returned ${resp.status}`);
  const html = await resp.text();
  return parseResults(html);
}
