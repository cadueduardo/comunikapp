# UX de Gestão de Instalação — Grid, Kanban por OS, Agenda e Calendário

**Versão:** 1.0  
**Data:** 2026-07-01  
**Status:** Especificação de produto — decisões de conversa jul/2026; **não implementado** na íntegra  
**Público:** Produto, UX e desenvolvimento  
**Relacionado:** [`modulo.md`](./modulo.md) · [`07-handoff-continuidade-jul-2026.md`](./07-handoff-continuidade-jul-2026.md) · [`../HANDOFF-CONTINUIDADE-INSTALACAO-JUL-2026.md`](../HANDOFF-CONTINUIDADE-INSTALACAO-JUL-2026.md)

---

## 1. Resumo executivo

Este documento consolida as decisões de produto discutidas em jul/2026 sobre **como o usuário gerencia instalações** no ComunikApp, indo além da implementação atual (tabela de lotes + aba OS com painel misto).

**Princípios acordados:**

1. **A OS é o contrato** — acompanha-se o andamento na aba Instalação da OS (espelho).
2. **O módulo `/instalacao` é onde se trabalha** — planejamento, lotes, agenda, ocorrências.
3. **Chão de fábrica não vê financeiro** — margem, split fiscal e relatório técnico ficam no Financeiro (ou perfil comercial), não na OS operacional.
4. **Agendamento canônico por lote/endereço** — cada visita tem data; a OS agrega resumos.
5. **Calendário operacional** — dia / semana / mês (preferência do operador); alertas de conflito ao agendar.

---

## 2. Separação de responsabilidades por superfície

| Superfície | Papel | O que mostra | O que **não** mostra |
|------------|-------|--------------|----------------------|
| **`/instalacao`** (desktop) | Gestão e planejamento | Grid de OS, calendário, drill-down para Kanban/workspace | Valores R$, margem, split fiscal |
| **`/instalacao`** (mobile) | Fila operacional | Cards de OS + acesso ao calendário via header | Mesmas restrições financeiras |
| **Drill-down da OS** (Kanban interno) | Despacho por endereço | Cards = lotes; equipes em paralelo | — |
| **Workspace** (modal ou rota) | Trabalho pesado | Lotes, endereços, fotos, ocorrências, agendar visita | Financeiro |
| **Aba Instalação na OS** | Espelho / acompanhamento | Timeline, progresso (`8/20`), próximas visitas | Edição pesada (opcional mínima); sem R$ |
| **`/instalador`** | Execução em campo | Fila do instalador, iniciar/concluir, evidências | Custos e preços ao cliente |
| **Financeiro** | Fechamento comercial | Relatório técnico, margem, saldo 50%, cobranças extras | — |
| **Home operacional** | Radar do dia | Widget “Instalações hoje / esta semana” | Calendário completo (só link) |

### 2.1. Padrão Arte (referência interna)

O fluxo espelha o que já existe em Arte & Aprovação:

- Fila/Kanban ou grid no módulo dedicado.
- Clique abre **workspace fullscreen** (desktop).
- Contexto na OS permanece como **acompanhamento**.

Diferença estrutural: em Arte o card da fila é **por item**; em Instalação o card operacional de despacho é **por lote (endereço)** dentro de uma OS.

---

## 3. Modelo de dados para agenda (fonte da verdade)

### 3.1. Campos existentes no repositório

| Campo | Entidade | Uso hoje | Papel na nova UX |
|-------|----------|----------|------------------|
| `data_previsao` | `ItemOSInstalacao` (lote) | Backend ordena filas; **sem UI de agendamento** | **Canônico** — data (e futuramente hora) da visita |
| `data_instalacao_agendada` | `OrdemServico` | API `PATCH /os/:id/agendar-instalacao`; listagem `GET /os/instalacoes/agendadas` | **Derivado / resumo** — ex.: próxima visita ou única visita |
| `data_execucao` | `ItemOSInstalacao` | Preenchido ao iniciar/concluir em campo | Realizado vs planejado |
| `exige_agendamento` | `TipoInstalacao` (orçamento) | Flag no produto | Obrigar data ao planejar lote |

### 3.2. Regra de produto

