import crypto from "node:crypto";
import { QdrantClient } from "@qdrant/js-client-rest";
import OpenAI from "openai";
import { env } from "../../config/env.js";
import { prisma } from "../../database/prisma.js";

const qdrant = new QdrantClient({ url: env.QDRANT_URL, apiKey: env.QDRANT_API_KEY });
const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY || "missing-key" });

export class RagService {
  async ensureCollection() {
    const collections = await qdrant.getCollections();
    if (!collections.collections.some((collection) => collection.name === env.QDRANT_COLLECTION)) {
      await qdrant.createCollection(env.QDRANT_COLLECTION, {
        vectors: { size: 1536, distance: "Cosine" }
      });
    }
  }

  async indexText(companyId: string, title: string, mimeType: string, content: string) {
    await this.ensureCollection();
    const document = await prisma.knowledgeDocument.create({
      data: { companyId, title, mimeType, status: "PROCESSING" }
    });
    const chunks = this.chunk(content);
    for (const chunk of chunks) {
      const embedding = await this.embed(chunk);
      const pointId = crypto.randomUUID();
      await qdrant.upsert(env.QDRANT_COLLECTION, {
        points: [{ id: pointId, vector: embedding, payload: { companyId, documentId: document.id, title, content: chunk } }]
      });
      await prisma.knowledgeChunk.create({
        data: {
          companyId,
          documentId: document.id,
          content: chunk,
          tokenCount: Math.ceil(chunk.length / 4),
          qdrantPointId: pointId
        }
      });
    }
    return prisma.knowledgeDocument.update({ where: { id: document.id }, data: { status: "READY" } });
  }

  async search(companyId: string, query: string) {
    await this.ensureCollection();
    const embedding = await this.embed(query);
    const result = await qdrant.search(env.QDRANT_COLLECTION, {
      vector: embedding,
      limit: 5,
      score_threshold: 0.72,
      filter: { must: [{ key: "companyId", match: { value: companyId } }] }
    });

    return result.map((item) => ({
      score: item.score,
      title: String(item.payload?.title ?? ""),
      content: String(item.payload?.content ?? "")
    }));
  }

  private async embed(text: string) {
    const response = await openai.embeddings.create({
      model: env.OPENAI_EMBEDDING_MODEL,
      input: text
    });
    return response.data[0].embedding;
  }

  private chunk(text: string) {
    const normalized = text.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim();
    const chunks: string[] = [];
    for (let i = 0; i < normalized.length; i += 2400) {
      chunks.push(normalized.slice(i, i + 2800));
    }
    return chunks.filter(Boolean);
  }
}
