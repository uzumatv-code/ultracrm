import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Card } from "../components/ui/card";
import { money } from "../lib/utils";

type Funnel = {
  id: string;
  name: string;
  stages: { id: string; name: string; leads: { id: string; title: string; valueCents: number; client: { name: string } }[] }[];
};

export function FunnelPage() {
  const { data = [] } = useQuery({ queryKey: ["funnels"], queryFn: () => api<Funnel[]>("/crm/funnels") });
  const funnel = data[0];
  return (
    <section className="pb-20">
      <h1 className="mb-6 text-2xl font-semibold">Funil</h1>
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