- **Agendar = definir `data_previsao` no lote** (não na OS inteira).
- A OS exibe rollup: `próxima_visita`, `visitas_concluidas / total`, `observacoes_instalacao` quando fizer sentido.
- Evitar duas fontes conflitantes: se `data_instalacao_agendada` na OS permanecer, deve ser **calculada ou sincronizada** a partir dos lotes (ou legado até migração).

### 3.3. Extensões futuras (não bloqueiam MVP)

| Campo / conceito | Finalidade |
|------------------|------------|
| `hora_inicio` / `hora_fim` ou janela | Conflito por turno |
| `equipe_id` / `instalador_id` | Conflito por equipe; fila do `/instalador` |
| `duracao_estimada_min` | Capacidade do dia (somar horas) |

---

## 4. Navegação em duas camadas

### 4.1. Camada 1 — Grid de OS (`/instalacao`)

**Layout desktop (proposta):**

```text
┌────────────────────────────────────┬─────────────────────────┐
│  Grid de OS com instalação         │  Calendário             │
│  (CRUD operacional padrão)         │  Dia | Semana | Mês     │
│                                    │                         │
│  Colunas sugeridas:                │  Eventos = lotes        │
│  - OS / cliente                    │  (endereço + OS)        │
│  - Produto / qty total             │                         │
│  - Progresso: 8/20 concluídas    │  Clique no dia →        │
│  - Próxima visita                  │  filtra grid            │
│  - Status agregado instalação      │                         │
│  - Ações: Abrir                    │  Clique no evento →     │
│                                    │  abre lote/workspace    │
└────────────────────────────────────┴─────────────────────────┘
```

**Comportamento:**

- Uma **linha = uma OS** que possui instalação (pelo menos um item com `instalacao_necessaria` e lotes ou saldo a alocar).
- Clique na linha → drill-down (ver §4.2).
- Calendário e grid **compartilham filtros** (período, cliente, status).

**Status agregado sugerido na linha** (rollup dos lotes):

| Status OS (instalação) | Regra |
|------------------------|-------|
| `AGUARDANDO_PLANEJAMENTO` | Nenhum lote com endereço/data definidos |
| `PARCIALMENTE_PLANEJADO` | Há lotes planejados e saldo pendente de alocação |
| `AGENDADO` | Todas as unidades alocadas em lotes com `data_previsao` |
| `EM_CAMPO` | Pelo menos um lote `EM_ANDAMENTO` |
| `PARCIALMENTE_CONCLUIDO` | Alguns `CONCLUIDO`, outros pendentes |
| `CONCLUIDO` | Todos os lotes `CONCLUIDO` |

*(Nomes finais podem alinhar a enums existentes; hoje o status é por lote, não por OS — rollup é camada de apresentação.)*

### 4.2. Camada 2 — Dentro da OS

Dois modos conforme complexidade:

#### A) Instalação simples (1 lote / 1 endereço)

- **Sem Kanban interno** (ou Kanban trivial com 1 card).
- Clique no grid abre **workspace direto** (modal fullscreen ou rota `/instalacao/os/:osId`).
- Agendamento: um campo de data no lote.

#### B) Rollout (N endereços / N lotes)

- Clique no grid abre **Kanban da OS**:
  - **1 card = 1 lote** (endereço + quantidade).
  - Colunas mapeadas ao fluxo operacional (ex.: `Aguardando` → `Agendado` → `Em campo` → `Concluído`).
  - Várias equipes em endereços diferentes no mesmo dia = vários cards em colunas distintas.
- Clique no card do lote → workspace do lote (ou painel lateral) para endereço, fotos, ocorrências, data.

**Critério sugerido para escolher modo A vs B:**

- `lotes.length === 1` **e** `quantidade_total === 1` → modo simples.
- Caso contrário → Kanban interno.

---

## 5. Workspace de instalação

### 5.1. Desktop

- **Modal fullscreen** (padrão Arte) **ou** rota dedicada — rota envelhece melhor para rollouts longos e links compartilháveis.
- Conteúdo operacional:
  - Resumo da OS (cliente, serviço, progresso).
  - Lista / edição de lotes (endereço, qty, `data_previsao`).
  - Ação **Novo lote** (rollout manual — já existe API `POST /instalacao/lotes`).
  - Timeline de eventos (somente leitura de ocorrências sem R$).
  - Registrar ocorrência (broker / gestor).

