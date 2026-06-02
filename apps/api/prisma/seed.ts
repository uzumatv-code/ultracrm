import bcrypt from "bcryptjs";
import { prisma } from "../src/database/prisma.js";
import { adminPermissions } from "../src/modules/auth/permissions.js";

async function main() {
  const passwordHash = await bcrypt.hash("UltraCRM@123", 12);
  const company = await prisma.company.upsert({
    where: { slug: "demo" },
    update: {},
    create: {
      name: "UltraCRM Demo",
      slug: "demo",
      aiPersona:
        "Voce e um assistente comercial e de suporte da UltraCRM Demo. Use somente dados da empresa e encaminhe para humano quando faltar contexto."
    }
  });

  const role = await prisma.role.upsert({
    where: { companyId_name: { companyId: company.id, name: "Administrador" } },
    update: { permissions: adminPermissions },
    create: { companyId: company.id, name: "Administrador", permissions: adminPermissions }
  });

  await prisma.user.upsert({
    where: { email: "admin@ultracrm.local" },
    update: {},
    create: {
      companyId: company.id,
      roleId: role.id,
      name: "Admin UltraCRM",
      email: "admin@ultracrm.local",
      passwordHash
    }
  });

  const funnel = await prisma.funnel.upsert({
    where: { companyId_name: { companyId: company.id, name: "Comercial" } },
    update: {},
    create: { companyId: company.id, name: "Comercial" }
  });

  const stages = ["Novo Lead", "Contato Feito", "Interessado", "Orcamento", "Negociacao", "Fechado", "Perdido"];
  for (const [index, name] of stages.entries()) {
    await prisma.funnelStage.upsert({
      where: { funnelId_position: { funnelId: funnel.id, position: index + 1 } },
      update: { name },
      create: { funnelId: funnel.id, name, position: index + 1, color: "#2563eb" }
    });
  }
}

main().finally(async () => prisma.$disconnect());
