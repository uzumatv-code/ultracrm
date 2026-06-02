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
import { AgentsPage, ConversationsPage, SettingsPage } from "./pages/static-pages";
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
      { path: "base", element: <KnowledgePage /> },
      { path: "ia", element: <AgentsPage /> },
      { path: "configuracoes", element: <SettingsPage /> }
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
