import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { pinoHttp } from "pino-http";
import path from "node:path";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { routes } from "./http/routes/index.js";
import { errorHandler } from "./http/errors.js";

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(pinoHttp({ logger }));
app.use(rateLimit({ windowMs: 60_000, limit: 300 }));
app.use("/api", routes);

if (process.env.WEB_DIST_DIR) {
  const webDist = path.resolve(process.env.WEB_DIST_DIR);
  app.use(express.static(webDist));
  app.get("*", (_req, res) => res.sendFile(path.join(webDist, "index.html")));
}

app.use(errorHandler);
