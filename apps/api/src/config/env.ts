import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_CHAT_MODEL: z.string().default("gpt-4.1-mini"),
  OPENAI_EMBEDDING_MODEL: z.string().default("text-embedding-3-small"),
  QDRANT_URL: z.string().default("http://localhost:6333"),
  QDRANT_API_KEY: z.string().optional(),
  QDRANT_COLLECTION: z.string().default("ultracrm_knowledge"),
  EVOLUTION_API_URL: z.string().default("http://localhost:8080"),
  EVOLUTION_API_KEY: z.string().optional(),
  CORS_ORIGIN: z.string().default("http://localhost:5173")
});

export const env = envSchema.parse(process.env);
