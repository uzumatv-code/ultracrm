import { Router } from "express";
import { loginSchema, registerCompanySchema } from "@ultracrm/shared";
import { validateBody } from "../middlewares/validate.js";
import { AuthService } from "../../modules/auth/auth.service.js";

export const authRoutes = Router();
const service = new AuthService();

authRoutes.post("/register", validateBody(registerCompanySchema), async (req, res) => {
  res.status(201).json(await service.register(req.body));
});

authRoutes.post("/login", validateBody(loginSchema), async (req, res) => {
  res.json(await service.login(req.body));
});
