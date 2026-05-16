export const SORT_FIELDS = ["relevance", "heat", "size", "time"];

// 关键词重要性权重：长度越长的词越可能是搜索主体（片名/软件名）
// 短词通常是通用限定词（1080p, 4k, x264, ISO）
function keywordWeight(kw) {
  const len = kw.length;
  if (len <= 2) return 1;    // "4K", "VR" 等 — 几乎无区分力
  if (len <= 3) return 2;    // "ISO", "mp4"
  if (len <= 5) return 4;    // "1080p", "x264"
  return 6;                   // 中文词、长英文词 — 高区分力
}

// 判断关键词是否为通用限定词（格式、分辨率、编码等）
const GENERIC_PATTERNS = [
  /^\d{3,4}[pi]$/i,          // 720p, 1080p, 2160p, 480i
  /^\d+k$/i,                 // 4k, 8k
  /^x\d{2,4}$/i,             // x264, x265, x265
  /^h\d{2,4}$/i,             // h264, h265
  /^(mp\d|mkv|avi|flv|mov|wmv|webm|m4v|ts)$/i,
  /^(mp3|flac|aac|wav|ogg|wma|m4a)$/i,
  /^(zip|rar|7z|tar|gz|iso)$/i,
  /^(pdf|epub|mobi)$/i,
  /^(hevc|avc|av1|vp9)$/i,
  /^(bluray|bdrip|brrip|web-dl|webrip|hdtv|dvdrip|remux)$/i,
  /^(gog|steam|fitgirl|dodi|codex|skidrow)$/i,
];

function isGenericKeyword(kw) {
  return GENERIC_PATTERNS.some((p) => p.test(kw));
}

// 判断字符串是否主要是 CJK 字符（中文/日文/韩文）
function isCJK(str) {
  let cjkCount = 0;
  for (const ch of str) {
    const code = ch.codePointAt(0);
    if ((code >= 0x4E00 && code <= 0x9FFF) ||   // CJK Unified
        (code >= 0x3400 && code <= 0x4DBF) ||    // CJK Ext-A
        (code >= 0x20000 && code <= 0x2A6DF) ||  // CJK Ext-B
        (code >= 0x3040 && code <= 0x309F) ||    // Hiragana
        (code >= 0x30A0 && code <= 0x30FF) ||    // Katakana
        (code >= 0xAC00 && code <= 0xD7AF)) {    // Hangul
      cjkCount++;
    }
  }
  return cjkCount > 0 && cjkCount / str.length >= 0.5;
}

// 生成字符级 bigram（用于 CJK 部分匹配）
function bigrams(str) {
  const result = [];
  for (let i = 0; i < str.length - 1; i++) {
    result.push(str.slice(i, i + 2));
  }
  return result;
}

// CJK 长关键词的部分匹配得分
// 对查询做 bigram 拆分，计算标题中命中的比例
function cjkPartialScore(title, query) {
  const bg = bigrams(query);
  if (bg.length === 0) return 0;
  let matched = 0;
  for (const b of bg) {
    if (title.includes(b)) matched++;
  }
  const ratio = matched / bg.length;
  if (ratio < 0.5) return 0;
  // 映射到 15-70 区间
  return Math.round(15 + ratio * 55);
}

// 检查 CJK "合集/全集" 类关键词是否与标题中的 "全X集" 模式匹配
function matchCollectionKeyword(title, kw) {
  if (kw === "合集" || kw === "全集") {
    return /全\d*集/.test(title);
  }
  return false;
}

// 计算标题与搜索词的相关度得分 (0-100)
export function relevanceScore(title, query) {
  if (!title || !query) return 0;

  const t = title.toLowerCase().trim();
  const q = query.toLowerCase().trim();

  // 完全匹配
  if (t === q) return 100;

  // 标题包含完整搜索短语
  if (t.includes(q)) {
    if (t.startsWith(q)) return 95;
    return 90;
  }

  // 分词加权匹配
  const keywords = q.split(/\s+/).filter((k) => k.length > 0);
  if (keywords.length === 0) return 0;

  // 单关键词
  if (keywords.length === 1) {
    if (t.includes(keywords[0])) return 85;
    if (matchCollectionKeyword(t, keywords[0])) return 85;
    // CJK 长关键词（≥4字）：尝试 bigram 部分匹配
    if (keywords[0].length >= 4 && isCJK(keywords[0])) {
      return cjkPartialScore(t, keywords[0]);
    }
    return 0;
  }

  // 多关键词：加权匹配
  const totalWeight = keywords.reduce((sum, k) => sum + keywordWeight(k), 0);
  let matchedWeight = 0;
  let matchedCount = 0;

  for (const k of keywords) {
    if (t.includes(k) || matchCollectionKeyword(t, k)) {
      matchedWeight += keywordWeight(k);
      matchedCount++;
    }
  }

  // 没有任何关键词命中 → 0
  if (matchedCount === 0) return 0;

  const weightRatio = matchedWeight / totalWeight;
  const countRatio = matchedCount / keywords.length;

  // 找出最长的非通用关键词（搜索主体词）
  const subjectKeywords = keywords.filter((k) => !isGenericKeyword(k));
  const primaryKw = subjectKeywords.length > 0
    ? subjectKeywords.reduce((a, b) => a.length >= b.length ? a : b)
    : keywords.reduce((a, b) => a.length >= b.length ? a : b);

  const primaryMatched = t.includes(primaryKw);

  // 主体词不匹配 → 大概率是不相关内容，严惩
  if (!primaryMatched && keywords.length >= 2) {
    // 除非权重匹配率极高（所有限定词都命中，且数量可观）
    if (weightRatio < 0.7 || countRatio < 0.5) return 0;
    // 即使通过，分数也极低
    return Math.round(weightRatio * 20);
  }

  // 全部关键词命中
  if (matchedCount === keywords.length) {
    // 70-85 区间，按权重比微调
    return 70 + Math.round(weightRatio * 15);
  }

  // 部分命中：分数与权重比和命中率正相关
  return 25 + Math.round(weightRatio * countRatio * 55);
}

