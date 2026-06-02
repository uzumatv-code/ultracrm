import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bot } from "lucide-react";
import { api, setSession } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";

export function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const body = Object.fromEntries(data.entries());
    const session = await api<{ accessToken: string; refreshToken: string }>(
      mode === "login" ? "/auth/login" : "/auth/register",
      { method: "POST", body: JSON.stringify(body) }
    );
    setSession(session);
    navigate("/");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-zinc-50 px-4">
      <Card className="w-full max-w-md p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-lg bg-zinc-950 text-white">
            <Bot size={22} />
          </div>
          <div>
            <h1 className="text-xl font-semibold">UltraCRM AI</h1>
            <p className="text-sm text-zinc-500">Acesse seu CRM conversacional</p>
          </div>
        </div>
        <form className="space-y-3" onSubmit={submit}>
          {mode === "register" && (
            <>
              <Input name="companyName" placeholder="Empresa" required />
              <Input name="slug" placeholder="slug-da-empresa" required />
              <Input name="name" placeholder="Seu nome" required />
            </>
          )}
          <Input name="email" type="email" placeholder="Email" defaultValue="admin@ultracrm.local" required />
          <Input name="password" type="password" placeholder="Senha" defaultValue="UltraCRM@123" required />
          <Button className="w-full" type="submit">{mode === "login" ? "Entrar" : "Criar empresa"}</Button>
        </form>
        <button className="mt-4 text-sm text-zinc-500" onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? "Criar nova empresa" : "Ja tenho conta"}
        </button>
      </Card>
    </main>
  );
}
