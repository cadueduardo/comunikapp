# Evidência de testes — Fase 3

**Data:** 2026-08-04
**HEAD inicial:** `a06a22181838e8076d6d37a5c08c46241e3394c4`
**HEAD final:** `5cc64b1d0962af0c99d6a784a0b53f43e29074ce` (implementação `fbb76595`)

## Backend — `vendas-acesso.controller.spec.ts`

Comando:

```text
cd backend
$env:NODE_OPTIONS='--max-old-space-size=6144'
npx jest src/vendas/vendas-acesso.controller.spec.ts --runInBand --forceExit --no-coverage
```

Resultado: **5 passed**

| Cenário | Resultado |
|---|---|
| Vendedor (`VENDAS`) com `proposta.ver` → módulo liberado | PASS |
| Gestor (`ADMINISTRADOR`) com piso completo | PASS |
| Usuário sem acesso (`PRODUCAO`) → módulo negado | PASS |
| Isolamento entre lojas (admin de outra loja no JWT de loja A) | PASS |
| `assertPode` permanece fonte de verdade | PASS |

## Frontend — navegação / sidebar

Comando:

```text
cd frontend
npm run test:vendas-nav
```

Resultado: **ok:true** nos contratos verificados diretamente no código da aplicação:

- `sidebar_condicionada_ao_backend`
- `orcamentos_e_clientes_fora_do_global`
- `migracao_da_ordem_legada`
- `financeiro_oculto_para_vendas`
- `cards_e_aliases_canonicos`
- `aditivos_filtrados`
- `rotas_vendas_e_aliases_protegidos`

## Typecheck / lint

- `read_lints` nos arquivos da Fase 3: sem erros.
- `npx tsc -p tsconfig.json --noEmit` no frontend: **nenhum erro** nos arquivos
  `vendas` / `use-vendas-*` (há erros pré-existentes alheios em specs/instalação/sidebar).
- Backend: controller tipado; rota já mapeada pelo `npm run dev`
  (`VendasAcessoController {/vendas}` → `GET /vendas/acesso`).

## `git diff --check`

Executado nos arquivos do commit da Fase 3 (ver saída anexada no commit).

## Nest build

Não reexecutado em paralelo ao `npm run dev` ativo (guardrail de processos).
Controller já carregado no processo de desenvolvimento.

## Redirects / bookmarks

Decisão documentada: aliases vivos (sem 301). Auditoria em
`auditoria-rotas-antigas.md`.
