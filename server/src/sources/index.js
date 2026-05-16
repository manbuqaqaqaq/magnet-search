import config from "../config.js";
import { dedupe } from "../utils/dedupe.js";
import { sortResults, filterIrrelevant, relevanceScore, SORT_FIELDS } from "../utils/sort.js";
import { normalizeQuery, getEnglishQuery } from "../utils/normalizeQuery.js";

// 源注册表
const registry = new Map();

// 简单 LRU 缓存 (60s TTL, 最多 200 条)
const cache = new Map();
const CACHE_TTL = 60000;
const CACHE_MAX = 200;

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.time > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  // LRU: move to end
  cache.delete(key);
  cache.set(key, entry);
  return entry.data;
}

function setCache(key, data) {
  if (cache.size >= CACHE_MAX) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
  cache.set(key, { data, time: Date.now() });
}

// 清理过期条目 (每 5 分钟)
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of cache) {
    if (now - v.time > CACHE_TTL) cache.delete(k);
  }
}, 300000);

function applyFilters(results, filters) {
  let filtered = results;

  if (filters.minSize != null) {
    filtered = filtered.filter((r) => r.size >= filters.minSize);
  }
  if (filters.maxSize != null) {
    filtered = filtered.filter((r) => r.size <= filters.maxSize);
  }
  if (filters.dateFrom) {
    const from = new Date(filters.dateFrom).getTime();
    filtered = filtered.filter((r) => {
      if (!r.date) return true;
      const d = new Date(r.date).getTime();
      return !isNaN(d) ? d >= from : true;
    });
  }
  if (filters.dateTo) {
    const to = new Date(filters.dateTo).getTime();
    filtered = filtered.filter((r) => {
      if (!r.date) return true;
      const d = new Date(r.date).getTime();
      return !isNaN(d) ? d <= to : true;
    });
  }

  return filtered;
}

async function loadSources() {
  for (const src of config.sources) {
    if (!src.enabled) continue;
    try {
      const mod = await import(src.module);
      registry.set(src.name, mod.search);
    } catch (e) {
      console.error(`[source] failed to load "${src.name}":`, e.message);
    }
  }
}

export function getEnabledSources() {
  return config.sources.filter((s) => s.enabled).map((s) => s.name);
}

// 构建搜索任务列表
function buildSearchTasks(query, page, filters, startTime) {
  const sourceQuery = normalizeQuery(query);
  const englishQuery = getEnglishQuery(query);
  const allowedSources = filters.sources?.length > 0 ? new Set(filters.sources) : null;

  const queries = [sourceQuery];
  if (englishQuery && englishQuery !== sourceQuery) {
    queries.push(englishQuery);
    queries.push(sourceQuery + " " + englishQuery);
  }

  const tasks = [];
  for (const q of queries) {
    for (const [name, searchFn] of registry) {
      if (allowedSources && !allowedSources.has(name)) continue;
      tasks.push(
        searchFn(q, page)
          .then((results) => ({ name, results, query: q, time: Date.now() - startTime }))
          .catch((err) => {
            console.warn(`[source] "${name}" failed:`, err.message);
            return { name, results: [], query: q, error: err.message, time: Date.now() - startTime };
          })
      );
    }
  }
  return { queries, sourceQuery, englishQuery, tasks };
}

// 聚合搜索：并发请求所有源，合并去重排序
export async function aggregateSearch(query, sortBy = "heat", page = 1, filters = {}) {
  // 检查缓存 (仅缓存第 1 页，其他页靠排序结果分页)
  const filterKey = JSON.stringify(filters);
  const cacheKey = `${query}:${sortBy}:${filterKey}`;
  if (page === 1) {
    const cached = getCached(cacheKey);
    if (cached) return { ...cached, cached: true };
  }

  if (registry.size === 0) await loadSources();
  if (registry.size === 0) throw new Error("没有可用的搜索源");

  const startTime = Date.now();
  const { queries, tasks } = buildSearchTasks(query, page, filters, startTime);
  const settled = await Promise.all(tasks);

  // 收集所有结果
  const allResults = [];
  const sourceStatsMap = new Map();
  for (const { name, results, error, time } of settled) {
    for (const r of results) {
      allResults.push(r);
    }
    // 按源名合并统计（两次查询的结果累加）
    const prev = sourceStatsMap.get(name);
    if (prev) {
      prev.count += results?.length || 0;
      if (!prev.error && error) prev.error = error;
    } else {
      sourceStatsMap.set(name, {
        name,
        count: results?.length || 0,
        error: error || null,
        time: time || 0,
      });
    }
  }

  // 去重
  let unique = dedupe(allResults);

  // 相关性过滤 + 排序：使用原始查询 + 所有搜索查询，取最佳匹配
  // 这样"合集""全集"等被剥离的修饰词也能参与评分
  const scoringQueries = [query, ...queries];
  unique = unique.filter((r) => {
    for (const q of scoringQueries) {
      if (relevanceScore(r.title, q) >= 10) return true;
    }
    return false;
  });
  unique = applyFilters(unique, filters);
  const sorted = sortResults(unique, sortBy, scoringQueries);

  // 分页
  const pageSize = config.pageSize;
  const start = (page - 1) * pageSize;
  const paged = sorted.slice(start, start + pageSize);

  const result = {
    total: sorted.length,
    page,
    pageSize,
    totalPages: Math.ceil(sorted.length / pageSize),
    results: paged,
    sources: [...new Set(settled.filter((s) => !s.error).map((s) => s.name))],
    sourceStats: [...sourceStatsMap.values()],
    totalTime: Date.now() - startTime,
    queries,
  };

  // 缓存第 1 页结果
  if (page === 1) {
    setCache(cacheKey, result);
  }

  return result;
}

