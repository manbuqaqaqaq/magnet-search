import { CONTENT_CATEGORIES } from "./fileTypes.js";

const CATEGORY_ICONS = { "全部": null, "影视": "🎬", "书籍": "📖", "软件": "⚙️", "音乐": "🎵" };

export default function ContentTypeTabs({ active, onChange }) {
  return (
    <div className="flex items-center gap-1 mb-3 sm:mb-4 overflow-x-auto no-scrollbar">
      {CONTENT_CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={`shrink-0 px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-lg text-[12px] sm:text-[13px] font-medium transition-all duration-150 touch-manipulation ${
            active === cat
              ? "bg-accent/15 text-accent border border-accent/30"
              : "text-muted border border-transparent hover:text-[#888] hover:border-[#2a2d35] light:hover:border-gray-300"
          }`}
        >
          {CATEGORY_ICONS[cat] && <span className="mr-1">{CATEGORY_ICONS[cat]}</span>}
          {cat}
        </button>
      ))}
    </div>
  );
}
