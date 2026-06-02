import { Router } from "express";
import { z } from "zod";
import {
  createAppointmentSchema,
  createClientSchema,
  createLeadSchema,
  createManualMessageSchema,
  createNoteSchema,
  createPaymentSchema,
  createProductSchema,
  createServiceOrderSchema,
  createServiceSchema,
  createTagSchema,
  createTaskSchema,
  updatePaymentSchema
} from "@ultracrm/shared";
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

crmRoutes.patch("/clients/:clientId", requirePermission("crm:write"), validateBody(createClientSchema.partial()), async (req, res) => {
  res.json(await service.updateClient(req.auth!.companyId, req.params.clientId, req.body));
});

crmRoutes.get("/funnels", requirePermission("crm:read"), async (req, res) => {
  res.json(await service.listFunnels(req.auth!.companyId));
});

crmRoutes.post("/leads", requirePermission("crm:write"), validateBody(createLeadSchema), async (req, res) => {
  res.status(201).json(await service.createLead(req.auth!.companyId, req.body));
});

crmRoutes.patch("/leads/:leadId/stage/:stageId", requirePermission("crm:write"), async (req, res) => {
  res.json(await service.moveLead(req.auth!.companyId, req.params.leadId, req.params.stageId));
});

crmRoutes.patch(
  "/leads/:leadId/status",
  requirePermission("crm:write"),
  validateBody(z.object({ status: z.enum(["OPEN", "WON", "LOST"]) })),
  async (req, res) => {
    res.json(await service.updateLeadStatus(req.auth!.companyId, req.params.leadId, req.body.status));
  }
);

crmRoutes.get("/tasks", requirePermission("crm:read"), async (req, res) => {
  res.json(await service.listTasks(req.auth!.companyId));
});

crmRoutes.post("/tasks", requirePermission("crm:write"), validateBody(createTaskSchema), async (req, res) => {
  res.status(201).json(await service.createTask(req.auth!.companyId, req.body));
});

crmRoutes.patch(
  "/tasks/:taskId/status",
  requirePermission("crm:write"),
  validateBody(z.object({ status: z.enum(["OPEN", "DONE", "CANCELED"]) })),
  async (req, res) => {
    res.json(await service.updateTaskStatus(req.auth!.companyId, req.params.taskId, req.body.status));
  }
);

crmRoutes.get("/products", requirePermission("crm:read"), async (req, res) => {
  res.json(await service.listProducts(req.auth!.companyId));
});

crmRoutes.post("/products", requirePermission("crm:write"), validateBody(createProductSchema), async (req, res) => {
  res.status(201).json(await service.createProduct(req.auth!.companyId, req.body));
});

crmRoutes.get("/services", requirePermission("crm:read"), async (req, res) => {
  res.json(await service.listServices(req.auth!.companyId));
});

crmRoutes.post("/services", requirePermission("crm:write"), validateBody(createServiceSchema), async (req, res) => {
  res.status(201).json(await service.createService(req.auth!.companyId, req.body));
});

crmRoutes.get("/payments", requirePermission("crm:read"), async (req, res) => {
  res.json(await service.listPayments(req.auth!.companyId));
});

crmRoutes.post("/payments", requirePermission("crm:write"), validateBody(createPaymentSchema), async (req, res) => {
  res.status(201).json(await service.createPayment(req.auth!.companyId, req.body));
});

crmRoutes.patch("/payments/:paymentId", requirePermission("crm:write"), validateBody(updatePaymentSchema), async (req, res) => {
  res.json(await service.updatePayment(req.auth!.companyId, req.params.paymentId, req.body.status, req.body.paidAt));
});

crmRoutes.get("/orders", requirePermission("crm:read"), async (req, res) => {
  res.json(await service.listOrders(req.auth!.companyId));
});

crmRoutes.post("/orders", requirePermission("crm:write"), validateBody(createServiceOrderSchema), async (req, res) => {
  res.status(201).json(await service.createOrder(req.auth!.companyId, req.body));
});

crmRoutes.patch(
  "/orders/:orderId/status",
  requirePermission("crm:write"),
  validateBody(z.object({ status: z.enum(["OPEN", "QUOTED", "APPROVED", "IN_PROGRESS", "DONE", "CANCELED"]) })),
  async (req, res) => {
    res.json(await service.updateOrderStatus(req.auth!.companyId, req.params.orderId, req.body.status));
  }
);

crmRoutes.get("/appointments", requirePermission("crm:read"), async (req, res) => {
  res.json(
    await service.listAppointments(
      req.auth!.companyId,
      req.query.from ? new Date(String(req.query.from)) : undefined,
      req.query.to ? new Date(String(req.query.to)) : undefined
    )
  );
});

crmRoutes.post("/appointments", requirePermission("crm:write"), validateBody(createAppointmentSchema), async (req, res) => {
  res.status(201).json(await service.createAppointment(req.auth!.companyId, req.body));
});

crmRoutes.patch(
  "/appointments/:appointmentId/status",
  requirePermission("crm:write"),
  validateBody(z.object({ status: z.enum(["SCHEDULED", "CONFIRMED", "CANCELED", "DONE", "NO_SHOW"]) })),
  async (req, res) => {
    res.json(await service.updateAppointmentStatus(req.auth!.companyId, req.params.appointmentId, req.body.status));
  }
);

crmRoutes.get("/conversations", requirePermission("crm:read"), async (req, res) => {
  res.json(await service.listConversations(req.auth!.companyId));
});

crmRoutes.patch(
  "/conversations/:conversationId/status",
  requirePermission("crm:write"),
  validateBody(z.object({ status: z.enum(["OPEN", "WAITING_HUMAN", "RESOLVED", "ARCHIVED"]) })),
  async (req, res) => {
    res.json(await service.updateConversationStatus(req.auth!.companyId, req.params.conversationId, req.body.status));
  }
);

crmRoutes.post("/messages", requirePermission("crm:write"), validateBody(createManualMessageSchema), async (req, res) => {
  res.status(201).json(await service.addManualMessage(req.auth!.companyId, req.body.conversationId, req.body.body));
});

crmRoutes.get("/notes", requirePermission("crm:read"), async (req, res) => {
  res.json(await service.listNotes(req.auth!.companyId, req.query.clientId ? String(req.query.clientId) : undefined));
});

crmRoutes.post("/notes", requirePermission("crm:write"), validateBody(createNoteSchema), async (req, res) => {
  res.status(201).json(await service.createNote(req.auth!.companyId, req.body.clientId, req.body.body));
});

crmRoutes.get("/tags", requirePermission("crm:read"), async (req, res) => {
  res.json(await service.listTags(req.auth!.companyId));
});

crmRoutes.post("/tags", requirePermission("crm:write"), validateBody(createTagSchema), async (req, res) => {
  res.status(201).json(await service.createTag(req.auth!.companyId, req.body.name, req.body.color));
});

crmRoutes.get("/dashboard", requirePermission("crm:read"), async (req, res) => {
  const to = req.query.to ? new Date(String(req.query.to)) : new Date();
  const from = req.query.from ? new Date(String(req.query.from)) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  res.json(await service.dashboard(req.auth!.companyId, from, to));
});
