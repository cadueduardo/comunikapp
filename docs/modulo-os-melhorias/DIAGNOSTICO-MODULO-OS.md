# Diagnóstico — Módulo Ordem de Serviço

> Análise completa de backend (`backend/src/os`, ~84 arquivos), frontend
> (`frontend/src/app/(main)/os`), schema Prisma e documentação.
> Data: 29/07/2026.

## Resumo executivo

| Indicador | Valor |
|---|---|
| Pontos com dados mockados/hardcoded | P0 removidos (29–30/07/2026) |
| Fluxos incompletos no backend (P1) | Concluídos |
| Status da OS | Enum único Prisma + TS (16 valores) — P1-5 |
| Tamanho do `os.service.ts` | ~4.500 linhas (higienização = P2-5, aberto) |

**Achado mais grave (histórico):** checklist de estoque fictício e fallbacks
mockados no detalhe da OS — **corrigidos em P0**.

**Fronteira financeira (decisão 30/07/2026):** custos, margens, pós-cálculo,
precificação ao cliente e UX de “valores na OS” **não** evoluem neste ciclo do
módulo OS. A casa canônica de dinheiro continua em Financeiro
(`docs/modulo financeiro/`); a casa comercial (vendedor / aditivos / preço ao
cliente) será especificada em `docs/modulo-vendas/` (RP). OS Aditivas já
funcionam e **não** devem ser recriadas. P2-3 fica **adiado** até essa fronteira.

---

## 1. Dados mockados e hardcoded — Frontend

| Severidade | Onde | Problema | Impacto |
|---|---|---|---|
| Crítico | `os/[id]/page.tsx:82–102` | Checklist de estoque inteiro fictício na aba Resumo | Usuário vê "Estoque OK" sem consulta real |
| Crítico | `os/[id]/page.tsx:42, 45` | Fallback de cliente "Carla Conceição" e prioridade fixa "Normal" | Dados falsos no cabeçalho da OS |
| Crítico | `PrazoProdutoComponent.tsx:147–158` | Em erro de API, renderiza produto mockado (90×120, qtd 25, banner fictício) | Falha de rede vira dado inventado |
| Crítico | `frontend/src/app/api/os/validacoes/*/route.ts` | Proxies apontam para endpoints de TESTE (`/test-os-validacoes`) **sem autenticação** | Risco de segurança |
| Alto | `os/[id]/page.tsx:236–244` | Aba "Análise Inteligente" é placeholder — mas `OSInteligenteTab` existe pronto e nunca é importado | Feature construída e não entregue |
| Alto | `os/page.tsx:108–117` | KPIs chamam `/os/estatisticas`, mas não existe route handler Next correspondente | Cards de estatística falham em silêncio |
| Alto | `os-card.tsx:199` e `os/[id]/page.tsx:378` | Links "Editar" apontam para `/os/[id]/editar` — página não existe | Rota morta em 3 lugares |
| Alto | `imprimir/page.tsx:62–73` | Download PDF é toast "em desenvolvimento"; botões de versão mudam a URL mas não recarregam | UI enganosa na impressão |
| Médio | Componentes de arte (`ArteAprovacaoTabLayout`, `ArteAprovacaoTabSimple`, `ArteAprovacaoWireframe`, etc.) | Protótipos com `setTimeout` fake e versões hardcoded coexistindo com o componente real | Código morto confunde manutenção |
| Médio | `os/[id]/page.tsx:381` | Usa `<Edit>` sem import de `lucide-react` | Bug latente de build/runtime |

## 2. Dados mockados e simulações — Backend

| Severidade | Onde | Problema | Impacto |
|---|---|---|---|
| Crítico | `services/centro-custo.service.ts` | Serviço quase todo simulado: orçamento fixo de R$ 10.000, listas e históricos hardcoded (TODOs nas linhas 89, 149, 247…) | Aprovação de OS interna decide sobre números inventados |
| Crítico | `services/aprovacao-alcada.service.ts:362–422` | Orçamento fixo 10.000; reserva e log de orçamento são só `console.log` | Alçada orçamentária sem efeito real |
| Crítico | `controllers/workflow-interno.controller.ts:136–143` | `GET /os/:id/validar-alcada` é stub: sempre `pode_aprovar=true`, `valor_os=0` | Controle de alçada inexistente na prática |
| Crítico | `services/os.service.ts:3617–3736` | `validarEstoqueDisponivel` e `validarArteAnexada` sempre retornam `true`; localização fixa "A1-B2" | Transições de etapa não validam nada |
| Alto | `services/estoque-apontamento.service.ts` | Apontamento de produção só registra log — não baixa estoque de verdade | Estoque nunca reflete o consumo da produção |
| Alto | Impressão da OS | Timbrado da loja + print/PDF no browser (como orçamento); QR aponta para `/os/{id}` |
| Alto | `controllers/os.controller.ts:124–130` | `workflow_instanciado` hardcoded `false` na listagem de liberadas para PCP | Informação incorreta para o PCP |
| Médio | `os.module.ts:50–72, 127, 150` | `HistoricoController`, `NotificacoesOSService` e `IntegracaoService` comentados como "TODO: Implementar" | Notificações e histórico dedicados nunca existiram |

