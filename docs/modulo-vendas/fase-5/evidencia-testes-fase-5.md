# Evidência de testes — Fase 5 (continuidade pós-`a29c46fc`)

**SHA inicial:** `a29c46fc`
**Status do gate:** Em validação — Fase 5 não concluída

## Backend — executado em 2026-08-05

```text
npx jest src/vendas/atendimento src/vendas/carteira/vendas-carteira-escopo.spec.ts \
  src/orcamentos-v2/services/validacao-v2-contato.spec.ts \
  src/orcamentos-v2/services/transformacao-v2-contato.spec.ts \
  src/orcamentos-v2/services/fluxo-atendimento-orcamento-contato.spec.ts \
  src/vendas/permissions/seed-vendas-rbac.spec.ts \
  --runInBand --forceExit --no-coverage
```

**Resultado informado na entrega:** 7 suítes e 21 testes aprovados.

Cobertura unitária e integrada com dependências simuladas:

- atendimento com cliente existente da própria carteira;
- participante autorizado e gestor/equipe conforme escopo;
- usuário sem `ATIVIDADE_GERENCIAR` negado;
- cliente de outra loja ou fora do escopo negado;
- contato incompatível com o cliente negado;
- atendimento → deep-link → transformação → validação de `contato_id`;
- seed RBAC idempotente em memória.

### Alcance da prova de `contato_id`

O teste `fluxo-atendimento-orcamento-contato.spec.ts` comprova, com mocks:

1. geração do deep-link com `clienteId` e `contatoId`;
2. inclusão de `contato_id` no objeto preparado para o Prisma;
3. validação por `{ id, loja_id, cliente_id, ativo: true }`;
4. rejeição de contato incompatível.

Ele não executa `orcamento.create` em MySQL e, portanto, não comprova sozinho a
persistência física da coluna ou a migration. Essa evidência depende da aplicação
da migration `20260805120800_vendas_orcamento_add_contato` em banco de teste e de
um teste de integração com criação e leitura do orçamento.

## Frontend — verificações estáticas

```text
npm run test:vendas-nav
npm run test:vendas-atendimento
```

Os scripts verificam contratos por leitura do código-fonte. Eles confirmam a
presença das ramificações de cliente/prospect, permissões e consumo de
`contatoId`, mas não são testes E2E, não interagem com o navegador e não provam
as jornadas das personas.

## Seed duas vezes no MySQL previsto

```text
npx ts-node scripts/seed-vendas-rbac-duas-vezes.ts
```

**Pendente:** a execução foi bloqueada corretamente pelo guardrail
`ALLOW_RBAC_TEST_MUTATIONS=true`. O teste Jest do seed não substitui a prova no
MySQL previsto.

## Pendências do gate

- aplicar M5.5 no banco MySQL de teste;
- criar e reler um orçamento real com `contato_id` nesse banco;
- executar o seed duas vezes no MySQL autorizado;
- executar a jornada das personas em navegador, caso ela permaneça como
  requisito do gate.

**FASE 5 permanece Em validação.**
