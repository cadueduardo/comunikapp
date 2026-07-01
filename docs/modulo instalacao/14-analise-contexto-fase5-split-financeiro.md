# Análise de contexto — Fase 5 (Engine PDF + Split Financeiro / OS Aditiva)

**Versão:** 1.0  
**Data:** 2026-07-01  
**Status:** Análise de engenharia — pré-implementação  
**Público-alvo:** Produto, desenvolvimento core e code review arquitetural  
**Relacionado:** [`13-plano-split-financeiro-os-aditiva.md`](./13-plano-split-financeiro-os-aditiva.md), [`06-relatorio-fase-5-pdf-e-fechamento.md`](./06-relatorio-fase-5-pdf-e-fechamento.md)

---

## 1. Objetivo desta análise

Validar se o repositório está pronto para dar início à **evolução da Fase 5** focada em:

- Engine do Relatório Técnico (PDF) consolidando OS pai + OS Aditivas;
- Split Financeiro via `InstalacaoSplitFinanceiroService` (OS Aditiva `OS-XXXX-A1`);
- Fluxo de precificação gestor e `calcularMargemRealOs` com custo operacional + receita aditiva.

**Diretrizes de desenvolvimento consideradas:**

- Zero CSS inline — Tailwind + tokens de tema (dark/light).
- OWASP / IDOR — toda query e mutação com `loja_id` do token; não confiar em IDs de body sem validação de tenant.
- DRY — reutilizar `components/ui` e módulos existentes.
- Interface em pt-BR (UTF-8).
- PATCH robustos com chaves por entidade e controle de versão (rascunhos).

---

## 2. Veredito executivo

| Pergunta | Resposta |
|----------|----------|
| Contexto completo para planejar? | **Sim** |
| Migration aditiva pronta para `migrate deploy`? | **Não** |
| Pode iniciar código de serviços sem migration? | **Não** |
| Serviço correto para OS Aditiva? | **`InstalacaoSplitFinanceiroService`** (módulo `instalacao`), não `ExpedicaoFinanceiroService` |

---

## 3. Validação da migration aditiva

### 3.1 Veredito: não está pronta para executar

| Item do plano (doc 13) | Estado no repositório |
|------------------------|------------------------|
| `StatusFinanceiroOcorrencia` | ❌ Não existe no `schema.prisma` |
| `status_financeiro`, `custo_sugerido`, `preco_sugerido`, `os_aditiva_id`, `versao` em `OcorrenciaInstalacao` | ❌ Modelo ainda com `custo_interno` / `preco_cliente` **NOT NULL** |
| `os_pai_id`, `tipo_vinculo_os`, `pular_*` em `OrdemServico` | ❌ Ausentes |
| `OrcamentoAditivoInstalacao` | ❌ Ausente |
| Migration SQL correspondente | ❌ Nenhuma migration com `os_pai`, `status_financeiro` ou `aditiva` |

### 3.2 O que já existe (Fase 5 anterior — PDF legado)

| Artefato | Situação |
|----------|----------|
| Migration `20260630180000_instalacoes_fase5_relatorio_pdf` | ✅ Tabela `relatorios_tecnicos_instalacao` + status `A_FATURAR` em parcelas |
| `InstalacaoRelatorioPdfService` | ✅ Engine PDF com `pdf-lib` |
| `InstalacaoSplitFiscalService` | ✅ Segregação NF-e / NFS-e |
| `InstalacaoPosCalculoService` | ✅ `aprovarFinanceiroOs`, parcela extra na cobrança pai |

### 3.3 Pré-requisitos da nova migration

Criar migration aditiva (sugestão: `2026070XXXXX_instalacao_split_financeiro_os_aditiva`):

1. Enum + colunas em `ocorrencias_instalacao` (tornar `custo_interno` / `preco_cliente` nullable).
2. Colunas + relação self em `ordens_servico` (`os_pai_id`, `tipo_vinculo_os`, `pular_pcp`, `pular_expedicao`, `pular_validacao_estoque`).
3. Tabela `orcamentos_aditivos_instalacao` (nome alinhado ao padrão do projeto).
4. **Backfill** legado: `preco_cliente > 0` → `PRECIFICADO` + copiar para `custo_sugerido` / `preco_sugerido`.
5. Índices `(loja_id, status_financeiro, criado_em)`.

