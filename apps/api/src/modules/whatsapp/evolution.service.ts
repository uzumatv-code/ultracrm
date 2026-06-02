import { env } from "../../config/env.js";
import { AppError } from "../../http/errors.js";

type EvolutionMessage = {
  number: string;
  text?: string;
  mediaUrl?: string;
  mediatype?: "image" | "document" | "audio";
};

export class EvolutionService {
  async createInstance(instanceKey: string) {
    return this.request(`/instance/create`, {
      method: "POST",
      body: JSON.stringify({ instanceName: instanceKey, qrcode: true, integration: "WHATSAPP-BAILEYS" })
    });
  }

  async connectionState(instanceKey: string) {
    return this.request(`/instance/connectionState/${instanceKey}`);
  }

  async sendText(instanceKey: string, number: string, text: string) {
    return this.request(`/message/sendText/${instanceKey}`, {
      method: "POST",
      body: JSON.stringify({ number, text })
    });
  }

  async sendMedia(instanceKey: string, message: EvolutionMessage) {
    return this.request(`/message/sendMedia/${instanceKey}`, {
      method: "POST",
      body: JSON.stringify({
        number: message.number,
        mediatype: message.mediatype ?? "document",
        media: message.mediaUrl,
        caption: message.text
      })
    });
  }

  private async request(path: string, init?: RequestInit) {
    if (!env.EVOLUTION_API_KEY) throw new AppError("Evolution API nao configurada.", 503, "EVOLUTION_NOT_CONFIGURED");
    const response = await fetch(`${env.EVOLUTION_API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        apikey: env.EVOLUTION_API_KEY,
        ...(init?.headers ?? {})
      }
    });
    if (!response.ok) throw new AppError(`Evolution API retornou ${response.status}.`, 502, "EVOLUTION_ERROR");
    return response.json();
  }
}
