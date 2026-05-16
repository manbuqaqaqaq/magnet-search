import { useState, useEffect, useRef } from "react";

const HISTORY_KEY = "magnet_search_history";
const MAX_HISTORY = 10;

export function getHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); }
  catch { return []; }
}
export function addToHistory(query) {
  const q = query.trim(); if (!q) return;
  const list = getHistory().filter((h) => h !== q);
  list.unshift(q);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, MAX_HISTORY)));
}
export function clearHistory() { localStorage.removeItem(HISTORY_KEY); }

export default function SearchHistory({ show, onSelect, onClose }) {
  const [items, setItems] = useState([]);
  const ref = useRef(null);

  useEffect(() => { if (show) setItems(getHistory()); }, [show]);
  useEffect(() => {
    if (!show) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [show, onClose]);

  if (!show || items.length === 0) return null;

  return (
    <div ref={ref} className="absolute top-full left-0 right-0 mt-2 bg-[#0b0d12] light:bg-white border border-[#1e2128] light:border-gray-200 rounded-lg shadow-2xl overflow-hidden z-50 animate-fade">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#1e2128] light:border-gray-100">
        <span className="text-xs text-muted">最近搜索</span>
        <button onClick={() => { clearHistory(); setItems([]); }} className="text-xs text-dim hover:text-warn transition-colors">
          清除
        </button>
      </div>
      {items.map((item, i) => (
        <button
          key={i}
          onClick={() => onSelect(item)}
          className="w-full text-left px-4 py-2.5 text-sm text-[#c8ccd4] light:text-gray-700 hover:bg-[#111318] light:hover:bg-gray-50 transition-colors flex items-center gap-2.5"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-dim shrink-0"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          {item}
        </button>
      ))}
    </div>
  );
}
