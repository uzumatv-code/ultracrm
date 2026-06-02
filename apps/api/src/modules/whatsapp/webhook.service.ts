import { prisma } from "../../database/prisma.js";
import { CrmService } from "../crm/crm.service.js";
import { AiService } from "../ai/ai.service.js";
import { EvolutionService } from "./evolution.service.js";

type EvolutionWebhookPayload = {
  instance?: string;
  data?: {
    key?: { id?: string; remoteJid?: string; fromMe?: boolean };
    pushName?: string;
    message?: { conversation?: string; extendedTextMessage?: { text?: string } };
  };
};

export class WhatsAppWebhookService {
  constructor(
    private readonly crm = new CrmService(),
    private readonly ai = new AiService(),
    private readonly evolution = new EvolutionService()
  ) {}

  async handle(payload: EvolutionWebhookPayload) {
    const instanceKey = payload.instance;
    if (!instanceKey || payload.data?.key?.fromMe) return { ignored: true };

    const instance = await prisma.whatsAppInstance.findUnique({ where: { instanceKey } });
    if (!instance) return { ignored: true };

    const phone = this.normalizePhone(payload.data?.key?.remoteJid ?? "");
    const body = payload.data?.message?.conversation ?? payload.data?.message?.extendedTextMessage?.text ?? "";
    if (!phone || !body) return { ignored: true };

    const client = await this.crm.upsertClientFromPhone(instance.companyId, phone, payload.data?.pushName);
    const conversation = await prisma.conversation.upsert({
      where: { id: `${instance.companyId}:${client.id}` },
      create: {
        id: `${instance.companyId}:${client.id}`,
        companyId: instance.companyId,
        clientId: client.id,
        whatsappId: instance.id,
        lastMessageAt: new Date()
      },
      update: { status: "OPEN", lastMessageAt: new Date() }
    });

    await prisma.message.create({
      data: {
        companyId: instance.companyId,
        conversationId: conversation.id,
        externalId: payload.data?.key?.id,
        direction: "INBOUND",
        type: "TEXT",
        body,
        metadata: payload as object
      }
    });
    await prisma.auditLog.create({
      data: {
        companyId: instance.companyId,
        action: "WEBHOOK",
        entity: "Message",
        entityId: payload.data?.key?.id,
        metadata: { instanceKey, phone }
      }
    });

    const answer = await this.ai.answer(instance.companyId, client.id, body);
    await prisma.message.create({
      data: {
        companyId: instance.companyId,
        conversationId: conversation.id,
        direction: "OUTBOUND",
        type: "TEXT",
        body: answer.text,
        metadata: { intent: answer.intent, handoff: answer.handoff }
      }
    });

    if (answer.handoff) {
      await prisma.conversation.update({ where: { id: conversation.id }, data: { status: "WAITING_HUMAN" } });
    } else {
      await this.evolution.sendText(instance.instanceKey, phone, answer.text);
      await prisma.auditLog.create({
        data: {
          companyId: instance.companyId,
          action: "WHATSAPP_SEND",
          entity: "Conversation",
          entityId: conversation.id,
          metadata: { intent: answer.intent, phone }
        }
      });
    }

    return { ok: true };
  }

  private normalizePhone(remoteJid: string) {
    return remoteJid.replace("@s.whatsapp.net", "").replace(/\D/g, "");
  }
}
