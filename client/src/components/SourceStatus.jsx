export default function SourceStatus({ stats, totalTime, activeSources, onSourceToggle }) {
  if (!stats || stats.length === 0) return null;

  const errSources = stats.filter((s) => s.error);

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-5 animate-fade">
      {stats.filter(s => !s.error).map((s) => {
        const isActive = !activeSources || activeSources.length === 0 || activeSources.includes(s.name);
        return (
          <button
            key={s.name}
            onClick={() => onSourceToggle?.(s.name)}
            title={`${s.name}: ${s.count} 条 — 点击筛选`}
            className={`inline-flex items-center gap-1 text-xs transition-all ${
              isActive ? "text-muted" : "text-dim opacity-50"
            } hover:text-accent`}
          >
            <span className={`w-1 h-1 rounded-full ${isActive ? "bg-signal" : "bg-dim"}`} />
            {s.name} {s.count} 条
          </button>
        );
      })}

      {errSources.length > 0 && (
        <span className="inline-flex items-center gap-1 text-xs text-warn" title={errSources.map((s) => `${s.name}: ${s.error}`).join("\n")}>
          <span className="w-1 h-1 rounded-full bg-warn animate-pulse" />
          {errSources.map((s) => s.name).join(", ")} 异常
        </span>
      )}

      {totalTime != null && (
        <span className="text-xs text-dim ml-auto">
          {totalTime < 1000 ? `${totalTime}ms` : `${(totalTime / 1000).toFixed(1)}s`}
        </span>
      )}
    </div>
  );
}
