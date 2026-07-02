# Handoff — Módulo de Instalação + continuidade do projeto (jul/2026)

> **Para o próximo chat/agente:** leia este arquivo **inteiro** antes de codar. Ele resume o estado real do módulo de instalação, o que foi corrigido em jul/2026, o que falta e como testar.
>
> **Documentação complementar:** [`docs/modulo instalacao/README.md`](./modulo%20instalacao/README.md) · [`docs/modulo instalacao/01-analise-implementacao-e-decisoes.md`](./modulo%20instalacao/01-analise-implementacao-e-decisoes.md) · [`docs/DEV-GESTAO-PROCESSOS-NODE-WINDOWS.md`](./DEV-GESTAO-PROCESSOS-NODE-WINDOWS.md)
>
> **Handoff histórico (outros módulos):** [`docs/HANDOFF-AGENTE-CONTINUACAO.md`](./HANDOFF-AGENTE-CONTINUACAO.md) — muito extenso; use só se precisar de contexto de Home/PCP/Orçamento.

---

## 1. Estado em uma frase

O módulo de instalação está **implementado em código** (backend + `/instalacao` + `/instalador` + aba OS), mas até jul/2026 **não era testável E2E** porque o hook PCP → fila de instalação só rodava em um dos caminhos de “fim de produção”. Isso foi **corrigido nesta sessão**; falta UI de rollout manual e fechamento de decisões financeiras (DEC-04).

---

## 2. Branch e git

| Item | Valor |
|------|--------|
| Branch ativa (sessão) | `feature/catalogo-escala-e-seguranca` |
| Commit automático | **Não** — usuário pediu para não commitar salvo solicitação explícita |
| Alterações locais relevantes | PCP kanban, expedição criação, `item-os-instalacao-criacao`, `instalacao.controller`, `useMeuSetor.ts`, `os.service.ts` |

Antes de push: `git status` e revisar se `backend/dist/` e logs não entram no commit.

---

## 3. Problema que motivou o trabalho (evidência OS-2026-025)

Auditoria no banco (jul/2026):

| Campo | Valor |
|-------|--------|
| Adesivo Laminado — `instalacao_necessaria` | `true` ✓ |
| Workflow PCP | `CONCLUIDO`, 3 setores `CONCLUIDA` |
| Lotes `item_os_instalacao` | **0** |
| Expedição | 1 card `AGUARDANDO_SEPARACAO`, modalidade `INSTALACAO_NO_LOCAL` |
| Apontamentos PCP `CONCLUSAO` | **0** |

**Causa raiz:** produção encerrada pelo atalho kanban → `FINALIZADA` (`finalizarWorkflowDaOs`), que criava expedição mas **não** chamava `processarBaixaProducao`. O hook só existia em `concluirEtapa` (Meu Setor).

---

## 4. O que foi implementado (jul/2026) — NÃO reimplementar

### 4.1 Gatilho unificado PCP → instalação

`ItemOSInstalacaoCriacaoService.processarBaixaProducaoOs(lojaId, osId)` processa **todos** os itens da OS.

Chamado em:

| Arquivo | Momento |
|---------|---------|
| `backend/src/pcp/services/pcp-kanban.service.ts` | `atualizarStatusOS(FINALIZADA)` após `finalizarWorkflowDaOs` |
| `backend/src/pcp/services/pcp-kanban.service.ts` | `liberarProximoGrupo` quando workflow → `CONCLUIDO` |
| `backend/src/pcp/services/pcp-kanban.service.ts` | `concluirEtapa` (item individual, como antes) |
| `backend/src/os/services/os.service.ts` | Transição manual OS → `FINALIZADA` |

### 4.2 DEC-01 (híbrido) — Expedição × Instalação

Arquivo: `backend/src/expedicao/services/expedicao-criacao.service.ts`

- OS com qualquer produto `instalacao_necessaria = true` → expedição criada com status **`AGUARDANDO_INSTALACAO`** (não `AGUARDANDO_SEPARACAO`).
- Modalidade continua `INSTALACAO_NO_LOCAL` quando aplicável (mapper existente).
- Reativação de expedição arquivada usa o mesmo `resolverStatusInicial`.
- `cancelarPorReversaoConclusaoPcp` arquiva também expedições em `AGUARDANDO_INSTALACAO`.

### 4.3 Avanço expedição após instalação

Arquivo: `backend/src/instalacao/services/instalacao.service.ts` → `concluirLote`

Quando **todos** os lotes da OS estão `CONCLUIDO` → expedição `AGUARDANDO_INSTALACAO` → **`ENTREGUE_FINALIZADO`**.

