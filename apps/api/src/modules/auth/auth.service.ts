import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { addDays } from "date-fns";
import { prisma } from "../../database/prisma.js";
import { AppError } from "../../http/errors.js";
import { env } from "../../config/env.js";
import { adminPermissions, type Permission } from "./permissions.js";
import type { LoginInput, RegisterCompanyInput } from "@ultracrm/shared";

type TokenPayload = {
  sub: string;
  companyId: string;
  permissions: Permission[];
};

export class AuthService {
  async register(input: RegisterCompanyInput) {
    const exists = await prisma.user.findUnique({ where: { email: input.email } });
    if (exists) throw new AppError("Email ja cadastrado.", 409, "EMAIL_EXISTS");

    const passwordHash = await bcrypt.hash(input.password, 12);
    const company = await prisma.company.create({
      data: {
        name: input.companyName,
        slug: input.slug,
        aiPersona:
          "Voce e o UltraCRM AI. Responda com clareza, use apenas dados autorizados da empresa e encaminhe para humano quando faltar contexto.",
        roles: {
          create: {
            name: "Administrador",
            permissions: adminPermissions
          }
        }
      },
      include: { roles: true }
    });

    const user = await prisma.user.create({
      data: {
        companyId: company.id,
        roleId: company.roles[0].id,
        name: input.name,
        email: input.email,
        passwordHash
      },
      include: { role: true }
    });

    await this.bootstrapCrm(company.id);
    return this.issueTokens(user.id, company.id, adminPermissions);
  }

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      include: { role: true }
    });
    if (!user || user.status !== "ACTIVE") throw new AppError("Credenciais invalidas.", 401, "INVALID_CREDENTIALS");

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) throw new AppError("Credenciais invalidas.", 401, "INVALID_CREDENTIALS");

    const permissions = (user.role?.permissions as Permission[] | undefined) ?? [];
    return this.issueTokens(user.id, user.companyId, permissions);
  }

  verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
  }

  private async issueTokens(userId: string, companyId: string, permissions: Permission[]) {
    const payload: TokenPayload = { sub: userId, companyId, permissions };
    const accessOptions: SignOptions = { expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"] };
    const refreshOptions: SignOptions = { expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"] };
    const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, accessOptions);
    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, refreshOptions);
    await prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: await bcrypt.hash(refreshToken, 12),
        expiresAt: addDays(new Date(), 30)
      }
    });
    return { accessToken, refreshToken };
  }

  private async bootstrapCrm(companyId: string) {
    const funnel = await prisma.funnel.create({
      data: {
        companyId,
        name: "Comercial",
        stages: {
          create: [
            { name: "Novo Lead", position: 1, color: "#38bdf8" },
            { name: "Contato Feito", position: 2, color: "#6366f1" },
            { name: "Interessado", position: 3, color: "#14b8a6" },
            { name: "Orcamento", position: 4, color: "#f59e0b" },
            { name: "Negociacao", position: 5, color: "#ec4899" },
            { name: "Fechado", position: 6, color: "#22c55e" },
            { name: "Perdido", position: 7, color: "#94a3b8" }
          ]
        }
      }
    });

    await prisma.tag.createMany({
      data: [
        { companyId, name: "VIP", color: "#0f766e" },
        { companyId, name: "Urgente", color: "#dc2626" },
        { companyId, name: `Funil ${funnel.name}`, color: "#2563eb" }
      ],
      skipDuplicates: true
    });
  }
}
