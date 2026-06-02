import { prisma } from "../../database/prisma.js";
import type {
  CreateAppointmentInput,
  CreateClientInput,
  CreateLeadInput,
  CreatePaymentInput,
  CreateProductInput,
  CreateServiceInput,
  CreateServiceOrderInput,
  CreateTaskInput
} from "@ultracrm/shared";

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

  updateClient(companyId: string, clientId: string, input: Partial<CreateClientInput>) {
    return prisma.client.update({
      where: { id: clientId, companyId },
      data: {
        name: input.name,
        phone: input.phone,
        email: input.email || undefined,
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

  async createLead(companyId: string, input: CreateLeadInput) {
    await this.assertClient(companyId, input.clientId);
    return prisma.lead.create({
      data: {
        companyId,
        clientId: input.clientId,
        funnelId: input.funnelId,
        stageId: input.stageId,
        title: input.title,
        valueCents: input.valueCents,
        interest: input.interest
      },
      include: { client: true, stage: true }
    });
  }

  updateLeadStatus(companyId: string, leadId: string, status: "OPEN" | "WON" | "LOST") {
    return prisma.lead.update({ where: { id: leadId, companyId }, data: { status } });
  }

  listTasks(companyId: string) {
    return prisma.task.findMany({
      where: { companyId },
      include: { client: true, user: true },
      orderBy: [{ status: "asc" }, { dueAt: "asc" }]
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

  updateTaskStatus(companyId: string, taskId: string, status: "OPEN" | "DONE" | "CANCELED") {
    return prisma.task.update({ where: { id: taskId, companyId }, data: { status } });
  }

  listProducts(companyId: string) {
    return prisma.product.findMany({ where: { companyId }, orderBy: { createdAt: "desc" } });
  }

  createProduct(companyId: string, input: CreateProductInput) {
    return prisma.product.create({ data: { companyId, ...input } });
  }

  listServices(companyId: string) {
    return prisma.service.findMany({ where: { companyId }, orderBy: { createdAt: "desc" } });
  }

  createService(companyId: string, input: CreateServiceInput) {
    return prisma.service.create({ data: { companyId, ...input } });
  }

  listPayments(companyId: string) {
    return prisma.payment.findMany({
      where: { companyId },
      include: { client: true },
      orderBy: { createdAt: "desc" }
    });
  }

  async createPayment(companyId: string, input: CreatePaymentInput) {
    await this.assertClient(companyId, input.clientId);
    return prisma.payment.create({
      data: {
        companyId,
        clientId: input.clientId,
        amountCents: input.amountCents,
        pixCode: input.pixCode,
        dueAt: input.dueAt ? new Date(input.dueAt) : undefined
      },
      include: { client: true }
    });
  }

  updatePayment(companyId: string, paymentId: string, status: "PENDING" | "PAID" | "OVERDUE" | "CANCELED", paidAt?: string) {
    return prisma.payment.update({
      where: { id: paymentId, companyId },
      data: { status, paidAt: status === "PAID" ? (paidAt ? new Date(paidAt) : new Date()) : null }
    });
  }

  listOrders(companyId: string) {
    return prisma.serviceOrder.findMany({
      where: { companyId },
      include: { client: true },
      orderBy: { createdAt: "desc" }
    });
  }

  async createOrder(companyId: string, input: CreateServiceOrderInput) {
    await this.assertClient(companyId, input.clientId);
    return prisma.serviceOrder.create({ data: { companyId, ...input }, include: { client: true } });
  }

  updateOrderStatus(
    companyId: string,
    orderId: string,
    status: "OPEN" | "QUOTED" | "APPROVED" | "IN_PROGRESS" | "DONE" | "CANCELED"
  ) {
    return prisma.serviceOrder.update({
      where: { id: orderId, companyId },
      data: { status, approvedAt: status === "APPROVED" ? new Date() : undefined }
    });
  }

  listAppointments(companyId: string, from?: Date, to?: Date) {
    return prisma.appointment.findMany({
      where: { companyId, startsAt: from || to ? { gte: from, lte: to } : undefined },
      include: { client: true, user: true },
      orderBy: { startsAt: "asc" }
    });
  }

  async createAppointment(companyId: string, input: CreateAppointmentInput, createdByAi = false) {
    await this.assertClient(companyId, input.clientId);
    return prisma.appointment.create({
      data: {
        companyId,
        clientId: input.clientId,
        userId: input.userId,
        title: input.title,
        notes: input.notes,
        startsAt: new Date(input.startsAt),
        endsAt: input.endsAt ? new Date(input.endsAt) : undefined,
        createdByAi
      },
      include: { client: true, user: true }
    });
  }

  updateAppointmentStatus(companyId: string, appointmentId: string, status: "SCHEDULED" | "CONFIRMED" | "CANCELED" | "DONE" | "NO_SHOW") {
    return prisma.appointment.update({ where: { id: appointmentId, companyId }, data: { status } });
  }

  listConversations(companyId: string) {
    return prisma.conversation.findMany({
      where: { companyId },
      include: { client: true, messages: { orderBy: { createdAt: "asc" }, take: 80 } },
      orderBy: { lastMessageAt: "desc" }
    });
  }

  updateConversationStatus(companyId: string, conversationId: string, status: "OPEN" | "WAITING_HUMAN" | "RESOLVED" | "ARCHIVED") {
    return prisma.conversation.update({ where: { id: conversationId, companyId }, data: { status } });
  }

  addManualMessage(companyId: string, conversationId: string, body: string) {
    return prisma.message.create({
      data: { companyId, conversationId, direction: "OUTBOUND", type: "TEXT", body }
    });
  }

  listNotes(companyId: string, clientId?: string) {
    return prisma.note.findMany({
      where: { companyId, clientId },
      include: { client: true },
      orderBy: { createdAt: "desc" }
    });
  }

  async createNote(companyId: string, clientId: string, body: string) {
    await this.assertClient(companyId, clientId);
    return prisma.note.create({ data: { companyId, clientId, body }, include: { client: true } });
  }

  listTags(companyId: string) {
    return prisma.tag.findMany({ where: { companyId }, orderBy: { name: "asc" } });
  }

  createTag(companyId: string, name: string, color: string) {
    return prisma.tag.create({ data: { companyId, name, color } });
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

  private async assertClient(companyId: string, clientId: string) {
    await prisma.client.findFirstOrThrow({ where: { id: clientId, companyId } });
  }
}
