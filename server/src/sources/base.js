// 格式化文件大小
export function formatSize(bytes) {
  if (!bytes || bytes <= 0) return "";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(size < 10 ? 1 : 0)} ${units[i]}`;
}

// 构建标准结果对象
export function makeResult(raw) {
  return {
    title: (raw.title || "").trim(),
    magnet: raw.magnet || "",
    infoHash: raw.infoHash || extractInfoHash(raw.magnet),
    size: raw.size || 0,
    sizeFormatted: formatSize(raw.size),
    seeders: raw.seeders || 0,
    leechers: raw.leechers || 0,
    date: raw.date || "",
    source: raw.source || "",
    files: raw.files || 0,
  };
}

// 从磁力链接中提取 infoHash
function extractInfoHash(magnet) {
  if (!magnet) return "";
  const m = magnet.match(/btih:([a-fA-F0-9]{40})/);
  return m ? m[1].toLowerCase() : "";
}