### 4.4 Rollout manual (API)

- **`POST /instalacao/lotes`** — gestor cria lote com endereço + quantidade (`CriarLoteInstalacaoDto`).
- Serviço: `ItemOSInstalacaoCriacaoService.criarLoteManual`.
- Valida saldo e `instalacao_necessaria`.

### 4.5 Feedback UI

- `POST /pcp/kanban/concluir/:itemOsId` retorna `instalacao: { criado, quantidade_alocada, motivo_skip }`.
- `PUT /pcp/kanban/status/:osId` retorna `instalacao: { lotes_criados, resultados[] }`.
- `frontend/src/hooks/useMeuSetor.ts` — toast ao criar lote ou quando `motivo_skip` é relevante.

### 4.6 Typecheck

`npx tsc -p tsconfig.build.json --noEmit` no `backend/` — **passou** (exit 0) após as mudanças.

---

## 5. Arquivos-chave (mapa rápido)

```
backend/src/
├── pcp/services/pcp-kanban.service.ts      # gatilhos PCP + sync instalação
├── expedicao/services/expedicao-criacao.service.ts  # status AGUARDANDO_INSTALACAO
├── instalacao/
│   ├── services/item-os-instalacao-criacao.service.ts  # processarBaixaProducao(Os) + criarLoteManual
│   ├── services/instalacao.service.ts        # concluirLote + avanço expedição
│   ├── controllers/instalacao.controller.ts  # POST /instalacao/lotes
│   └── dto/gestao.dto.ts                     # CriarLoteInstalacaoDto
└── os/services/os.service.ts                 # hook FINALIZADA manual

frontend/src/
├── hooks/useMeuSetor.ts                      # toast instalação
├── app/(main)/instalacao/                    # fila gestão
├── app/(main)/instalador/                    # mobile campo
└── components/instalacao/InstalacaoOsPainel.tsx  # aba OS (sem botão "Novo lote" ainda)
```

---

## 6. Roteiro de teste E2E (obrigatório após mudanças)

1. Orçamento: 1 produto PCP, **Instalação necessária** ON, tipo + preços → salvar/aprovar.
2. Gerar OS → aprovar prazos → liberar item PCP → atribuir workflow.
3. Concluir produção por **qualquer** caminho:
   - **Meu Setor** (`/pcp/meu-setor`) — iniciar + concluir cada etapa, **ou**
   - Kanban PCP — arrastar OS para **Finalizada**.
4. Verificar:
   - `/instalacao` — lote(s) na fila
   - OS → aba **Instalação**
   - `/expedicao` — card em **Aguardando instalação**
5. `/instalador` → iniciar → concluir lote com fotos/assinatura.
6. Expedição deve ir para **Entregue/Finalizado**.

**Rollout multi-endereço:** `POST /instalacao/lotes` com `item_os_id`, `quantidade_alocada` e endereço; repetir até saldo zerar.

---

## 7. Próximos passos (backlog priorizado)

### Alta — para produto testável no dia a dia

| # | Tarefa | Onde |
|---|--------|------|
| 1 | Botão **“Novo lote”** + saldo a alocar no `InstalacaoOsPainel` | `frontend/src/components/instalacao/` |
| 2 | API route Next.js para `POST /instalacao/lotes` (se ainda não existir) | `frontend/src/app/api/instalacao/` |
| 3 | Exibir `motivo_skip` no kanban PCP ao finalizar OS (toast) | kanban frontend |
| 4 | Fechar **DEC-04** na doc e no código (saldo 50%: PDF vs trava expedição) | financeiro + expedição |

### Média — spec completa

| # | Tarefa |
|---|--------|
| 5 | Cobrança extra por ocorrências (DEC-08) |
| 6 | Split fiscal em produção real (DEC-09) |
| 7 | `data_instalacao_agendada` na OS quando tipo exige agendamento |
| 8 | Importação/planilha rollouts (DEC-13) |

### Decisões de produto ainda abertas

Documentadas em [`01-analise-implementacao-e-decisoes.md`](./modulo%20instalacao/01-analise-implementacao-e-decisoes.md):

- **DEC-01** — fechada na prática como **opção C (híbrido)** nesta implementação; formalizar na doc.
- **DEC-03** — lote na baixa parcial (implementado) vs só no fim (fallback quando setores todos CONCLUIDA).
- **DEC-04** — momento liberação saldo 50%.

---

## 8. Motivos de skip (`processarBaixaProducao`)