### 5.2. Espelho na aba OS

Tudo registrado no workspace **replica** na aba Instalação da OS:

- Timeline cronológica.
- Barra ou badge: `Instalação: 8/20 concluídas · 2 em campo`.
- Próximas visitas agendadas.
- **Sem** botões duplicados de gestão pesada (opcional: link “Gerenciar em Instalações →”).

---

## 6. Calendário operacional

### 6.1. Visualizações

O operador escolhe a granularidade (padrão de mercado):

| Vista | Uso |
|-------|-----|
| **Dia** | Despacho diário — **abertura sugerida** com instalações do dia |
| **Semana** | Capacidade e distribuição de equipes |
| **Mês** | Planejamento de rollouts longos |

**Preferência do operador** deve ser persistida (localStorage ou perfil).

### 6.2. Unidade do evento

Cada evento no calendário = **um lote** (`ItemOSInstalacao`), não a OS inteira.

Tooltip / card do evento:

- OS `numero`, cliente
- Endereço resumido
- Quantidade alocada
- Status do lote
- Equipe (futuro)

### 6.3. Interações

| Ação | Resultado |
|------|-----------|
| Clicar em um **dia** | Filtra grid de OS à esquerda (desktop) ou lista no mobile |
| Clicar em um **evento** | Abre workspace do lote ou Kanban da OS focado no card |
| **Arrastar** evento (fase 2) | Reagenda `data_previsao` com checagem de conflito |

### 6.4. Desktop vs mobile

| Plataforma | Layout |
|------------|--------|
| **Desktop** | Grid (esquerda) + calendário (direita) na mesma tela `/instalacao` |
| **Mobile** | Lista de OS em **cards** (padrão CRUD responsivo); no **header**, toggle ou botão **“Ver calendário”** que troca para vista calendário (dia/semana/mês em tela cheia ou aba) |

---

## 7. Alertas de conflito de agenda

### 7.1. Problema

Ao agendar OS B no mesmo dia em que OS A já tem visita, o operador precisa de **visibilidade** para evitar sobrecarga ou choque de equipe.

### 7.2. Fases de regra

#### Fase 1 — MVP (baixa complexidade)

**Gatilho:** ao salvar `data_previsao` de um lote.

**Consulta:** todos os lotes da **loja** naquele **dia civil** com status ≠ `CONCLUIDO`.

**UI:**

- Alerta **informativo** (amarelo): *“Neste dia já existem N instalações agendadas”*.
- Lista resumida: OS, endereço, horário (se houver).
- Botões: **Confirmar mesmo assim** | **Escolher outra data**.

Não bloquear por padrão — lojas pequenas frequentemente empilham visitas.

#### Fase 2 — Equipe e capacidade

- Conflito **por equipe** no mesmo dia/turno.
- Configuração na loja: máx. visitas por equipe/dia ou horas disponíveis.
- Alerta **forte** (laranja) ou bloqueio configurável.

#### Fase 3 — Geografia (opcional)

- Aviso se duas visitas no mesmo dia estão em cidades distantes para a **mesma equipe** (requer mapas/distância).

### 7.3. API sugerida (produto)

```http
GET /instalacao/agenda?de=2026-07-01&ate=2026-07-31
→ lista de eventos (lotes com data_previsao, status, OS, endereço)

GET /instalacao/agenda/conflitos?data=2026-07-02&lote_id=opcional&equipe_id=opcional
→ { total_no_dia, itens[], severidade }
```

---

## 8. Home operacional

Widget compacto (não duplicar calendário completo):

- **“Instalações hoje”** — contagem + 3–5 próximos eventos (OS, endereço, hora).
- **“Esta semana”** — resumo numérico.
- Link: **Ver todas em Instalações →** (`/instalacao` com filtro de data).

Alimentado pela mesma API `GET /instalacao/agenda`.

---

## 9. Jornada ponta a ponta (referência)

