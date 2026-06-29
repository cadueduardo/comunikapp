# 01 — Visão e escopo

**Versão:** 0.2  
**Data:** 2026-06-26  
**Branch:** `feature/catalogo-escala-e-seguranca`

---

## 1. Contexto

O Comunikapp já possui:

- **Modelos de Orçamento** (`/produtos`): produtos calculados (insumos, máquinas, geometria) — ferramenta central de orçamento sob medida.
- **Produtos finitos** (`/produtos-finitos`): prateleira / revenda com preço, imagem, categorias e integração ao Orçamento V2 como `PRODUTO_FINITO`.
- **Arte & Aprovação**, **OS**, **PCP** e **Expedição** com fluxos por item em evolução.

Falta amadurecer o **catálogo comercial** para produtos de prateleira que podem ser vendidos:

- **Sem personalização** (só separar e expedir).
- **Com personalização livre** (ex.: UV + texto).
- **Com estampa catalogada** (layout fixo + campos variáveis, ex.: nome e frase em silk).

Hoje não há cadastro de processos de decoração, estampas nem conjuntos de campos reutilizáveis; o produto finito não expressa modos de personalização nem vínculos com esses catálogos.

---

## 2. Problema

| Dor | Impacto |
|-----|---------|
| Produto finito tratado só como SKU | Não diferencia caneca pronta vs caneca estampada |
| Personalização misturada com arte da OS | Confusão entre “decorar produto” e “arte de produção gráfica” |
| Sem biblioteca de estampas | Cada venda redefine layout; sem VDP (dados variáveis) |
| Menu lateral inchado | Difícil acrescentar 3+ CRUDs sem poluir navegação |
| Liberação PCP única para tudo | Produto de estoque não deveria ir para kanban de produção |

---

## 3. Objetivos

### 3.1 Objetivos de produto

1. **Hub “Catálogo de produtos”** com cards (estilo Estoque, **sem dashboard** de KPIs).
2. CRUDs reutilizáveis: **Personalização** (processos), **Estampas**, **Conjuntos de campos**.
3. **Produto finito** vincula o que é permitido (modos, estampas, processos) — sem preencher textos do cliente no cadastro.
4. **Orçamento** consome o catálogo: escolha de estampa, preenchimento de variáveis, preço composto.
5. **OS** roteia por item: expedição direta, PCP (personalização) ou híbrido.

### 3.2 Objetivos técnicos

- Modelo de dados extensível (migrations aditivas).
- Multi-tenant (`loja_id`) em todas as entidades novas.
- APIs REST alinhadas ao padrão do monorepo (NestJS + Prisma + Next.js).
- Não quebrar produtos finitos nem orçamentos existentes.

---

## 4. Fora de escopo (v1 / explícito)

| Item | Motivo |
|------|--------|
| Alterar **Modelos de Orçamento** | Permanecem no menu; escopo próprio |
| Substituir módulo **Insumos** | Matéria-prima continua separada |
| Editor visual WYSIWYG de estampas | Fase futura; v1 usa upload de arte mestra |
| E-commerce B2C self-service | Foco B2B: vendedor preenche orçamento |
| Preview 3D mockup | Fase futura; v1 pode ter thumb + PDF prova |
| Motor de renderização WYSIWYG em tempo real | Fase futura; v1 usa thumb + merge PDF |
| Tabelas de preço multi-dimensionais (cliente × região × canal) | Fase 2; v1 cobre **Faixas de Preço** (Quantity Breaks) por processo |

---

## 5. Princípios de desenho

1. **Cadastro ≠ venda ≠ execução**  
   - Cadastro define possibilidades.  
   - Orçamento escolhe e preenche.  
   - OS executa e roteia.

2. **Reutilização**  
   - Processo (silk) usado por N estampas.  
   - Conjunto de campos usado por N estampas.  
   - Estampa usada por N produtos finitos.

3. **Modos de personalização** (não um booleano único)  
   - Nenhuma  
   - Estampa catalogada  
   - Imprint livre  
   - Arte sob medida (futuro)

4. **Processo amarrado à estampa**  
   - Vendedor escolhe estampa; silk/UV vem do cadastro da estampa.

5. **Menu enxuto**  
   - Um item “Catálogo de produtos”; detalhes no hub.

6. **Compatibilidade retroativa**  
   - Produto finito sem personalização continua funcionando como hoje.  
   - Fluxos de lote, matriz de atributos (grade) e VDP em lote permanecem **ocultos** quando o produto não é personalizável ou a quantidade é 1 sem variáveis — sem alterar estruturas legadas (`PRODUTO_FINITO` simples).

7. **Escala industrial e vendas corporativas**  
   - Suporte nativo a pedidos de **1 a 500+ unidades** na mesma linha de orçamento.  
   - Entrada de dados em massa via **importação CSV/Excel** mapeada ao `conjunto_campos` da estampa.  
   - Precificação composta: **preço base do produto** + **Custo de Setup** (fixo por linha) + **Faixas de Preço** (Quantity Breaks) do processo de decoração.

8. **Segurança por desenho (shift-left)**  
   - Multi-tenancy obrigatório em toda leitura/escrita; uploads isolados por loja; validação de esquema em JSON persistido.  
   - Ver seção **9. Requisitos de Segurança** abaixo.

---

## 6. Personas e jornadas