// 过滤掉完全不相关的结果（得分低于最低阈值）
export function filterIrrelevant(results, query, minScore = 10) {
  if (!query || results.length === 0) return results;
  return results.filter((r) => relevanceScore(r.title, query) >= minScore);
}

// Sort results by key-0/0 (unknown, DHT source didn't track activity) vs
// key-0/>0 (known dead — leechers exist but no seeders)
function heatSort(a, b) {
  const as = a.seeders || 0;
  const al = a.leechers || 0;
  const bs = b.seeders || 0;
  const bl = b.leechers || 0;

  const aUnknown = as === 0 && al === 0;
  const bUnknown = bs === 0 && bl === 0;
  const aDead = as === 0 && al > 0;
  const bDead = bs === 0 && bl > 0;

  // Known active beats everything
  if (as > 0 && bs > 0) return bs - as;
  if (as > 0) return -1;
  if (bs > 0) return 1;

  // Unknown (DHT, no tracker stats) beats known dead
  if (aUnknown && bUnknown) return (b.size || 0) - (a.size || 0);
  if (aUnknown && bDead) return -1;
  if (aDead && bUnknown) return 1;

  // Both dead: sort by leechers (more leechers = more potential demand)
  if (aDead && bDead) return bl - al;

  return 0;
}

// 判断字符串是否包含 CJK 字符
function hasCJK(str) {
  for (const ch of str) {
    const code = ch.codePointAt(0);
    if ((code >= 0x4E00 && code <= 0x9FFF) ||
        (code >= 0x3400 && code <= 0x4DBF) ||
        (code >= 0x3040 && code <= 0x30FF) ||
        (code >= 0xAC00 && code <= 0xD7AF)) {
      return true;
    }
  }
  return false;
}

// 对多条查询取最高相关度得分（适配中英文双路搜索）
function maxRelevanceScore(title, queries) {
  if (!Array.isArray(queries)) {
    return relevanceScore(title, queries);
  }
  let best = 0;
  let hasCollectionQuery = false;
  let hasCJKQuery = false;
  for (const q of queries) {
    if (q.includes("合集") || q.includes("全集")) hasCollectionQuery = true;
    if (hasCJK(q)) hasCJKQuery = true;
    const s = relevanceScore(title, q);
    if (s > best) best = s;
  }
  // 合集/全集 加分：标题中有 "全X集" 模式且任一查询包含 合集/全集 关键词
  if (/全\d*集/.test(title) && hasCollectionQuery) {
    best += 8;
  }
  // CJK 查询 + CJK 标题加分：用户输入中文时优先展示中文资源
  // 跳过完全匹配（标题=查询本身，说明没有额外信息）
  if (hasCJKQuery && hasCJK(title) && best >= 50 && best < 100) {
    best += 6;
  }
  return best;
}

// 混合排序
export function sortResults(results, sortBy = "relevance", queries = "") {
  const sorted = [...results];

  switch (sortBy) {
    case "size":
      sorted.sort((a, b) => (b.size || 0) - (a.size || 0));
      break;

    case "time":
      sorted.sort((a, b) => {
        const da = a.date ? new Date(a.date).getTime() : 0;
        const db = b.date ? new Date(b.date).getTime() : 0;
        return db - da;
      });
      break;

    case "heat":
      sorted.sort(heatSort);
      break;

    case "relevance":
    default:
      sorted.sort((a, b) => {
        const ra = maxRelevanceScore(a.title, queries);
        const rb = maxRelevanceScore(b.title, queries);
        if (rb !== ra) return rb - ra;
        return heatSort(a, b);
      });
      break;
  }

  return sorted;
}
