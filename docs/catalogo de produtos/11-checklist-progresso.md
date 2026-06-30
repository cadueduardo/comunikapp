# 11 — Checklist de progresso — Catálogo de Produtos e Personalização

**Branch:** `feature/catalogo-escala-e-seguranca`  
**Documentação base:** v0.2 (2026-06-26)  
**Última atualização:** 2026-06-29

---

## Status atual

| Item | Valor |
|------|-------|
| **Fase ativa** | Encerramento da Epic — homologação |
| **Status geral** | **FINALIZADO / PRONTO PARA HOMOLOGAÇÃO** |
| **Próximo passo** | Revisão de PR, deploy em ambiente de homologação e validação comercial |

---

## Fase 10 — Testes, qualidade e encerramento

### 10.1 Testes de integração

- [x] E2E estrutural `catalogo-ponta-a-ponta.e2e-spec.ts` (orçamento VDP → ItemOS → PDF)
- [x] Script dedicado `npm run test:e2e:catalogo`
- [x] Cleanup automático de arquivos temporários no disco após testes
- [x] Asserções: `modo_fulfillment` HIBRIDO/MAKE, snapshot JSON imutável, PDF no storage tenant

### 10.2 Qualidade e preparação de PR

- [x] Varredura de `console.log` / debug nos módulos de catálogo e orçamento V2
- [x] Template de PR técnico (`99-template-pull-request.md`)
- [x] `npm run build` backend validado
- [x] Build frontend validado

### 10.3 Integração UI — Kanban PCP

- [x] `ArteProducaoVdpControle` nos cards do Kanban por setores (`/pcp`)
- [x] `ArteProducaoVdpControle` na fila do operador (`FilaOperador`)
- [x] Download seguro via `GET /catalogo/item-os/:id/arte-producao` com Bearer token
- [x] Badge `⏳ Gerando Arquivo de Produção...` quando `arte_producao_url` nula
- [x] Backend: `KanbanMapper` expõe `item_os_id`, `modo_fulfillment`, `arte_producao_url`

---

## Fase 0 — Hub e navegação

- [x] Página hub `/catalogo` com cards (sem KPIs)
- [x] Menu lateral: **Catálogo de produtos**
- [x] Card Produtos → grid produtos finitos (`/produtos-finitos`)
- [x] Cards Personalização, Estampas, Conjuntos (rotas reais)
- [ ] Redirect `/produtos-finitos` mantido
- [ ] Modelos de Orçamento sem alteração no menu
- [ ] Critério: zero regressão em orçamento prateleira

---

## Fase 1 — Modelagem de banco (Prisma)

### 1.1 Schema — entidades novas

- [x] `ProcessoDecoracao` (`processos_decoracao`) — setup, faixas_preco, insumos_aceitos
- [x] `ConjuntoCampos` (`conjuntos_campos`)
- [x] `CampoVariavelDef` (`campos_variaveis_def`) + enum `CampoVariavelTipo`
- [x] `Estampa` (`estampas`) — metadados JSON, vínculos processo/conjunto
- [x] `ProdutoFinitoModo` (`produto_finito_modos`)
- [x] `ProdutoFinitoEstampa` (`produto_finito_estampas`)
- [x] `ProdutoFinitoProcesso` (`produto_finito_processos`)
- [x] `PersonalizacaoOrcamento` (`personalizacao_orcamento`)

### 1.2 Schema — extensões

- [x] `ProdutoFinito`: `personalizavel`, `fulfillment_padrao`
- [x] `ProdutoOrcamento`: relação 1:1 com `PersonalizacaoOrcamento`
- [x] `ItemOS`: `modo_fulfillment`, `personalizacao_modo`, `estampa_id`, `valores_personalizacao`, `grade_distribuicao`, `arte_producao_url` (catálogo)

### 1.3 Enums

- [x] `CampoVariavelTipo` (TEXTO, NUMERO, DATA)
- [x] `ModoPersonalizacao` (NENHUM, ESTAMPA, IMPRINT_LIVRE, ARTE_SOB_MEDIDA)
- [x] `FulfillmentPadrao` (ESTOQUE, PRODUCAO, HIBRIDO)
- [x] `ModoFulfillmentItem` (PICK, MAKE, HIBRIDO)

### 1.4 Índices e segurança (BOLA)

- [x] Índices compostos `(loja_id, id)` em entidades tenant-scoped
- [x] Índices `(loja_id, ativo)` em processos e estampas
- [x] `loja_id` em tabelas de vínculo N:M com produto finito

### 1.5 Validação e migration

- [x] `npx prisma validate` sem erros
- [x] Migration SQL gerada (`20260627120000_modulo_catalogo_personalizacao_fase1`)
- [x] Schema aplicado ao banco de dev (`prisma db push` + `migrate resolve`)
- [x] `npx prisma generate` executado
- [x] Migration registrada no histórico Prisma

