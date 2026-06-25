# Plano de Ação Técnico — Módulo de Expedição e Pós-Produção

**Público-alvo:** Desenvolvedor Core / Code Review arquitetural  
**Branch:** `feature/modulo-expedicao`  
**Fase atual:** Schema aprovado (migração `20260625100000_add_modulo_expedicao` pendente de apply em ambiente)  
**Escopo deste documento:** Fase 2 (Backend NestJS) + Fase 3 (Frontend Next.js)  
**Documento relacionado:** `ComunikApp - Especificação Técnica - Módulo de Expedição e Pós-Produção.pdf`

---

## Diretrizes obrigatórias de implementação

### Encoding e localização (UTF-8)

- **SEMPRE** salvar arquivos de código, comentários, mensagens de API, logs visíveis ao usuário e este documento em **UTF-8** com acentuação correta em **pt-BR**.
- Proibido substituir acentos por entidades HTML (`&aacute;`) ou transliteração (`expedicao` no lugar de `expedição`) em textos de interface e respostas da API.
- Validar no editor/IDE que o encoding do arquivo é UTF-8 antes de commitar.
- Mensagens de erro, labels de Kanban, modais e toasts devem usar português brasileiro consistente com o restante do ComunikApp (ex.: «Devolver para Produção», «Bloqueio Financeiro», «Aguardando Separação»).

### Reutilização de componentes globais

- **SEMPRE** reutilizar os componentes globais já existentes no projeto. **Não** recriar primitives de UI (botão, card, dialog, input) nem um segundo Kanban do zero.
- O módulo de expedição é uma **camada de composição** sobre a design system e os padrões de `(main)` — especialmente PCP e OS.
- Novos componentes em `components/expedicao/` devem ser **específicos de domínio** (card de expedição, canvas de assinatura, modal de bloqueio financeiro). Tudo que for genérico continua em `components/ui/`.
- Antes de criar um componente novo, verificar se já existe equivalente em `frontend/src/components/ui/` ou `frontend/src/components/pcp/`.

---

## 1. Visão geral da arquitetura

```mermaid
flowchart TB
  subgraph Gatilhos
    PCP[PCP Kanban<br/>workflow CONCLUIDO]
    OS[OS Service<br/>status → FINALIZADA manual]
  end

  subgraph Backend
    EXP[ExpedicaoModule]
    FIN[FinanceiroModule<br/>CobrancasService]
    PRD[ProdutosModule<br/>ProdutosService]
    PCPM[PCPModule]
    OSM[OSModule]
  end

  subgraph Dados
    EL[(expedicoes_logistica)]
    OS_TBL[(ordens_servico)]
    WF[(workflow_instancia)]
    COB[(cobrancas / parcelas)]
    TP[(template_produtos)]
  end

  subgraph Frontend
    KAN[/expedicao Kanban]
    MOD[Modais: Bloqueio / Assinatura / Template]
  end

  PCP -->|hook pós-conclusão| EXP
  OS -->|hook pós-FINALIZADA| EXP
  EXP --> EL
  EXP --> OS_TBL
  EXP --> WF
  EXP -->|trava 409| FIN
  EXP -->|transformar-template| PRD
  EXP --> TP
  KAN -->|REST JWT| EXP
  KAN --> MOD
  PCPM -->|filtro 24h coluna Pronto| PCP
```

### Princípios arquiteturais (decisões fechadas)