## 3. Problemas estruturais

### 3.1 Status da OS unificado (resolvido em P1-5)

- A coluna `OrdemServico.status` é `StatusOS` tipado (`@default(FILA)`).
- O enum Prisma `StatusOS` e o enum TypeScript
  (`backend/src/os/interfaces/os.interfaces.ts`) têm os **mesmos 16 valores**.
- Helpers `STATUS_OS_VALUES` / `isStatusOS` / `assertStatusOS` validam writes.
- Migration `20260730123600_os_status_enum_unificado` tipa a coluna no MySQL.
- A doc oficial (`docs/fase-0-home-operacional/01-status-oficiais.md`) espelha
  os 16 status.

### 3.2 Rotas duplicadas no mesmo prefixo (crítico)

`WorkflowComercialController` e `WorkflowInternoController` registram rotas
iguais (`transicionar-estado`, `finalizar-os`) no mesmo `@Controller('os')` —
qual responde depende da ordem de registro. Além disso, `criarOSComercial` /
`criarOSInterna` forçam `status: 'FILA'`, ignorando o fluxo financeiro /
orçamentário do `create()` principal.

### 3.3 Manutenção

- `os.service.ts` com ~4.800 linhas (convenção do projeto: ≤400).
- O middleware de isolamento de tenant existe
  (`middleware/os-tenant-isolation.middleware.ts`) mas **nunca é registrado**
  no módulo — o `configure()` do `os.module.ts` está vazio.
- Uma geração inteira de componentes documentados e órfãos em
  `frontend/src/components/ui/os/` (`OSHeader`, `OSSidebar`, `OSTabs`,
  `OSTimeline`, `OSWorkflowActions`, `ChecklistEstoque`) — nenhuma página os
  importa; o detalhe reimplementou tudo inline.

### 3.4 Frontend fora do template CRUD canônico

Referência canônica: `frontend/src/app/(main)/fornecedores/` (ver `AGENTS.md`).

- Listagem usa `OsGridTable` próprio em vez do `DataTable` canônico.
- Cards não espelham as ações da tabela (sem Aprovar/Imprimir/Reativar; o
  "Excluir" do card na verdade inativa com motivo genérico).
- Carrega `limit=500` sem paginação de servidor.
- Detalhe e impressão usam muitas cores fixas (`text-gray-*`, `bg-white`,
  `bg-blue-600`) incompatíveis com dark mode.
- Filtro de status na listagem existe como estado mas não tem UI.

## 4. O que já está sólido

Orçamento → OS automática · Numeração rastreável ORC/OS · OS comercial e
interna · Aprovações financeira e técnica · Liberação PCP por item · Prazos por
produto · OS aditiva de instalação · Soft-delete com snapshot · Logs e
auditoria · Integração expedição/instalação/arte · Pós-cálculo financeiro (aba).

## 5. Gaps em relação ao mercado

Comparação com o que ERPs de comunicação visual e gráficas (Gestãocom, SGE,
InfoSign e similares) entregam no módulo de OS/produção:

| Funcionalidade de mercado | Situação no ComunikApp |
|---|---|
| Baixa automática de estoque no apontamento de produção | Infra existe (`EstoqueApontamentoService`), mas só registra log — não movimenta estoque |
| Custo real vs. orçado (horas + consumo apontados) | Campos existem no schema (`valor_realizado`, `margem_lucro_real`) e há aba de pós-cálculo, mas sem fluxo de apontamento de horas alimentando |
| OS impressa em PDF profissional com QR code para apontamento no chão de fábrica | Só HTML; PDF pendente; sem QR code |
| Anexos genéricos na OS (fotos de referência, arquivos do cliente) | Não existe model de anexo — só arte (`ArteArquivo`) e JSON em `MovimentacaoOS` |
| Notificação automática ao cliente por mudança de status (WhatsApp/e-mail) | `NotificacoesOSService` é um TODO comentado no módulo |
| Checklist de qualidade na finalização da produção | Placeholder na impressão; `ChecklistInstancia` existe no PCP mas não há gate de qualidade na finalização |
| Faturamento vinculado à OS (status faturada / emissão de NF) | Não há conceito de faturamento no módulo; financeiro trata cobrança separadamente |
| Pesquisa de satisfação / pós-venda | Campo `satisfacao_cliente` existe no schema, sem nenhum fluxo que o preencha |
| Agenda de capacidade produtiva (calendário de máquinas/setores) | PCP tem kanban, mas não há programação de capacidade finita |

