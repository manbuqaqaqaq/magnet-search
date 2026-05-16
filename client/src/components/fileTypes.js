const TYPE_RULES = [
  {
    type: "视频",
    icon: "🎬",
    color: "#38bdf8",
    patterns: [
      /\b(mp4|mkv|avi|mov|wmv|flv|webm|m4v|ts|m2ts)\b/i,
      /\b(720p|1080p|2160p|4k|8k|bluray|bdrip|brrip|web-dl|webrip|hdtv|dvdrip)\b/i,
      /\b(h\.?264|h\.?265|x264|x265|hevc|avc|av1|vp9)\b/i,
      /\b(remux|imax|hdr|dolby.vision|sdr|hdr10\+?)\b/i,
    ],
  },
  {
    type: "音频",
    icon: "🎵",
    color: "#34d399",
    patterns: [
      /\b(mp3|flac|aac|wav|ogg|wma|m4a|opus|alac|dsd)\b/i,
      /\b(album|discography|discog|vinyl|lossless|320kbps|24bit)\b/i,
      /\b(itunes|spotify|tidal|qobuz)\b/i,
    ],
  },
  {
    type: "图片",
    icon: "🖼️",
    color: "#f59e0b",
    patterns: [
      /\b(jpe?g|png|gif|bmp|tiff?|webp|psd|raw|svg)\b/i,
      /\b(photo|wallpaper|stock|preset|lightroom|lut)\b/i,
    ],
  },
  {
    type: "压缩包",
    icon: "📦",
    color: "#a78bfa",
    patterns: [
      /\b(zip|rar|7z|tar|gz|xz|bz2|lz4|zst)\b/i,
    ],
  },
  {
    type: "电子书",
    icon: "📖",
    color: "#fb923c",
    patterns: [
      /\b(pdf|epub|mobi|azw3?|djvu|cbr|cbz|lit|fb2)\b/i,
      /\b(ebook|电子书|漫画|manga|comic)\b/i,
    ],
  },
  {
    type: "软件",
    icon: "⚙️",
    color: "#f472b6",
    patterns: [
      /\b(exe|dmg|appx?|msi|deb|rpm|apk|ipa)\b/i,
      /\b(setup|installer|portable|crack|keygen|patch|repack|pre-activated)\b/i,
      /\b(windows|macos|mac.os|linux|android|ios)\b.*\b(software|app|program|tool)\b/i,
    ],
  },
  {
    type: "游戏",
    icon: "🎮",
    color: "#ef4444",
    patterns: [
      /\b(game|gaming|repack|fitgirl|dodi|codex|skidrow|cpy|empress|rune|tenoke|razor1911|platinmods)\b/i,
      /\b(gog|steam|epic|origin|uplay)\b/i,
    ],
  },
  {
    type: "字幕",
    icon: "💬",
    color: "#60a5fa",
    patterns: [
      /\b(srt|ass|ssa|sub|vtt|idx)\b/i,
      /\b(subtitle|subtitles|字幕)\b/i,
    ],
  },
  {
    type: "ISO/镜像",
    icon: "💿",
    color: "#c084fc",
    patterns: [
      /\b(iso|img|bin|cue|nrg|mdf|mds|dmg|toast)\b/i,
      /\b(bootable|livecd|liveusb|rescue)\b/i,
    ],
  },
];

export function detectFileType(title) {
  if (!title) return null;
  for (const rule of TYPE_RULES) {
    for (const pat of rule.patterns) {
      if (pat.test(title)) return { type: rule.type, icon: rule.icon, color: rule.color };
    }
  }
  return null;
}

export function detectMultipleTypes(title) {
  if (!title) return [];
  return TYPE_RULES.filter((rule) => rule.patterns.some((pat) => pat.test(title))).map((r) => ({ type: r.type, icon: r.icon, color: r.color }));
}

// 内容大类 → 文件类型映射
const CATEGORY_MAP = {
  "影视": ["视频", "字幕", "ISO/镜像"],
  "书籍": ["电子书", "图片"],
  "软件": ["软件", "游戏", "压缩包"],
  "音乐": ["音频"],
};

export const CONTENT_CATEGORIES = ["全部", "影视", "书籍", "软件", "音乐"];

// 判断标题是否属于指定内容大类
export function matchesCategory(title, category) {
  if (!title || category === "全部") return true;
  const types = CATEGORY_MAP[category];
  if (!types) return true;
  return TYPE_RULES.some(
    (rule) => types.includes(rule.type) && rule.patterns.some((pat) => pat.test(title))
  );
}

// 获取标题的内容大类（用于排序加权）
export function getCategory(title) {
  if (!title) return null;
  for (const [cat, types] of Object.entries(CATEGORY_MAP)) {
    if (TYPE_RULES.some((rule) => types.includes(rule.type) && rule.patterns.some((pat) => pat.test(title)))) {
      return cat;
    }
  }
  return null;
}
