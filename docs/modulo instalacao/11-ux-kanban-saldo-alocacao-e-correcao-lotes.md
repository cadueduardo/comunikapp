# UX Kanban — Header de Saldo de Alocação e Correção de Lotes

**Versão:** 1.0  
**Data:** 2026-07-01  
**Status:** 📋 Proposta para validação de produto — **não implementado**  
**Público:** Produto, UX, operações e desenvolvimento  
**Relacionado:** [`08-ux-gestao-agenda-e-calendario.md`](./08-ux-gestao-agenda-e-calendario.md) · [`09-plano-execucao-doc08-dec04.md`](./09-plano-execucao-doc08-dec04.md) · [`modulo.md`](./modulo.md)

---

## 1. Resumo executivo

Esta proposta melhora o **workspace de instalação com Kanban interno** (UX-06), hoje visível quando uma OS possui **dois ou mais lotes** no modal `/instalacao?os=:id`.

**Problema observado:** o quadro mostra bem *onde* cada frente de trabalho está (colunas por status), mas não mantém visível *quanto da OS ainda falta alocar* em endereços. Além disso, erros de quantidade na criação do lote não têm correção clara na interface de gestão.

**Solução proposta (duas frentes):**

| # | Melhoria | Objetivo |
|---|----------|----------|
| **UX-07** | Card-header de saldo acima das colunas do Kanban | Controle visual contínuo: total × alocado × pendente |
| **UX-08** | Edição e exclusão de lote com guardrails por status | Corrigir quantidade/endereço sem quebrar a contabilidade da OS |

**Princípio reforçado:** **alocação ≠ execução**. O saldo pendente zera quando todas as unidades foram distribuídas em lotes, mesmo que os lotes ainda estejam em *Aguardando* ou *Em andamento*.

---

## 2. Contexto e motivação

### 2.1. Estado atual (pós Passos 1–5)

- O painel `InstalacaoWorkspacePanel` já expõe `itens_saldo` com `saldo_disponivel` em um card **separado**, acima do Kanban, quando há quantidade pendente.
- O Kanban (`InstalacaoOsKanbanBoard`) lista cards por endereço com `quantidade_alocada` no rodapé do card.
- Criação de lote via `NovoLoteDialog` consome saldo do `item_os_id` escolhido.
- Backend já calcula saldo em `obterPainelOs` e valida teto na criação/edição parcial via `PATCH /instalacao/lotes/:id` (`quantidade_alocada` opcional).

### 2.2. Lacunas de experiência

1. **Saldo pouco integrado ao Kanban** — o gestor precisa correlacionar mentalmente o card de saldo (acima) com os cards das colunas (abaixo).
2. **Sem feedback de “OS 100% alocada”** no contexto do quadro — quando `saldo_disponivel = 0`, o card de pendência some e o Kanban fica sem um resumo de fechamento da alocação.
3. **Correção de erro operacional** — digitar `2` em vez de `20`, endereço errado ou lote criado por engano exige fluxo pouco óbvio (não há exclusão de lote na API de gestão hoje).
4. **Card do Kanban é somente leitura** para despacho — clique abre drill-down; não há ações rápidas de correção.

### 2.3. Cenário de referência (validação visual)

OS com **20 unidades** de um produto instalável:

1. Gestor cria lote A com **2 un.** → card em *Aguardando*; header deve mostrar **18 pendentes**.
2. Cria lote B com **18 un.** → header **0 pendentes**; cards distribuídos nas colunas conforme status de campo.
3. Percebe erro no lote A (deveria ser 3 un.) → edita quantidade; header recalcula para **17 pendentes** até realocar, ou ajusta outro lote.

---

## 3. UX-07 — Card-header de saldo (acima do Kanban)

### 3.1. Posicionamento

Inserir **uma faixa fixa** entre o bloco “Execução em campo” (título + ações) e o título “Quadro de lotes”, **somente quando** `totalLotes >= 2` (modo Kanban — UX-06).

Em instalação simples (`totalLotes === 1`), o header compacto pode reutilizar o mesmo componente em versão reduzida (opcional — ver § 7).

### 3.2. Conteúdo do header

#### Linha de contexto (sempre)

