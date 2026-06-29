# 03 — IA, UX e hub do Catálogo

**Versão:** 0.2  
**Data:** 2026-06-26  
**Branch:** `feature/catalogo-escala-e-seguranca`

---

## 1. Menu lateral

### 1.1 Antes → Depois

| Antes | Depois |
|-------|--------|
| **Produtos** → `/produtos-finitos` | **Catálogo de produtos** → `/catalogo` (hub) |
| **Modelos de Orçamento** → `/produtos` | **Sem alteração** (permanece no menu) |

### 1.2 O que não entra no menu

- Personalização, Estampas, Conjuntos de campos → apenas dentro do hub.
- Redirect: `/produtos-finitos` pode permanecer funcionando (alias) até migração completa.

---

## 2. Hub `/catalogo` — layout

### 2.1 Princípios

- **Sem dashboard** de KPIs (diferente de Estoque).
- Título + subtítulo + grid de cards.
- Cards agrupados por **seção** para reduzir ruído cognitivo.
- Ícone + título + descrição curta (1 linha) + link.

### 2.2 Wireframe textual

```
┌──────────────────────────────────────────────────────────────┐
│  Catálogo de produtos                                        │
│  Cadastre produtos de prateleira e regras de personalização  │
├──────────────────────────────────────────────────────────────┤
│  VENDA                                                       │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │ Produtos        │  │ Categorias      │                  │
│  │ Prateleira,     │  │ Organize a      │                  │
│  │ preços, fotos   │  │ prateleira      │                  │
│  └─────────────────┘  └─────────────────┘                  │
├──────────────────────────────────────────────────────────────┤
│  PERSONALIZAÇÃO                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌───────────────┐ │
│  │ Personalização  │  │ Estampas        │  │ Conjuntos de  │ │
│  │ UV, silk, laser │  │ Layouts e       │  │ campos        │ │
│  │                 │  │ previews        │  │ Nome, data…   │ │
│  └─────────────────┘  └─────────────────┘  └───────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### 2.3 Cards (lista fechada v1)

| Card | Rota sugerida | Descrição (subtitle) |
|------|---------------|----------------------|
| **Produtos** | `/catalogo/produtos` ou `/produtos-finitos` | Cadastro de produtos de prateleira, preços e fotos |
| **Categorias** | `/catalogo/categorias` | Agrupe produtos para filtros e orçamento |
| **Personalização** | `/catalogo/personalizacao` | Processos de decoração: UV, silk, laser e outros |
| **Estampas** | `/catalogo/estampas` | Modelos visuais com textos personalizáveis |
| **Conjuntos de campos** | `/catalogo/conjuntos-campos` | Grupos de campos reutilizáveis entre estampas |

---

## 3. Telas por CRUD (resumo)

### 3.1 Produtos (existente — evolução)

- Grid + cards (manter padrão atual).
- Formulário em abas — ver [06-produto-finito-vinculos.md](./06-produto-finito-vinculos.md).

### 3.2 Personalização (processos)

- **Lista:** nome, código, ativo, setor PCP sugerido.
- **Formulário:** nome, descrição, código interno, exige aprovação de arte (sim/não), tipos de insumo aceitos (arquivo, texto, vetor), preço base opcional, **preço fixo de setup**, **tabela de faixas de preço (Quantity Breaks)**, ativo.

### 3.3 Estampas

- **Lista:** grid com **thumbnail**, nome, processo, ativo.
- **Formulário:**
  - Identificação (nome, código, ativo)
  - Processo (select — Personalização)
  - Conjunto de campos (select opcional) ou campos inline
  - Arte mestra (upload)
  - Preview thumb
  - Preço adicional
  - Produtos compatíveis (opcional: filtro por categoria)

### 3.4 Conjuntos de campos

- **Lista:** nome, quantidade de campos, usado em N estampas.
- **Formulário:** nome + tabela editável de campos:

| Campo | Tipo | Obrigatório | Máx chars | Fonte | Placeholder |
|-------|------|-------------|-----------|-------|-------------|

Tipos de campo v1: `texto`, `numero`, `data`.

---

## 4. Orçamento (fora do hub — referência UX)

Fluxo na linha ao adicionar produto finito personalizável — detalhado em [07-fluxo-orcamento.md](./07-fluxo-orcamento.md).

### 4.1 Visibilidade condicional (retrocompatibilidade)

| Condição | UI exibida |
|----------|------------|
| `personalizavel=false` | Apenas quantidade × preço — **sem** blocos abaixo |
| `personalizavel=true`, qty = 1 | Modo estampa/imprint + campos inline (objeto simples) |
| `personalizavel=true`, qty &gt; 1 | + alternância VDP + grade (se produto tiver variações) |

### 4.2 Matriz de Atributos (Grade)

Quando o produto finito possui variações cadastradas (`produto_finito_variacoes` ou atributos no pai), exibir **mini-grade** na linha do orçamento **antes** ou **acoplada** à área de personalização:

```
┌─ Distribuição por tamanho ─────────────────────────┐
│  P  [ 20 ]    M  [ 50 ]    G  [ 30 ]    Σ = 100 ✓ │
└────────────────────────────────────────────────────┘
```

- Inputs numéricos por combinação de atributos (Tamanho, Cor, etc.).
- Indicador de soma vs quantidade total da linha (verde ✓ / vermelho se divergir).
- Bloquear salvar enquanto soma ≠ quantidade.
- Oculto se produto não tiver grade configurada.

### 4.3 UI de Dados Variáveis (VDP em lote)

Quando `personalizavel=true` **e** `quantidade > 1` **e** modo = Estampa (ou imprint com campos):

**Alternância (segmented control):**

```
[ Digitar Inline ]  |  [ Importar Planilha (CSV/Excel) ]
```

#### Modo “Digitar Inline”

- Tabela editável com N linhas (N = quantidade ou N = unidades após grade).
- Colunas = rótulos do `conjunto_campos` da estampa selecionada.
- Contador de caracteres por célula; validação em tempo real.
- Para qty ≤ 10: edição inline confortável; para qty &gt; 10: sugerir importação.

#### Modo “Importar Planilha”

1. Upload `.csv` ou `.xlsx` (drag-and-drop).
2. **Passo de mapeamento:** UI exibe cabeçalhos do arquivo vs chaves do `conjunto_campos`:

```
Coluna arquivo     →  Campo da estampa
─────────────────────────────────────
"Nome Completo"    →  [ nome        ▼ ]
"Mensagem"         →  [ frase       ▼ ]
"Ignorar"          →  [ — não mapear — ]
```

3. Preview das primeiras 5 linhas após mapeamento.
4. Validação: linhas com campos obrigatórios vazios destacadas; bloqueio se count &gt; quantidade da linha.
5. Ao confirmar: persiste `valores_campos` como `Record<string, string>[]`.
6. Aviso de segurança: fórmulas em células serão neutralizadas (sanitização A03).

### 4.4 Resumo visual — linha simples (qty = 1)

```
[Produto: Caneca 350ml]
  Personalizar? ( ) Não  (•) Sim
  Modo: ( ) Estampa  ( ) Personalização livre
  Estampa: [thumb] [thumb] [thumb]  ← só modos permitidos pelo produto
  Nome: [_______________]  0/50
  Descrição: [____________]  0/120
  [Preview]
