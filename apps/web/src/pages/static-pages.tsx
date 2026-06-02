import { Card } from "../components/ui/card";

export function ConversationsPage() {
  return <Module title="Conversas" items={["Fila WhatsApp", "Aguardando humano", "Resolvidas", "Auditoria de mensagens"]} />;
}

export function AgentsPage() {
  return <Module title="Agentes IA" items={["Supervisor", "Vendas", "Suporte", "Financeiro", "Agendamento", "Ordens de Servico"]} />;
}

export function SettingsPage() {
  return <Module title="Ajustes" items={["Empresa", "Usuarios e RBAC", "Evolution API", "OpenAI", "Qdrant", "Railway"]} />;
}

function Module({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="pb-20">
      <h1 className="mb-6 text-2xl font-semibold">{title}</h1>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <Card key={item} className="p-5">
            <h2 className="text-base font-semibold">{item}</h2>
            <p className="mt-2 text-sm text-zinc-500">Modulo preparado para operacao multi-tenant e trilha de auditoria.</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