**Risco:** alterar `NOT NULL` → `NULL` exige script de backfill na mesma migration. Sem isso, `migrate deploy` pode falhar ou deixar inconsistência.

---

## 4. `ExpedicaoFinanceiroService` vs `InstalacaoSplitFinanceiroService`

### 4.1 Situação atual

`ExpedicaoFinanceiroService` **já existe** em `backend/src/expedicao/services/expedicao-financeiro.service.ts`.

**Responsabilidade atual:** trava de entrega/expedição por parcela SALDO em aberto — **não** gera OS Aditiva nem precifica ocorrências.

Referência: `verificarBloqueioEntrega`, `assertEntregaLiberada`, `assertMovimentoKanbanLiberado`.

### 4.2 Recomendação arquitetural

| Serviço | Responsabilidade |
|---------|------------------|
| `InstalacaoSplitFinanceiroService` **(novo)** | OS Aditiva, orçamento sintético, cobrança, lock de ocorrências |
| `InstalacaoSplitFiscalService` *(existente)* | Segregação NF-e / NFS-e |
| `InstalacaoRelatorioPdfService` *(existente)* | Engine PDF — evoluir para incluir aditivas |
| `InstalacaoPosCalculoService` *(existente)* | `calcularMargemRealOs` + `aprovarFinanceiroOs` — evoluir |
| `ExpedicaoFinanceiroService` *(existente)* | Manter escopo de trava logística/financeira da expedição |

**Não** expandir `ExpedicaoFinanceiroService` com lógica de OS Aditiva (viola separação de domínio).

### 4.3 Estrutura proposta (esqueleto — pré-implementação)

```
backend/src/instalacao/
  services/
    instalacao-split-financeiro.service.ts
    instalacao-split-financeiro.service.spec.ts
  dto/
    precificar-ocorrencia.dto.ts
    gerar-os-aditiva.dto.ts
  constants/
    status-financeiro-ocorrencia.enum.ts
```

**Registro no módulo** (`instalacao.module.ts`):

- `providers`: adicionar `InstalacaoSplitFinanceiroService`
- `imports`: `FinanceiroModule` (com `forwardRef` se houver ciclo com `CobrancasService`)
- `exports`: exportar se outros módulos precisarem

### 4.4 Contrato IDOR (OWASP)

Todo método deve:

1. Receber `lojaId` do decorator `@LojaId()` (nunca do body).
2. Usar `where: { loja_id: lojaId }` em todas as queries Prisma.
3. Para ocorrências: validar `ocorrencia.loja_id === lojaId` **e** que `os_id` pertence à mesma loja.
4. Retornar `404` (não `403`) quando recurso não existe no tenant — evita enumeração de IDs.

Padrão já adotado em `InstalacaoService.obterPainelOs(lojaId, osId)`.

### 4.5 Alinhamento de terminologia

| Briefing / conversa | Doc 13 | Decisão sugerida |
|---------------------|--------|------------------|
| `LOCKED` | `FATURADO` | Unificar em **`FATURADO`** no enum Prisma; “locked” = regra de imutabilidade pós-faturamento |
| `rootOsId` | `os_pai_id` / `os_id` na ocorrência | `os_id` na ocorrência = OS pai; `os_pai_id` na OS filha; `os_aditiva_id` na ocorrência após faturar |

---

## 5. Gap: Fase 5 “concluída” vs evolução atual

Há **sobreposição de nomenclatura** entre o relatório [`06-relatorio-fase-5-pdf-e-fechamento.md`](./06-relatorio-fase-5-pdf-e-fechamento.md) e esta evolução.

| Entregue (doc 06) | A construir agora (doc 13) |
|-------------------|----------------------------|
| PDF com 5 blocos | PDF consolidando **OS pai + OS Aditivas** sem double-count |
| Split fiscal por ocorrência na cobrança pai | Split via **OS Aditiva** + cobrança própria |
| Parcela extra em `executarLiberacaoComercialEmTransacao` | Remover/substituir por validação “sem pendências” |
| `calcularMargemRealOs` só com `Σ custo_interno` | Incluir **receita aditiva** + custo operacional de instalação |

