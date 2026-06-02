import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { pinoHttp } from "pino-http";
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
app.use(errorHandler);