| Camada | Regra |
|--------|-------|
| Status OS | Permanece `FINALIZADA`; progresso logístico em `ExpedicaoLogistica.status` |
| Multi-tenant | Toda query Prisma com `loja_id` do JWT |
| Histórico | `DEVOLVIDA` preserva registro; nova expedição = novo registro na mesma OS |
| Kanban | Transições livres entre colunas de `StatusExpedicao` |
| PCP | Card em «Pronto» por 24h (`workflow_instancia.data_fim` ou `ordem_servicos.atualizado_em`) — cálculo **estritamente em UTC** (ver §5.3) |
| Modalidade inicial | Herda `orcamento.entrega_modalidade`; override se `instalacao_necessaria = true` → `INSTALACAO_NO_LOCAL` |
| Transações DB | Ações multi-tabela (ex.: devolução) **obrigam** `Prisma.$transaction` com rollback automático (ver §5.4) |
| Null safety financeiro | OS sem `orcamento_id` libera entrega sem consultar parcelas (ver §2.3) |
| Backfill | Não — apenas OS finalizadas após o deploy entram no módulo |
| OS interna | Não entra no fluxo de expedição |

---

## 2. Backend (NestJS)

### 2.1 Novo módulo — estrutura de pastas

```
backend/src/expedicao/
├── expedicao.module.ts
├── controllers/
│   ├── expedicao.controller.ts           # CRUD + ações do fluxo
│   └── expedicao-assinatura.controller.ts # Upload PNG da assinatura
├── services/
│   ├── expedicao.service.ts              # Orquestração principal (≤ 400 linhas)
│   ├── expedicao-kanban.service.ts       # Listagem/agrupamento por status
│   ├── expedicao-criacao.service.ts      # Gatilho automático + modalidade inicial
│   ├── expedicao-financeiro.service.ts   # Trava 409 (regra SALDO/VENCIDO)
│   ├── expedicao-devolucao.service.ts    # Devolver para produção + retrabalho
│   ├── expedicao-template.service.ts     # Clonagem ProdutoOrcamento → TemplateProduto
│   ├── expedicao-assinatura.service.ts   # Persistência de arquivo (espelho AnexoGeometria)
│   └── expedicao-modalidade.mapper.ts    # Palavra-chave + override instalação
├── guards/
│   └── expedicao-permissions.guard.ts    # ADMINISTRADOR | PRODUCAO | ESTOQUE
├── dto/
│   ├── listar-expedicao-query.dto.ts
│   ├── atualizar-expedicao.dto.ts
│   ├── atualizar-status-expedicao.dto.ts
│   ├── concluir-entrega.dto.ts
│   ├── devolver-producao.dto.ts
│   ├── arquivar-expedicao.dto.ts
│   └── transformar-template.dto.ts
├── enums/
│   ├── status-expedicao.enum.ts
│   └── modalidade-expedicao.enum.ts
├── interfaces/
│   └── expedicao.interface.ts
└── constants/
    └── bloqueio-financeiro.code.ts       # code: 'BLOQUEIO_FINANCEIRO'
```

### 2.2 Registro no app

| Arquivo | Alteração |
|---------|-----------|
| `backend/src/app.module.ts` | `imports: [..., ExpedicaoModule]` |
| `backend/src/expedicao/expedicao.module.ts` | `imports`: `PrismaModule`, `AuthModule`, `FinanceiroModule`, `ProdutosModule`, `WebsocketsModule` (opcional v1) |
| `backend/src/pcp/pcp.module.ts` | `imports: [..., ExpedicaoModule]` — hook pós-conclusão |
| `backend/src/os/os.module.ts` | `imports: [..., ExpedicaoModule]` — hook pós-`FINALIZADA` manual |

**Dependência circular:** `ExpedicaoModule` **não** importa `PCPModule` nem `OSModule`. Os hooks ficam nos módulos consumidores chamando services exportados (`ExpedicaoCriacaoService`, `ExpedicaoDevolucaoService`). A devolução usa `PrismaService` diretamente para reativar workflow, evitando ciclo com `WorkflowService`.

### 2.3 Responsabilidades dos services