### 5.1 Código atual de margem (a evoluir)

`InstalacaoPosCalculoService.calcularMargemRealOs`:

- Agrega `_sum.custo_interno` de todas as ocorrências da OS.
- Fórmula: `lucro_real = valor_orcado - custo_orcado - custosExtras`.

**Evolução proposta:**

- **Custo:** `Σ custo_interno` (status `PRECIFICADO` / `FATURADO`) + custo operacional de instalação do orçamento (`instalacao_custo_mao_obra`, `instalacao_custo_deslocamento`).
- **Receita:** `valor_orcado` + `Σ preco_cliente` faturado em aditivas.
- **Margem:** considerar receita total vs custo total (não apenas descontar custo extra do valor orçado).

---

## 6. Plano de implementação frontend (reuso DRY)

Não existe componente literal `QuickActions` / `DetailView`. Equivalentes no projeto:

| Padrão existente | Caminho | Uso na feature |
|------------------|---------|----------------|
| Ação rápida | `OcorrenciaRapidaDialog` | Registro de ocorrência (manter) |
| Detail view OS/lote | `InstalacaoWorkspacePanel`, `InstalacaoLoteDetalhePanel` | Contexto operacional |
| Fechamento financeiro | `InstalacaoRelatorioTecnicoCard` | **Hub principal** (`/financeiro/recebimentos`) |
| Split fiscal | `InstalacaoSplitFiscalCard` | Bloco NF-e / NFS-e |
| UI base | `Card`, `Badge`, `Table`, `AlertDialog`, `Button` | Zero CSS inline |

### 6.1 Fase FE-1 — Tipos e API (BFF)

Estender:

- `frontend/src/lib/instalacao/instalacao.types.ts`
- `frontend/src/lib/instalacao/instalacao-api.ts`

Novos tipos/endpoints:

- `StatusFinanceiroOcorrencia`
- `PrecificarOcorrenciaPayload` (PATCH com `versao`)
- `gerarOsAditiva(osPaiId)`
- `listarFilaPrecificacao()`, `contadoresPendencias()`

Rotas BFF em `frontend/src/app/api/instalacao/...` (proxy JWT, padrão existente).

### 6.2 Fase FE-2 — Fila transversal (gestor)

Nova aba **Pendências** em `/instalacao`:

- Reutilizar `Table`, `Input`, `Select` de `InstalacaoOsGrid`.
- Novo `InstalacaoOcorrenciasFilaGrid` (sem duplicar primitivas).
- `PrecificarOcorrenciaDrawer` com `Sheet` ou `Dialog` de `components/ui`.
- Badge de contador no menu (padrão `contadores-menu.service.ts`).

### 6.3 Fase FE-3 — Fechamento financeiro (Detail View)

Evoluir **`InstalacaoRelatorioTecnicoCard`**:

```
┌─ InstalacaoRelatorioTecnicoCard ─────────────────────┐
│ Status OS · Métricas (lotes, ocorrências, extras)     │
├─ Seção: Ocorrências por status financeiro ───────────┤
│   → Precificar inline / link para fila               │
├─ Seção: OS Aditivas (filhas) ────────────────────────┤
│   → Lista OS-042-A1, valor, link financeiro          │
│   → Botão "Gerar OS Aditiva" (se PRECIFICADO)        │
├─ InstalacaoSplitFiscalCard (preview sem double-count) │
├─ Margem real (expandir grid existente)               │
└─ Aprovar faturamento (AlertDialog existente) ────────┘
```

**Persistência de rascunho:** estado local no drawer + PATCH ao salvar (`custo_interno`, `preco_cliente`, `versao`, `observacao_gestor`); 409 em conflito → toast + recarregar entidade.

### 6.4 Fase FE-4 — PDF

- Reutilizar botão "Baixar PDF" existente.
- Exibir seção "Valores faturados em OS Aditiva" no card antes da aprovação.
- Não criar terceiro card de split — estender `InstalacaoSplitFiscalCard`.

### 6.5 Componentes que não criar

- Nova tabela genérica (usar `Table` existente).
- Novo modal de confirmação (usar `AlertDialog` do card financeiro).
- Novo formatador de moeda (usar `formatarMoeda` de `financeiro-format`).

