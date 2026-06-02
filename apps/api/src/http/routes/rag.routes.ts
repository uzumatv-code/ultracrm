import { Router } from "express";
import multer from "multer";
import pdf from "pdf-parse";
import mammoth from "mammoth";
import { z } from "zod";
import { requireAuth, requirePermission } from "../middlewares/auth.js";
import { validateBody } from "../middlewares/validate.js";
import { RagService } from "../../modules/rag/rag.service.js";

export const ragRoutes = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
const service = new RagService();

ragRoutes.use(requireAuth);

ragRoutes.post("/documents", requirePermission("rag:manage"), upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(422).json({ code: "FILE_REQUIRED" });
  const text = await extractText(req.file);
  const document = await service.indexText(req.auth!.companyId, req.file.originalname, req.file.mimetype, text);
  res.status(201).json(document);
});

ragRoutes.post(
  "/search",
  requirePermission("rag:manage"),
  validateBody(z.object({ query: z.string().min(2) })),
  async (req, res) => {
    res.json(await service.search(req.auth!.companyId, req.body.query));
  }
);

async function extractText(file: Express.Multer.File) {
  if (file.mimetype === "application/pdf") {
    const parsed = await pdf(file.buffer);
    return parsed.text;
  }
  if (file.mimetype.includes("wordprocessingml")) {
    const parsed = await mammoth.extractRawText({ buffer: file.buffer });
    return parsed.value;
  }
  return file.buffer.toString("utf8");
}
