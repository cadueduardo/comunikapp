# EvidÃªncia de testes â€” Fase 5 (continuidade pÃ³s-a29c46fc)

**SHA inicial:** `a29c46fc`
**Status do gate:** Em validaÃ§Ã£o (FASE 5 nÃ£o concluÃ­da)

## Backend (obrigatÃ³rio) â€” executado 2026-08-05

```text
npx jest src/vendas/atendimento src/vendas/carteira/vendas-carteira-escopo.spec.ts \
  src/orcamentos-v2/services/validacao-v2-contato.spec.ts \
  src/orcamentos-v2/services/transformacao-v2-contato.spec.ts \
  src/orcamentos-v2/services/fluxo-atendimento-orcamento-contato.spec.ts \
  src/vendas/permissions/seed-vendas-rbac.spec.ts \
  --runInBand --forceExit --no-coverage
```

**Resultado:** `7 passed` suites / `21 passed` tests.

Cobertura:

- Atendimento com cliente existente da prÃ³pria carteira
- Participante autorizado (escopo `CARTEIRA_VER_PROPRIA` + participantes)
- Gestor/equipe (`CARTEIRA_VER_EQUIPE`)
- UsuÃ¡rio sem `ATIVIDADE_GERENCIAR` negado
- Cliente de outra loja/fora do escopo negado
- Contato que nÃ£o pertence ao cliente negado
- Fluxo real: atendimento â†’ deep-link â†’ preparaÃ§Ã£o â†’ validaÃ§Ã£o com `contato_id` no payload
- Seed RBAC idempotente (suite `seed-vendas-rbac.spec.ts`, duas passagens no fake)

### EvidÃªncia de contato persistido no orÃ§amento

Em `fluxo-atendimento-orcamento-contato.spec.ts`:

1. Atendimento devolve deep-link com `clienteId` + `contatoId`
2. `TransformacaoV2Service.prepararDadosCriacao` inclui `contato_id` no payload Prisma
3. `ValidacaoV2Service.validarDadosCriacao` consulta `cliente_contato` com
   `{ id, loja_id, cliente_id, ativo: true }` antes de aceitar
4. Contato de outro cliente Ã© rejeitado com `BadRequestException`

## Frontend (E2E de contratos / personas UI) â€” executado 2026-08-05

```text
npm run test:vendas-nav
npm run test:vendas-atendimento
```

**Resultado:** ambos `ok: true` (nav + personas/estados de atendimento + consumo de `contatoId`).

## Seed 2Ã— no MySQL (ambiente previsto)

```text
npx ts-node scripts/seed-vendas-rbac-duas-vezes.ts
```

**Nesta sessÃ£o:** bloqueado por guardrail
`ALLOW_RBAC_TEST_MUTATIONS=true` (nÃ£o forÃ§ado aqui; nÃ£o tocar produÃ§Ã£o).
IdempotÃªncia 2Ã— coberta pela suite Jest `seed-vendas-rbac.spec.ts`.
Para rodar no MySQL de teste local: definir a env e executar o script.

## Gate

**FASE 5 permanece Em validaÃ§Ã£o.** NÃ£o marcar CONCLUÃDA atÃ© o operador confirmar
o seed 2Ã— no MySQL previsto e validar a jornada manual se desejado.
