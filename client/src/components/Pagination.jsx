export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxShow = 5;
  let start = Math.max(1, page - 2);
  let end = Math.min(totalPages, start + maxShow - 1);
  if (end - start < maxShow - 1) start = Math.max(1, end - maxShow + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-1 mt-8 sm:mt-10 mb-8 sm:pb-10">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="h-10 sm:h-9 px-3 sm:px-3 rounded-lg sm:rounded-md text-sm text-muted hover:text-accent disabled:opacity-25 disabled:cursor-not-allowed transition-all touch-manipulation"
      >
        上一页
      </button>

      {start > 1 && (
        <>
          <PageBtn n={1} active={false} onClick={onPageChange} />
          {start > 2 && <span className="w-7 sm:w-8 text-center text-dim text-xs">···</span>}
        </>
      )}

      {pages.map((n) => <PageBtn key={n} n={n} active={n === page} onClick={onPageChange} />)}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="w-7 sm:w-8 text-center text-dim text-xs">···</span>}
          <PageBtn n={totalPages} active={false} onClick={onPageChange} />
        </>
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="h-10 sm:h-9 px-3 sm:px-3 rounded-lg sm:rounded-md text-sm text-muted hover:text-accent disabled:opacity-25 disabled:cursor-not-allowed transition-all touch-manipulation"
      >
        下一页
      </button>
    </div>
  );
}

function PageBtn({ n, active, onClick }) {
  return (
    <button
      onClick={() => onClick(n)}
      className={`w-10 h-10 sm:w-9 sm:h-9 rounded-lg sm:rounded-md text-sm font-medium transition-all duration-150 touch-manipulation ${
        active
          ? "bg-accent/15 text-accent border border-accent/30"
          : "text-muted border border-transparent hover:border-[#2a2d35] hover:text-[#888]"
      }`}
    >
      {n}
    </button>
  );
}