| Service | Responsabilidade |
|---------|------------------|
| **ExpedicaoCriacaoService** | Idempotência: cria registro só se OS comercial, não interna, sem expedição ativa. Resolve modalidade (instalação → mapper por palavra-chave → fallback `RETIRADA_CLIENTE`). |
| **ExpedicaoKanbanService** | `GET /expedicao` — cards por `StatusExpedicao`, join OS/cliente/orçamento/endereço; exclui `DEVOLVIDA` do board ativo. |
| **ExpedicaoService** | Detalhe, patch modalidade/rastreio/observações, `data_expedida` na 1ª saída de `AGUARDANDO_SEPARACAO`. |
| **ExpedicaoFinanceiroService** | Antes de `ENTREGUE_FINALIZADO`: bloqueia se `SALDO` em `PREVISTO`/`VENCIDO`/`PARCIAL_PAGO` ou qualquer parcela `VENCIDO`. **Null safety (obrigatório):** se `ordem_servico.orcamento_id` for `null`, retorna liberação imediata (`{ bloqueado: false }`) **sem** consultar `cobrancas`/`cobranca_parcelas`, evitando erro 500 por referência nula. Se não existir cobrança vinculada ao orçamento, também libera. |
| **ExpedicaoDevolucaoService** | Fluxo «Devolver para Produção» que altera **4 entidades** (`ExpedicaoLogistica`, `OrdemServico`, `WorkflowInstancia`, `WorkflowInstanciaSetor` e insert em `OrdemServicoLog`). **Obrigatório:** encapsular todas as escritas em `prisma.$transaction(async (tx) => { ... })`. Se qualquer passo falhar, o Prisma reverte tudo — evita estado inconsistente (ex.: OS em `EM_WORKFLOW` com expedição ainda ativa). Ver §5.4. |
| **ExpedicaoTemplateService** | Lê `orcamento.produtos` com includes; persiste `TemplateProduto` via `ProdutosService`. |
| **ExpedicaoAssinaturaService** | Upload PNG/WebP em `uploads/anexos/expedicao/<loja_id>/`; padrão `AnexoGeometriaService`. |
| **ExpedicaoModalidadeMapper** | Keywords: retirada/balcão → `RETIRADA_CLIENTE`; transportadora/correios → `ENTREGA_TRANSPORTADORA`; motoboy/própria → `ENTREGA_FROTA_PROPRIA`. |

### 2.4 Mapeamento ModalidadeEntrega → ModalidadeExpedicao

| Nome default (`ModalidadeEntrega`) | `ModalidadeExpedicao` |
|-----------------------------------|------------------------|
| Retirada no balcão | `RETIRADA_CLIENTE` |
| Entrega própria | `ENTREGA_FROTA_PROPRIA` |
| Motoboy | `ENTREGA_FROTA_PROPRIA` |
| Transportadora | `ENTREGA_TRANSPORTADORA` |
| Correios / envio externo | `ENTREGA_TRANSPORTADORA` |
| Outro / customizado | Match por palavra-chave ou fallback `RETIRADA_CLIENTE` |

**Override:** se qualquer produto do orçamento tiver `instalacao_necessaria = true` → `INSTALACAO_NO_LOCAL` (independente da modalidade de entrega).

### 2.5 DTOs (validação `class-validator`)

| DTO | Campos principais | Validações |
|-----|-------------------|------------|
| `ListarExpedicaoQueryDto` | `status?`, `modalidade?`, `busca?`, `incluir_arquivados?` | `@IsOptional`, `@IsEnum`, `@MaxLength(100)` em busca |
| `AtualizarExpedicaoDto` | `modalidade?`, `codigo_rastreio?`, `observacoes?` | Whitelist; `observacoes` `@MaxLength(5000)` |
| `AtualizarStatusExpedicaoDto` | `status` | `@IsEnum(StatusExpedicao)` |
| `ConcluirEntregaDto` | `recebedor_nome`, `recebedor_doc?`, `url_assinatura`, `observacoes?` | Nome obrigatório; URL validada |
| `DevolverProducaoDto` | `motivo` | `@IsNotEmpty`, `@MinLength(10)`, `@MaxLength(2000)` |
| `ArquivarExpedicaoDto` | `observacoes?` | Somente se status = `ENTREGUE_FINALIZADO` |
| `TransformarTemplateDto` | `nome` | `@IsNotEmpty`, `@MaxLength(120)` |

