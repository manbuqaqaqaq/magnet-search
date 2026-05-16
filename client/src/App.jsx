import { useState, useCallback, useEffect, useRef } from "react";
import SearchBar from "./components/SearchBar.jsx";
import SortTabs from "./components/SortTabs.jsx";
import ResultList from "./components/ResultList.jsx";
import ThemeToggle from "./components/ThemeToggle.jsx";
import Pagination from "./components/Pagination.jsx";
import FilterBar from "./components/FilterBar.jsx";
import FavoritesList from "./components/FavoritesList.jsx";
import { search, fetchSources } from "./api.js";
import { addToHistory } from "./components/SearchHistory.jsx";

function readParams() {
  const p = new URLSearchParams(window.location.search);
  return { q: p.get("q") || "", sort: p.get("sort") || "relevance", page: parseInt(p.get("page")) || 1 };
}
function writeParams(q, sort, page) {
  const p = new URLSearchParams();
  if (q) p.set("q", q);
  if (sort !== "relevance") p.set("sort", sort);
  if (page > 1) p.set("page", String(page));
  const s = p.toString();
  window.history.replaceState(null, "", s ? `?${s}` : window.location.pathname);
}

export default function App() {
  const initial = readParams();
  const [query, setQuery] = useState(initial.q);
  const [sort, setSort] = useState(initial.sort || "relevance");
  const [page, setPage] = useState(initial.page);
  const [results, setResults] = useState(null);
  const [status, setStatus] = useState(initial.q ? "loading" : "idle");
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ sources: [], minSize: null, maxSize: null, dateFrom: null, dateTo: null, sizePreset: "全部", timePreset: "全部" });
  const [availableSources, setAvailableSources] = useState([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const inputRef = useRef(null);
  const hasSearched = useRef(false);
  const resultsContainerRef = useRef(null);

  useEffect(() => { fetchSources().then(setAvailableSources).catch(() => {}); }, []);

  // 滚动监听：回到顶部按钮
  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 500);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (initial.q && !hasSearched.current) { hasSearched.current = true; doSearch(initial.q, initial.sort, initial.page); }
  }, []);
  useEffect(() => { if (!hasSearched.current) return; inputRef.current?.focus(); }, []);

  const doSearch = useCallback(async (q, s, p = 1, f = filters) => {
    setStatus("loading"); setError(""); setResults(null); setSelectedIndex(-1); writeParams(q, s, p);
    try { const data = await search({ q, sort: s, page: p, filters: f }); setResults(data); setStatus("done"); addToHistory(q); }
    catch (err) { setError(err.message); setStatus("error"); }
  }, [filters]);

  const handleSubmit = useCallback((e) => {
    e?.preventDefault(); const q = query.trim(); if (!q) return;
    hasSearched.current = true; setPage(1); setSort("relevance"); doSearch(q, "relevance", 1);
  }, [query, doSearch]);

  const handleSortChange = useCallback((newSort) => {
    setSort(newSort); setPage(1); if (query.trim()) doSearch(query.trim(), newSort, 1);
  }, [query, doSearch]);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters); setPage(1);
    if (query.trim()) doSearch(query.trim(), sort, 1, newFilters);
  }, [query, sort, doSearch]);

  const handleSourceToggle = useCallback((sourceName) => {
    setFilters((prev) => {
      const current = prev.sources || [];
      const next = current.includes(sourceName)
        ? current.filter((s) => s !== sourceName)
        : [...current, sourceName];
      const newFilters = { ...prev, sources: next };
      if (query.trim()) doSearch(query.trim(), sort, 1, newFilters);
      return newFilters;
    });
  }, [query, sort, doSearch]);

  const handlePageChange = useCallback((newPage) => {
    setPage(newPage); if (query.trim()) doSearch(query.trim(), sort, newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [query, sort, doSearch]);

  const reset = useCallback(() => {
    setQuery(""); setResults(null); setStatus("idle"); setError(""); setPage(1);
    writeParams("", "heat", 1); inputRef.current?.focus();
  }, []);

  // 键盘快捷键
  useEffect(() => {
    const handler = (e) => {
      const isInput = e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.isContentEditable;
      if (!isInput) {
        if (e.key === "/") { e.preventDefault(); inputRef.current?.focus(); }
        if (e.key === "Escape") { reset(); setSelectedIndex(-1); }
      }
      // 箭头键导航结果（仅在非输入状态下）
      const resultCards = results?.results;
      if (!resultCards?.length) return;
      if (isInput) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, resultCards.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, -1));
      }
      if (e.key === "Enter" && selectedIndex >= 0 && !isInput) {
        const magnet = resultCards[selectedIndex]?.magnet;
        if (magnet) {
          navigator.clipboard.writeText(magnet).catch(() => {});
          setSelectedIndex(-1);
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [reset, results, selectedIndex]);

  const autofill = useCallback((q) => {
    setQuery(q); setPage(1); setSort("relevance"); hasSearched.current = true; doSearch(q, "relevance", 1);
  }, [doSearch]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#08090d]/90 light:bg-white/90 border-b border-[#1e2128] light:border-gray-200 safe-top">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 h-12 sm:h-14 flex items-center justify-between">
          <button onClick={reset} className="flex items-center gap-2 sm:gap-2.5 group">
            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-signal/10 border border-signal/20 flex items-center justify-center text-xs sm:text-sm font-bold text-signal group-hover:bg-signal/15 transition-colors">
              M
            </span>
            <span className="text-[14px] sm:text-[15px] font-semibold tracking-tight text-[#c8ccd4] light:text-gray-800">
              磁力搜索
            </span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFavorites(true)}
              className="w-8 h-8 flex items-center justify-center rounded-md border border-[#1e2128] light:border-gray-200 bg-[#0b0d12] light:bg-white text-sm hover:border-alert/30 transition-all"
              title="收藏列表"
            >
              ★
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-10 safe-bottom">
        {status === "idle" && (
          <div className="text-center pt-12 sm:pt-16 md:pt-28 pb-6 sm:pb-8 animate-fade">
            <h2 className="text-[24px] sm:text-[28px] md:text-[36px] font-bold tracking-tight text-[#c8ccd4] light:text-gray-800 mb-2 sm:mb-3">
              磁力<span className="text-accent">聚合</span>搜索
            </h2>
            <p className="text-xs sm:text-sm text-muted px-4">
              跨多个数据源实时检索 · 智能去重排序
            </p>
            {typeof window !== "undefined" && window.innerWidth > 640 && (
              <p className="text-xs text-dim mt-2">
                按 <kbd className="px-1 py-0.5 rounded bg-[#1a1d24] border border-[#2a2d35] text-[11px]">/</kbd> 快速搜索 · 按 <kbd className="px-1 py-0.5 rounded bg-[#1a1d24] border border-[#2a2d35] text-[11px]">Esc</kbd> 清空
              </p>
            )}
          </div>
        )}

        <div className={status === "idle" ? "max-w-2xl mx-auto" : ""}>
          <SearchBar ref={inputRef} query={query} onChange={setQuery} onSubmit={handleSubmit} onSelect={autofill} loading={status === "loading"} />
          {status !== "idle" && availableSources.length > 0 && (
            <FilterBar sources={availableSources} filters={filters} onChange={handleFilterChange} onClose={() => {}} />
          )}
        </div>

        {status !== "idle" && (
          <>
            <SortTabs active={sort} onChange={handleSortChange} count={results?.total} />
            <ResultList status={status} error={error} results={results} onRetry={handleSubmit} sourceCount={availableSources.length} activeSources={filters.sources} onSourceToggle={handleSourceToggle} query={query} selectedIndex={selectedIndex} />
            {status === "done" && results && <Pagination page={results.page} totalPages={results.totalPages} onPageChange={handlePageChange} />}
          </>
        )}
      </main>

      <FavoritesList show={showFavorites} onClose={() => setShowFavorites(false)} onSearch={autofill} />

      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-40 w-10 h-10 rounded-full bg-[#0b0d12] light:bg-white border border-[#1e2128] light:border-gray-200 flex items-center justify-center text-dim hover:text-accent hover:border-accent/30 shadow-lg transition-all animate-fade"
          title="回到顶部"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m18 15-6-6-6 6"/></svg>
        </button>
      )}
    </div>
  );
}
