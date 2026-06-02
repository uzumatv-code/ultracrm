import { FormEvent, ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { money } from "../lib/utils";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";

type Client = { id: string; name: string; phone: string };
type Conversation = { id: string; status: string; client: Client; messages: { id: string; direction: string; body?: string; createdAt: string }[] };
type Product = { id: string; name: string; description?: string; priceCents?: number; active: boolean };
type Task = { id: string; title: string; status: string; dueAt?: string; client?: Client; createdByAi: boolean };
type Payment = { id: string; amountCents: number; status: string; pixCode?: string; dueAt?: string; client: Client };
type Order = { id: string; title: string; description: string; status: string; quoteCents?: number; client: Client };
type Appointment = { id: string; title: string; status: string; startsAt: string; client: Client };
type Role = { id: string; name: string };
type User = { id: string; name: string; email: string; status: string; role?: Role };

function useCreate(path: string, key: string[]) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, FormDataEntryValue>) => api(path, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key })
  });
}

function postForm(event: FormEvent<HTMLFormElement>, mutate: (body: Record<string, FormDataEntryValue>) => void) {
  event.preventDefault();
  const body = Object.fromEntries(new FormData(event.currentTarget).entries());
  mutate(body);
  event.currentTarget.reset();
}

function Page({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="pb-20">
      <h1 className="mb-6 text-2xl font-semibold">{title}</h1>
      {children}
    </section>
  );
}

function ClientSelect() {
  const { data = [] } = useQuery({ queryKey: ["clients"], queryFn: () => api<Client[]>("/crm/clients") });
  return (
    <select name="clientId" className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm" required>
      <option value="">Cliente</option>
      {data.map((client) => (
        <option key={client.id} value={client.id}>{client.name}</option>
      ))}
    </select>
  );
}

