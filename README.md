# UltraCRM AI

CRM conversacional multi-tenant para WhatsApp com Evolution API, OpenAI, RAG em Qdrant, MySQL, Redis e deploy preparado para Railway.

## Visao geral

Quando um cliente envia uma mensagem no WhatsApp, a Evolution API chama o webhook do backend. A API identifica a instancia WhatsApp, encontra ou cria o cliente da empresa correta, salva a conversa, consulta MySQL e Qdrant, chama o agente supervisor com OpenAI e registra a resposta no CRM antes de responder pelo WhatsApp.

Fluxo:

1. Evolution API recebe a mensagem.
2. Webhook `POST /api/whatsapp/webhook/evolution` e chamado.
3. A instancia identifica a empresa (`companyId`).
4. Cliente, conversa e mensagem inbound sao persistidos.
5. O RAG consulta Qdrant com filtro obrigatorio por `companyId`.
6. O supervisor escolhe agente: venda, suporte, financeiro, agendamento ou ordem de servico.
7. A resposta e salva como mensagem outbound.
8. A Evolution API envia a resposta no WhatsApp.
9. O CRM exibe historico, funil, clientes, tarefas e relatorios.

## Stack

- Frontend: React, Vite, TypeScript, TailwindCSS, componentes estilo Shadcn UI, React Query, React Router.
- Backend: Node.js, Express, TypeScript, Prisma ORM, JWT, Bcrypt, Zod.
- Banco: MySQL.
- Vetores: Qdrant.
- IA: OpenAI Chat Completions e Embeddings.
- WhatsApp: Evolution API.
- Infra: Docker, Railway, Redis, MinIO opcional.

## Estrutura

```txt
apps/api      Backend Express + Prisma
apps/web      Frontend React + Vite
packages/shared DTOs, schemas Zod e tipos compartilhados
docs          Documentacao tecnica
docker-compose.yml
railway.json
```

## Variaveis de ambiente

Copie `.env.example` para `.env` e preencha:

```bash
cp .env.example .env
```

Principais variaveis:

- `DATABASE_URL`: conexao MySQL.
- `JWT_ACCESS_SECRET` e `JWT_REFRESH_SECRET`: segredos fortes.
- `OPENAI_API_KEY`: chave OpenAI.
- `QDRANT_URL` e `QDRANT_API_KEY`: endpoint vetorial.
- `EVOLUTION_API_URL` e `EVOLUTION_API_KEY`: Evolution API.
- `CORS_ORIGIN`: URL do frontend.

## Desenvolvimento local

```bash
npm install
docker compose up -d mysql redis qdrant minio
npm run db:generate
npm --workspace apps/api run db:migrate:dev
npm run db:seed
npm run dev
```

Credenciais seed:

- Email: `admin@ultracrm.local`
- Senha: `UltraCRM@123`

URLs:

- Frontend: `http://localhost:5173`
- API: `http://localhost:4000/api/health`
- Qdrant: `http://localhost:6333`
- MinIO: `http://localhost:9001`

## Docker local

```bash
cp .env.example .env
docker compose up --build
```

## Deploy Railway

Projeto informado: `c80e4c04-e688-45df-9bf7-9b306d5cbad1`.

O repositorio esta preparado para Railway com Dockerfiles separados. A forma recomendada e criar serviços:

1. `api`: Dockerfile `apps/api/Dockerfile`.
2. `web`: Dockerfile `apps/web/Dockerfile`.
3. `mysql`: plugin/servico MySQL Railway.
4. `redis`: plugin/servico Redis Railway.
5. `qdrant`: imagem Docker `qdrant/qdrant`.

Configure no Railway:

- `DATABASE_URL` apontando para o MySQL.
- `REDIS_URL` apontando para Redis.
- `QDRANT_URL` apontando para o servico Qdrant.
- `OPENAI_API_KEY`.
- `EVOLUTION_API_URL`.
- `EVOLUTION_API_KEY`.
- `CORS_ORIGIN` com a URL publica do frontend.
- `VITE_API_URL` com a URL publica da API + `/api`.

Com Railway CLI autenticado:

```bash
railway link c80e4c04-e688-45df-9bf7-9b306d5cbad1
railway up
```

## Multi-tenant

Toda entidade operacional possui `companyId`. As rotas autenticadas extraem `companyId` do JWT, e os servicos usam esse valor em todas as consultas. O RAG tambem grava `companyId` no payload do Qdrant e aplica filtro semantico por empresa. Isso impede vazamento entre clientes SaaS.

## Segurança

- JWT access token e refresh token.
- Hash de senha com Bcrypt.
- RBAC por permissoes.
- Rate limit global.
- Helmet e CORS.
- Validacao Zod.
- Logs estruturados com Pino.
- Auditoria modelada em `AuditLog`.

## RAG

Upload aceito:

- PDF
- DOCX
- TXT
- Markdown

O backend extrai texto, divide em chunks, cria embeddings com OpenAI e indexa no Qdrant. Quando nao ha contexto suficiente, a resposta padrao e:

```txt
Vou encaminhar sua solicitacao para um atendente humano.
```

## Webhook Evolution API

Configure a Evolution API para enviar eventos de mensagens para:

```txt
https://SUA-API.railway.app/api/whatsapp/webhook/evolution
```

Cada instancia criada no CRM gera um `instanceKey` unico por empresa.

## Qualidade

Comandos:

```bash
npm run typecheck
npm run build
```

CI GitHub Actions esta em `.github/workflows/ci.yml`.
