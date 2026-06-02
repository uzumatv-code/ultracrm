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

reportRoutes.get("/funnel", async (req, res) => {
  const funnels = await prisma.funnel.findMany({
    where: { companyId: req.auth!.companyId },
    include: { stages: { include: { leads: true }, orderBy: { position: "asc" } } }
  });
  res.json(
    funnels.map((funnel) => ({
      id: funnel.id,
      name: funnel.name,
      stages: funnel.stages.map((stage) => ({
        name: stage.name,
        leads: stage.leads.length,
        valueCents: stage.leads.reduce((sum, lead) => sum + lead.valueCents, 0)
      }))
    }))
  );
});

reportRoutes.get("/attendance", async (req, res) => {
  const companyId = req.auth!.companyId;
  const [open, waitingHuman, resolved, inbound, outbound] = await Promise.all([
    prisma.conversation.count({ where: { companyId, status: "OPEN" } }),
    prisma.conversation.count({ where: { companyId, status: "WAITING_HUMAN" } }),
    prisma.conversation.count({ where: { companyId, status: "RESOLVED" } }),
    prisma.message.count({ where: { companyId, direction: "INBOUND" } }),
    prisma.message.count({ where: { companyId, direction: "OUTBOUND" } })
  ]);
  res.json({ open, waitingHuman, resolved, inbound, outbound });
});

reportRoutes.get("/productivity", async (req, res) => {
  const companyId = req.auth!.companyId;
  const users = await prisma.user.findMany({
    where: { companyId },
    include: { tasks: true }
  });
  res.json(
    users.map((user) => ({
      user: { id: user.id, name: user.name, email: user.email },
      openTasks: user.tasks.filter((task) => task.status === "OPEN").length,
      doneTasks: user.tasks.filter((task) => task.status === "DONE").length
    }))
  );
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

reportRoutes.get("/summary.pdf", async (req, res) => {
  const companyId = req.auth!.companyId;
  const [clients, leads, payments, conversations] = await Promise.all([
    prisma.client.count({ where: { companyId } }),
    prisma.lead.count({ where: { companyId } }),
    prisma.payment.aggregate({ where: { companyId, status: "PAID" }, _sum: { amountCents: true } }),
    prisma.conversation.count({ where: { companyId } })
  ]);
  res.header("Content-Type", "text/html");
  res.header("Content-Disposition", "attachment; filename=ultracrm-relatorio.html");
  res.send(`<!doctype html><html><body><h1>UltraCRM AI - Relatorio</h1><ul><li>Clientes: ${clients}</li><li>Leads: ${leads}</li><li>Conversas: ${conversations}</li><li>Vendas: R$ ${((payments._sum.amountCents ?? 0) / 100).toFixed(2)}</li></ul></body></html>`);
});
