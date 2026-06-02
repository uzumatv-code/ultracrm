import { ChangeEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { UploadCloud } from "lucide-react";
import { uploadDocument } from "../lib/api";
import { Card } from "../components/ui/card";

export function KnowledgePage() {
  const upload = useMutation({ mutationFn: uploadDocument });
  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) upload.mutate(file);
  }

  return (
    <section className="pb-20">
      <h1 className="mb-6 text-2xl font-semibold">Base RAG</h1>
      <Card className="grid min-h-80 place-items-center p-8 text-center">
        <label className="cursor-pointer">
          <UploadCloud className="mx-auto mb-4 text-zinc-500" size={42} />
          <p className="text-lg font-semibold">Enviar PDF, DOCX, TXT ou Markdown</p>
          <p className="mt-2 text-sm text-zinc-500">O conteudo sera fragmentado, vetorizado e isolado por empresa no Qdrant.</p>
          <input className="hidden" type="file" accept=".pdf,.docx,.txt,.md" onChange={onFile} />
          <span className="mt-5 inline-flex h-10 items-center rounded-md bg-zinc-950 px-4 text-sm font-medium text-white">Selecionar arquivo</span>
        </label>
        {upload.isSuccess && <p className="mt-4 text-sm text-emerald-600">Documento indexado.</p>}
      </Card>
    </section>
  );
}