---

## 7. Checklist de completude do contexto

| Área | Completo? | Observação |
|------|-----------|------------|
| Dor de negócio / fluxo 3 etapas | ✅ | Doc 13 + briefing |
| Schema alvo | ✅ | Especificado no doc 13, não aplicado |
| Migration executável | ❌ | **Bloqueador #1** |
| Padrão IDOR / `@LojaId()` | ✅ | Já usado em `obterPainelOs` |
| Engine PDF base | ✅ | `InstalacaoRelatorioPdfService` — evoluir |
| Split fiscal base | ✅ | `InstalacaoSplitFiscalService` — evoluir anti double-count |
| Serviço OS Aditiva | ❌ | **Bloqueador #2** — criar `InstalacaoSplitFinanceiroService` |
| Guards PCP/expedição para aditiva | ⚠️ Parcial | Flags no schema; hooks em `OSService` / `ExpedicaoCriacaoService` pendentes |
| Orçamento sintético + cobrança | ⚠️ Parcial | `CobrancasService.criarCobrancaParaOrcamento` existe; falta factory de orçamento aditivo |
| Frontend fechamento | ✅ base | `InstalacaoRelatorioTecnicoCard` é ponto de extensão |
| Decisões D1–D5 (doc 13 §8) | ⚠️ | Recomendações existem; falta fechamento formal de produto |
| Terminologia LOCKED / ExpedicaoFinanceiro | ⚠️ | Alinhar antes de codar (ver §4.5) |

---

## 8. Ordem de execução recomendada

1. **Migration + `prisma generate`** (Fase A do doc 13).
2. **`InstalacaoSplitFinanceiroService`** (esqueleto + `gerarOsAditiva` transacional).
3. Ajustar `registrarOcorrenciaObra` → `PENDENTE_PRECIFICACAO` sem valores finais.
4. Endpoints precificação + fila (guards + IDOR).
5. Evoluir `InstalacaoSplitFiscalService` + `InstalacaoRelatorioPdfService`.
6. Evoluir `calcularMargemRealOs` e `aprovarFinanceiroOs` (remover parcela extra).
7. Frontend: fila Pendências + evolução do `InstalacaoRelatorioTecnicoCard`.

---

## 9. Decisões pendentes de confirmação (produto)

Antes do primeiro commit de código:

| # | Decisão | Opção recomendada |
|---|---------|-------------------|
| 1 | Nome do serviço | `InstalacaoSplitFinanceiroService` |
| 2 | Status pós-faturamento | `FATURADO` (imutável), não `LOCKED` separado |
| 3 | Primeiro passo de código | Fase A: migration + schema |
| 4 | Feature flag migração parcela extra | `INSTALACAO_OS_ADITIVA` por loja (doc 13 D5) |

---

## 10. Referências no código

| Arquivo | Papel |
|---------|-------|
| `backend/prisma/schema.prisma` | `OcorrenciaInstalacao`, `OrdemServico`, `Cobranca` |
| `backend/src/instalacao/services/instalacao.service.ts` | `registrarOcorrenciaObra`, `obterPainelOs` |
| `backend/src/instalacao/services/instalacao-pos-calculo.service.ts` | Margem, aprovação financeira, parcela extra |
| `backend/src/instalacao/services/instalacao-relatorio-pdf.service.ts` | Engine PDF |
| `backend/src/instalacao/services/instalacao-split-fiscal.service.ts` | Split NF-e / NFS-e |
| `backend/src/expedicao/services/expedicao-financeiro.service.ts` | Trava expedição (escopo distinto) |
| `backend/src/instalacao/instalacao.module.ts` | DI NestJS |
| `frontend/src/components/financeiro/InstalacaoRelatorioTecnicoCard.tsx` | UI fechamento financeiro |
| `frontend/src/components/instalacao/InstalacaoSplitFiscalCard.tsx` | UI split fiscal |
| `frontend/src/components/instalacao/OcorrenciaRapidaDialog.tsx` | Quick action ocorrência |

---

## 11. Histórico de revisões

| Versão | Data | Alteração |
|--------|------|-----------|
| 1.0 | 2026-07-01 | Análise de contexto pré-implementação Fase 5 evolutiva |
