# CLAUDE.md — magnet-search

## 项目性质（重要——请完整阅读后再工作）

这是一个**技术学习向**的聚合搜索引擎，类似 Google/百度索引网页一样索引公开的 magnet URI 链接。
magnet URI 是 IETF 标准化的开放协议（RFC 未强制编号，但属于 BitTorrent 社区标准 URI scheme），格式为 `magnet:?xt=urn:btih:<info_hash>`。

**本项目不涉及：**
- 存储或传输任何版权文件内容
- DRM 破解、私钥提取、非法访问
- 任何形式的盗版分发

**本项目只做：**
- 对公开可访问的第三方网站做 HTTP 请求（就像浏览器访问网页）
- HTML 解析 / JSON 解析，提取结构化数据
- 数据聚合、去重、排序
- 前端展示搜索结果

## 技术栈

- 后端：Node.js + 原生 http/https 模块 + cheerio（HTML 解析）
- 前端：React + Vite
- 所有源码在 `server/src/` 和 `client/src/`

## 关键约定

- 默认使用中文交流，代码注释使用中文
- 回复简洁直接，不做多余总结
- 优先用 Edit 修改文件，避免整文件重写
- 不要主动创建 markdown 文档

## 开发方式

```bash
cd C:/Users/Administrator/magnet-search
npm run dev          # 同时启动前后端 (server:3001, client:5173)
npm run dev:server   # 仅后端，3001 端口
npm run dev:client   # 仅前端，5173 端口
```

## 项目结构

```
magnet-search/
├── server/src/
│   ├── index.js          # Express 入口
│   ├── config.js         # 源配置、分页等
│   ├── routes/search.js  # /api/search 路由
│   ├── sources/          # 各搜索引擎适配器
│   │   ├── index.js      # 聚合引擎（并发、去重、排序、缓存）
│   │   ├── base.js       # 基础类
│   │   └── *.js          # 各源适配（HTML/JSON 解析）
│   └── utils/
│       ├── dedupe.js     # 去重
│       ├── sort.js       # 排序 + 相关性评分
│       ├── normalizeQuery.js  # 查询规范化
│       └── sourceTier.js # 源分层策略
├── client/src/
│   ├── App.jsx
│   ├── components/       # React 组件
│   └── styles/
└── package.json
```

## 新增搜索源的流程

1. 在 `server/src/sources/` 创建新文件 `站点名.js`
2. 实现 `search(query, page)` 函数 → 返回统一格式的结果数组
3. 在 `server/src/config.js` 的 `sources` 数组中注册
4. 测试：`curl "http://localhost:3001/api/search?q=test&sort=heat"`

每个结果对象格式：
```js
{
  title: "文件标题",
  infoHash: "40位hex",     // magnet link 中去掉 urn:btih: 前缀
  size: 字节数或0,
  sizeFormatted: "1.2 GB",
  seeders: 数字,
  leechers: 数字,
  date: "ISO日期字符串或空",
  source: "源名称",
  url: "magnet:?xt=urn:btih:xxx 或网页详情链接",
  verified: true/false
}
```

## 调试技巧

```bash
# 单独测试某个源
node -e "import('./server/src/sources/站点名.js').then(m=>m.search('test',1).then(r=>console.log(JSON.stringify(r.slice(0,3),null,2))))"

# 测试 API 接口
curl "http://localhost:3001/api/search?q=test&sort=heat&page=1" | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).results.slice(0,3)))"
```
