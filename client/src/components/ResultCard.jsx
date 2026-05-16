import { useState } from "react";
import CopyButton from "./CopyButton.jsx";
import { isFavorite, addFavorite, removeFavorite } from "./FavoritesManager.jsx";
import { detectFileType } from "./fileTypes.js";

const SOURCE_COLORS = {
  tpb: "#38bdf8", hiddenbay: "#38bdf8",
  torrentz2: "#a78bfa", knaben: "#f59e0b",
  nyaa: "#34d399", rutor: "#f472b6",
  glodls: "#fb923c", dmhy: "#60a5fa",
};

function timeAgo(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr.slice(0, 10);
    const diff = Date.now() - d.getTime();
    const min = Math.floor(diff / 60000);
    if (min < 60) return `${min}分钟前`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}小时前`;
    const days = Math.floor(hr / 24);
    if (days < 30) return `${days}天前`;
    if (days < 365) return `${Math.floor(days / 30)}个月前`;
    return `${Math.floor(days / 365)}年前`;
  } catch { return dateStr.slice(0, 10); }
}

function highlightText(text, query) {
  if (!query || !text) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return parts.map((part, i) => {
    if (part.toLowerCase() === query.toLowerCase()) {
      return <mark key={i} className="bg-accent/20 text-accent rounded-sm px-0.5">{part}</mark>;
    }
    return part;
  });
}

export default function ResultCard({ result, index, query, selected }) {
  const { title, sizeFormatted, seeders, leechers, date, source, magnet, infoHash } = result;
  const primarySource = source.split(",")[0].trim();
  const accentColor = SOURCE_COLORS[primarySource] || "#5c6170";
  const ago = timeAgo(date);
  const [fav, setFav] = useState(() => isFavorite(infoHash));
  const fileType = detectFileType(title);

  const toggleFav = () => {
    if (fav) { removeFavorite(infoHash); setFav(false); }
    else { addFavorite({ title, magnet, infoHash, sizeFormatted, seeders, date, source }); setFav(true); }
  };

  return (
    <div
      className={`group relative bg-[#0b0d12] light:bg-white border rounded-lg overflow-hidden transition-all duration-200 animate-scan-in ${
        selected
          ? "border-accent/60 shadow-[0_0_12px_rgba(56,189,248,0.12)]"
          : "border-[#1e2128] light:border-gray-200 active:border-accent/40"
      }`}
      style={{ animationDelay: `${index * 35}ms`, animationFillMode: "both" }}
      data-result-index={index}
    >
      {/* 左侧色条 — 桌面端显示 */}
      <div className="hidden sm:block absolute left-0 top-0 bottom-0 w-0.5 opacity-60 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: accentColor }} />

      <div className="pl-3 pr-3 sm:pl-4 sm:pr-4 py-3 sm:py-3.5">
        {/* 标题行 + 收藏 */}
        <div className="flex items-start gap-2 mb-2">
          <h3 className="flex-1 min-w-0 text-[14px] sm:text-[13px] font-medium leading-snug text-[#c8ccd4] light:text-gray-800 break-all line-clamp-3 sm:line-clamp-2">
            {query ? highlightText(title || "(无标题)", query) : (title || "(无标题)")}
          </h3>
          <button
            onClick={toggleFav}
            title={fav ? "取消收藏" : "收藏"}
            className={`shrink-0 w-8 h-8 sm:w-7 sm:h-7 flex items-center justify-center rounded-lg sm:rounded text-base sm:text-sm transition-all active:scale-90 touch-manipulation ${
              fav ? "text-alert" : "text-dim hover:text-alert"
            }`}
          >
            {fav ? "★" : "☆"}
          </button>
        </div>

        {/* 元信息行 */}
        <div className="flex flex-wrap items-center gap-x-2.5 sm:gap-x-3 gap-y-1.5 mb-3">
          {fileType && (
            <span
              className="inline-flex items-center gap-1 text-[11px] sm:text-[11px] px-1.5 py-0.5 rounded font-medium"
              style={{ color: fileType.color, backgroundColor: fileType.color + "12", border: `1px solid ${fileType.color}20` }}
            >
              {fileType.icon} {fileType.type}
            </span>
          )}
          {sizeFormatted && <span className="text-xs text-muted">{sizeFormatted}</span>}
          <span className="inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-signal" />
            <span className="text-xs font-medium text-signal">{seeders.toLocaleString()} 做种</span>
          </span>
          {leechers > 0 && (
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-alert" />
              <span className="text-xs font-medium text-alert">{leechers.toLocaleString()} 下载</span>
            </span>
          )}
          {ago && <span className="text-xs text-dim">{ago}</span>}
          <span
            className="text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded tracking-wide border"
            style={{ color: accentColor, borderColor: accentColor + "30", backgroundColor: accentColor + "0a" }}
          >
            {primarySource}
          </span>
        </div>

        {/* 操作按钮区 — 移动端全宽 */}
        <CopyButton text={magnet} title={title} />
      </div>
    </div>
  );
}
