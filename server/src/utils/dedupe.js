// 按 infoHash 去重，保留种子数更高的记录，合并来源信息
export function dedupe(results) {
  const seen = new Map();

  for (const r of results) {
    const key = r.infoHash?.toLowerCase();
    if (!key) {
      // 无 infoHash 的条目保留但做简单标题去重
      const titleKey = r.title?.toLowerCase().trim();
      if (!titleKey || seen.has(titleKey)) continue;
      seen.set(titleKey, r);
      continue;
    }
    const existing = seen.get(key);
    if (!existing || (r.seeders || 0) > (existing.seeders || 0)) {
      // 合并来源标记
      if (existing) {
        r.source = `${existing.source}, ${r.source}`;
      }
      seen.set(key, r);
    }
  }

  return [...seen.values()];
}
