# 05 — Cadastros (CRUDs)

**Versão:** 0.2  
**Data:** 2026-06-26  
**Branch:** `feature/catalogo-escala-e-seguranca`

Especificação funcional de cada cadastro do hub Catálogo.

---

## 1. Personalização (processos de decoração)

### 1.1 Propósito

Cadastro **reutilizável** do “como” decorar: UV, silk, laser, aplicação de adesivo, etc.

### 1.2 Campos do formulário

| Campo | Obrigatório | Validação |
|-------|-------------|-----------|
| Nome | Sim | único por loja (recomendado) |
| Código interno | Não | único por loja se preenchido |
| Descrição | Não | |
| Exige arte aprovada antes da produção | Não | default: não para VDP |
| Tipos de conteúdo aceitos | Sim (≥1) | arquivo, texto, vetor |
| Preço base do processo | Não | decimal ≥ 0; usado quando `faixas_preco` vazio |
| **Preço fixo de Setup** | Não | decimal ≥ 0; default `0,00` — cobrado **uma vez por linha** de orçamento |
| **Faixas de preço (Quantity Breaks)** | Não | sub-grade dinâmica — ver §1.3 |
| Setor PCP sugerido | Não | string / FK futura |
| Ativo | Sim | default true |

### 1.3 Sub-grade — Faixas de preço por quantidade

Tabela editável no formulário do processo (adicionar/remover linhas):

| Coluna UI | Campo JSON | Validação |
|-----------|------------|-----------|
| Qtd. mínima | `min` | inteiro ≥ 1 |
| Qtd. máxima | `max` | inteiro ≥ min ou vazio (= sem teto) |
| Preço unitário (R$) | `preco` | decimal ≥ 0 |

Exemplo persistido em `faixas_preco`:

```json
[
  {"min": 1, "max": 10, "preco": 5.00},
  {"min": 11, "max": 100, "preco": 3.00},
  {"min": 101, "max": null, "preco": 2.50}
]
```

**Regras de UX:**

- Ordenar faixas por `min` ascendente.
- Impedir sobreposição de intervalos.
- Preview ao lado: “Para 50 un.: R$ 3,00/un. + setup R$ X”.
- Se nenhuma faixa cadastrada, usar apenas `preco_base` + `custo_setup`.

### 1.4 Regras

- Processo inativo não aparece em novos vínculos nem orçamentos.
- Estampas **referenciam** um processo; não duplicar silk em cada estampa como string solta.
- Exclusão: soft-delete ou bloqueio se houver estampas vinculadas.

### 1.5 API sugerida

- `GET/POST /catalogo/personalizacao` (ou `/processos-decoracao`)
- `GET/PATCH/DELETE /catalogo/personalizacao/:id`

---

## 2. Conjuntos de campos

### 2.1 Propósito

Agrupar definições de variáveis reutilizáveis entre estampas (ex.: “Nome + Mensagem”).

### 2.2 Campos do formulário

**Cabeçalho**

| Campo | Obrigatório |
|-------|-------------|
| Nome | Sim |
| Descrição | Não |
| Ativo | Sim |

**Linhas de campo** (repetível)

| Campo | Obrigatório | Notas |
|-------|-------------|-------|
| Chave interna | Sim | `nome`, snake_case, estável |
| Rótulo na UI | Sim | "Nome" |
| Tipo | Sim | texto, número, data |
| Obrigatório | Sim | |
| Máximo de caracteres | Condicional | para texto |
| Placeholder | Não | |
| Ordem | Sim | |

### 2.3 Regras

- Chaves únicas dentro do conjunto.
- Alterar tipo ou chave em conjunto usado por estampas ativas: aviso + versionamento (decisão pendente).
- Exclusão bloqueada se estampas ativas referenciam.

### 2.4 API sugerida

- CRUD `/catalogo/conjuntos-campos`
- Sub-recurso `/:id/campos` ou embed no PATCH

---

## 3. Estampas

### 3.1 Propósito

Biblioteca visual de layouts: arte mestra + processo + campos variáveis.

### 3.2 Campos do formulário

| Seção | Campos |
|-------|--------|
| Identificação | nome, código, ativo |
| Produção | processo_id (select Personalização) |
| Campos | conjunto_campos_id **ou** campos inline |
| Mídia | upload arte mestra, thumb (auto ou upload) |
| Comercial | preco_adicional |
| Compatibilidade | categorias de produto (opcional v1) |

