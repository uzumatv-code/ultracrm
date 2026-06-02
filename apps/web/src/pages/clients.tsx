import { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";

type Client = { id: string; name: string; phone: string; email?: string; origin?: string };

export function ClientsPage() {
  const queryClient = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["clients"], queryFn: () => api<Client[]>("/crm/clients") });
  const create = useMutation({
    mutationFn: (body: Record<string, FormDataEntryValue>) => api("/crm/clients", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients"] })
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    create.mutate(Object.fromEntries(new FormData(event.currentTarget).entries()));
    event.currentTarget.reset();
  }

  return (
    <section className="pb-20">
      <h1 className="mb-6 text-2xl font-semibold">Clientes</h1>
      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <Card className="p-5">
          <form className="space-y-3" onSubmit={submit}>
            <Input name="name" placeholder="Nome" required />
            <Input name="phone" placeholder="WhatsApp" required />
            <Input name="email" placeholder="Email" />
            <Input name="document" placeholder="CPF/CNPJ" />
            <Input name="origin" placeholder="Origem" />
            <Button className="w-full">Salvar</Button>
          </form>
        </Card>
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          {data.map((client) => (
            <div key={client.id} className="grid gap-2 border-b border-zinc-100 px-4 py-3 sm:grid-cols-4">
              <strong className="text-sm">{client.name}</strong>
              <span className="text-sm text-zinc-500">{client.phone}</span>
              <span className="text-sm text-zinc-500">{client.email}</span>
              <span className="text-sm text-zinc-500">{client.origin}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