| Campo | Fonte | Exemplo |
|-------|-------|---------|
| Número da OS | `painel.os.numero` | OS-2026-025 |
| Cliente | `painel.os.cliente_nome` | Elisa Cristina Santos |
| Serviço | `painel.os.nome_servico` | fone de ouvido |

#### Linha de saldo (por item instalável)

Para cada entrada em `painel.itens_saldo`:

```
{produto_servico} — {quantidade_alocada} alocadas · {saldo_disponivel} pendentes · {quantidade_total} total
```

- **Barra de progresso** opcional: `quantidade_alocada / quantidade_total`.
- **Badge de estado:**
  - `saldo_disponivel > 0` → âmbar: “Alocação incompleta”
  - `saldo_disponivel === 0` → verde: “Totalmente alocado”

#### Ações no header

| Ação | Condição | Comportamento |
|------|----------|---------------|
| **Novo lote** | `saldo_disponivel > 0` (qualquer item) | Abre `NovoLoteDialog` (já existente) |
| **Atualizar** | sempre | Refresh do painel (opcional — pode herdar do botão global) |

O botão **Nova ocorrência** permanece no toolbar superior; não duplicar no header.

### 3.3. Regras de atualização reativa

| Evento | Efeito no header |
|--------|------------------|
| Criar lote | `saldo_disponivel` diminui; `quantidade_alocada` aumenta |
| Editar `quantidade_alocada` do lote | Recalcula saldo do `item_os_id` vinculado |
| Excluir lote (UX-08) | Devolve unidades ao saldo pendente |
| Transição de status no Kanban (drag) | **Não altera** saldo — apenas execução |

### 3.4. Relação com o card de saldo atual

**Decisão proposta:** substituir o card isolado “Quantidade pendente de alocação” pelo **header unificado** quando em modo Kanban, evitando duas fontes visuais com a mesma informação.

Quando `totalLotes === 0`, manter o card atual de pendência + CTA “Novo lote”.

### 3.5. Múltiplos produtos na mesma OS

Se `itens_saldo.length > 1`, o header lista **uma linha por item**. Não agregar em um único número global (evita ambiguidade).

---

## 4. UX-08 — Edição e exclusão de lote

### 4.1. Onde expor as ações

| Superfície | Ações |
|------------|-------|
| **Drill-down do lote** (`InstalacaoLoteDetalhePanel`) | Formulário completo: endereço, quantidade, agendamento; botões Salvar / Excluir lote |
| **Card do Kanban** | Menu `⋯` com atalhos “Editar” (abre drill-down) e “Excluir” (quando permitido) |

Prioridade de implementação: **drill-down primeiro**; atalho no card é refinamento.

### 4.2. Matriz de permissões (produto)

| Status do lote (`status_instalacao`) | Editar endereço | Editar quantidade | Excluir lote |
|--------------------------------------|-----------------|-------------------|--------------|
| `AGUARDANDO` | ✅ Sim | ✅ Sim | ✅ Sim |
| `EM_ANDAMENTO` | ⚠️ Com confirmação | ⚠️ Com confirmação forte | ❌ Não |
| `CONCLUIDO` | ❌ Não | ❌ Não | ❌ Não |
| `LOGISTICA_NEGATIVA` | ❌ Não (via ocorrência) | ❌ Não | ❌ Não |

**Racional:**

- Lote **aguardando** ainda não impactou o instalador em campo → correção livre.
- Lote **em andamento** pode já estar no app `/instalador` → edição só com aviso de sincronização; exclusão bloqueada para não orphanar execução.
- Lote **concluído** entra no histórico do relatório técnico → imutável; correções via ocorrência financeira/operacional.

### 4.3. Edição de quantidade — regras de negócio

Dado lote com `item_os_id`, quantidade atual `Q_lote` e saldo pendente do item `S`:

- **Nova quantidade `Q_nova`** deve satisfazer:  
  `1 <= Q_nova <= S + Q_lote`
- Ao salvar: backend recalcula agregado de `quantidade_alocada` por `item_os_id` (já existe lógica em `item-os-instalacao-criacao.service`).
- Toast de sucesso: *“Lote atualizado. Saldo pendente: X un.”*

### 4.4. Exclusão de lote — regras de negócio

Pré-condições:

- `status_instalacao === AGUARDANDO`
- Sem evidências (`fotos_evidencia` vazias) e sem assinatura
- Sem ocorrências vinculadas exclusivamente a este lote (ou política: desvincular ocorrências — **decisão pendente**, ver § 8)

