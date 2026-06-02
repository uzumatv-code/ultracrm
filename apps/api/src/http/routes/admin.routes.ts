import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../database/prisma.js";
import { requireAuth, requirePermission } from "../middlewares/auth.js";
import { validateBody } from "../middlewares/validate.js";
import { adminPermissions, permissions } from "../../modules/auth/permissions.js";

export const adminRoutes = Router();

adminRoutes.use(requireAuth);

adminRoutes.get("/company", requirePermission("admin:manage"), async (req, res) => {
  res.json(await prisma.company.findUnique({ where: { id: req.auth!.companyId } }));
});

adminRoutes.patch(
  "/company",
  requirePermission("admin:manage"),
  validateBody(z.object({ name: z.string().min(2).optional(), aiPersona: z.string().min(10).optional(), document: z.string().optional() })),
  async (req, res) => {
    res.json(await prisma.company.update({ where: { id: req.auth!.companyId }, data: req.body }));
  }
);

adminRoutes.get("/permissions", requirePermission("admin:manage"), (_req, res) => {
  res.json({ permissions });
});

adminRoutes.get("/roles", requirePermission("admin:manage"), async (req, res) => {
  res.json(await prisma.role.findMany({ where: { companyId: req.auth!.companyId }, orderBy: { name: "asc" } }));
});

adminRoutes.post(
  "/roles",
  requirePermission("admin:manage"),
  validateBody(z.object({ name: z.string().min(2), permissions: z.array(z.enum(permissions)).default(adminPermissions) })),
  async (req, res) => {
    res.status(201).json(await prisma.role.create({ data: { companyId: req.auth!.companyId, ...req.body } }));
  }
);

adminRoutes.get("/users", requirePermission("admin:manage"), async (req, res) => {
  res.json(
    await prisma.user.findMany({
      where: { companyId: req.auth!.companyId },
      include: { role: true },
      orderBy: { createdAt: "desc" }
    })
  );
});

adminRoutes.post(
  "/users",
  requirePermission("admin:manage"),
  validateBody(
    z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(8),
      roleId: z.string().optional()
    })
  ),
  async (req, res) => {
    res.status(201).json(
      await prisma.user.create({
        data: {
          companyId: req.auth!.companyId,
          name: req.body.name,
          email: req.body.email,
          roleId: req.body.roleId,
          passwordHash: await bcrypt.hash(req.body.password, 12)
        },
        include: { role: true }
      })
    );
  }
);

adminRoutes.patch(
  "/users/:userId",
  requirePermission("admin:manage"),
  validateBody(z.object({ status: z.enum(["ACTIVE", "INVITED", "DISABLED"]).optional(), roleId: z.string().optional() })),
  async (req, res) => {
    res.json(await prisma.user.update({ where: { id: req.params.userId, companyId: req.auth!.companyId }, data: req.body }));
  }
);

adminRoutes.get("/audit-logs", requirePermission("admin:manage"), async (req, res) => {
  res.json(
    await prisma.auditLog.findMany({
      where: { companyId: req.auth!.companyId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 200
    })
  );
});