---

## Fase 2 — CRUD Backend: Personalização (processos)

- [x] `CatalogoModule` / submódulo NestJS
- [x] `GET/POST /catalogo/personalizacao`
- [x] `GET/PATCH/DELETE /catalogo/personalizacao/:id`
- [x] Validação `faixas_preco` e `insumos_aceitos` (class-validator)
- [x] Queries sempre com `where: { loja_id }` + `updateMany` tenant-scoped
- [x] Soft delete (`ativo: false`)
- [ ] Testes unitários básicos

---

## Fase 3 — CRUD Backend: Conjuntos de campos

- [x] API CRUD `conjuntos_campos` + campos filhos
- [x] Validação chaves únicas por conjunto
- [x] Sanitização de chaves (regex snake_case)
- [x] Soft delete (`ativo: false`)
- [ ] Testes unitários básicos

---

## Fase 4 — CRUD Backend: Estampas

- [x] API CRUD estampas (`GET/POST /catalogo/estampas`, `GET/PATCH/DELETE /catalogo/estampas/:id`)
- [x] Filtro `produto_finito_id` na listagem (estampas compatíveis com produto)
- [x] BOLA: `findOne` / mutações via `assertEstampaDaLoja` + `updateMany` com `loja_id` (404 se ID de outra loja)
- [x] Validação estrita de `metadados` (âncoras): `Array<{ campoDefId, x, y, width, height }>`
- [x] Upload arte-mestra (`POST /catalogo/estampas/:id/arte-mestra`)
- [x] Armazenamento isolado por tenant: `uploads/{loja_id}/estampas/`
- [x] Whitelist MIME + extensão cruzada (A05): PDF, PNG, JPEG, SVG
- [x] Limite 15 MB por arquivo (mitigação DoS)
- [x] Sanitização de nome original (anti path traversal `../`, barras, caracteres perigosos)
- [x] URL relativa estável em `arte_mestra_url` após upload
- [x] `GET /catalogo/estampas/arte-mestra/:token` — entrega autenticada tenant-scoped
- [ ] Testes unitários básicos

### Notas de segurança — upload arte-mestra

| Controle | Implementação |
|----------|----------------|
| **A01 BOLA** | Upload e download validam `loja_id` do JWT; estampa inexistente ou de outra loja → 404 |
| **A03 Injeção** | Metadados de âncoras validados via `class-validator` + validador customizado (chaves estritas, números finitos, `width`/`height` > 0) |
| **A04 Path traversal** | Diretório fixo `uploads/{loja_id}/estampas/`; nome sanitizado (remove `..`, paths absolutos, chars não permitidos) |
| **A05 Misconfiguration** | `FileInterceptor` + `fileFilter` Multer: MIME **e** extensão devem coincidir na whitelist |
| **DoS** | `limits.fileSize` = 15 MB; buffer em memória (`memoryStorage`) com escrita controlada no service |

---

## Fase 5 — Backend: Produto finito (vínculos)

- [x] PATCH produto: `personalizavel`, `fulfillment_padrao`, `modos_personalizacao`, `estampa_ids`, `processo_ids`
- [x] `GET .../para-orcamento` enriquecido com modos, estampas (conjunto completo) e processos livres
- [x] Validação cross-tenant nos vínculos (BOLA — 404 genérico se ID de outra loja)
- [x] Persistência atômica via `prisma.$transaction` (delete + createMany nas tabelas N:M)
- [x] Limpeza automática dos vínculos quando `personalizavel: false`

### Notas de integridade — Fase 5

| Regra | Implementação |
|-------|----------------|
| **BOLA (A01)** | `assertEstampasAtivasDaLoja` / `assertProcessosAtivosDaLoja` antes da transação |
| **Atomicidade** | `$transaction`: update `ProdutoFinito` + replace `ProdutoFinitoModo` / `Estampa` / `Processo` |
| **Denormalização** | `loja_id` gravado em cada linha das junções conforme schema |
| **Orçamento** | `personalizacao` no `para-orcamento`: modos, estampas com `ConjuntoCampos.campos`, processos com faixas/setup |

---

## Fase 6 — Frontend: Hub e CRUDs

- [x] Hub `/catalogo` (cards com tokens de tema — sem CSS inline)
- [x] Lista + formulário Personalização (setup + faixas) — padrão `CrudPage` + `ProdutoFinitoForm`
- [x] Lista + formulário Conjuntos de campos
- [x] Grid Estampas com thumbnails (`ProdutoFinitoThumb` reutilizado)
- [x] Aba Personalização no `ProdutoFinitoForm` (switch, modos, estampas com thumb, processos, fulfillment)

---

## Fase 7 — Orçamento (UI + persistência)