### 2.6 Arquivos existentes a alterar

| Arquivo | Alteração |
|---------|-----------|
| `backend/src/pcp/services/pcp-kanban.service.ts` | Hook criação expedição + filtro 24h coluna `CONCLUIDA` (UTC) |
| `backend/src/common/utils/utc-time.util.ts` | **Novo:** helper `obterLimiarHorasAtrasUtc` para filtro 24h |
| `backend/src/pcp/services/os-pcp-integration.service.ts` | Manter `CONCLUIDO → FINALIZADA`; opcional WebSocket `expedicao_criada` |
| `backend/src/pcp/mappers/kanban.mapper.ts` | Badge `retrabalho` no card |
| `backend/src/os/services/os.service.ts` | Hook em `transicionarEstadoOS` quando `FINALIZADA` |
| `backend/src/home-operacional/services/fluxo-trabalho.service.ts` | Coluna `prontos`: href → `/expedicao?os={id}` |
| `backend/src/financeiro/services/cobrancas.service.ts` | Opcional: método reutilizável de bloqueio de entrega |
| `backend/src/produtos/produtos.service.ts` | Opcional: helper `criarAPartirDeProdutoOrcamento` |

### 2.7 Regras de estabilidade e integridade (obrigatórias)

#### 2.7.1 Transações de banco (`Prisma.$transaction`)

Operações que persistem em mais de uma tabela relacionada **devem** usar transação interativa:

| Service | Operação | Tabelas afetadas |
|---------|----------|------------------|
| `ExpedicaoDevolucaoService` | `devolverParaProducao()` | `expedicoes_logistica`, `ordens_servico`, `workflow_instancia`, `workflow_instancia_setor`, `ordem_servico_logs` |
| `ExpedicaoService` | `concluirEntrega()` (recomendado) | `expedicoes_logistica`, `ordens_servico` (`data_entrega_cliente`) |
| `ExpedicaoCriacaoService` | `criarSeElegivel()` (recomendado) | `expedicoes_logistica` (+ validação prévia read-only fora da tx) |

**Padrão obrigatório em `ExpedicaoDevolucaoService`:**

```typescript
// Pseudocódigo — não implementar fora de $transaction
await this.prisma.$transaction(async (tx) => {
  // 1. Validar expedição ativa (loja_id + id) dentro da tx ou antes com lock lógico
  // 2. tx.expedicaoLogistica.update → status DEVOLVIDA
  // 3. tx.ordemServico.update → EM_WORKFLOW, retrabalho: true
  // 4. tx.workflowInstancia.update → ATIVO
  // 5. tx.workflowInstanciaSetor.update → último setor PENDENTE
  // 6. tx.ordemServicoLog.create → motivo da devolução
});
```

- **Proibido** executar os passos 2–6 como updates isolados sem transação.
- Em falha (constraint, timeout, validação), a API retorna erro e **nenhuma** tabela permanece em estado parcial.
- Timeout da transação: usar padrão do Prisma (ou `maxWait`/`timeout` explícito se necessário em produção).

#### 2.7.2 Null safety no módulo financeiro

`ExpedicaoFinanceiroService.verificarBloqueioEntrega(os, lojaId)` deve seguir esta ordem **antes** de qualquer query em cobranças:

1. Se `os.orcamento_id == null` → `{ bloqueado: false, motivo: 'SEM_ORCAMENTO' }` (libera entrega).
2. Se `orcamento_id` presente, buscar cobrança com `where: { orcamento_id, loja_id }`.
3. Se cobrança não existir → `{ bloqueado: false, motivo: 'SEM_COBRANCA' }`.
4. Somente então avaliar parcelas (`SALDO` + status bloqueantes ou qualquer `VENCIDO`).

