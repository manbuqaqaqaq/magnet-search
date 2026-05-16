import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import path from "path";
import { fileURLToPath } from "url";
import config from "./config.js";
import searchRoute from "./routes/search.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const fastify = Fastify({ logger: true });

// CORS
await fastify.register(cors, { origin: true });

// 访问密钥验证（公网穿透时启用）
// 浏览器同源访问免密；直接调 API（curl/脚本）需携带 ?token=xxx 或 X-Access-Token 头
const accessToken = config.accessToken;
if (accessToken) {
  fastify.addHook("onRequest", (req, reply, done) => {
    if (!req.url.startsWith("/api/")) return done();
    // 同源请求放行（浏览器中打开的前端页面）
    const ref = (req.headers.referer || req.headers.referrer || "").toString();
    if (ref && ref.includes(req.hostname)) return done();
    // 携带有效 token 放行
    const urlParams = new URLSearchParams(req.url.split("?")[1] || "");
    const token = urlParams.get("token") || (req.headers["x-access-token"] || "").toString();
    if (token === accessToken) return done();
    return reply.status(401).send({ error: "需要有效的访问令牌，请通过 ?token=xxx 或 X-Access-Token 头提供" });
  });
  console.log("[auth] 访问密钥已启用，直接 API 调用需携带 token");
}

// 简单频率限制: 每 IP 每分钟最多 30 次请求
const rateLimitMap = new Map();
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW = 60000;

fastify.addHook("onRequest", (req, reply, done) => {
  if (!req.url.startsWith("/api/")) return done();
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  let entry = rateLimitMap.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW) {
    entry = { windowStart: now, count: 1 };
  } else {
    entry.count++;
  }
  rateLimitMap.set(ip, entry);

  if (entry.count > RATE_LIMIT_MAX) {
    return reply.status(429).send({ error: "请求过于频繁，请稍后重试" });
  }
  done();
});

// 定期清理过期记录
setInterval(() => {
  const cutoff = Date.now() - RATE_LIMIT_WINDOW;
  for (const [ip, entry] of rateLimitMap) {
    if (entry.windowStart < cutoff) rateLimitMap.delete(ip);
  }
}, 120000);

// API 路由
await fastify.register(searchRoute);

// Serve 前端构建产物 (生产模式)
const distDir = path.resolve(__dirname, "../../client/dist");
try {
  await fastify.register(fastifyStatic, {
    root: distDir,
    prefix: "/",
  });
  // SPA fallback: 非 API 路径返回 index.html
  fastify.setNotFoundHandler((req, reply) => {
    if (req.url.startsWith("/api/")) {
      return reply.status(404).send({ error: "Not found" });
    }
    return reply.sendFile("index.html");
  });
} catch {
  fastify.log.warn("前端构建产物未找到，仅提供 API 服务");
}

// 启动
try {
  await fastify.listen({ port: config.port, host: "0.0.0.0" });
  console.log(`\n  Server running at http://localhost:${config.port}\n`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
