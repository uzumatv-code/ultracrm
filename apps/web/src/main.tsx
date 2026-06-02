import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Navigate, RouterProvider, createBrowserRouter } from "react-router-dom";
import { AppShell } from "./components/layout/app-shell";
import { getSession } from "./lib/api";
import { LoginPage } from "./pages/login";
import { DashboardPage } from "./pages/dashboard";
import { ClientsPage } from "./pages/clients";
import { FunnelPage } from "./pages/funnel";
import { KnowledgePage } from "./pages/knowledge";
import {
  AdminPage,
  AppointmentsPage,
  CatalogPage,
  ConversationsPage,
  FinancePage,
  OrdersPage,
  ReportsPage,
  TasksPage,
  WhatsAppPage
} from "./pages/operations";
import "./index.css";

const queryClient = new QueryClient();

function Protected() {
  return getSession() ? <AppShell /> : <Navigate to="/login" replace />;
}

const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: <Protected />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "conversas", element: <ConversationsPage /> },
      { path: "clientes", element: <ClientsPage /> },
      { path: "funil", element: <FunnelPage /> },
      { path: "tarefas", element: <TasksPage /> },
      { path: "catalogo", element: <CatalogPage /> },
      { path: "financeiro", element: <FinancePage /> },
      { path: "agenda", element: <AppointmentsPage /> },
      { path: "os", element: <OrdersPage /> },
      { path: "whatsapp", element: <WhatsAppPage /> },
      { path: "base", element: <KnowledgePage /> },
      { path: "relatorios", element: <ReportsPage /> },
      { path: "configuracoes", element: <AdminPage /> }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  });
}
