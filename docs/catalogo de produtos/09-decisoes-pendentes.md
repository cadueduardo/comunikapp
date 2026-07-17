# 09 — Decisões pendentes

**Versão:** 0.1  
**Data:** 2026-06-26

Marque a opção escolhida antes de implementar cada fase. Mover decisões fechadas para o documento técnico relevante com data.

---

## CRÍTICAS (bloqueiam Fase 2+)

### D1 — Persistência da personalização no orçamento

**Contexto:** Onde salvar modo, estampa, processo e valores na linha do orçamento.

| Opção | Prós | Contras |
|-------|------|---------|
| **A) Tabela `personalizacao_orcamento` (1:1)** | Tipado, consultável, histórico | Migration + join |
| **B) JSON em `ProdutoOrcamento.metadados`** | Rápido | Frágil, difícil validar |
| **C) Tabela filha genérica `linha_personalizacao`** | Extensível | Mais abstrato |

**Recomendação:** **A**

**Decisão:** ☐ A ☐ B ☐ C  
**Responsável:** __________ **Data:** __________

---

### D2 — Rota e rename do menu

| Opção | Detalhe |
|-------|---------|
| **A)** Hub em `/catalogo`, produtos em `/catalogo/produtos`, manter redirect `/produtos-finitos` | Transição suave |
| **B)** Manter `/produtos-finitos`, hub em `/produtos-finitos/catalogo` | Menos redirects |
| **C)** Hub em `/catalogo`, quebrar `/produtos-finitos` | Breaking |

**Recomendação:** **A**

**Decisão:** ☐ A ☐ B ☐ C

---

### D3 — Campos variáveis: só conjunto vs inline na estampa

| Opção | Detalhe |
|-------|---------|
| **A)** Estampa sempre usa `conjunto_campos_id`; campos inline proibidos | Mais simples |
| **B)** Estampa pode usar conjunto OU campos inline exclusivos | Flexível |
| **C)** Sempre inline na estampa (sem CRUD conjuntos na v1) | Menos CRUDs |

**Recomendação:** **B** (conjunto recomendado, inline permitido para exceções)

**Decisão:** ☐ A ☐ B ☐ C

---

## IMPORTANTES (bloqueiam refinamento)

### D4 — Estampa VDP e status de arte na OS

Quando só variáveis são preenchidas (sem upload cliente):

| Opção | Comportamento |
|-------|---------------|
| **A)** `status_arte = APROVADA` automático na geração da OS | Libera PCP rápido |
| **B)** `status_arte = NAO_APLICA` | Arte módulo ignora |
| **C)** Exige prova PDF e aprovação cliente leve | Mais controle |

**Recomendação:** **A** ou **B** — validar com operação

**Decisão:** ☐ A ☐ B ☐ C

---

### D5 — Preço promocional vs adicional de estampa

`preco_promocional` substitui:

| Opção | Fórmula |
|-------|---------|
| **A)** Só preço base; adicional de estampa integral | `promo + estampa` |
| **B)** Preço final único sem adicional | promo já embute tudo |
| **C)** Vendedor escolhe no orçamento | Flexível, complexo |

**Recomendação:** **A**

**Decisão:** ☐ A ☐ B ☐ C

---

### D6 — Card Categorias no hub

| Opção | Detalhe |
|-------|---------|
| **A)** Card separado no hub | Como desenhado |
| **B)** Dentro da tela Produtos (aba/filtro) | Menos um card |
| **C)** Modal no grid de produtos | Mínimo |

**Recomendação:** **B** para v1 se quiser reduzir escopo; **A** se categorias forem muito usadas

**Decisão:** ☐ A ☐ B ☐ C

---

### D7 — Nome do módulo no menu

| Opção | Label |
|-------|-------|
| **A)** Catálogo de produtos | Acordado |
| **B)** Catálogo | Mais curto |
| **C)** Prateleira e personalização | Mais descritivo |

**Recomendação:** **A**

**Decisão:** ☐ A ☐ B ☐ C

---

## FUTURAS (não bloqueiam v1)

### D8 — Geração de arte de produção (mestra + variáveis)

- Serviço backend com template engine (PDF/Imagem) vs manual no início.

### D9 — Integração estoque_itens ↔ produto_finito

- SKU único no módulo estoque.

### D10 — Arte sob medida como modo no orçamento

- Terceiro fluxo completo com ciclo arte.

### D11 — Versionamento de estampa

- Alterar conjunto de campos sem quebrar orçamentos abertos.

---

## Registro de decisões fechadas

| ID | Decisão | Data | Notas |
|----|---------|------|-------|
| — | — | — | — |
