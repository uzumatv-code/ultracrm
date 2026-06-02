import { NavLink, Outlet } from "react-router-dom";
import { BarChart3, Bot, Contact, KanbanSquare, MessageCircle, Settings, UploadCloud } from "lucide-react";
import { cn } from "../../lib/utils";

const items = [
  { to: "/", label: "Dashboard", icon: BarChart3 },
  { to: "/conversas", label: "Conversas", icon: MessageCircle },
  { to: "/clientes", label: "Clientes", icon: Contact },
  { to: "/funil", label: "Funil", icon: KanbanSquare },
  { to: "/base", label: "Base RAG", icon: UploadCloud },
  { to: "/ia", label: "Agentes", icon: Bot },
  { to: "/configuracoes", label: "Ajustes", icon: Settings }
];

export function AppShell() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-zinc-200 bg-white/85 px-4 py-5 backdrop-blur xl:block dark:border-zinc-800 dark:bg-zinc-950/85">
        <div className="mb-8 px-2">
          <p className="text-lg font-semibold">UltraCRM AI</p>
          <p className="text-xs text-zinc-500">CRM conversacional</p>
        </div>
        <nav className="space-y-1">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex h-10 items-center gap-3 rounded-md px-3 text-sm text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900",
                  isActive && "bg-zinc-950 text-white hover:bg-zinc-950 dark:bg-white dark:text-zinc-950"
                )
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="xl:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
      <nav className="fixed inset-x-0 bottom-0 grid grid-cols-5 border-t border-zinc-200 bg-white xl:hidden dark:border-zinc-800 dark:bg-zinc-950">
        {items.slice(0, 5).map((item) => (
          <NavLink key={item.to} to={item.to} className="flex h-14 items-center justify-center">
            <item.icon size={20} />
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
