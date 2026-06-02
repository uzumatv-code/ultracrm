import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../database/prisma.js";
import { requireAuth, requirePermission } from "../middlewares/auth.js";
import { validateBody } from "../middlewares/validate.js";
import { EvolutionService } from "../../modules/whatsapp/evolution.service.js";
import { WhatsAppWebhookService } from "../../modules/whatsapp/webhook.service.js";

export const whatsappRoutes = Router();
const evolution = new EvolutionService();
const webhookService = new WhatsAppWebhookService();

const createInstanceSchema = z.object({ name: z.string().min(2) });
const sendTextSchema = z.object({ instanceKey: z.string(), number: z.string(), text: z.string().min(1) });

whatsappRoutes.post("/webhook/evolution", async (req, res) => {
  res.json(await webhookService.handle(req.body));
});

whatsappRoutes.use(requireAuth);

whatsappRoutes.get("/instances", requirePermission("whatsapp:manage"), async (req, res) => {
  res.json(await prisma.whatsAppInstance.findMany({ where: { companyId: req.auth!.companyId } }));
});

whatsappRoutes.post("/instances", requirePermission("whatsapp:manage"), validateBody(createInstanceSchema), async (req, res) => {
  const instanceKey = `${req.auth!.companyId}-${req.body.name}`.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const remote = await evolution.createInstance(instanceKey);
  const instance = await prisma.whatsAppInstance.create({
    data: {
      companyId: req.auth!.companyId,
      name: req.body.name,
      instanceKey,
      qrCode: remote.qrcode?.base64 ?? remote.qr ?? null,
      status: "CONNECTING"
    }
  });
  res.status(201).json(instance);
});

whatsappRoutes.get("/instances/:instanceKey/status", requirePermission("whatsapp:manage"), async (req, res) => {
  res.json(await evolution.connectionState(req.params.instanceKey));
});

whatsappRoutes.post("/send/text", requirePermission("whatsapp:manage"), validateBody(sendTextSchema), async (req, res) => {
  const instance = await prisma.whatsAppInstance.findFirst({
    where: { companyId: req.auth!.companyId, instanceKey: req.body.instanceKey }
  });
  if (!instance) return res.status(404).json({ code: "INSTANCE_NOT_FOUND" });
  res.json(await evolution.sendText(req.body.instanceKey, req.body.number, req.body.text));
});
