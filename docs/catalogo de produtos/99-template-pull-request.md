# Template de Pull Request — Epic Catálogo de Produtos e Personalização

**Branch:** `feature/catalogo-escala-e-seguranca`  
**Tipo:** Feature (Epic completa — Fases 0–9 + encerramento)  
**Destino sugerido:** `develop` / `main`  
**Data:** 2026-06-29

---

## Resumo executivo

Esta PR entrega o **motor completo de Catálogo e Personalização** no Comunikapp: cadastros industriais (processos, conjuntos de campos, estampas), vínculos em produto finito, orçamento V2 com VDP/CSV/grade, propagação comercial→operacional (OS/ItemOS), geração de arte print-ready (PDF multipáginas) e integração visual no Kanban PCP para download seguro da arte de produção.

**Status:** pronto para homologação.

---

## Escopo entregue

| Fase | Entrega |
|------|---------|
| 0–1 | Hub `/catalogo`, schema Prisma, migration aditiva |
| 2–4 | CRUD processos, conjuntos, estampas + upload arte-mestra OWASP |
| 5–6 | Vínculos produto finito + UI hub/CRUDs |
| 7 | Orçamento V2: personalização polimórfica, VDP, CSV, grade, preço industrial |
| 8 | Propagação orçamento→`ItemOS`, `modo_fulfillment`, logs imutáveis |
| 9 | `ArteProducaoService`, PDF VDP, storage tenant, download autenticado |
| Encerramento | Teste E2E estrutural, UI Kanban PCP, limpeza e documentação |

---

## 1. Mudanças no Schema (Prisma)

### Novas entidades

- `ProcessoDecoracao` — setup, faixas de preço, insumos aceitos
- `ConjuntoCampos` + `CampoVariavelDef` — definição de campos VDP (tipo, chave, obrigatoriedade)
- `Estampa` — arte-mestra, metadados de âncoras JSON, vínculos processo/conjunto
- `ProdutoFinitoModo`, `ProdutoFinitoEstampa`, `ProdutoFinitoProcesso` — junções N:M tenant-scoped
- `PersonalizacaoOrcamento` — snapshot comercial 1:1 com `ProdutoOrcamento`

### Extensões em entidades existentes

| Modelo | Campos novos |
|--------|----------------|
| `ProdutoFinito` | `personalizavel`, `fulfillment_padrao` |
| `ProdutoOrcamento` | relação `personalizacao` |
| `ItemOS` | `modo_fulfillment`, `personalizacao_modo`, `estampa_id`, `valores_personalizacao`, `grade_distribuicao`, `arte_producao_url` |

### Enums

- `CampoVariavelTipo`, `ModoPersonalizacao`, `FulfillmentPadrao`, `ModoFulfillmentItem`

### Migration

- `20260627120000_modulo_catalogo_personalizacao_fase1` — **somente aditiva**, sem drop de colunas legadas.

---

## 2. Padrão polimórfico do JSON (`valores_campos`)

O campo `PersonalizacaoOrcamento.valores_campos` e o espelho `ItemOS.valores_personalizacao` aceitam **dois formatos validados por Zod/DTO**:

### Modo objeto (inline / imprint livre)

```json
{
  "nome_colaborador": "Ana Silva",
  "departamento": "RH"
}
```

### Modo array (VDP — lote variável)

```json
[
  { "nome_colaborador": "Ana Silva", "departamento": "RH" },
  { "nome_colaborador": "Bruno Costa", "departamento": "TI" },
  { "nome_colaborador": "Carla Souza", "departamento": "Vendas" }
]
```

**Regras:**

- Limite de **500 registros** por lote (`MAX_CSV_VDP_ROWS`)
- Sanitização anti-injeção de fórmula CSV (`=`, `+`, `-`, `@` no início de células)
- Clonagem profunda (`JSON.parse/stringify`) na propagação orçamento→OS — **imutabilidade de auditoria**
- Log `PERSONALIZACAO_MIGRADA_ORCAMENTO` em `ordem_servico_logs` com snapshot `imutavel: true`

**Arquivos-chave:**

- `backend/src/orcamentos-v2/dto/personalizacao-orcamento.dto.ts`
- `backend/src/orcamentos-v2/services/transformacao-v2.service.ts`
- `backend/src/os/utils/item-os-personalizacao.util.ts`
- `frontend/src/lib/catalogo/csv-sanitizer.ts`
- `frontend/src/components/ui/orcamento/schemas/orcamento.schema.ts`

---

## 3. Estratégia segura de upload (OWASP)

### Arte-mestra de estampa

| Controle | Implementação |
|----------|----------------|
| **A01 BOLA** | Todas as queries/mutações filtram `loja_id` do JWT; ID de outra loja → 404 |
| **A03 Injeção** | Metadados de âncoras validados (`class-validator` + validador customizado) |
| **A04 Path traversal** | Storage fixo `uploads/{loja_id}/estampas/`; nome sanitizado |
| **A05 Misconfiguration** | Whitelist MIME + extensão cruzada; limite 15 MB |
| **Download** | `GET /catalogo/estampas/arte-mestra/:token` — streaming autenticado, sem path físico no HTML |

### Arte de produção VDP

