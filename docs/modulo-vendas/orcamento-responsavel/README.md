# Responsável do orçamento (Atendente)

**Branch:** `feat/modulo-vendas`

**Ambiente de teste:** UAT. Produção não entra neste pacote.

## Problema

Três conceitos conviviam no orçamento:

1. `orcamento.responsavel_id` — dono canônico (FK de usuário), descrito no RP §5.2.
2. `orcamento.atendente` — texto livre, default Prisma `"Equipe Comercial"`, editável no formulário.
3. `cliente.responsavel_comercial_id` — dono da conta/carteira, não do orçamento.

O vendedor limitado via propostas “sem dono” (rótulo Equipe Comercial) e o
elaborador não virava automaticamente o responsável.

## Decisões travadas

- **Elaborar** grava `responsavel_id` = usuário autenticado. Sempre. O body não
  escolhe o dono.
- **Atendente no PDF** = nome desse usuário (cópia desnormalizada em
  `atendente`). Sem input aberto “Equipe Comercial”.
- **Quem pode ser dono:** usuário ativo da mesma loja com função comercial
  (`VENDAS` ou `ADMINISTRADOR`), igual à transferência de carteira de cliente.
- **Troca de dono** é transferência (`vendas.carteira.transferir`), não campo
  de formulário.
- **Sem dono** (`responsavel_id` nulo) é fila de distribuição:
  - ver: `vendas.carteira.ver.sem_responsavel`
  - atribuir: `vendas.carteira.transferir`
- Vendedor com `carteira.ver.propria` vê os **seus** orçamentos e os da **sua
  carteira**. Não vê o bolo da loja sem responsável.

## Fora de escopo

- Relabel “Equipe Comercial” como configuração da loja.
- Migration / coluna nova.
- Produção.
- Página inicial custom, favoritar registro, dashboard arrastável.