### 3.5 Arte mestra — metadados de âncoras (VDP)

No upload da **arte-mestra**, o sistema deve **idealmente** registrar (ou permitir edição posterior) metadados de posição das variáveis para o motor de renderização automática:

| Campo em `estampas.metadados` | Descrição |
|------------------------------|-----------|
| `variaveis[].chave` | Alinhado ao `conjunto_campos` / campo inline |
| `variaveis[].bbox` | Bounding box normalizada `{x, y, width, height}` (0–1) ou pixels |
| `variaveis[].fonte` | Família/tamanho sugerido (opcional) |
| `canvas` | Largura/altura da arte mestra em mm ou px |

**v1 mínima:** upload + thumb; metadados podem ser preenchidos manualmente em JSON avançado ou via ferramenta de marcação (fase 1.5).

**v2:** editor visual de âncoras sobre a thumb.

Esses metadados alimentam o merge VDP em lote (PDF multi-páginas) descrito em [04-modelo-de-dados.md §3.2.2](./04-modelo-de-dados.md).

### 3.3 Regras

- Toda estampa tem exatamente **um** processo.
- Preview thumb obrigatório para lista visual no orçamento.
- `preco_adicional` soma ao preço do produto finito na linha.
- Duplicar estampa: ação “Copiar” para acelerar cadastro.

### 3.4 API sugerida

- CRUD `/catalogo/estampas`
- `POST /catalogo/estampas/:id/arte-mestra` (upload)
- `GET /catalogo/estampas?produto_finito_id=` — filtrar por compatibilidade

---

## 4. Produtos finitos

Ver documento dedicado [06-produto-finito-vinculos.md](./06-produto-finito-vinculos.md).

CRUD atual em `/produtos-finitos` permanece; evolui formulário com aba Personalização.

---

## 5. Categorias

Reutilizar `CategoriaProdutoFinito` existente.

Card separado no hub opcional; pode permanecer como sub-rota ou modal no grid de produtos até v2.

---

## 6. Matriz de dependências entre CRUDs

| Cadastro | Depende de | Usado por |
|----------|------------|-----------|
| Personalização | — | Estampas, Produto (imprint livre), Orçamento |
| Conjuntos de campos | — | Estampas |
| Estampas | Personalização, (Conjuntos) | Produto, Orçamento |
| Produto finito | Estampas, Personalização | Orçamento, OS |

**Ordem de implementação sugerida:** Personalização → Conjuntos → Estampas → Produto (vínculos) → Orçamento.

---

## 7. Multi-tenant e segurança

Alinhado a [01-visao-escopo.md §8](./01-visao-escopo.md) e [04-modelo-de-dados.md §7](./04-modelo-de-dados.md).

### 7.1 Controle de acesso (A01)

- Todas as queries com `loja_id` do JWT — **incluindo** listagem de estampas para orçamento, validação de CSV e leitura de `faixas_preco`.
- `GET /catalogo/estampas/:id` retorna `404` se `loja_id` divergir (não revelar existência cross-tenant).

### 7.2 Upload e storage (A04, A05)

| Tipo | Path | MIME permitidos | Tamanho |
|------|------|-----------------|---------|
| Arte mestra | `uploads/{loja_id}/estampas/` | `application/pdf`, `image/png`, `image/jpeg`, `image/svg+xml` | `MAX_UPLOAD_ESTAMPA_MB` |
| Import VDP | `uploads/{loja_id}/vdp-imports/` (temporário) | `text/csv`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | linhas ≤ `MAX_CSV_VDP_ROWS` |

- Rejeitar extensão/MIME não correspondentes (whitelist estrita).
- SVG: servir como attachment ou sanitizar se inline.

### 7.3 Importação CSV (A03)

- Sanitizar células: bloquear prefixos de fórmula Excel (`=`, `+`, `-`, `@`).
- Mapeamento de colunas validado contra chaves do `conjunto_campos` — colunas desconhecidas ignoradas com aviso na UI.
- Parser roda server-side no contexto da loja autenticada.

### 7.4 Retrocompatibilidade

- CRUDs de processo/estampa sem `faixas_preco` ou `custo_setup` funcionam com defaults (`[]`, `0.00`).
- Produto não personalizável: formulário de orçamento não exibe importação CSV nem grade.

---

## 8. Auditoria

Logar criação/alteração de estampas e processos (quem, quando) — alinhar com `ordem_servico_log` ou tabela genérica de auditoria.
