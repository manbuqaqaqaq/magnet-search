export default function EmptyState() {
  return (
    <div className="text-center py-28 animate-fade">
      <div className="mb-5 inline-flex items-center justify-center w-16 h-16 rounded-lg bg-[#0b0d12] light:bg-gray-50 border border-[#1e2128] light:border-gray-200">
        <span className="text-2xl text-dim">∅</span>
      </div>
      <p className="text-sm text-muted mb-1">没有找到相关结果</p>
      <p className="text-xs text-dim">尝试缩短关键词或更换搜索词</p>
    </div>
  );
}
