# Rollout de clientes legados sem responsável comercial

**Status:** procedimento operacional da Fase 4 (DV-12)
**Regra absoluta:** não inventar atribuição automática. Não atribuir tudo ao
primeiro administrador.

## Contexto

Clientes criados antes de M4.1 permanecem com `responsavel_comercial_id = null`.
Eles:

- **não** entram no escopo `propria` do vendedor;
- **aparecem** no escopo `sem_responsavel` para quem tem
  `CARTEIRA_VER_SEM_RESPONSAVEL` (gestor/admin);
- continuam resolvíveis por ID canônico em Orçamento/OS quando o consumidor já
  tem o `cliente_id` (sem furar carteira via listagem).

`GET /clientes?legado=1` muda **somente o formato** (array vs paginado). O filtro
de escopo e a autorização permanecem os mesmos — **não** libera a carteira
inteira ao vendedor.

## Contagem sanitizada (dry-run)

```bash
cd backend
# DATABASE_URL deve apontar para banco local/teste/scratch/ci
npx ts-node -r tsconfig-paths/register scripts/carteira-rollout-legado-dry-run.ts
```

Saída esperada:

- `total_sem_responsavel`
- por loja: `loja_ref` (hash), `quantidade`, `amostra_cliente_refs` (hashes)
- **sem** nome, e-mail, documento ou telefone

## Visão “Sem responsável”

Na listagem `/vendas/carteira` (e alias `/clientes`), gestor/admin com a
permissão adequada seleciona o escopo **Sem responsável**.

Fluxo operacional:

1. Abrir o cliente.
2. Usar **Transferir carteira** com motivo explícito e `chave_operacao` única.
3. Opcionalmente incluir participantes depois (não substitui o responsável).

## Importação controlada (opcional)

Se houver planilha:

1. Dry-run da contagem (script acima).
2. Validar que cada linha tem `cliente_id` + `usuario_destino_id` da **mesma**
   loja, usuário ativo, função `VENDAS` ou `ADMINISTRADOR`.
3. Aplicar via `POST /clientes/:id/transferir` (idempotente por
   `chave_operacao` = hash estável da linha).
4. Relatório final só com contagens e refs pseudonimizadas.

Proibido:

- `UPDATE cliente SET responsavel_comercial_id = <primeiro_admin>`;
- backfill silencioso no `create`/`update` genérico;
- script que escolhe “qualquer admin da loja”.

## Selects de Orçamento enquanto houver órfãos

- Select usa `GET /clientes?legado=1` ou `/clientes/search` com o escopo do
  chamador (default `propria`).
- Vendedor **não** vê órfãos na listagem/select.
- Gestor que precisa atribuir usa escopo `sem_responsavel` ou abre a ficha pelo
  ID conhecido.
- Orçamento já vinculado a `cliente_id` legado continua válido; a proposta não
  depende do responsável comercial para resolver o cadastro mestre.

## Critério para liberar a carteira aos vendedores

Só liberar uso pleno de `/vendas/carteira` aos vendedores quando:

1. Contagem de `sem_responsavel` da loja estiver em patamar aceito pela operação
   (meta sugerida: **0** clientes ativos órfãos, ou fila explicitamente
   gerenciada).
2. Gestores treinados no fluxo Transferir + Participantes.
3. Evidência MySQL 8 (M4.1–M4.4) e testes de isolamento OK.
4. Comunicação interna: participante ≠ gestor.

Enquanto houver órfãos, manter `CARTEIRA_VER_SEM_RESPONSAVEL` só em
gestor/admin e orientar redistribuição manual.
