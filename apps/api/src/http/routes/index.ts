import { Router } from "express";
import { authRoutes } from "./auth.routes.js";
import { crmRoutes } from "./crm.routes.js";
import { whatsappRoutes } from "./whatsapp.routes.js";
import { ragRoutes } from "./rag.routes.js";
import { reportRoutes } from "./report.routes.js";

export const routes = Router();

routes.get("/health", (_req, res) => res.json({ status: "ok", service: "ultracrm-api" }));
routes.use("/auth", authRoutes);
routes.use("/crm", crmRoutes);
routes.use("/whatsapp", whatsappRoutes);
routes.use("/rag", ragRoutes);
routes.use("/reports", reportRoutes);
