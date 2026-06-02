export const permissions = [
  "crm:read",
  "crm:write",
  "whatsapp:manage",
  "ai:manage",
  "rag:manage",
  "reports:read",
  "billing:manage",
  "admin:manage"
] as const;

export type Permission = (typeof permissions)[number];

export const adminPermissions: Permission[] = [...permissions];
