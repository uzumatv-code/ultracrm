import type { Permission } from "../modules/auth/permissions.js";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        companyId: string;
        permissions: Permission[];
      };
    }
  }
}

export {};