| `motivo_skip` | Significado |
|---------------|-------------|
| `SEM_INSTALACAO` | Produto sem flag no orçamento — normal, ignorar |
| `SEM_ORCAMENTO` | OS sem `orcamento_id` |
| `PRODUCAO_INCOMPLETA` | Setores PCP ainda não todos CONCLUIDA/CANCELADA e sem `quantidadeProduzida` |
| `SEM_SALDO` | Quantidade já alocada em lotes |
| `ITEM_NAO_ENCONTRADO` | `item_os_id` inválido |
| `ENDERECO_PENDENTE` | Endereço do orçamento é placeholder — lote deve ser criado manualmente após confirmação |
| `AGUARDANDO_PRODUCAO` | (`criarLoteManual`) Item ainda sem baixa de produção — lote manual bloqueado até o PCP concluir (ou OS FINALIZADA / item `NAO_APLICA`) |

### 8.1 Gate de entrada no módulo (jul/2026 — correção definitiva)

O fluxo oficial (`modulo.md` § 2.1) exige que a OS só entre em Instalações **após a baixa de produção**. Dois guardrails garantem isso:

1. **Grid `/instalacao`** (`InstalacaoService.listarOsInstalacaoGestao`): OS aparece somente se tem ≥1 lote em `itens_os_instalacao` **ou** está `FINALIZADA` com produto `instalacao_necessaria`. Orçamento aprovado + OS recém-criada **não** entra mais no grid.
2. **Lote manual** (`ItemOSInstalacaoCriacaoService.criarLoteManual`): rejeita com `AGUARDANDO_PRODUCAO` enquanto o item não tiver produção concluída (setores), lote de baixa parcial, OS `FINALIZADA` ou `status_liberacao_pcp = NAO_APLICA`.

O badge do menu (`ContadoresMenuService.contarNovasInstalacoes`) espelha o critério do grid: conta lotes criados desde a última visita **e** OS `FINALIZADA` com produto instalável ainda sem lote (caso do skip `ENDERECO_PENDENTE`, em que o gestor precisa alocar manualmente). O `PcpKanbanService` invalida o cache dos badges sempre que processa a baixa de produção, mesmo quando nenhum lote é criado.

Lookup de instalação: `ProdutoOrcamento.id` **deve** ser igual a `ItemOS.id` (espelhado na geração da OS).

### 8.2 Trava financeira no grid de instalação (jul/2026)

O grid `/instalacao` reutiliza a regra da expedição (`ExpedicaoFinanceiroService`): parcela `SALDO` em `PREVISTO`/`VENCIDO`/`PARCIAL_PAGO` ou qualquer parcela vencida bloqueia. `InstalacaoService.calcularBloqueiosFinanceiros` calcula em lote (1 query de cobranças) usando o `StatusRollupService` (provider puro, registrado direto no `InstalacaoModule` para evitar ciclo com o `FinanceiroModule`). O grid retorna `bloqueio_financeiro` + `link_financeiro` por OS; o frontend pinta a linha de âmbar e exibe cadeado com tooltip "Entrega bloqueada — pendência financeira — ver financeiro" (clique abre popover com link para o financeiro). Saldo em `AGUARDANDO_RELATORIO_TECNICO` (retenção DEC-04) **não** bloqueia — é o estado esperado do fluxo de instalação.

---

## 9. Regras para o agente neste projeto

1. **Idioma:** pt-BR em código visível, commits e respostas.
2. **Commit/push:** só quando o usuário pedir explicitamente (regra do usuário prevalece sobre regra de workspace).
3. **Escopo:** mudanças mínimas; não refatorar módulos adjacentes sem pedido.
4. **Processos Node no Windows:** seguir [`DEV-GESTAO-PROCESSOS-NODE-WINDOWS.md`](./DEV-GESTAO-PROCESSOS-NODE-WINDOWS.md) — evitar `npm test` sem filtro, não deixar `nest --watch` + `jest` + `tsc` em paralelo.
5. **Prisma generate:** parar backend dev antes (`EPERM` no `query_engine-windows.dll.node`).
6. **Deploy produção:** regras em `.cursor/rules/deploy-cors-nginx-pm2-guardrails.mdc`.

---

## 10. Como retomar no novo chat

Cole no primeiro prompt:

```text
Continuar o módulo de instalação do Comunikapp.
Leia: docs/HANDOFF-CONTINUIDADE-INSTALACAO-JUL-2026.md e docs/DEV-GESTAO-PROCESSOS-NODE-WINDOWS.md
Próximo passo: [UI Novo lote no InstalacaoOsPainel | DEC-04 | outro]
Não commitar sem eu pedir.
```

---

**Última atualização:** 2026-07-01 · sessão: integração PCP→instalação + DEC-01 + POST lotes + gestão Node
