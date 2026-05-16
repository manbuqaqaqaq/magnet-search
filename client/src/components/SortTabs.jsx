const TABS = [
  { key: "relevance", label: "相关度" },
  { key: "heat", label: "热度" },
  { key: "size", label: "大小" },
  { key: "time", label: "时间" },
];

export default function SortTabs({ active, onChange, count }) {
  return (
    <div className="flex items-center justify-between mb-4 sm:mb-5 gap-2">
      <div className="flex items-center gap-0.5 bg-[#0b0d12] light:bg-gray-100 rounded-lg p-1 border border-[#1e2128] light:border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={`px-2.5 sm:px-3.5 py-1.5 sm:py-1.5 rounded-[6px] text-[12px] sm:text-[13px] font-medium transition-all duration-150 touch-manipulation ${
              active === t.key
                ? "bg-[#1a1d24] light:bg-white text-accent border border-[#2a2d35] light:border-gray-300"
                : "text-muted hover:text-[#888] light:hover:text-gray-500 border border-transparent"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {count != null && (
        <span className="text-[11px] sm:text-xs text-muted shrink-0">
          共 {count} 条
        </span>
      )}
    </div>
  );
}