export function ConversationsPage() {
  const queryClient = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["conversations"], queryFn: () => api<Conversation[]>("/crm/conversations") });
  const send = useCreate("/crm/messages", ["conversations"]);
  const status = useMutation({
    mutationFn: ({ id, value }: { id: string; value: string }) => api(`/crm/conversations/${id}/status`, { method: "PATCH", body: JSON.stringify({ status: value }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["conversations"] })
  });
  return (
    <Page title="Conversas">
      <div className="grid gap-4 lg:grid-cols-2">
        {data.map((conversation) => (
          <Card key={conversation.id} className="p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">{conversation.client.name}</h2>
                <p className="text-sm text-zinc-500">{conversation.client.phone}</p>
              </div>
              <select className="h-9 rounded-md border px-2 text-sm" value={conversation.status} onChange={(event) => status.mutate({ id: conversation.id, value: event.target.value })}>
                {["OPEN", "WAITING_HUMAN", "RESOLVED", "ARCHIVED"].map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>
            <div className="mb-4 max-h-56 space-y-2 overflow-auto rounded-md bg-zinc-50 p-3">
              {conversation.messages.map((message) => (
                <p key={message.id} className={message.direction === "OUTBOUND" ? "text-right text-sm" : "text-sm"}>
                  <span className="inline-block rounded-md bg-white px-3 py-2 shadow-sm">{message.body}</span>
                </p>
              ))}
            </div>
            <form className="flex gap-2" onSubmit={(event) => postForm(event, (body) => send.mutate({ ...body, conversationId: conversation.id }))}>
              <Input name="body" placeholder="Responder" />
              <Button>Enviar</Button>
            </form>
          </Card>
        ))}
      </div>
    </Page>
  );
}

export function TasksPage() {
  const { data = [] } = useQuery({ queryKey: ["tasks"], queryFn: () => api<Task[]>("/crm/tasks") });
  const create = useCreate("/crm/tasks", ["tasks"]);
  return (
    <Page title="Tarefas">
      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <Card className="p-5"><form className="space-y-3" onSubmit={(e) => postForm(e, create.mutate)}><ClientSelect /><Input name="title" placeholder="Titulo" /><Input name="description" placeholder="Descricao" /><Input name="dueAt" type="datetime-local" /><Button className="w-full">Criar</Button></form></Card>
        <div className="grid gap-3">{data.map((task) => <Card key={task.id} className="p-4"><strong>{task.title}</strong><p className="text-sm text-zinc-500">{task.client?.name} · {task.status} {task.createdByAi ? "· IA" : ""}</p></Card>)}</div>
      </div>
    </Page>
  );
}

export function CatalogPage() {
  const { data: products = [] } = useQuery({ queryKey: ["products"], queryFn: () => api<Product[]>("/crm/products") });
  const { data: services = [] } = useQuery({ queryKey: ["services"], queryFn: () => api<Product[]>("/crm/services") });
  const createProduct = useCreate("/crm/products", ["products"]);
  const createService = useCreate("/crm/services", ["services"]);
  return (
    <Page title="Produtos e Servicos">
      <div className="grid gap-4 lg:grid-cols-2">
        <CatalogBlock title="Produtos" items={products} onSubmit={createProduct.mutate} />
        <CatalogBlock title="Servicos" items={services} onSubmit={createService.mutate} />
      </div>
    </Page>
  );
}

function CatalogBlock({ title, items, onSubmit }: { title: string; items: Product[]; onSubmit: (body: Record<string, FormDataEntryValue>) => void }) {
  return <Card className="p-5"><h2 className="mb-4 font-semibold">{title}</h2><form className="mb-5 grid gap-3" onSubmit={(e) => postForm(e, onSubmit)}><Input name="name" placeholder="Nome" /><Input name="description" placeholder="Descricao" /><Input name="priceCents" type="number" placeholder="Preco em centavos" /><Button>Salvar</Button></form><div className="space-y-2">{items.map((item) => <div key={item.id} className="rounded-md bg-zinc-50 px-3 py-2"><strong className="text-sm">{item.name}</strong><p className="text-sm text-zinc-500">{money(item.priceCents ?? 0)}</p></div>)}</div></Card>;
}

export function FinancePage() {
  const { data = [] } = useQuery({ queryKey: ["payments"], queryFn: () => api<Payment[]>("/crm/payments") });
  const create = useCreate("/crm/payments", ["payments"]);
  return (
    <Page title="Financeiro">
      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <Card className="p-5"><form className="space-y-3" onSubmit={(e) => postForm(e, create.mutate)}><ClientSelect /><Input name="amountCents" type="number" placeholder="Valor em centavos" /><Input name="pixCode" placeholder="Codigo PIX" /><Input name="dueAt" type="datetime-local" /><Button className="w-full">Criar cobranca</Button></form></Card>
        <div className="grid gap-3">{data.map((payment) => <Card key={payment.id} className="p-4"><strong>{payment.client.name}</strong><p className="text-sm text-zinc-500">{money(payment.amountCents)} · {payment.status}</p></Card>)}</div>
      </div>
    </Page>
  );
}

export function OrdersPage() {
  const { data = [] } = useQuery({ queryKey: ["orders"], queryFn: () => api<Order[]>("/crm/orders") });
  const create = useCreate("/crm/orders", ["orders"]);
  return (
    <Page title="Ordens de Servico">
      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <Card className="p-5"><form className="space-y-3" onSubmit={(e) => postForm(e, create.mutate)}><ClientSelect /><Input name="title" placeholder="Titulo" /><Input name="description" placeholder="Descricao" /><Input name="quoteCents" type="number" placeholder="Orcamento em centavos" /><Button className="w-full">Abrir OS</Button></form></Card>
        <div className="grid gap-3">{data.map((order) => <Card key={order.id} className="p-4"><strong>{order.title}</strong><p className="text-sm text-zinc-500">{order.client.name} · {order.status} · {money(order.quoteCents ?? 0)}</p></Card>)}</div>
      </div>
    </Page>
  );
}

export function AppointmentsPage() {
  const { data = [] } = useQuery({ queryKey: ["appointments"], queryFn: () => api<Appointment[]>("/crm/appointments") });
  const create = useCreate("/crm/appointments", ["appointments"]);
  return (
    <Page title="Agenda">
      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <Card className="p-5"><form className="space-y-3" onSubmit={(e) => postForm(e, create.mutate)}><ClientSelect /><Input name="title" placeholder="Titulo" /><Input name="startsAt" type="datetime-local" /><Input name="endsAt" type="datetime-local" /><Input name="notes" placeholder="Notas" /><Button className="w-full">Agendar</Button></form></Card>
        <div className="grid gap-3">{data.map((appointment) => <Card key={appointment.id} className="p-4"><strong>{appointment.title}</strong><p className="text-sm text-zinc-500">{appointment.client.name} · {new Date(appointment.startsAt).toLocaleString("pt-BR")} · {appointment.status}</p></Card>)}</div>
      </div>
    </Page>
  );
}

export function WhatsAppPage() {
  const { data = [] } = useQuery({ queryKey: ["wa-instances"], queryFn: () => api<{ id: string; name: string; instanceKey: string; status: string; qrCode?: string }[]>("/whatsapp/instances") });
  const create = useCreate("/whatsapp/instances", ["wa-instances"]);
  return <Page title="WhatsApp"><div className="grid gap-4 lg:grid-cols-[360px_1fr]"><Card className="p-5"><form className="space-y-3" onSubmit={(e) => postForm(e, create.mutate)}><Input name="name" placeholder="Nome da instancia" /><Button className="w-full">Conectar</Button></form></Card><div className="grid gap-3">{data.map((item) => <Card key={item.id} className="p-4"><strong>{item.name}</strong><p className="text-sm text-zinc-500">{item.instanceKey} · {item.status}</p>{item.qrCode && <img className="mt-3 max-w-48 rounded-md border" src={item.qrCode.startsWith("data:") ? item.qrCode : `data:image/png;base64,${item.qrCode}`} />}</Card>)}</div></div></Page>;
}

export function ReportsPage() {
  const { data: conversion } = useQuery({ queryKey: ["conversion"], queryFn: () => api<{ won: number; lost: number; open: number; conversionRate: number }>("/reports/conversion") });
  const { data: attendance } = useQuery({ queryKey: ["attendance"], queryFn: () => api<Record<string, number>>("/reports/attendance") });
  return <Page title="Relatorios"><div className="grid gap-4 md:grid-cols-2"><Card className="p-5"><h2 className="font-semibold">Conversao</h2><p className="mt-4 text-4xl font-semibold">{conversion?.conversionRate ?? 0}%</p><p className="text-sm text-zinc-500">Abertos {conversion?.open ?? 0} · Ganhos {conversion?.won ?? 0} · Perdidos {conversion?.lost ?? 0}</p></Card><Card className="p-5"><h2 className="font-semibold">Atendimento</h2><p className="mt-4 text-sm text-zinc-500">Abertas {attendance?.open ?? 0} · Humano {attendance?.waitingHuman ?? 0} · Resolvidas {attendance?.resolved ?? 0}</p><div className="mt-4 flex gap-2"><a className="rounded-md bg-zinc-950 px-4 py-2 text-sm text-white" href="/api/reports/sales.csv">Excel CSV</a><a className="rounded-md border px-4 py-2 text-sm" href="/api/reports/summary.pdf">PDF/HTML</a></div></Card></div></Page>;
}

export function AdminPage() {
  const { data: users = [] } = useQuery({ queryKey: ["users"], queryFn: () => api<User[]>("/admin/users") });
  const { data: roles = [] } = useQuery({ queryKey: ["roles"], queryFn: () => api<Role[]>("/admin/roles") });
  const create = useCreate("/admin/users", ["users"]);
  return <Page title="Admin"><div className="grid gap-4 lg:grid-cols-[360px_1fr]"><Card className="p-5"><form className="space-y-3" onSubmit={(e) => postForm(e, create.mutate)}><Input name="name" placeholder="Nome" /><Input name="email" type="email" placeholder="Email" /><Input name="password" type="password" placeholder="Senha" /><select name="roleId" className="h-10 w-full rounded-md border px-3 text-sm"><option value="">Perfil</option>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select><Button className="w-full">Criar usuario</Button></form></Card><div className="grid gap-3">{users.map((user) => <Card key={user.id} className="p-4"><strong>{user.name}</strong><p className="text-sm text-zinc-500">{user.email} · {user.status} · {user.role?.name}</p></Card>)}</div></div></Page>;
}
