import { useQuery } from "@tanstack/react-query";
import { Activity, Banknote, MessageCircle, TrendingUp, UserPlus, Users } from "lucide-react";
import type { DashboardMetrics } from "@ultracrm/shared";
import { api } from "../lib/api";
import { money } from "../lib/utils";
import { Card } from "../components/ui/card";

export function DashboardPage() {
  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api<DashboardMetrics>("/crm/dashboard")
  });

  const metrics = [
    { label: "Novos leads", value: data?.newLeads ?? 0, icon: UserPlus },
    { label: "Conversas", value: data?.conversations ?? 0, icon: MessageCircle },
    { label: "Clientes ativos", value: data?.activeClients ?? 0, icon: Users },
    { label: "Conversao", value: `${data?.conversionRate ?? 0}%`, icon: TrendingUp },
    { label: "Vendas", value: money(data?.salesCents ?? 0), icon: Banknote },
    { label: "Mensagens", value: `${data?.inboundMessages ?? 0}/${data?.outboundMessages ?? 0}`, icon: Activity }
  ];

  return (
    <section className="pb-20">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Dashboard</h1>
          <p className="text-sm text-zinc-500">Operacao comercial, suporte e automacao em tempo real.</p>
        </div>
        <select className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm">
          <option>Ultimos 30 dias</option>
          <option>Hoje</option>
          <option>Este mes</option>
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.label} className="p-5">
            <div className="mb-5 flex items-center justify-between">
              <span className="text-sm text-zinc-500">{metric.label}</span>
              <metric.icon size={18} className="text-zinc-500" />
            </div>
            <p className="text-3xl font-semibold">{metric.value}</p>
          </Card>
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <Card className="p-5">
          <h2 className="mb-4 text-base font-semibold">Atendimento IA</h2>
          <div className="grid gap-3">
            {["Supervisor", "Vendas", "Suporte", "Financeiro", "Agendamento", "Ordens de Servico"].map((agent) => (
              <div key={agent} className="flex items-center justify-between rounded-md bg-zinc-50 px-4 py-3">
                <span className="text-sm">{agent}</span>
                <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-700">ativo</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="mb-4 text-base font-semibold">SLA WhatsApp</h2>
          <p className="text-4xl font-semibold">94%</p>
          <p className="mt-2 text-sm text-zinc-500">Conversas respondidas sem intervencao humana.</p>
        </Card>
      </div>
    </section>
  );
}