Fluxo:

1. Modal de confirmação:  
   *“Excluir o lote em {endereço}? {Q} unidades voltarão ao saldo pendente de {produto}.”*
2. `DELETE /instalacao/lotes/:id` (endpoint **novo** — não existe hoje).
3. Refresh do painel + header + Kanban.

### 4.5. Sincronização com `/instalador`

Se o lote estiver `EM_ANDAMENTO` e a quantidade for reduzida no desktop:

- O app do instalador deve refletir a nova quantidade no próximo refresh (GET fila).
- Mensagem na UI desktop: *“O instalador em campo verá a alteração ao atualizar a fila.”*

---

## 5. Alinhamento técnico (inventário)

### 5.1. Já disponível no repositório

| Capacidade | Onde |
|------------|------|
| `itens_saldo` no painel | `GET /instalacao/os/:osId/painel` → `InstalacaoService.obterPainelOs` |
| Criar lote | `POST /instalacao/lotes` |
| Atualizar endereço e quantidade | `PATCH /instalacao/lotes/:id` (`AtualizarEnderecoLoteDto.quantidade_alocada`) |
| Atualizar status (Kanban drag) | `PATCH /instalacao/lotes/:id/status` |
| BFF frontend | `instalacaoApi.obterPainelOs`, `atualizarLote`, `criarLote` |

### 5.2. Lacunas técnicas para implementação

| Item | Tipo | Observação |
|------|------|------------|
| `DELETE /instalacao/lotes/:id` | Backend + BFF | Novo; com validação de status e devolução de saldo |
| UI de edição no drill-down | Frontend | Reutilizar `EnderecoInstalacaoForm` + campo quantidade |
| Componente `InstalacaoSaldoAlocacaoHeader` | Frontend | Novo; consumido pelo workspace Kanban |
| Log de auditoria (edição/exclusão) | Backend | Recomendado — `usuario_id`, `acao`, `antes/depois` |
| Testes | Backend + frontend | Validação de saldo após PATCH/DELETE |

---

## 6. Wireframe textual

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Execução em campo                    [Atualizar] [+ Nova ocorrência]    │
│ 2 lotes — gerencie cada frente de trabalho no quadro abaixo.            │
├─────────────────────────────────────────────────────────────────────────┤
│ HEADER SALDO (UX-07)                                                    │
│ OS OS-2026-025 — Elisa Cristina Santos · fone de ouvido                 │
│ Adesivo Laminado — 20 alocadas · 0 pendentes · 20 total  [████████] ✓   │
├─────────────────────────────────────────────────────────────────────────┤
│ Quadro de lotes                                                         │
│ ┌──────────────┬──────────────┬──────────────┬──────────────────────┐ │
│ │ Aguardando 1 │ Em andam. 1  │ Concluído 0  │ Logística negativa 0 │ │
│ │ [card…]      │ [card…]      │              │                      │ │
│ └──────────────┴──────────────┴──────────────┴──────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘

Drill-down do lote (UX-08):
┌─────────────────────────────────────────────────────────────────────────┐
│ ← Voltar ao quadro          Rua Gasparino Lunardi, 321                  │
│ Status: Aguardando                                                      │
│ Quantidade alocada: [  18  ] un.   (máx. 18 — saldo devolvido + atual)  │
│ [EndereçoInstalacaoForm…]                                               │
│ [ Salvar alterações ]  [ Excluir lote ] (destrutivo, só se Aguardando)  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Escopo e fases sugeridas

### Fase A — Header de saldo (menor risco)

- Componente header + integração no `InstalacaoWorkspacePanel` (modo Kanban).
- Remover/substituir card duplicado de pendência nesse modo.
- Critérios de aceite: § 9.1.

### Fase B — Edição de lote

- Formulário no `InstalacaoLoteDetalhePanel` com `PATCH` existente.
- Validação de teto de quantidade no backend (reforço se necessário).
- Critérios de aceite: § 9.2.

### Fase C — Exclusão de lote

- Novo endpoint `DELETE` + modal de confirmação.
- Critérios de aceite: § 9.3.

### Fora de escopo (v1 desta proposta)

