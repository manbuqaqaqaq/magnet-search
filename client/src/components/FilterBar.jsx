import { useState, useEffect } from "react";

const SIZE_PRESETS = [
  { label: "全部", min: null, max: null },
  { label: "< 1 GB", min: null, max: 1073741824 },
  { label: "1–5 GB", min: 1073741824, max: 5368709120 },
  { label: "5–20 GB", min: 5368709120, max: 21474836480 },
  { label: "> 20 GB", min: 21474836480, max: null },
];

const TIME_PRESETS = [
  { label: "全部", value: null },
  { label: "今天", value: "today" },
  { label: "本周", value: "week" },
  { label: "本月", value: "month" },
  { label: "今年", value: "year" },
];

function getDateFrom(preset) {
  const now = new Date();
  switch (preset) {
    case "today": {
      const d = new Date(now); d.setHours(0, 0, 0, 0); return d.toISOString();
    }
    case "week": {
      const d = new Date(now); d.setDate(d.getDate() - 7); return d.toISOString();
    }
    case "month": {
      const d = new Date(now); d.setMonth(d.getMonth() - 1); return d.toISOString();
    }
    case "year": {
      const d = new Date(now); d.setFullYear(d.getFullYear() - 1); return d.toISOString();
    }
    default:
      return null;
  }
}

export default function FilterBar({ sources, filters, onChange, onClose }) {
  const [open, setOpen] = useState(false);
  const [selectedSources, setSelectedSources] = useState(filters.sources || []);
  const [sizePreset, setSizePreset] = useState(filters.sizePreset || "全部");
  const [timePreset, setTimePreset] = useState(filters.timePreset || "全部");

  const hasFilters = selectedSources.length > 0 || sizePreset !== "全部" || timePreset !== "全部";

  useEffect(() => {
    setSelectedSources(filters.sources || []);
    setSizePreset(filters.sizePreset || "全部");
    setTimePreset(filters.timePreset || "全部");
  }, [filters]);

  const toggleSource = (name) => {
    setSelectedSources((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  };

  const apply = () => {
    const preset = SIZE_PRESETS.find((p) => p.label === sizePreset);
    onChange({
      sources: selectedSources,
      minSize: preset?.min ?? null,
      maxSize: preset?.max ?? null,
      dateFrom: getDateFrom(timePreset === "全部" ? null : timePreset),
      dateTo: null,
      sizePreset,
      timePreset,
    });
    setOpen(false);
  };

  const reset = () => {
    setSelectedSources([]);
    setSizePreset("全部");
    setTimePreset("全部");
    onChange({ sources: [], minSize: null, maxSize: null, dateFrom: null, dateTo: null, sizePreset: "全部", timePreset: "全部" });
  };

  return (
    <div className="mb-4 animate-fade">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setOpen(!open)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            hasFilters
              ? "bg-accent/10 border border-accent/30 text-accent"
              : "text-muted border border-[#1e2128] light:border-gray-200 hover:border-[#2a2d35]"
          }`}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3M1 14h6m2-6h6m2 8h6" />
          </svg>
          筛选{hasFilters ? ` (${selectedSources.length || sizePreset !== "全部" ? "+" : ""})` : ""}
        </button>
        {hasFilters && (
          <button onClick={reset} className="text-xs text-dim hover:text-warn transition-colors">
            清除筛选
          </button>
        )}
      </div>

      {open && (
        <div className="mt-3 p-4 rounded-lg bg-[#0b0d12] light:bg-white border border-[#1e2128] light:border-gray-200 space-y-4">
          {/* Source filter */}
          <div>
            <div className="text-xs text-muted mb-2">数据源</div>
            <div className="flex flex-wrap gap-1.5">
              {sources.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleSource(s)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                    selectedSources.includes(s)
                      ? "bg-accent/15 text-accent border border-accent/30"
                      : "text-muted border border-[#1e2128] light:border-gray-200 hover:border-[#2a2d35]"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Size filter */}
          <div>
            <div className="text-xs text-muted mb-2">文件大小</div>
            <div className="flex flex-wrap gap-1.5">
              {SIZE_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setSizePreset(p.label)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                    sizePreset === p.label
                      ? "bg-accent/15 text-accent border border-accent/30"
                      : "text-muted border border-[#1e2128] light:border-gray-200 hover:border-[#2a2d35]"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time filter */}
          <div>
            <div className="text-xs text-muted mb-2">发布时间</div>
            <div className="flex flex-wrap gap-1.5">
              {TIME_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setTimePreset(p.label)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                    timePreset === p.label
                      ? "bg-accent/15 text-accent border border-accent/30"
                      : "text-muted border border-[#1e2128] light:border-gray-200 hover:border-[#2a2d35]"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={apply}
            className="w-full py-2 rounded-md bg-accent text-[#08090d] text-sm font-semibold hover:bg-accent/90 transition-colors"
          >
            应用筛选
          </button>
        </div>
      )}
    </div>
  );
}
