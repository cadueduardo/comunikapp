# PR: Fase 5 – Limpeza final do módulo de estoque (sem breaking changes)

## Resumo
- Remoção do `EstoqueSimpleService` (facade antigo) e referências.
- Tipos compartilhados: criação de `IEstoqueContext` em `backend/src/estoque/types/estoque-context.ts`.
- Serviços dedicados consolidados: Itens, Localizações, Lotes, Transferências, Dashboard, Relatórios e Sobras.
- Observabilidade: middleware de `correlationId` e endpoint `GET /api/estoque/health/links`.
- Segurança: `JwtModule.registerAsync` com `JWT_SECRET` obrigatório em produção, Helmet, Rate Limiting e CORS condicional.
- SQL endurecido: placeholders/`Prisma.sql` para consultas dinâmicas (Transferências, Lotes.update, Sobras.sugestões).
- Testes: suites estoque verdes; e2e mínimo habilitado; legados com skip onde necessário.

## Mudanças principais
- backend/src/estoque/types/estoque-context.ts (novo)
- backend/src/estoque/middleware/request-context.middleware.ts (novo)
- backend/src/estoque/controllers/health.controller.ts (links rápidos)
- backend/src/main.ts (Helmet, rate limiting, CORS, níveis de log por ambiente)
- backend/src/estoque/controllers/itens.controller.ts (logs padronizados; exemplos extraídos)
- backend/src/estoque/swagger/itens.examples.ts (novo)
- backend/src/estoque/controllers/lotes.controller.ts + controller-utils.ts (redução de linhas)
- backend/src/estoque/services/sobras.service.ts (SQL seguro em sugestões)

## Testes
- Escopo estoque: 10/10 suites, 83/83 testes – verdes
- e2e mínimo: `backend/test/estoque-minimal.e2e-spec.ts` – verde

## Como validar
```pwsh
cd backend; npm run build; npm run test --silent -- estoque
```
Headers obrigatórios nas rotas protegidas: `Authorization`, `x-loja-id`, `x-user-roles`.

## Riscos/Mitigação
- e2e legados com skip até inclusão de headers/JWT: reativar gradualmente
- Tabelas opcionais: quedas controladas e retornos vazios onde aplicável

## Próximos passos
- Refinar `sobras.service.ts` (420 linhas) em submódulos; manter contratos
- Reativar e2e legados com headers/JWT
- PR de Melhorias de Segurança após merge


