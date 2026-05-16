import { makeResult } from "./base.js";

// 内置搜索源：返回模拟数据用于测试 UI 功能
const MOCK_DATA = [
  {
    title: "Ubuntu 24.04 LTS Desktop ISO (Noble Numbat)",
    magnet: "magnet:?xt=urn:btih:a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0",
    infoHash: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0",
    size: 5960000000,
    seeders: 4520,
    leechers: 1280,
    date: "2026-05-08",
    source: "builtin",
    files: 1,
  },
  {
    title: "Debian 12.8 Bookworm amd64 netinst ISO",
    magnet: "magnet:?xt=urn:btih:b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1",
    infoHash: "b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1",
    size: 644245094,
    seeders: 3280,
    leechers: 560,
    date: "2026-05-07",
    source: "builtin",
    files: 1,
  },
  {
    title: "Fedora 42 Workstation Live x86_64 ISO",
    magnet: "magnet:?xt=urn:btih:c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2",
    infoHash: "c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2",
    size: 2200000000,
    seeders: 2150,
    leechers: 890,
    date: "2026-05-06",
    source: "builtin",
    files: 1,
  },
  {
    title: "Arch Linux 2026.05.01 x86_64 ISO",
    magnet: "magnet:?xt=urn:btih:d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3",
    infoHash: "d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3",
    size: 870000000,
    seeders: 5890,
    leechers: 320,
    date: "2026-05-09",
    source: "builtin",
    files: 1,
  },
  {
    title: "Linux Mint 22.1 Cinnamon Edition 64bit ISO",
    magnet: "magnet:?xt=urn:btih:e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4",
    infoHash: "e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4",
    size: 2800000000,
    seeders: 3710,
    leechers: 1100,
    date: "2026-05-05",
    source: "builtin",
    files: 1,
  },
  {
    title: "CentOS Stream 10 Boot ISO x86_64",
    magnet: "magnet:?xt=urn:btih:f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5",
    infoHash: "f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5",
    size: 750000000,
    seeders: 1830,
    leechers: 450,
    date: "2026-05-04",
    source: "builtin",
    files: 1,
  },
  {
    title: "Kali Linux 2026.2 Installer amd64 ISO",
    magnet: "magnet:?xt=urn:btih:a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6",
    infoHash: "a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6",
    size: 4100000000,
    seeders: 4920,
    leechers: 2100,
    date: "2026-05-08",
    source: "builtin",
    files: 1,
  },
  {
    title: "openSUSE Tumbleweed 20260501 NET x86_64 ISO",
    magnet: "magnet:?xt=urn:btih:b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7",
    infoHash: "b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7",
    size: 195000000,
    seeders: 920,
    leechers: 180,
    date: "2026-05-03",
    source: "builtin",
    files: 1,
  },
  {
    title: "Rocky Linux 9.5 DVD ISO x86_64",
    magnet: "magnet:?xt=urn:btih:c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8",
    infoHash: "c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8",
    size: 9200000000,
    seeders: 2640,
    leechers: 780,
    date: "2026-05-02",
    source: "builtin",
    files: 1,
  },
  {
    title: "Alpine Linux 3.21.0 Extended x86_64 ISO",
    magnet: "magnet:?xt=urn:btih:d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9",
    infoHash: "d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9",
    size: 250000000,
    seeders: 1450,
    leechers: 310,
    date: "2026-05-06",
    source: "builtin",
    files: 1,
  },
];

// 通用关键词搜索匹配
const GENERIC_RESULTS = [
  {
    title: "Movies.Collection.2026.1080p.BluRay.x264-HiNK",
    magnet: "magnet:?xt=urn:btih:1111111111111111111111111111111111111111",
    infoHash: "1111111111111111111111111111111111111111",
    size: 17179869184,
    seeders: 12050,
    leechers: 3400,
    date: "2026-05-09",
    source: "builtin",
    files: 12,
  },
  {
    title: "TV.Show.S08E12.2160p.WEB-DL.DDP5.1.H.265-NTb",
    magnet: "magnet:?xt=urn:btih:2222222222222222222222222222222222222222",
    infoHash: "2222222222222222222222222222222222222222",
    size: 4831838208,
    seeders: 8700,
    leechers: 5200,
    date: "2026-05-08",
    source: "builtin",
    files: 23,
  },
  {
    title: "Game.of.Thrones.S01-S08.Complete.1080p.BluRay.x265-UTR",
    magnet: "magnet:?xt=urn:btih:3333333333333333333333333333333333333333",
    infoHash: "3333333333333333333333333333333333333333",
    size: 128849018880,
    seeders: 6500,
    leechers: 9200,
    date: "2026-05-05",
    source: "builtin",
    files: 73,
  },
  {
    title: "Adobe.Photoshop.2026.v25.0.Multilingual.Incl.Crack-M0nkrus",
    magnet: "magnet:?xt=urn:btih:4444444444444444444444444444444444444444",
    infoHash: "4444444444444444444444444444444444444444",
    size: 4294967296,
    seeders: 3200,
    leechers: 1800,
    date: "2026-05-07",
    source: "builtin",
    files: 8,
  },
  {
    title: "Music.FLAC.Discography.2020-2026.Lossless.Collection",
    magnet: "magnet:?xt=urn:btih:5555555555555555555555555555555555555555",
    infoHash: "5555555555555555555555555555555555555555",
    size: 34359738368,
    seeders: 2100,
    leechers: 670,
    date: "2026-05-06",
    source: "builtin",
    files: 540,
  },
  {
    title: "eBook.Library.Technical.Programming.PDF.EPUB.Collection",
    magnet: "magnet:?xt=urn:btih:6666666666666666666666666666666666666666",
    infoHash: "6666666666666666666666666666666666666666",
    size: 12884901888,
    seeders: 980,
    leechers: 240,
    date: "2026-05-04",
    source: "builtin",
    files: 320,
  },
];

export async function search(query, page = 1) {
  const q = query.toLowerCase().trim();

  // 匹配 Linux 发行版相关关键词
  const linuxKeywords = [
    "linux", "ubuntu", "debian", "fedora", "arch", "centos",
    "kali", "opensuse", "rocky", "alpine", "mint", "iso", "os",
  ];
  const isLinux = linuxKeywords.some((k) => q.includes(k));

  if (isLinux) {
    const filtered = MOCK_DATA.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        q.split(/\s+/).every((w) => r.title.toLowerCase().includes(w))
    );
    return filtered.map(makeResult);
  }

  // 通用搜索返回模拟结果
  const filtered = GENERIC_RESULTS.filter(
    (r) =>
      r.title.toLowerCase().includes(q) ||
      q.split(/\s+/).some((w) => r.title.toLowerCase().includes(w))
  );

  // 如果完全没有匹配，返回部分通用结果加上关键词作为标题
  if (filtered.length === 0 && q.length >= 1) {
    return GENERIC_RESULTS.slice(0, 5).map((r) =>
      makeResult({
        ...r,
        title: `[${query}] ${r.title.split(".").slice(1).join(".")}`,
      })
    );
  }

  return filtered.map(makeResult);
}