```

### 4.5 Resumo visual — lote corporativo (qty &gt; 1)

```
[Produto: Caneca 350ml]  Qtd: 100
  [ Grade: P20 M50 G30 ]  (se aplicável)
  Modo: Estampa → [● Aniversário]
  [ Digitar Inline ] | [ Importar Planilha ]
  📎 planilha_nomes.csv — 100 linhas mapeadas ✓
  Setup silk: R$ 45,00 (único)  |  Unit. decoração: R$ 3,00 (faixa 11–100)
  Total linha: R$ 1.500 base + R$ 45 setup + R$ 300 decoração = R$ 1.845,00
  [Preview amostra] [Gerar prova PDF após salvar]
```

---

## 5. Padrões visuais

- Reutilizar componentes de card do Estoque (`estoque/page.tsx` — `estoqueOptions`).
- Hub sem botão “Atualizar” de dashboard; opcional refresh só se listas cacheadas.
- Estampas: priorizar **grade visual** (thumbs), não só tabela.
- Conjuntos de campos: tabela editável; linguagem humana (“Campos que o cliente pode alterar”).

---

## 6. Permissões (sugestão)

| Ação | Perfil sugerido |
|------|-----------------|
| Ver catálogo | Vendedor, cadastro, admin |
| Editar produtos finitos | Cadastro, admin |
| Editar estampas / processos / conjuntos | Cadastro, admin |
| Usar personalização no orçamento | Vendedor |

Validar com módulo de usuários existente.

---

## 7. Acessibilidade e mobile

- Hub: cards empilhados em mobile (1 coluna).
- Seleção de estampa no orçamento: scroll horizontal de thumbs em mobile.
- Campos variáveis: labels associados, contador de caracteres visível.
