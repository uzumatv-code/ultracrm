import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { logger } from "../lib/logger.js";

export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400,
    public readonly code = "APP_ERROR"
  ) {
    super(message);
  }
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    return res.status(422).json({ code: "VALIDATION_ERROR", issues: error.flatten() });
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ code: error.code, message: error.message });
  }

  logger.error({ error }, "Unhandled error");
  return res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro interno do servidor." });
}