// 流式聚合搜索：每个源完成后立即回调，前端渐进渲染
// onSource: ({ name, results, error, time, total }) => void
export async function aggregateSearchStream(query, sortBy = "heat", page = 1, filters = {}, onSource) {
  if (registry.size === 0) await loadSources();
  if (registry.size === 0) throw new Error("没有可用的搜索源");

  const startTime = Date.now();
  const { queries, tasks } = buildSearchTasks(query, page, filters, startTime);

  // 收集结果（逐步累积）
  const allResults = [];
  const sourceStatsMap = new Map();
  const settledSources = new Set();

  // 包装每个 task，完成时立即回调
  const wrappedTasks = tasks.map((task) =>
    task.then(({ name, results, query: q, error, time }) => {
      // 累积结果
      for (const r of results) allResults.push(r);
      const prev = sourceStatsMap.get(name);
      if (prev) {
        prev.count += results?.length || 0;
        if (!prev.error && error) prev.error = error;
      } else {
        sourceStatsMap.set(name, {
          name,
          count: results?.length || 0,
          error: error || null,
          time: time || 0,
        });
      }
      settledSources.add(name);

      // 实时回调：把该源的结果发出去，前端渐进渲染
      if (onSource) {
        // 快速去重 + 过滤 + 排序（仅对当前已累积的结果）
        let snapshot = dedupe([...allResults]);
        const scoringQueries = [query, ...queries];
        snapshot = snapshot.filter((r) => {
          for (const q of scoringQueries) {
            if (relevanceScore(r.title, q) >= 10) return true;
          }
          return false;
        });
        let filtered = applyFilters(snapshot, filters);
        let sorted = sortResults(filtered, sortBy, scoringQueries);
        const pageSize = config.pageSize;
        const paged = sorted.slice(0, pageSize);

        onSource({
          name,
          count: results?.length || 0,
          error: error || null,
          time,
          snapshot: {
            total: sorted.length,
            page: 1,
            pageSize,
            totalPages: Math.max(1, Math.ceil(sorted.length / pageSize)),
            results: paged,
            sources: [...settledSources].filter((s) => {
              const st = sourceStatsMap.get(s);
              return st && !st.error;
            }),
            sourceStats: [...sourceStatsMap.values()],
            streaming: true,
            pendingCount: tasks.length - settledSources.size * (queries.length || 1),
          },
        });
      }

      return { name, results, query: q, error, time };
    })
  );

  await Promise.all(wrappedTasks);

  // 最终结果（完整去重排序分页）
  let unique = dedupe(allResults);
  const scoringQueries = [query, ...queries];
  unique = unique.filter((r) => {
    for (const q of scoringQueries) {
      if (relevanceScore(r.title, q) >= 10) return true;
    }
    return false;
  });
  unique = applyFilters(unique, filters);
  const sorted = sortResults(unique, sortBy, scoringQueries);
  const pageSize = config.pageSize;
  const start = (page - 1) * pageSize;
  const paged = sorted.slice(start, start + pageSize);

  return {
    total: sorted.length,
    page,
    pageSize,
    totalPages: Math.ceil(sorted.length / pageSize),
    results: paged,
    sources: [...new Set([...sourceStatsMap.keys()].filter((s) => !sourceStatsMap.get(s)?.error))],
    sourceStats: [...sourceStatsMap.values()],
    totalTime: Date.now() - startTime,
    queries,
    streaming: false,
  };
}

export { SORT_FIELDS };
