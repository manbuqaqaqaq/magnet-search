import { useState, useCallback } from "react";

// Detect if running on a mobile device (rough heuristic)
const isMobile = /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent);

function copyText(text) {
  try {
    return navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.cssText = "position:fixed;opacity:0;pointer-events:none";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    return Promise.resolve();
  }
}

export default function CopyButton({ text, title }) {
  const [copied, setCopied] = useState(false);
  const [openFailed, setOpenFailed] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!text) return;
    await copyText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [text]);

  // 尝试通过 magnet:// 协议打开（移动端会弹出 App 选择：115网盘、迅雷等）
  const handleOpen = useCallback(async () => {
    if (!text) return;
    setOpenFailed(false);

    // 先复制链接（部分 App 会读取剪贴板）
    await copyText(text);

    // 尝试跳转 magnet 协议
    const magnetUri = text.startsWith("magnet:") ? text : `magnet:?xt=urn:btih:${text}`;

    // 用隐藏 iframe 尝试触发协议（避免当前页面被导航离开）
    try {
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = magnetUri;
      document.body.appendChild(iframe);

      // 短暂延迟后移除 iframe
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 2000);

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // iframe 方式也失败，尝试直接跳转
      try {
        window.location.href = magnetUri;
      } catch {
        setOpenFailed(true);
        setTimeout(() => setOpenFailed(false), 3000);
      }
    }
  }, [text]);

  // 使用 <a> 标签作为后备（iOS Safari 对 magnet:// 协议支持更好的方式）
  const magnetHref = text && text.startsWith("magnet:") ? text : null;

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {/* 打开按钮 —— 移动端优先显示 */}
      {magnetHref && (
        <a
          href={magnetHref}
          onClick={(e) => {
            // 移动端让浏览器自然处理 magnet:// 协议
            if (isMobile) return; // 放行 <a> 标签默认行为
            // 桌面端拦截，用 iframe 方式尝试
            e.preventDefault();
            handleOpen();
          }}
          className="shrink-0 h-10 sm:h-7 px-3 sm:px-2.5 flex items-center gap-1.5 rounded-lg sm:rounded text-sm sm:text-xs font-semibold transition-all duration-200 bg-signal/10 border border-signal/30 text-signal hover:bg-signal/20 active:scale-95 touch-manipulation"
          title="打开磁力链接 — 移动端自动选择下载 App"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="sm:w-3.5 sm:h-3.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span className="hidden sm:inline">打开</span>
          <span className="sm:hidden text-[13px]">磁力下载</span>
        </a>
      )}

      {/* 复制按钮 */}
      <button
        onClick={handleCopy}
        title={copied ? "已复制" : "复制磁力链接"}
        className={`shrink-0 h-10 sm:h-7 px-3 sm:px-2.5 flex items-center gap-1.5 rounded-lg sm:rounded text-sm sm:text-xs font-medium transition-all duration-200 touch-manipulation ${
          copied
            ? "bg-signal/10 border border-signal/30 text-signal"
            : "text-dim border border-transparent hover:text-accent hover:border-accent/20 hover:bg-accent/5 active:scale-95"
        }`}
      >
        {copied ? (
          <>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="sm:w-3.5 sm:h-3.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span className="hidden sm:inline">已复制</span>
            <span className="sm:hidden text-[13px]">已复制 ✓</span>
          </>
        ) : (
          <>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:w-3.5 sm:h-3.5">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            <span className="hidden sm:inline">复制</span>
            <span className="sm:hidden text-[13px]">复制链接</span>
          </>
        )}
      </button>

      {/* 打开失败提示 */}
      {openFailed && (
        <span className="text-xs text-alert animate-fade">未找到磁力应用，已复制链接</span>
      )}
    </div>
  );
}
