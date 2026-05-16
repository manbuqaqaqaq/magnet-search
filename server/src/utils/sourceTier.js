// 源站分级评估：中文能力 + 国内可访问性 + 数据质量

export const SOURCE_PROFILES = {
  dmhy: {
    tier: 1,
    chineseSupport: "excellent", // 中文标题、中文搜索、国内可访问
    gfwBlocked: false,
    category: "anime",
    notes: "台湾站点，国内直连，中文动漫资源最丰富",
  },
  knaben: {
    tier: 1,
    chineseSupport: "good", // 中文搜索有结果，但标题以英文为主
    gfwBlocked: true,
    category: "general",
    notes: "聚合 TPB+YTS，国内可能需代理",
  },
  tpb: {
    tier: 1,
    chineseSupport: "limited", // 英文标题为主，中文搜索命中率低
    gfwBlocked: true,
    category: "general",
    notes: "全球最大 BT 库，国内需代理",
  },
  hiddenbay: {
    tier: 1,
    chineseSupport: "limited",
    gfwBlocked: true,
    category: "general",
    notes: "TPB 备用镜像",
  },
  torrentz2: {
    tier: 2,
    chineseSupport: "good", // 中文搜索有结果（电影天堂等）
    gfwBlocked: true,
    category: "meta",
    notes: "6100 万索引元搜索，国内可能需代理",
  },
  nyaa: {
    tier: 2,
    chineseSupport: "limited", // 少量中文标题
    gfwBlocked: false,
    category: "anime",
    notes: "ACG 专站，国内可直连",
  },
  glodls: {
    tier: 2,
    chineseSupport: "none",
    gfwBlocked: true,
    category: "general",
    notes: "英文影视为主",
  },
  rutor: {
    tier: 3,
    chineseSupport: "none",
    gfwBlocked: true,
    category: "general",
    notes: "俄语站点，仅俄语用户适用",
  },
};

// 检测查询是否包含中文
export function isChineseQuery(query) {
  return /[一-鿿]/.test(query);
}

// 按查询语言调整源优先级：中文查询时中文源排前面
export function prioritizeSources(sources, query) {
  if (!isChineseQuery(query)) return sources;

  const tierOrder = { dmhy: 0, torrentz2: 1, knaben: 2, nyaa: 3, tpb: 4, hiddenbay: 5, glodls: 6, rutor: 7 };

  return [...sources].sort((a, b) => {
    const orderA = tierOrder[a.name] ?? 99;
    const orderB = tierOrder[b.name] ?? 99;
    return orderA - orderB;
  });
}