| Controle | Implementação |
|----------|----------------|
| **Storage** | `uploads/{loja_id}/producao/prod_{uuid}.pdf` + `{uuid}.json` (meta) |
| **URL no banco** | Caminho lógico `/catalogo/producao/arquivo/{token}` — nunca expõe filesystem |
| **Download** | `GET /catalogo/item-os/:id/arte-producao` — valida `item_os_id` + `loja_id` via meta JSON |
| **Anti-IDOR** | Nome físico imprevisível; token UUID; validação cruzada meta↔item |
| **Headers** | `Content-Disposition: inline`, `X-Content-Type-Options: nosniff` |

**Arquivos-chave:**

- `backend/src/catalogo/estampas/estampa-arte-mestra.service.ts`
- `backend/src/catalogo/producao/producao-storage.util.ts`
- `backend/src/catalogo/producao/arte-producao.controller.ts`
- `backend/src/config/multer-estampa-arte-mestra.config.ts`

---

## 4. Roteamento inteligente (`modo_fulfillment`)

Motor em `item-os-personalizacao.util.ts`:

| Cenário | Resultado |
|---------|-----------|
| Produto não finito / sem personalização | `PICK` |
| Personalizável + `FulfillmentPadrao.PRODUCAO` | `MAKE` |
| Personalizável + `ESTOQUE` ou `HIBRIDO` | `HIBRIDO` (reserva base + PCP) |

**Efeitos operacionais:**

- `PICK` → expedição/separação; **não** aparece no Kanban PCP industrial
- `MAKE` / `HIBRIDO` → elegível PCP; dispara geração assíncrona de arte VDP na criação da OS
- `ArteProducaoService.agendarGeracaoItemOS` via `criarOSDeOrcamento`

---

## 5. Frontend — integrações

### Orçamento V2

- Componentes em `frontend/src/components/ui/orcamento/catalogo/`
- Grade de atributos, toggle VDP inline/CSV, mapeamento de colunas
- Cálculo industrial: base + setup + quantity breaks (`personalizacao-preco.ts`)

### Kanban PCP

- `ArteProducaoVdpControle` nos cards do Kanban por setores e na fila do operador
- Botão **⬇️ Baixar Arte Print-Ready (VDP)** quando `arte_producao_url` preenchida
- Badge **⏳ Gerando Arquivo de Produção...** quando pendente
- Download via `catalogoArteProducaoApi.downloadArteProducao` com Bearer token — **sem URL estática no DOM**

### Backend PCP

- `KanbanMapper.mapearInstanciaParaKanban` expõe `item_os_id`, `modo_fulfillment`, `arte_producao_url`, `personalizacao_modo`

---

## 6. Testes

### E2E estrutural (sem banco)

```bash
cd backend && npm run test:e2e:catalogo
```

Arquivo: `backend/src/catalogo/__tests__/catalogo-ponta-a-ponta.e2e-spec.ts`

**Cenários cobertos:**

1. `montarItensOSDoOrcamento` → `modo_fulfillment: HIBRIDO` + snapshot JSON imutável
2. `ArteProducaoService.gerarArteProducaoItemOS` → PDF válido em storage temporário + cleanup
3. Motor de roteamento `MAKE` para `FulfillmentPadrao.PRODUCAO`

### Unitários existentes

- `backend/src/catalogo/producao/__tests__/vdp-valores.util.spec.ts`
- `backend/src/orcamentos-v2/services/transformacao-v2.service.spec.ts`

---

## 7. Como validar manualmente (homologação)

1. Cadastrar processo + conjunto de campos + estampa com arte-mestra PDF
2. Vincular produto finito personalizável (`fulfillment: HIBRIDO`)
3. Criar orçamento V2 com lote VDP (3 registros) e converter em OS
4. Verificar `ItemOS.modo_fulfillment` e `valores_personalizacao` no banco
5. Aguardar/confirmar `arte_producao_url` preenchida
6. Abrir PCP → Kanban → card do item → baixar arte via botão autenticado
7. Confirmar que produto legado (`personalizavel: false`) não quebrou fluxo PICK

---

## 8. Checklist de revisão para o revisor

- [ ] Todas as queries novas incluem `loja_id` (BOLA)
- [ ] Migration é aditiva; rollback seguro
- [ ] Nenhum path físico de upload exposto no frontend
- [ ] `valores_campos` polimórfico validado nos dois formatos
- [ ] Produto finito legado testado (regressão orçamento prateleira)
- [ ] `npm run build` backend e frontend sem erros
- [ ] `npm run test:e2e:catalogo` passando

---

## 9. Riscos conhecidos / follow-ups

| Item | Status |
|------|--------|
| Preview arte com TTL / Signed URL (A04) | Backlog Fase 10 |
| Testes unitários CRUD catálogo | Parcial — E2E estrutural cobre fluxo crítico |
| Merge PDF com arte-mestra real (canvas/CLI) | Provider extensível; v1 gera PDF texto para imprint livre |

---

## 10. Comandos de build

```bash
# Backend
cd backend && npm run build && npm run test:e2e:catalogo

# Frontend
cd frontend && npm run build
```

---

## Referências internas

- `docs/catalogo de produtos/04-modelo-de-dados.md`
- `docs/catalogo de produtos/07-fluxo-orcamento.md`
- `docs/catalogo de produtos/08-integracao-operacional.md`
- `docs/catalogo de produtos/11-checklist-progresso.md`
