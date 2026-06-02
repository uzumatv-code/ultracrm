import { prisma } from "../../database/prisma.js";
import type { CreateClientInput, CreateTaskInput } from "@ultracrm/shared";

export class CrmService {
  listClients(companyId: string) {
    return prisma.client.findMany({
      where: { companyId },
      include: { tags: { include: { tag: true } } },
      orderBy: { updatedAt: "desc" }
    });
  }

  createClient(companyId: string, input: CreateClientInput) {
    return prisma.client.create({
      data: {
        companyId,
        name: input.name,
        phone: input.phone,
        email: input.email || null,
        document: input.document,
        address: input.address,
        notes: input.notes,
        origin: input.origin
      }
    });
  }

  async upsertClientFromPhone(companyId: string, phone: string, name?: string) {
    return prisma.client.upsert({
      where: { companyId_phone: { companyId, phone } },
      create: { companyId, phone, name: name || phone, origin: "whatsapp" },
      update: { name: name || undefined }
    });
  }

  listFunnels(companyId: string) {
    return prisma.funnel.findMany({
      where: { companyId },
      include: { stages: { orderBy: { position: "asc" }, include: { leads: { include: { client: true } } } } }
    });
  }

  moveLead(companyId: string, leadId: string, stageId: string) {
    return prisma.lead.update({
      where: { id: leadId, companyId },
      data: { stageId }
    });
  }

  createTask(companyId: string, input: CreateTaskInput, createdByAi = false) {
    return prisma.task.create({
      data: {
        companyId,
        clientId: input.clientId,
        title: input.title,
        description: input.description,
        dueAt: input.dueAt ? new Date(input.dueAt) : undefined,
        createdByAi
      }
    });
  }

  async dashboard(companyId: string, from: Date, to: Date) {
    const [newLeads, conversations, activeClients, wonLeads, totalLeads, sales, inboundMessages, outboundMessages] =
      await Promise.all([
        prisma.lead.count({ where: { companyId, createdAt: { gte: from, lte: to } } }),
        prisma.conversation.count({ where: { companyId, createdAt: { gte: from, lte: to } } }),
        prisma.client.count({ where: { companyId, updatedAt: { gte: from, lte: to } } }),
        prisma.lead.count({ where: { companyId, status: "WON", updatedAt: { gte: from, lte: to } } }),
        prisma.lead.count({ where: { companyId, createdAt: { gte: from, lte: to } } }),
        prisma.payment.aggregate({ where: { companyId, status: "PAID", paidAt: { gte: from, lte: to } }, _sum: { amountCents: true } }),
        prisma.message.count({ where: { companyId, direction: "INBOUND", createdAt: { gte: from, lte: to } } }),
        prisma.message.count({ where: { companyId, direction: "OUTBOUND", createdAt: { gte: from, lte: to } } })
      ]);

    return {
      newLeads,
      conversations,
      activeClients,
      conversionRate: totalLeads === 0 ? 0 : Math.round((wonLeads / totalLeads) * 100),
      salesCents: sales._sum.amountCents ?? 0,
      supportTickets: 0,
      inboundMessages,
      outboundMessages
    };
  }
}
