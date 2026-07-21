# Fase 0 — Descoberta e contratos (MVP Compras)

**Status:** inventário concluído; D1/D2 fechados (2026-07-21)  
**Branch:** `feat/mvp-compras-fase-0`  
**Data:** 2026-07-21  
**RP:** `docs/modulo de compras/RP-mvp-compras-suprimentos.md`

---

## 1. Inventário (somente leitura)

### 1.1 Permissões

- Modelo canônico: `perfil_permissao` (`modulo` + `acao` + `permitido`) — strings livres, sem migration.
- Mistura atual: guards por `usuario.funcao` (OS/estoque/financeiro) e checagens por perfil (aprovação OS).
- UI de perfis já lista módulo `compras` com ações genéricas; **não** existem ainda as strings do RP (`compras.solicitacao.criar`, `compras.pedido.aprovar`, etc.).
- Fornecedores hoje: só `JwtAuthGuard` (sem granularidade).

**Contrato Fase 1:** seed/catálogo com as permissões do RP §4 e checagem no service (padrão Home/OS approval).

### 1.2 Numeração

- `document_sequences` + `DocumentCodeService` (`ORC`, `OS`, `OSI`, `NF`).
- Adequado para Compras: novos tipos `SC` (solicitação) e `PC` (pedido), formato `{TIPO}-{AAAA}-{NNN}` por loja/ano.

### 1.3 Estoque

- Entrada/saída via `movimentacoes.service` (`ENTRADA`, `SAIDA`, …).
- `estoque_itens.precoUnitario` e `Insumo.custo_unitario` existem; **sem** PEPS/FIFO e **sem** custo médio ponderado implementado.
- Idempotência de movimento: **fraca** (`documentoRef` sem unique; id baseado em timestamp). Fase 3 exigirá chave idempotente.

### 1.4 Anexos

- Melhor padrão: instalação (`COMUNIKAPP_ANEXOS_DIR`, token, hash SHA-256, download autorizado).
- Sem S3 genérico. Drive fica fora de documentos financeiros.

### 1.5 Legado de compras

- Sem `backend/src/compras/`, sem models de pedido/solicitação/conta a pagar.
- Financeiro atual = contas a **receber** (`Cobranca*`).
- Nada a migrar; greenfield aditivo.

### 1.6 Reuso obrigatório

- CRUD `Fornecedor` + matriz `InsumoFornecedor` prontos.
- Preço da matriz = referência; preço do pedido = snapshot (princípio 5 do RP).

---

## 2. Decisões fechadas (2026-07-21)

### D1 — Valorização de estoque no recebimento = **A (custo médio ponderado)**

Na entrada confirmada de material, recalcular `estoque_itens.precoUnitario` por média ponderada:

```text
novo = ((qtd_atual * preco_atual) + (qtd_entrada * preco_recebimento)) / (qtd_atual + qtd_entrada)
```

Espelhamento em `Insumo.custo_unitario` fica opcional por política da loja (default: **não** alterar o cadastro do insumo no MVP; só o saldo/localização). PEPS/lote com custo permanece fora do MVP.

### D2 — Política de aprovação inicial = **A + B**

- Aprovação exige permissão `compras.solicitacao.aprovar` / `compras.pedido.aprovar` (ADMINISTRADOR bypass).
- Se o solicitante/criador já possui a permissão de aprovar, a transição pode autoaprovar na mesma operação (registrando a permissão usada no histórico).
- Sem faixas de valor / alçadas no MVP.

---

## 3. Checklist Fase 0 (RP §14)

- [x] Inventariar permissões, numeração, estoque e anexos existentes.
- [x] Mapear dados legados; nenhuma escrita.
- [ ] Validar o RP com cenários reais (smoke operacional com o time).
- [x] Fechar método de valorização de estoque (**D1 = A**).
- [x] Definir política de aprovação inicial (**D2 = A+B**).

---

## 4. Próximo passo

Fase 1: enums + tabelas solicitação/pedido/histórico + migrations aditivas + API rascunho/listagem/detalhe + UI CRUD mínima.
