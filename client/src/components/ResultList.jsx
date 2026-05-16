import ResultCard from "./ResultCard.jsx";
import Skeleton from "./Skeleton.jsx";
import EmptyState from "./EmptyState.jsx";
import SourceStatus from "./SourceStatus.jsx";

export default function ResultList({ status, error, results, onRetry, sourceCount, activeSources, onSourceToggle, query, selectedIndex, streaming }) {
  // 流式加载中：已有部分结果，展示结果 + 底部骨架
  if (status === "loading" && streaming && results?.results?.length > 0) {
    return (
      <div className="animate-fade">
        <div className="space-y-2">
          {results.results.map((r, i) => <ResultCard key={r.infoHash || i} result={r} index={i} query={query} selected={i === selectedIndex} />)}
        </div>
        <div className="flex items-center gap-2 mt-4 mb-2">
          <div className="h-4 w-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          <span className="text-xs text-dim">更多数据源搜索中...</span>
        </div>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="animate-fade">
        <div className="flex items-center gap-2 mb-5">
          <div className="h-0.5 flex-1 rounded-full bg-[#1a1d24] overflow-hidden">
            <div className="h-full bg-accent/40 rounded-full animate-pulse" style={{ width: "60%", animation: "shimmer 2s infinite" }} />
          </div>
          <span className="text-xs text-dim shrink-0">
            {sourceCount ? `正在查询 ${sourceCount} 个数据源...` : "搜索中..."}
          </span>
        </div>
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} index={i} />)}
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="text-center py-28 animate-fade">
        <div className="mb-5 inline-flex items-center justify-center w-16 h-16 rounded-lg bg-warn/5 border border-warn/20">
          <span className="text-2xl text-warn">!</span>
        </div>
        <p className="text-sm text-warn mb-1">搜索失败</p>
        <p className="text-xs text-muted mb-4">{error}</p>
        <button onClick={onRetry} className="px-5 py-2 rounded-md bg-accent/10 border border-accent/20 text-accent text-sm font-medium hover:bg-accent/20 transition-colors">
          重试
        </button>
      </div>
    );
  }

  if (status === "done" && results.results.length === 0) return <EmptyState />;

  if (status === "done" && results) {
    return (
      <div className="animate-fade">
        <SourceStatus stats={results.sourceStats} totalTime={results.totalTime} activeSources={activeSources} onSourceToggle={onSourceToggle} />
        <div className="space-y-2">
          {results.results.map((r, i) => <ResultCard key={r.infoHash || i} result={r} index={i} query={query} selected={i === selectedIndex} />)}
        </div>
      </div>
    );
  }

  return null;
}
