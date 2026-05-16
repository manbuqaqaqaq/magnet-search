import { useState, useEffect } from "react";
import { getFavorites, removeFavorite } from "./FavoritesManager.jsx";
import CopyButton from "./CopyButton.jsx";

export default function FavoritesList({ show, onClose, onSearch }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (show) setItems(getFavorites());
  }, [show]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg mx-4 bg-[#0b0d12] light:bg-white border border-[#1e2128] light:border-gray-200 rounded-xl shadow-2xl animate-fade max-h-[70vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1e2128] light:border-gray-100 shrink-0">
          <span className="text-sm font-semibold text-[#c8ccd4] light:text-gray-800">收藏列表 ({items.length})</span>
          <button onClick={onClose} className="text-dim hover:text-[#c8ccd4] transition-colors text-lg leading-none">&times;</button>
        </div>
        <div className="overflow-y-auto flex-1">
          {items.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted">还没有收藏任何资源</div>
          ) : (
            items.map((item) => (
              <div
                key={item.infoHash}
                className="flex items-start gap-3 px-5 py-3 border-b border-[#1e2128]/50 light:border-gray-100 hover:bg-[#111318] light:hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => { onSearch(item.title); onClose(); }}
                    className="text-left text-[13px] text-[#c8ccd4] light:text-gray-800 hover:text-accent transition-colors break-all line-clamp-2"
                  >
                    {item.title}
                  </button>
                  <div className="flex items-center gap-2 mt-1">
                    {item.sizeFormatted && <span className="text-xs text-muted">{item.sizeFormatted}</span>}
                    <span className="text-xs text-signal">{item.seeders} 做种</span>
                    {item.source && (
                      <span className="text-[11px] text-dim">{item.source.split(",")[0].trim()}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <CopyButton text={item.magnet} />
                  <button
                    onClick={() => { removeFavorite(item.infoHash); setItems((prev) => prev.filter((f) => f.infoHash !== item.infoHash)); }}
                    className="text-xs text-dim hover:text-warn transition-colors px-1"
                    title="取消收藏"
                  >
                    &times;
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
