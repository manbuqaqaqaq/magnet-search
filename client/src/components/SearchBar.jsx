import { forwardRef, useState, useCallback } from "react";
import SearchHistory from "./SearchHistory.jsx";

const SearchBar = forwardRef(function SearchBar({ query, onChange, onSubmit, onSelect, loading }, ref) {
  const [showHistory, setShowHistory] = useState(false);
  const handleFocus = useCallback(() => { if (!query.trim()) setShowHistory(true); }, [query]);
  const handleSelect = useCallback((q) => { setShowHistory(false); if (onSelect) onSelect(q); }, [onSelect]);
  const handleClear = useCallback(() => {
    onChange(""); setShowHistory(true); ref?.current?.focus();
  }, [onChange, ref]);

  return (
    <form onSubmit={onSubmit} className="w-full mb-6 relative">
      <div className="flex gap-0">
        <div className="flex-1 relative">
          <input
            ref={ref}
            type="text"
            value={query}
            onChange={(e) => { onChange(e.target.value); setShowHistory(!e.target.value.trim()); }}
            onFocus={handleFocus}
            placeholder="输入关键词搜索磁力链接..."
            className="w-full h-11 sm:h-12 pl-4 sm:pl-5 pr-4 rounded-l-lg border border-[#1e2128] light:border-gray-300 bg-[#0b0d12] light:bg-white text-[16px] sm:text-[15px] text-[#c8ccd4] light:text-gray-800 placeholder:text-[#3a3d45] light:placeholder:text-gray-400 outline-none focus:border-accent/40 transition-all duration-200"
            style={{ boxShadow: "inset 0 1px 3px rgba(0,0,0,0.4)" }}
          />
          {query.trim() && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full text-dim hover:text-[#c8ccd4] hover:bg-[#1a1d24] transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="h-11 sm:h-12 px-4 sm:px-6 rounded-r-lg bg-accent hover:bg-accent/90 disabled:bg-[#1a1d24] disabled:text-[#3a3d45] text-[#08090d] font-semibold text-sm transition-all shrink-0 cursor-pointer disabled:cursor-not-allowed touch-manipulation"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-[#08090d]/30 border-t-[#08090d] rounded-full animate-spin" />
              搜索中
            </span>
          ) : "搜索"}
        </button>
      </div>
      <SearchHistory show={showHistory} onSelect={handleSelect} onClose={() => setShowHistory(false)} />
    </form>
  );
});

export default SearchBar;
