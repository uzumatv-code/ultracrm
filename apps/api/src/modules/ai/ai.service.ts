import OpenAI from "openai";
import { env } from "../../config/env.js";
import { prisma } from "../../database/prisma.js";
import { RagService } from "../rag/rag.service.js";

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY || "missing-key" });

export type AgentIntent = "venda" | "suporte" | "financeiro" | "agendamento" | "ordem_servico";

export class AiService {
  constructor(private readonly rag = new RagService()) {}

  async answer(companyId: string, clientId: string, userMessage: string) {
    const company = await prisma.company.findUniqueOrThrow({ where: { id: companyId } });
    const client = await prisma.client.findFirstOrThrow({ where: { id: clientId, companyId } });
    const context = env.OPENAI_API_KEY ? await this.rag.search(companyId, userMessage) : [];
    const intent = await this.classifyIntent(userMessage);

    if (context.length === 0 && (intent === "suporte" || intent === "venda")) {
      return {
        intent,
        text: "Vou encaminhar sua solicitacao para um atendente humano.",
        handoff: true
      };
    }

    const system = [
      company.aiPersona,
      "Voce e um agente supervisor de CRM conversacional.",
      "Escolha e aja como o agente correto: venda, suporte, financeiro, agendamento ou ordem de servico.",
      "Nunca invente fatos. Para perguntas de conhecimento, responda somente com base no contexto RAG.",
      "Quando faltar base para responder, diga: Vou encaminhar sua solicitacao para um atendente humano."
    ].join("\n");

    const text = env.OPENAI_API_KEY
      ? (
          await openai.chat.completions.create({
            model: env.OPENAI_CHAT_MODEL,
            temperature: 0.2,
            messages: [
              { role: "system", content: system },
              {
                role: "user",
                content: JSON.stringify({
                  intent,
                  client: { name: client.name, phone: client.phone },
                  message: userMessage,
                  rag: context
                })
              }
            ]
          })
        ).choices[0]?.message.content?.trim()
      : this.fallbackText(intent);

    await this.applyAgentActions(companyId, clientId, intent, userMessage);

    return {
      intent,
      text: text || "Vou encaminhar sua solicitacao para um atendente humano.",
      handoff: false
    };
  }

  private async classifyIntent(message: string): Promise<AgentIntent> {
    const lowered = message.toLowerCase();
    if (/(boleto|pix|pagamento|cobran|parcela|fatura)/.test(lowered)) return "financeiro";
    if (/(agenda|horario|marcar|remarcar|cancelar)/.test(lowered)) return "agendamento";
    if (/(ordem|os|servico|tecnico|reparo|manutencao)/.test(lowered)) return "ordem_servico";
    if (/(problema|duvida|suporte|erro|ajuda)/.test(lowered)) return "suporte";
    return "venda";
  }

  private fallbackText(intent: AgentIntent) {
    const responses: Record<AgentIntent, string> = {
      venda: "Recebi seu interesse. Vou registrar aqui e seguir com o atendimento comercial.",
      suporte: "Recebi sua solicitacao de suporte. Vou consultar seu historico e encaminhar se precisar de atendimento humano.",
      financeiro: "Recebi sua solicitacao financeira. Vou verificar os pagamentos registrados e seguir com a cobranca, se necessario.",
      agendamento: "Recebi sua solicitacao de agendamento. Vou registrar uma atividade para confirmarmos o melhor horario.",
      ordem_servico: "Recebi sua solicitacao de ordem de servico. Vou registrar a demanda para acompanhamento."
    };
    return responses[intent];
  }

  private async applyAgentActions(companyId: string, clientId: string, intent: AgentIntent, message: string) {
    const lowered = message.toLowerCase();
    if (/(amanha|amanhã|retorno|lembrar|cobrar depois)/.test(lowered)) {
      const dueAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await prisma.task.create({
        data: {
          companyId,
          clientId,
          title: "Retornar contato do WhatsApp",
          description: message,
          dueAt,
          createdByAi: true
        }
      });
    }

    if (intent === "agendamento") {
      await prisma.task.create({
        data: {
          companyId,
          clientId,
          title: "Confirmar horario com cliente",
          description: message,
          dueAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
          createdByAi: true
        }
      });
    }

    if (intent === "ordem_servico") {
      await prisma.serviceOrder.create({
        data: {
          companyId,
          clientId,
          title: "OS aberta por WhatsApp",
          description: message
        }
      });
    }

    if (intent === "financeiro" && /(pix|cobran|pagamento)/.test(lowered)) {
      await prisma.task.create({
        data: {
          companyId,
          clientId,
          title: "Revisar cobranca solicitada",
          description: message,
          createdByAi: true
        }
      });
    }
  }
}