| Persona | Jornada principal |
|---------|-------------------|
| **Cadastro / admin** | Cria processos, estampas, conjuntos; vincula ao produto finito |
| **Vendedor** | No orçamento: adiciona caneca, personaliza, escolhe estampa, preenche nome |
| **Arte** | Aprova exceções; estampas catalogadas raramente passam por arte completa |
| **PCP** | Recebe só itens com processo de transformação |
| **Expedição** | Separa produto base; pode aguardar personalização em OS mista |

---

## 7. Métricas de sucesso (pós-implementação)

- Vendedor consegue orçar caneca **sem** e **com** estampa na mesma versão do sistema.
- Produto só estoque **não** aparece no kanban PCP após liberação da OS.
- Tempo de cadastro de nova estampa < cadastro duplicado por produto.
- Zero regressão em orçamentos só com `PRODUTO_FINITO` legado.
- **Pedido corporativo em lote:** orçar 100+ unidades com dados variáveis (VDP em lote) via planilha em menos de 5 minutos, sem duplicar linhas manualmente.
- **Matriz de atributos:** distribuir quantidades por variação (ex.: 20 P / 50 M / 30 G) na mesma linha, com soma validada = quantidade total.
- **Precificação industrial:** Custo de Setup cobrado uma vez por linha; valor unitário da personalização recalculado automaticamente ao cruzar faixas de Quantity Breaks.
- **Arte de produção:** geração de PDF multi-páginas print-ready para lotes VDP sem intervenção manual do designer.

---

## 8. Requisitos de Segurança (OWASP Top 10 — aplicáveis ao Catálogo)

Requisitos obrigatórios de arquitetura e implementação. Detalhamento técnico complementar em [04-modelo-de-dados.md](./04-modelo-de-dados.md) e [05-cadastros-crud.md](./05-cadastros-crud.md).

### 8.1 A01:2021 — Broken Access Control (BOLA)

| Requisito | Implementação esperada |
|-----------|------------------------|
| Isolamento multi-tenant | **Toda** query Prisma (leitura e escrita) de estampas, processos, conjuntos de campos, variações de produto, personalização de orçamento e validação de CSV deve incluir `where: { loja_id }` derivado do JWT — nunca confiar em `id` vindo do cliente sem validar propriedade. |
| Recursos globais | Se houver estampas/processos “globais” ou compartilhados entre lojas (futuro), exigir tabela de permissão explícita; padrão v1: **sem compartilhamento cross-tenant**. |
| Upload e download | Servir arquivos somente após checagem `arquivo.loja_id === usuario.loja_id`. |
| Importação CSV | Parser e persistência executados no contexto da loja autenticada; rejeitar `loja_id` no body da requisição. |

### 8.2 A03:2021 — Injection (CSV e JSON)

| Vetor | Mitigação |
|-------|-----------|
| **CSV / Excel — injeção de fórmulas** | Sanitizar campos de texto no upload VDP: prefixar ou rejeitar valores que iniciem com `=`, `+`, `-`, `@`, `\t` (tab) ou `\r` quando interpretados como início de célula. Normalizar para string literal antes de persistir. |
| **JSON polimórfico** | `valores_campos` / `valores_personalizacao` validados por **esquema Zod** (backend) e `class-validator` (DTO NestJS): chaves permitidas = definição do `conjunto_campos`; tipos e `max_caracteres` respeitados; array de objetos com tamanho ≤ quantidade da linha. |
| **SQL** | Manter Prisma parametrizado; proibir concatenação de SQL com dados do CSV. |

### 8.3 A04:2021 — Insecure Design

| Requisito | Implementação esperada |
|-----------|------------------------|
| Isolamento físico de uploads | `uploads/{loja_id}/estampas/`, `uploads/{loja_id}/arte-producao/`, `uploads/{loja_id}/vdp-imports/` — sem path traversal (`..`). |
| URLs temporárias | `preview_url` e arte gerada: expiração (TTL) ou **Signed URLs** em storage de nuvem; não expor paths internos permanentes. |
| VDP em lote | Merge PDF executado em job assíncrono com limite de páginas/tamanho por loja (rate limit). |

### 8.4 A05:2021 — Security Misconfiguration

| Requisito | Implementação esperada |
|-----------|------------------------|
| Whitelist MIME | Upload de arte-mestra e estampas: apenas `application/pdf`, `image/png`, `image/jpeg`, `image/svg+xml` (SVG com sanitização adicional se servido inline). Rejeitar `application/octet-stream` genérico. |
| Tamanho máximo | Limite configurável por env (`MAX_UPLOAD_ESTAMPA_MB`, `MAX_CSV_VDP_ROWS`); resposta `413` com mensagem clara. |
| CSV | Limite de linhas e colunas; encoding UTF-8 explícito na leitura. |

### 8.5 Retrocompatibilidade e superfície de ataque

- Produtos não personalizáveis **não expõem** endpoints de importação CSV nem UI de lote — reduz superfície de ataque e evita regressão.
- Campos novos (`custo_setup`, `faixas_preco`, grade) são opcionais com defaults seguros (`0.00`, `[]`).

---

## 9. Referências de mercado

- **Decorator / distributor promocional:** produto base + método de decoração + artwork template + variable data (VDP).
- **Print-on-demand:** template library + campos variáveis + prova automática.
- **Distinção pick vs make:** estoque separado; personalização = etapa de valor agregado antes da expedição.