- [x] UI modo estampa / imprint livre (`ProdutoFinitoPersonalizacaoOrcamento`, `EstampaThumbGrid`)
- [x] Mini-grade Matriz de Atributos (`GradeDistribuicaoMini` — exibida quando `grade_atributos_def` não vazio)
- [x] VDP: alternância Inline vs CSV + mapeamento colunas (`VdpModoToggle`, `CsvColumnMapper`)
- [x] Cálculo: base + setup + quantity breaks (`personalizacao-preco.ts`)
- [x] Persistência `PersonalizacaoOrcamento` polimórfica (DTO + `transformacao-v2.service`)
- [x] Sanitização fórmulas CSV (A03) (`csv-sanitizer.ts`)

---

## Fase 8 — OS e roteamento operacional

- [x] Propagação orçamento → `ItemOS` (`personalizacao_modo`, `estampa_id`, `valores_personalizacao`, `grade_distribuicao`)
- [x] `modo_fulfillment` derivado automaticamente (`item-os-personalizacao.util.ts`)
- [x] Elegibilidade PCP vs expedição por item (PICK ignora kanban; MAKE/HIBRIDO seguem fluxo industrial)
- [x] Snapshot imutável em `ordem_servico_logs` (`PERSONALIZACAO_MIGRADA_ORCAMENTO`)
- [x] BOLA na conversão (`findFirst` com `loja_id`, validação tenant do produto finito)

---

## Fase 9 — Arte de produção VDP (refinamento)

- [x] Job merge PDF multi-páginas (`VdpPdfMergeProvider` + `pdf-lib`)
- [x] `arte_producao_url` print-ready (`ArteProducaoService`, path `uploads/{loja_id}/producao/`)
- [x] Download autenticado `GET /catalogo/item-os/:id/arte-producao` (BOLA + nomes imprevisíveis anti-IDOR)
- [x] Logs `ARTE_PRODUCAO_CONSOLIDADA` / `ARTE_PRODUCAO_FALHA` em `ordem_servico_logs`
- [x] Geração assíncrona ao criar OS com itens `MAKE`/`HIBRIDO`
- [ ] Preview com TTL / Signed URL (A04) — refinamento futuro

### Arquitetura segura (Fase 9)

| Camada | Implementação |
|--------|----------------|
| **Storage** | `uploads/{loja_id}/producao/prod_{uuid}.pdf` — sem ID de OS no nome físico |
| **URL DB** | Caminho interno `/catalogo/producao/arquivo/{token}` |
| **Download** | Endpoint tenant-scoped com JWT; validação `item_os_id` no meta JSON |
| **VDP** | Sanitização `=+-@` antes do merge; limite 500 registros |
| **Merge** | Provider isolado (`VdpPdfMergeProvider`) — extensível para CLI/canvas |

---

## Segurança transversal (OWASP)

- [x] Modelo com `loja_id` + índices BOLA documentados no schema
- [x] Guards/services: `findFirst` / `updateMany` com `id` + `loja_id`
- [x] Upload isolado por tenant (`uploads/{loja_id}/estampas/`, BOLA no upload/download)
- [x] Zod schema `valores_campos` (objeto | array) — orçamento
- [x] Limites CSV (`MAX_CSV_VDP_ROWS` = 500)

---

## Checklist antes de cada PR

- [x] `loja_id` em todas as queries novas
- [x] Produto finito legado (`personalizavel=false`) testado
- [x] Migration aditiva apenas
- [x] `11-checklist-progresso.md` atualizado
- [x] Docs RP atualizados (`99-template-pull-request.md`)

---

## Histórico de entregas

| Data | Entrega | Fase |
|------|---------|------|
| 2026-06-26 | Checklist criado; schema Prisma Fase 1 completo | Fase 1 |
| 2026-06-27 | Migration aplicada; CRUD Personalização + Conjuntos de campos | Fase 1–3 |
| 2026-06-27 | CRUD Estampas + upload seguro arte-mestra (OWASP A01/A03/A04/A05) | Fase 4 |
| 2026-06-27 | Frontend hub `/catalogo` + CRUDs (componentes globais, tema light/dark) | Fase 0/6 |
| 2026-06-27 | Vínculos ProdutoFinito + `para-orcamento` enriquecido (transação Prisma, BOLA) | Fase 5 |
| 2026-06-27 | Aba Personalização no `ProdutoFinitoForm` (modos, estampas, processos, fulfillment) | Fase 6 |
| 2026-06-27 | Orçamento V2: UI personalização, VDP/CSV, grade, preço industrial, persistência | Fase 7 |
| 2026-06-27 | Propagação personalização orçamento→OS, motor `modo_fulfillment`, logs imutáveis | Fase 8 |
| 2026-06-27 | Motor arte produção VDP (PDF multipáginas, storage seguro, download autenticado) | Fase 9 |
| 2026-06-29 | Encerramento Epic: E2E estrutural, UI Kanban PCP, limpeza, template PR | Fase 10 |