Isso garante que OS diretas ou sem vínculo comercial não disparem exceção ao acessar relações inexistentes.

#### 2.7.3 Padronização de timezone (filtro 24h do PCP)

Todos os cálculos de janela temporal no backend para o filtro da coluna «Pronto» (`CONCLUIDA`) **devem operar em UTC**:

- Calcular o limiar uma única vez: `const limiarUtc = subHours(new Date(), 24)` usando UTC (ex.: `date-fns` com `UTCDate` / `date-fns-tz`, ou `Date.UTC` manual).
- Comparar `workflow_instancia.data_fim` e `ordem_servicos.atualizado_em` **como instantes UTC** (`>= limiarUtc`).
- **Não** usar `new Date()` com offset local do servidor nem `NOW()` do MySQL sem conversão explícita para UTC na camada de aplicação.
- Motivo: evitar que o fuso do servidor (ex.: `America/Sao_Paulo`, UTC−3) oculte ou exiba cartões fora da janela real de 24 horas no Kanban.
- Os campos `DateTime` do Prisma já são persistidos em UTC; a regra aplica-se ao **momento da comparação** (`now`) e à documentação do filtro em `pcp-kanban.service.ts`.

---

## 3. Endpoints REST (API)

**Prefixo:** `@Controller('expedicao')`  
**Guards:** `@UseGuards(JwtAuthGuard, ExpedicaoPermissionsGuard)`  
**Tenant:** `@LojaId() lojaId` em todos os handlers.

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/expedicao` | Kanban logístico agrupado por status |
| `GET` | `/expedicao/arquivo` | Somente leitura: `ARQUIVADO` + histórico `DEVOLVIDA` |
| `GET` | `/expedicao/:id` | Detalhe por id da expedição |
| `GET` | `/expedicao/os/:osId` | Detalhe por OS (atalho Home/PCP) |
| `PATCH` | `/expedicao/:id` | Modalidade, rastreio, observações |
| `PATCH` | `/expedicao/:id/status` | Move card no Kanban |
| `POST` | `/expedicao/:id/concluir-entrega` | Conclusão com trava financeira + assinatura |
| `POST` | `/expedicao/:id/arquivar` | Arquivamento manual pós-entrega |
| `POST` | `/expedicao/:id/devolver-producao` | Devolução transacional (`$transaction`) com motivo → retrabalho no PCP |
| `POST` | `/expedicao/os/:osId/transformar-template` | Clona produtos do orçamento para template |
| `POST` | `/expedicao/assinaturas/upload` | Upload multipart PNG/WebP |
| `GET` | `/expedicao/assinaturas/:token` | Download autenticado (anti-IDOR) |

### Respostas de erro

| HTTP | Código | Quando |
|------|--------|--------|
| `409` | `BLOQUEIO_FINANCEIRO` | Parcelas bloqueantes na conclusão |
| `409` | `EXPEDICAO_JA_ATIVA` | Segunda expedição ativa na mesma OS |
| `403` | — | Função sem permissão |
| `404` | — | Recurso não encontrado na loja do JWT |

Payload `409 BLOQUEIO_FINANCEIRO`:

```json
{
  "code": "BLOQUEIO_FINANCEIRO",
  "message": "Existem parcelas em aberto que impedem a conclusão da entrega.",
  "parcelas": [
    {
      "id": "...",
      "tipo": "SALDO",
      "valor_saldo": 1500.0,
      "data_vencimento": "2026-06-20T00:00:00.000Z",
      "status": "VENCIDO"
    }
  ],
  "link_financeiro": "/financeiro/recebimentos/{cobrancaId}"
}
```

---

## 4. Frontend (Next.js 15 — App Router)

### 4.1 Estrutura de pastas

```
frontend/src/
├── app/(main)/expedicao/
│   ├── page.tsx                 # Kanban principal
│   ├── arquivo/page.tsx         # Arquivo morto
│   └── layout.tsx               # Guard de função (opcional)
├── components/expedicao/        # Apenas composição de domínio
│   ├── ExpedicaoKanbanBoard.tsx
│   ├── ExpedicaoKanbanFilters.tsx
│   ├── ExpedicaoKanbanStats.tsx
│   ├── ExpedicaoCard.tsx
│   ├── ExpedicaoDetalheSheet.tsx
│   ├── BloqueioFinanceiroModal.tsx
│   ├── ConcluirEntregaDialog.tsx
│   ├── AssinaturaCanvas.tsx
│   ├── DevolverProducaoDialog.tsx
│   ├── ArquivarExpedicaoDialog.tsx
│   └── TransformarTemplateDialog.tsx
├── hooks/
│   └── useExpedicaoKanban.ts
└── lib/expedicao/
    ├── expedicao-api.ts
    ├── expedicao.types.ts
    └── expedicao-columns.ts