```mermaid
flowchart LR
    PCP[PCP conclui produção]
    FILA[Lote(s) na fila Instalação]
    GRID[Grid OS em /instalacao]
    KANBAN[Kanban lotes da OS]
    WS[Workspace lote]
    CAMPO[/instalador em campo]
    OS_ESP[Aba OS espelho]
    FIN[Financeiro fechamento]

    PCP --> FILA --> GRID
    GRID -->|1 lote| WS
    GRID -->|N lotes| KANBAN --> WS
    WS -->|agenda + alerta| WS
    WS --> CAMPO
    WS --> OS_ESP
    CAMPO --> OS_ESP
    OS_ESP -.->|sem R$| FIN
```

---

## 10. Estado atual vs este documento

| Capacidade | Estado jul/2026 |
|------------|-----------------|
| Hook PCP → criação de lotes | ✅ Implementado |
| `/instalacao` tabela global de lotes | ✅ Implementado (a substituir por grid de OS) |
| Aba OS operacional (sem financeiro) | ✅ Ajustado jul/2026 |
| Novo lote manual (API + UI na OS) | ✅ Implementado |
| Grid de OS em `/instalacao` | ❌ Não implementado |
| Kanban interno por OS | ❌ Não implementado |
| Workspace modal estilo Arte | ❌ Não implementado |
| Calendário dia/semana/mês | ❌ Não implementado |
| Alerta de conflito ao agendar | ❌ Não implementado |
| `data_previsao` na UI | ❌ Não implementado |
| Widget Home operacional | ❌ Não implementado |
| Agendamento só no Financeiro (relatório técnico) | ✅ Backend existe; UI fora da OS |

---

## 11. Backlog sugerido (ordem de implementação)

| # | Entrega | Depende de |
|---|---------|------------|
| 1 | API `GET /instalacao/agenda` + PATCH lote com `data_previsao` | Schema já tem campo |
| 2 | UI agendar data no workspace / edição de lote | #1 |
| 3 | Alerta conflito Fase 1 ao salvar data | #1 |
| 4 | Grid de OS em `/instalacao` com rollup de progresso | Painel já retorna `itens_saldo` |
| 5 | Calendário (dia default) + integração grid ↔ calendário desktop | #1, #4 |
| 6 | Drill-down: workspace simples vs Kanban por OS | #4 |
| 7 | Vista mobile: cards + header “Calendário” | #4, #5 |
| 8 | Widget Home operacional | #1 |
| 9 | Conflito por equipe (Fase 2) | Modelo equipe no lote |
| 10 | Sincronizar / deprecar `data_instalacao_agendada` na OS | Decisão explícita |

---

## 12. Decisões em aberto (para fechar antes de codar calendário)

> **Atualização jul/2026:** decisões oficiais e plano técnico de implementação em [`09-plano-execucao-doc08-dec04.md`](./09-plano-execucao-doc08-dec04.md) (DEC-04 fechada; UX-01 a UX-06 definidos).

| ID | Pergunta | Opções |
|----|----------|--------|
| **UX-01** | Workspace em modal ou rota `/instalacao/os/:id`? | Modal (Arte) / Rota / Híbrido |
| **UX-02** | `data_instalacao_agendada` na OS | Manter manual / calcular do lote / deprecar |
| **UX-03** | Horário no MVP | Só data / data + hora opcional |
| **UX-04** | Conflito mesmo dia | Só aviso / aviso + confirmação obrigatória |
| **UX-05** | Vista default do calendário | Dia (proposto) / Semana |
| **UX-06** | Critério “instalação simples” | 1 lote e qty 1 / só 1 lote |

---

## 13. Fora de escopo deste documento

- Fechamento financeiro (DEC-04), split fiscal, relatório técnico — ver [`06-relatorio-fase-5-pdf-e-fechamento.md`](./06-relatorio-fase-5-pdf-e-fechamento.md).
- Integração Expedição × Instalação (DEC-01) — ver handoff jul/2026.
- Importação de rollouts por planilha (DEC-13).

---

**Última atualização:** 2026-07-01 · decisões oficiais: ver [`09-plano-execucao-doc08-dec04.md`](./09-plano-execucao-doc08-dec04.md) e [`10-analise-varredura-alinhamento-passo1.md`](./10-analise-varredura-alinhamento-passo1.md)
