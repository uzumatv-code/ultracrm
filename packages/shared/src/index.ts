import { z } from "zod";

export const phoneSchema = z.string().min(8).max(32).regex(/^[0-9+()\-\s]+$/);

export const createClientSchema = z.object({
  name: z.string().min(2),
  phone: phoneSchema,
  email: z.string().email().optional().or(z.literal("")),
  document: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  origin: z.string().optional()
});

export const createTaskSchema = z.object({
  clientId: z.string().optional(),
  title: z.string().min(3),
  description: z.string().optional(),
  dueAt: z.string().min(1).optional()
});

export const createProductSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  priceCents: z.coerce.number().int().min(0),
  active: z.coerce.boolean().default(true)
});

export const createServiceSchema = createProductSchema.extend({
  priceCents: z.coerce.number().int().min(0).optional()
});

export const createLeadSchema = z.object({
  clientId: z.string().min(1),
  funnelId: z.string().min(1),
  stageId: z.string().min(1),
  title: z.string().min(2),
  valueCents: z.coerce.number().int().min(0).default(0),
  interest: z.string().optional()
});

export const createPaymentSchema = z.object({
  clientId: z.string().min(1),
  amountCents: z.coerce.number().int().min(1),
  pixCode: z.string().optional(),
  dueAt: z.string().min(1).optional()
});

export const updatePaymentSchema = z.object({
  status: z.enum(["PENDING", "PAID", "OVERDUE", "CANCELED"]),
  paidAt: z.string().datetime().optional()
});

export const createServiceOrderSchema = z.object({
  clientId: z.string().min(1),
  title: z.string().min(2),
  description: z.string().min(2),
  quoteCents: z.coerce.number().int().min(0).optional()
});

export const createAppointmentSchema = z.object({
  clientId: z.string().min(1),
  userId: z.string().optional(),
  title: z.string().min(2),
  notes: z.string().optional(),
  startsAt: z.string().min(1),
  endsAt: z.string().min(1).optional()
});

export const createNoteSchema = z.object({
  clientId: z.string().min(1),
  body: z.string().min(1)
});

export const createTagSchema = z.object({
  name: z.string().min(2),
  color: z.string().min(3).default("#2563eb")
});

export const createManualMessageSchema = z.object({
  conversationId: z.string().min(1),
  body: z.string().min(1),
  instanceKey: z.string().optional(),
  number: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const registerCompanySchema = z.object({
  companyName: z.string().min(2),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/),
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8)
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type CreateServiceOrderInput = z.infer<typeof createServiceOrderSchema>;
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterCompanyInput = z.infer<typeof registerCompanySchema>;

export type DashboardMetrics = {
  newLeads: number;
  conversations: number;
  activeClients: number;
  conversionRate: number;
  salesCents: number;
  supportTickets: number;
  inboundMessages: number;
  outboundMessages: number;
};
