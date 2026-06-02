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
  dueAt: z.string().datetime().optional()
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