---

## 6. Plano de ação

Marque os checkboxes conforme os itens forem concluídos (no mesmo commit da
mudança).

### P0 — Corrigir dados falsos e segurança (fazer primeiro)

- [x] **P0-1** — Substituir checklist de estoque mock da aba Resumo por
      consulta real (os endpoints de materiais/validação de estoque já existem
      no backend).
- [x] **P0-2** — Remover fallback "Carla Conceição", prioridade fixa e mock de
      erro do `PrazoProdutoComponent`.
- [x] **P0-3** — Trocar proxies de validações que usam `/test-os-validacoes`
      sem auth pelos endpoints reais autenticados.
- [x] **P0-4** — Criar route handler `/api/os/estatisticas` para os KPIs da
      listagem e corrigir import `Edit` faltante no detalhe.
- [x] **P0-5** — Resolver rota morta `/os/[id]/editar`: criar a página ou
      remover os 3 links.

### P1 — Completar fluxos que existem pela metade

- [x] **P1-1** — Plugar `OSInteligenteTab` (validações + cálculo de materiais)
      na aba Análise Inteligente.
- [x] **P1-2** — Decisão: **esconder / fail-closed** até haver persistência real
      de centro de custo. Removidos saldos inventados (R$ 10.000); `validar-alcada`
      responde 503; aprovação interna segue só por alçada de cargo. Persistência
      de saldo orçamentário fica para entrega futura dedicada.
- [x] **P1-3** — Implementar baixa real de estoque no apontamento de produção e
      as validações de transição (estoque/arte) que hoje retornam sempre
      `true`.
- [x] **P1-4** — Impressão da OS alinhada ao timbrado da loja (mesmo padrão do
      orçamento): página React + `window.print()`/PDF, versões simples/completa
      funcionais e QR Code apontando para `/os/{id}` no sistema. Evoluída para
      modelo "job traveller" de mercado (via de produção sem valores): faixa de
      prazo/prioridade/status/orçamento origem, bloco cliente + instalação com
      lotes/endereços, um bloco por item (dimensões, prazo, ordem, status da
      arte), pick list de materiais com disponibilidade de estoque e, na versão
      completa, roteiro de apontamento manual + checklist de qualidade com
      assinaturas.
- [x] **P1-5** — Unificar status da OS: tipar a coluna com enum único (ou
      remover o enum Prisma órfão) e atualizar `01-status-oficiais.md`.
- [x] **P1-6** — Eliminar rotas duplicadas dos controllers de workflow e
      alinhar `criarOSComercial`/`criarOSInterna` ao fluxo do `create()`.

### P2 — Evolução para paridade de mercado

- [ ] **P2-1** — Anexos genéricos na OS (model próprio + upload na UI).
- [ ] **P2-2** — Notificações de status ao cliente (e-mail/WhatsApp) via
      `NotificacoesOSService`.
- [ ] **P2-3** — ~~Fluxo de custo real vs. orçado alimentado pelos apontamentos~~
      **ADIADO (30/07/2026):** não evoluir valorização/R$ na OS neste ciclo.
      Custo real × orçado e UX comercial ficam sob Financeiro (pós-cálculo) e
      futuro módulo Vendas (`docs/modulo-vendas/`). Não alimentar
      `valor_realizado` a partir do chão de fábrica neste backlog.
- [ ] **P2-4** — Alinhar listagem ao template CRUD canônico (`DataTable`, cards
      com mesmas ações, paginação de servidor, dark mode).
- [ ] **P2-5** — Higienização: quebrar `os.service.ts`, remover protótipos de
      arte e componentes órfãos de `ui/os`.

**Escopo fechado para deploy (30/07/2026):** P0 + P1 concluídos e prontos para
produção. P2 (exceto decisão de adiamento do P2-3) permanece backlog.

---

## Fontes

- `backend/src/os` (84 arquivos) e `backend/prisma/schema.prisma`
- `frontend/src/app/(main)/os`, `frontend/src/app/api/os`,
  `frontend/src/components`
- `docs/integracao orc os pcp/`, `docs/detalhamento-os/`,
  `docs/HANDOFF-IDE-CONTINUIDADE.md`,
  `docs/fase-0-home-operacional/01-status-oficiais.md`

Diagnóstico gerado em 29/07/2026.
