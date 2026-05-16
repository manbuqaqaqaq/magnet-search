import { makeResult } from "./base.js";

const BASE = "https://btdig.com";

function parseSize(str) {
  if (!str) return 0;
  const m = str.trim().match(/([\d.,]+)\s*(GB|MB|KB|TB|B)/i);
  if (!m) return 0;
  const v = parseFloat(m[1].replace(/,/g, ""));
  const u = m[2].toUpperCase();
  const mult = { B: 1, KB: 1024, MB: 1048576, GB: 1073741824, TB: 1099511627776 };
  return Math.round(v * (mult[u] || 1));
}

function parseResults(html) {
  const results = [];
  const seen = new Set();

  // 按 one_result 拆分为每个结果块
  const blocks = html.split(/<div class="one_result"[^>]*>/);
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];

    // 提取 infoHash: btdig.com/([a-fA-F0-9]{40})/
    const hashM = block.match(/btdig\.com\/([a-fA-F0-9]{40})\//);
    if (!hashM) continue;
    const infoHash = hashM[1].toLowerCase();
    if (seen.has(infoHash)) continue;
    seen.add(infoHash);

    // 提取标题: torrent_name 中的 <a> 内容（去除高亮标签）
    const titleM = block.match(/<div class="torrent_name"[^>]*>\s*<a[^>]*>([\s\S]*?)<\/a>/i);
    let title = "";
    if (titleM) {
      title = titleM[1]
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .trim();
    }
    if (!title) continue;

    // 提取文件数: <span class="torrent_files">N</span>
    const filesM = block.match(/<span class="torrent_files"[^>]*>(\d+)<\/span>/i);
    const files = filesM ? parseInt(filesM[1]) : 0;

    // 提取大小: <span class="torrent_size">SIZE</span>
    const sizeM = block.match(/<span class="torrent_size"[^>]*>([^<]+)<\/span>/i);
    const size = sizeM ? parseSize(sizeM[1].trim()) : 0;

    // 提取日期: <span class="torrent_age"[^>]*>([^<]+)</span>
    const dateM = block.match(/<span class="torrent_age"[^>]*>([^<]+)<\/span>/i);
    const date = dateM ? dateM[1].trim() : "";

    // 提取磁力链接: torrent_magnet 中的 href="magnet:..."
    const magnetM = block.match(/<a\s+href="(magnet:\?xt=urn:btih:[^"]+)"/i);
    const magnet = magnetM
      ? magnetM[1].replace(/&amp;/g, "&")
      : `magnet:?xt=urn:btih:${infoHash}`;

    results.push(
      makeResult({
        title,
        magnet,
        infoHash,
        size,
        seeders: 0,
        leechers: 0,
        date,
        source: "btdig",
        files,
      })
    );
  }

  return results;
}

// BTDigg 每页 10 条，并发取前 3 页（共 30 条），大幅提升中文资源覆盖
const MAX_PAGES = 3;

async function fetchPage(query, pageNum) {
  const url = `${BASE}/search?q=${encodeURIComponent(query)}&p=${pageNum}`;
  const resp = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!resp.ok) throw new Error(`btdig returned ${resp.status}`);
  return parseResults(await resp.text());
}

export async function search(query, page = 1) {
  // 并发拉取前 MAX_PAGES 页
  const pagePromises = [];
  for (let i = 0; i < MAX_PAGES; i++) {
    pagePromises.push(
      fetchPage(query, i).catch(() => [])
    );
  }
  const resultsArray = await Promise.all(pagePromises);

  // 合并去重
  const seen = new Set();
  const merged = [];
  for (const results of resultsArray) {
    for (const r of results) {
      if (!seen.has(r.infoHash)) {
        seen.add(r.infoHash);
        merged.push(r);
      }
    }
  }
  return merged;
}
