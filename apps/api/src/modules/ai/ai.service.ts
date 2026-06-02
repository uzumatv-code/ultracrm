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
    const context = await this.rag.search(companyId, userMessage);
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

    const response = await openai.chat.completions.create({
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
    });

    return {
      intent,
      text: response.choices[0]?.message.content?.trim() || "Vou encaminhar sua solicitacao para um atendente humano.",
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
}
