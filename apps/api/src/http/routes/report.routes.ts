import { Router } from "express";
import type { Payment } from "@prisma/client";
import { requireAuth, requirePermission } from "../middlewares/auth.js";
import { prisma } from "../../database/prisma.js";

export const reportRoutes = Router();

reportRoutes.use(requireAuth, requirePermission("reports:read"));

reportRoutes.get("/conversion", async (req, res) => {
  const companyId = req.auth!.companyId;
  const [won, lost, open] = await Promise.all([
    prisma.lead.count({ where: { companyId, status: "WON" } }),
    prisma.lead.count({ where: { companyId, status: "LOST" } }),
    prisma.lead.count({ where: { companyId, status: "OPEN" } })
  ]);
  res.json({ won, lost, open, conversionRate: won + lost === 0 ? 0 : Math.round((won / (won + lost)) * 100) });
});

reportRoutes.get("/sales.csv", async (req, res) => {
  const payments = await prisma.payment.findMany({
    where: { companyId: req.auth!.companyId, status: "PAID" },
    include: { client: true },
    orderBy: { paidAt: "desc" }
  });
  const rows = ["cliente,valor,status,pago_em"].concat(
    payments.map((payment: Payment & { client: { name: string } }) =>
      [payment.client.name, payment.amountCents / 100, payment.status, payment.paidAt?.toISOString() ?? ""].join(",")
    )
  );
  res.header("Content-Type", "text/csv").send(rows.join("\n"));
});