- Edição em lote concluído ou com assinatura.
- Rebalanceamento automático entre lotes (“mover 5 un. do lote A para B”).
- Header na aba Instalação da OS (espelho) — pode ser fase futura.

---

## 8. Decisões pendentes para validação

| ID | Pergunta | Opções | Recomendação |
|----|----------|--------|--------------|
| **D-11.1** | Header também em instalação simples (1 lote)? | Sim compacto / Não | Sim, versão compacta |
| **D-11.2** | Excluir lote com ocorrência vinculada? | Bloquear / Desvincular / Excluir em cascata | Bloquear com mensagem clara |
| **D-11.3** | Editar lote `EM_ANDAMENTO`? | Bloquear / Permitir com confirmação | Permitir com confirmação (v1) |
| **D-11.4** | Auditoria obrigatória? | Sim / Não | Sim (log estruturado) |
| **D-11.5** | Quem pode excluir? | Mesmo RBAC de gestão / Só ADMIN | Mesmo guard de `InstalacaoGestaoPermissionsGuard` |

---

## 9. Critérios de aceite (homologação)

### 9.1. UX-07 — Header de saldo

- [ ] Com 2+ lotes, o header aparece acima das colunas do Kanban.
- [ ] Exibe corretamente `alocadas`, `pendentes` e `total` por item em `itens_saldo`.
- [ ] Ao criar lote, números atualizam sem recarregar a página inteira (refresh do painel).
- [ ] Com saldo zero, badge “Totalmente alocado” visível; Kanban continua funcional.
- [ ] Com múltiplos itens instaláveis, uma linha por produto (sem soma global enganosa).
- [ ] Textos em pt-BR; suporte light/dark (`bg-card`, `border-border`).

### 9.2. UX-08 — Edição

- [ ] No drill-down, lote `AGUARDANDO` permite alterar quantidade e endereço.
- [ ] Quantidade acima do permitido é rejeitada com mensagem em pt-BR.
- [ ] Após salvar, header e cards do Kanban refletem a nova quantidade.
- [ ] Lote `CONCLUIDO` não exibe ações de edição/exclusão.

### 9.3. UX-08 — Exclusão

- [ ] Apenas lotes `AGUARDANDO` sem evidências podem ser excluídos.
- [ ] Modal descreve quantas unidades retornam ao saldo.
- [ ] Após excluir, card some do Kanban e saldo pendente aumenta corretamente.
- [ ] Lote `EM_ANDAMENTO` não oferece exclusão.

---

## 10. Riscos e mitigação

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Dessincronia com app instalador | Instalador vê quantidade/endereço antigo | Aviso na UI; refresh da fila mobile |
| Dupla fonte de saldo (UI) | Números divergentes | Uma única API: `obterPainelOs` |
| Exclusão acidental | Perda de planejamento | Modal destrutivo + só em Aguardando |
| OS com itens heterogêneos | Confusão no header | Linha por `item_os_id` |

---

## 11. Checklist de validação de produto

Use este bloco na reunião de aprovação:

- [ ] **Conceito UX-07 aprovado** — header de saldo acima do Kanban
- [ ] **Conceito UX-08 aprovado** — edição/exclusão com matriz de status
- [ ] **D-11.1 a D-11.5** respondidas (§ 8)
- [ ] **Fase A** autorizada para desenvolvimento
- [ ] **Fase B / C** autorizadas ou adiadas explicitamente

**Aprovado por:** _______________  
**Data:** _______________

---

## 12. Referências de código (implementação futura)

```
frontend/src/components/instalacao/
├── InstalacaoWorkspacePanel.tsx      # integrar header
├── InstalacaoOsKanbanBoard.tsx       # cards + menu opcional
├── InstalacaoLoteDetalhePanel.tsx    # edição/exclusão
├── InstalacaoSaldoAlocacaoHeader.tsx # novo (proposto)
└── NovoLoteDialog.tsx                # CTA do header

backend/src/instalacao/
├── controllers/instalacao.controller.ts  # DELETE lotes/:id (novo)
├── services/instalacao.service.ts        # excluirLote, reforço PATCH
└── dto/gestao.dto.ts                     # já suporta quantidade_alocada
```

---

*Documento gerado a partir da conversa de produto jul/2026 — Kanban OS OS-2026-025 / cenário 20 unidades em 2 endereços.*
