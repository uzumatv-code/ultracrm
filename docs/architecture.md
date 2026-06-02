# Arquitetura Tecnica

## Camadas

- `http/routes`: contratos HTTP, middlewares e validacao.
- `modules/*`: casos de uso por dominio.
- `database`: Prisma Client.
- `config`: ambiente validado.
- `packages/shared`: DTOs e schemas compartilhados.

## Principios

- Isolamento multi-tenant sempre pelo `companyId`.
- Services concentram regra de negocio.
- Rotas ficam finas e delegam para services.
- Zod valida entrada externa.
- Prisma e o contrato relacional.
- Qdrant armazena somente vetores e payload minimo.

## Agentes IA

O supervisor classifica a intencao em:

- venda
- suporte
- financeiro
- agendamento
- ordem_servico

Para respostas baseadas em conhecimento interno, o contexto vem exclusivamente do Qdrant. Se a busca nao retornar resultado confiavel, o sistema encaminha para humano.

## Deploy

Railway deve usar serviços separados para web, api, mysql, redis e qdrant. O backend executa `prisma migrate deploy` no start do container.
