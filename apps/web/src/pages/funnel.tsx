import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent } from "react";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { money } from "../lib/utils";

type Funnel = {
  id: string;
  name: string;
  stages: { id: string; name: string; leads: { id: string; title: string; valueCents: number; client: { name: string } }[] }[];
};

export function FunnelPage() {
  const { data = [] } = useQuery({ queryKey: ["funnels"], queryFn: () => api<Funnel[]>("/crm/funnels") });
  const queryClient = useQueryClient();
  const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: () => api<{ id: string; name: string }[]>("/crm/clients") });
  const funnel = data[0];
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!funnel?.stages[0]) return;
    const body = Object.fromEntries(new FormData(event.currentTarget).entries());
    await api("/crm/leads", {
      method: "POST",
      body: JSON.stringify({ ...body, funnelId: funnel.id, stageId: funnel.stages[0].id, valueCents: Number(body.valueCents || 0) })
    });
    event.currentTarget.reset();
    queryClient.invalidateQueries({ queryKey: ["funnels"] });
  }
  return (
    <section className="pb-20">
      <h1 className="mb-6 text-2xl font-semibold">Funil</h1>
      <Card className="mb-5 p-4">
        <form className="grid gap-3 md:grid-cols-5" onSubmit={submit}>
          <select name="clientId" className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm" required>
            <option value="">Cliente</option>
            {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
          </select>
          <Input name="title" placeholder="Titulo do lead" />
          <Input name="interest" placeholder="Interesse" />
          <Input name="valueCents" type="number" placeholder="Valor em centavos" />
          <Button>Criar lead</Button>
        </form>
      </Card>
      <div className="grid min-h-[70vh] gap-3 overflow-x-auto lg:grid-cols-7">
        {funnel?.stages.map((stage) => (
          <div key={stage.id} className="min-w-64">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">{stage.name}</h2>
              <span className="text-xs text-zinc-500">{stage.leads.length}</span>
            </div>
            <div className="space-y-3">
              {stage.leads.map((lead) => (
                <Card key={lead.id} className="p-4">
                  <p className="text-sm font-medium">{lead.title}</p>
                  <p className="mt-1 text-xs text-zinc-500">{lead.client.name}</p>
                  <p className="mt-3 text-sm font-semibold">{money(lead.valueCents)}</p>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
