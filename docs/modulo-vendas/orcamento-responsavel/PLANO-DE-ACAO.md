# Plano de ação — responsável do orçamento

**Branch:** `feat/modulo-vendas`

**Ambiente de teste:** UAT (`uat.comunikapp.com.br`). Produção não entra neste pacote.

**Marcar o checkbox no mesmo commit da implementação.**

## Decisões travadas

- Dono canônico: `orcamento.responsavel_id`.
- `atendente` é cópia do nome do responsável, gravada só no backend.
- Sem schema novo.
- Fila sem dono recortada por `vendas.carteira.ver.sem_responsavel`.
- Transferência reutiliza `vendas.carteira.transferir` e a lista de
  responsáveis comerciais já existente em `/clientes/responsaveis-disponiveis`.

## Backend

- [x] Criação força `responsavel_id` = identidade e `atendente` = nome do usuário; ignora body.
- [x] Atualização ignora `atendente` e `responsavel_id` do cliente.
- [x] `PATCH /orcamentos-v2/:id/transferir` com DTO tipado, destino revalidado na loja, auditoria sanitizada, idempotente por `chave_operacao`.
- [x] `whereOrcamento`: orçamento sem responsável só entra com `CARTEIRA_VER_SEM_RESPONSAVEL`; a cláusula de clientes sem responsável comercial **não** despeja a fila no vendedor limitado.
- [x] Listagem/detalhe devolvem `responsavel` (id + nome).

## Frontend

- [x] Input aberto “Atendente” / “Equipe Comercial” vira somente leitura com o nome do responsável.
- [x] Gestor/admin com `carteira_transferir`: ação Atribuir/Transferir (select de usuários comerciais, não texto livre).
- [x] Lista (tabela e cards): coluna/rótulo do dono; estado “Sem responsável”.
- [x] PDF público continua lendo `atendente` preenchido pelo backend.

## Testes

- [x] `whereOrcamento`: própria não inclui `{ responsavel_id: null }`.
- [x] `whereOrcamento`: `ver.sem_responsavel` inclui a fila sem dono.
- [x] Criação sobrescreve `atendente` / `responsavel_id` do body.
- [x] Transferência sem permissão não muta.
