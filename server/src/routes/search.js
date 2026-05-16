import { aggregateSearch, aggregateSearchStream, SORT_FIELDS, getEnabledSources } from "../sources/index.js";

export default async function searchRoute(fastify) {
  fastify.get("/api/search", {
    schema: {
      querystring: {
        type: "object",
        required: ["q"],
        properties: {
          q: { type: "string", minLength: 1 },
          sort: { type: "string", enum: SORT_FIELDS, default: "relevance" },
          page: { type: "integer", minimum: 1, default: 1 },
          sources: { type: "string" },
          minSize: { type: "integer", minimum: 0 },
          maxSize: { type: "integer", minimum: 0 },
          dateFrom: { type: "string" },
          dateTo: { type: "string" },
        },
      },
    },
    handler: async (req, reply) => {
      const { q, sort = "relevance", page = 1, sources, minSize, maxSize, dateFrom, dateTo } = req.query;

      const filters = {};
      if (sources) filters.sources = sources.split(",").map((s) => s.trim()).filter(Boolean);
      if (minSize != null) filters.minSize = Number(minSize);
      if (maxSize != null) filters.maxSize = Number(maxSize);
      if (dateFrom) filters.dateFrom = dateFrom;
      if (dateTo) filters.dateTo = dateTo;

      try {
        const data = await aggregateSearch(q, sort, page, filters);
        return reply.send(data);
      } catch (err) {
        req.log.error(err);
        const userMsg = friendlyError(err);
        return reply.status(userMsg.status).send({
          error: userMsg.error,
          message: userMsg.message,
        });
      }
    },
  });

  // SSE 流式搜索：每个源完成后即刻推送结果
  fastify.get("/api/search/stream", async (req, reply) => {
    const { q, sort = "relevance", page = 1, sources, minSize, maxSize, dateFrom, dateTo } = req.query;

    const filters = {};
    if (sources) filters.sources = sources.split(",").map((s) => s.trim()).filter(Boolean);
    if (minSize != null) filters.minSize = Number(minSize);
    if (maxSize != null) filters.maxSize = Number(maxSize);
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;

    const res = reply.raw;
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    });

    try {
      let lastSend = 0;
      const result = await aggregateSearchStream(q, sort, page, filters, (evt) => {
        // 节流：100ms 内最多发一次快照
        const now = Date.now();
        if (now - lastSend < 100) return;
        lastSend = now;

        res.write(`event: source\n`);
        res.write(`data: ${JSON.stringify(evt)}\n\n`);
      });

      // 最终完整结果
      res.write(`event: complete\n`);
      res.write(`data: ${JSON.stringify(result)}\n\n`);
    } catch (err) {
      req.log.error(err);
      res.write(`event: error\n`);
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    } finally {
      res.end();
    }
  });

  fastify.get("/api/sources", async (_req, reply) => {
    return reply.send(getEnabledSources());
  });
}

function friendlyError(err) {
  const msg = err.message || "";
  if (msg.includes("fetch") || msg.includes("ECONNREFUSED") || msg.includes("ENOTFOUND"))
    return { status: 502, error: "数据源暂时不可达，请稍后重试", message: "" };
  if (msg.includes("timeout") || msg.includes("TIMEDOUT"))
    return { status: 504, error: "搜索超时，部分数据源响应过慢", message: "" };
  if (msg.includes("没有可用的搜索源"))
    return { status: 503, error: "所有搜索源暂不可用，请稍后重试", message: "" };
  return { status: 500, error: "搜索失败，请稍后重试", message: msg };
}
