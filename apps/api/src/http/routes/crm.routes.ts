import { Router } from "express";
import { createClientSchema, createTaskSchema } from "@ultracrm/shared";
import { requireAuth, requirePermission } from "../middlewares/auth.js";
import { validateBody } from "../middlewares/validate.js";
import { CrmService } from "../../modules/crm/crm.service.js";

export const crmRoutes = Router();
const service = new CrmService();

crmRoutes.use(requireAuth);

crmRoutes.get("/clients", requirePermission("crm:read"), async (req, res) => {
  res.json(await service.listClients(req.auth!.companyId));
});

crmRoutes.post("/clients", requirePermission("crm:write"), validateBody(createClientSchema), async (req, res) => {
  res.status(201).json(await service.createClient(req.auth!.companyId, req.body));
});

crmRoutes.get("/funnels", requirePermission("crm:read"), async (req, res) => {
  res.json(await service.listFunnels(req.auth!.companyId));
});

crmRoutes.patch("/leads/:leadId/stage/:stageId", requirePermission("crm:write"), async (req, res) => {
  res.json(await service.moveLead(req.auth!.companyId, req.params.leadId, req.params.stageId));
});

crmRoutes.post("/tasks", requirePermission("crm:write"), validateBody(createTaskSchema), async (req, res) => {
  res.status(201).json(await service.createTask(req.auth!.companyId, req.body));
});

crmRoutes.get("/dashboard", requirePermission("crm:read"), async (req, res) => {
  const to = req.query.to ? new Date(String(req.query.to)) : new Date();
  const from = req.query.from ? new Date(String(req.query.from)) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  res.json(await service.dashboard(req.auth!.companyId, from, to));
});