```

### 4.2 Rotas

| Rota | Papel |
|------|-------|
| `/expedicao` | Kanban ativo |
| `/expedicao/arquivo` | Auditoria read-only |
| `/expedicao?os={osId}` | Deep link da Home «Prontos» |

**Sidebar** (`app/(main)/layout.tsx`): item «Expedição» para `ADMINISTRADOR`, `PRODUCAO`, `ESTOQUE`.

### 4.3 Componentes globais a reutilizar (obrigatório)

| Necessidade | Componente global existente | Caminho |
|-------------|----------------------------|---------|
| Kanban drag-and-drop | `KanbanBoard` | `@/components/ui/kanban-board` |
| Tela cheia Kanban | `FullscreenKanban` | `@/components/ui/fullscreen-kanban` |
| Filtros (padrão PCP) | `KanbanFilters` | `@/components/pcp/KanbanFilters` |
| Estatísticas | `KanbanStats` | `@/components/pcp/KanbanStats` |
| Card base / layout | `Card`, `CardHeader`, `CardContent` | `@/components/ui/card` |
| Botões | `Button` | `@/components/ui/button` |
| Badges (status, retrabalho) | `Badge` | `@/components/ui/badge` |
| Modais / diálogos | `Dialog`, `AlertDialog` | `@/components/ui/dialog` |
| Sheet lateral (detalhe) | `Sheet` | `@/components/ui/sheet` (se já usado no projeto) |
| Formulários | `Input`, `Label`, `Textarea`, `Select` | `@/components/ui/*` |
| Alertas de erro | `Alert`, `AlertDescription` | `@/components/ui/alert` |
| Loading | `Skeleton` | `@/components/ui/skeleton` |
| Toasts | `sonner` (`toast`) | `@/components/ui/sonner` |
| API autenticada | `apiRequest` | `@/lib/api` |
| Ícones | Tabler Icons | `@tabler/icons-react` (padrão `(main)`) |
| Info em campos | `InfoTooltip` | `@/components/ui/info-tooltip` |
| Upload de imagem (referência) | `ImageUpload` | `@/components/ui/ImageUpload` |

**Regra:** `ExpedicaoKanbanBoard` importa e configura `KanbanBoard` — não duplicar lógica de `@hello-pangea/dnd`. `useExpedicaoKanban` espelha `useKanbanData` (`hooks/useKanbanData.ts`).

### 4.4 Componentes de domínio (permitidos criar)

| Componente | Responsabilidade |
|------------|------------------|
| `ExpedicaoCard` | Composição: dados OS + modalidade + alerta financeiro sobre `KanbanBoard` card slot |
| `AssinaturaCanvas` | Canvas HTML5 → blob → upload (único componente sem equivalente global) |
| `BloqueioFinanceiroModal` | Composição de `Dialog` + `Alert` vermelho (`bg-red-50 text-red-700`) |
| `ConcluirEntregaDialog` | `Dialog` + form + `AssinaturaCanvas` |
| `DevolverProducaoDialog` | `Dialog` + `Textarea` motivo |
| `TransformarTemplateDialog` | `Dialog` + `Input` nome do template |

### 4.5 Arquivos frontend existentes a alterar

| Arquivo | Alteração |
|---------|-----------|
| `frontend/src/app/(main)/layout.tsx` | Link sidebar Expedição |
| `frontend/src/components/pcp/FilaOperador.tsx` | Borda/badge retrabalho |
| `frontend/src/lib/pcp/pcp.utils.ts` | Helper visual retrabalho (se necessário) |

---

## 5. Integração — hooks exatos

### 5.1 Hook primário (PCP)

**Arquivo:** `backend/src/pcp/services/pcp-kanban.service.ts`  
**Método:** `avaliarGrupoFinalizado` (~linhas 709–730)

```
PCP conclui último setor
  → workflow.status = CONCLUIDO, data_fim = now()
  → OSPCPIntegrationService → OS.status = FINALIZADA
  → ExpedicaoCriacaoService.criarSeElegivel(osId, lojaId)
```

### 5.2 Hook secundário (OS manual)

**Arquivo:** `backend/src/os/services/os.service.ts`  
**Método:** `transicionarEstadoOS` — após update com `FINALIZADA`

```
Usuário finaliza OS sem PCP
  → transicionarEstadoOS(..., FINALIZADA)
  → ExpedicaoCriacaoService.criarSeElegivel(osId, lojaId)
```

Timestamp 24h (manual): `ordem_servicos.atualizado_em`.

### 5.3 Filtro 24h — coluna «Pronto» do PCP

Incluir card `CONCLUIDA` somente se:

- `workflow_instancia.data_fim >= limiarUtc` (OS com PCP), ou
- OS sem workflow e `ordem_servicos.atualizado_em >= limiarUtc` com `status = FINALIZADA` (finalização manual)

Onde `limiarUtc = instante_atual_utc - 24 horas` (ver §2.7.3).

**Exigência de timezone:** o cálculo de `limiarUtc` e a comparação com `data_fim` / `atualizado_em` ocorrem **estritamente em UTC** no backend (`pcp-kanban.service.ts`). O frontend apenas exibe o card retornado pela API — não recalcula a janela de 24h no browser.

**Implementação sugerida:** helper compartilhado `backend/src/common/utils/utc-time.util.ts` com `obterLimiarHorasAtrasUtc(horas: number): Date` para reuso e testes unitários.

### 5.4 Devolução para produção (transação obrigatória)

Todas as etapas abaixo executam **dentro de um único** `prisma.$transaction`:

1. `ExpedicaoLogistica.status` → `DEVOLVIDA` (registro preservado para auditoria)
2. `OrdemServico.status` → `EM_WORKFLOW`, `retrabalho` → `true`
3. `WorkflowInstancia.status` → `ATIVO`
4. Último setor da ordem (`WorkflowInstanciaSetor`) → `PENDENTE`
5. Insert em `OrdemServicoLog` com o motivo informado pelo usuário

Se o passo 4 falhar (ex.: workflow inexistente), os passos 1–3 são revertidos automaticamente. A API responde com erro adequado (`400`/`404`) sem deixar dados órfãos.

### 5.5 Home Operacional

**Arquivo:** `fluxo-trabalho.service.ts` → `montarColunaProntos`  
Alterar `href` de `/os/${os.id}` para `/expedicao?os=${os.id}`.

---

## 6. OWASP Top 10 — mitigações

### A01 — Broken Access Control (IDOR)

- Toda query: `where: { id, loja_id: lojaId }`
- Rotas `os/:osId`: validar OS e expedição na mesma loja; 404 genérico
- Upload/download assinatura: metadado `loja_id`; GET recusa JWT de outra loja
- `ExpedicaoPermissionsGuard`: `ADMINISTRADOR`, `PRODUCAO`, `ESTOQUE`

### A03 — Injection

- DTOs + `ValidationPipe` global (`whitelist: true`)
- Proibido `$queryRaw` / `$executeRaw` no módulo
- `busca`: trim + `@MaxLength(100)`

### A07 — Identification and Authentication Failures

- `@UseGuards(JwtAuthGuard)` em todos os controllers
- `loja_id` exclusivamente do JWT (`@LojaId()`)
- Upload exige JWT válido

### A04 — Insecure Design (Uploads / XSS)

- Assinatura: apenas PNG/WebP; limite ~500 KB; UUID no disco
- Observações: renderização React sem `dangerouslySetInnerHTML`
- Modal bloqueio: valores formatados; links internos fixos
- Nome do template: texto puro, `@MaxLength(120)`

### Integridade de dados (complemento OWASP / estabilidade)

- **Transações:** devolução para produção e demais fluxos multi-tabela conforme §2.7.1 — falha atômica com rollback
- **Null safety financeiro:** §2.7.2 — nunca assumir `orcamento_id` ou cobrança presentes; resposta determinística sem 500
- **Timezone UTC:** §2.7.3 — filtros temporais do PCP independentes do fuso do servidor

---

## 7. Schema (Fase 1 — referência)

| Artefato | Detalhe |
|----------|---------|
| Tabela | `expedicoes_logistica` |
| Campo OS | `retrabalho Boolean @default(false)` |
| Enums | `StatusExpedicao` (incl. `DEVOLVIDA`), `ModalidadeExpedicao` |
| `os_id` | **Sem** `@unique` — histórico + nova expedição após retrabalho |
| Índices | `[loja_id]`, `[loja_id, status]`, `[loja_id, os_id]`, `[os_id]` |
| Migração | `20260625100000_add_modulo_expedicao` (100% aditiva) |

---

## 8. Ordem de implementação

| Etapa | Entrega |
|-------|---------|
| 2.1 | Apply migração + `prisma generate` |
| 2.2 | `ExpedicaoModule` skeleton + guards + DTOs |
| 2.3 | `ExpedicaoCriacaoService` + hooks PCP/OS |
| 2.4 | Kanban API + controller GET/PATCH |
| 2.5 | Financeiro + concluir-entrega + upload assinatura |
| 2.6 | Devolução + filtro 24h PCP + badge retrabalho |
| 2.7 | Transformar template |
| 2.8 | Home href + sidebar |
| 3.1 | `expedicao-api` + hook + página Kanban |
| 3.2 | Modais (bloqueio, entrega, devolução, template) |
| 3.3 | Página arquivo morto |

---

## 9. Fora do escopo v1

- WebSocket tempo real na expedição
- Override administrativo da trava financeira
- PDF comprovante de entrega
- Permissões via `perfil_permissao`
- Feature flag `EXPEDICAO_MODULE_ENABLED`

---

## 10. Checklist de aprovação arquitetural

- [ ] Estrutura de pastas e divisão de services
- [ ] Rotas REST e códigos de erro (`409 BLOQUEIO_FINANCEIRO`)
- [ ] Hooks PCP / OS / filtro 24h
- [ ] **`ExpedicaoDevolucaoService` usa `Prisma.$transaction` (§2.7.1 / §5.4)**
- [ ] **`ExpedicaoFinanceiroService` trata `orcamento_id` nulo sem 500 (§2.7.2)**
- [ ] **Filtro 24h do PCP calculado em UTC (§2.7.3 / §5.3)**
- [ ] Reutilização de `KanbanBoard` e componentes `ui/`
- [ ] UTF-8 / pt-BR em todo o módulo
- [ ] Upload assinatura espelhando `AnexoGeometriaService`
- [ ] Cobertura OWASP suficiente para v1

---

*Última atualização: junho/2026 — alinhado às decisões de produto, refinamentos de estabilidade e ao schema `feature/modulo-expedicao`.*
