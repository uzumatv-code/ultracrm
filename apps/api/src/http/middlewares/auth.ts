import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors.js";
import { AuthService } from "../../modules/auth/auth.service.js";
import type { Permission } from "../../modules/auth/permissions.js";

const authService = new AuthService();

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) throw new AppError("Token ausente.", 401, "TOKEN_MISSING");
    const token = header.replace("Bearer ", "");
    const payload = authService.verifyAccessToken(token);
    req.auth = {
      userId: payload.sub,
      companyId: payload.companyId,
      permissions: payload.permissions
    };
    next();
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Token invalido ou expirado.", 401, "TOKEN_INVALID");
  }
}

export function requirePermission(permission: Permission) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth?.permissions.includes(permission)) {
      throw new AppError("Permissao insuficiente.", 403, "FORBIDDEN");
    }
    next();
  };
}
