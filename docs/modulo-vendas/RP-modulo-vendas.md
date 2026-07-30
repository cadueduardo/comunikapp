# RP — Módulo de Vendas

**Status:** requisitos de produto e plano arquitetural — implementação **não iniciada**  
**Revisão:** 2026-07-30  
**RP significa:** Requisitos de Produto  
**Nome na interface:** Vendas  
**Domínio interno:** Comercial / Vendas  
**Objetivo:** dar casa própria ao ciclo comercial (preço ao cliente, proposta, negociação, aditivos e handoff limpo), sem misturar o vendedor de equipe na área financeira nem reinventar OS Aditiva / pós-cálculo.

**Referências obrigatórias (inventário e fronteiras):**

- `docs/modulo instalacao/13-plano-split-financeiro-os-aditiva.md`
- `docs/modulo instalacao/14-analise-contexto-fase5-split-financeiro.md`
- `docs/modulo instalacao/12-decisoes-produto-instalacao-comunikapp.md` (DEC-17)
- `docs/modulo financeiro/radar-home-financeiro.md`
- `docs/modulo financeiro/feature-financeiro-previsto-real.md`
- `docs/modulo-os-melhorias/DIAGNOSTICO-MODULO-OS.md`
- `docs/modulo-aprovacao-orcamento.md`
- `docs/fase-0-home-operacional/07-permissoes-home.md`
- `docs/database/boas-praticas-schema-prisma.md`
- Estilo de RP: `docs/modulo de compras/RP-mvp-compras-suprimentos.md`

---

## 0. Decisões fechadas do product owner (não negociar neste RP)

1. **Hoje não existe módulo de Vendas.** Orçamento existe; o vendedor acaba misturado com Financeiro/OS — dor de UX em equipes.
2. **Vendedor solo** continua podendo fazer tudo (modo “dona da loja”).
3. **Em equipe**, o vendedor **não** deve “entrar na área financeira da empresa” para precificar, gerar aditivo ou tratar preço ao cliente.
4. **OS Aditivas já funcionam e estão corretas.** **Não recriar.** Apenas referenciar e encaixar no fluxo de Vendas (UX + ownership + RBAC).
5. **Custos / valores / pós-cálculo / aba Financeiro na OS: não mexer agora.** Este RP **absorve** as melhorias de fronteira comercial para implementação futura (épicos marcados).
6. Premissa de mercado:
   - **Vendas** = preço e relação comercial;
   - **Financeiro** = cobrar / conciliar / fechar;
   - **OS / PCP / campo** = fatos **sem R$** na superfície operacional.

---

## 1. Visão do produto

Vendas é o módulo em que a loja **propõe, negocia e fecha preço com o cliente**, e acompanha o pipeline comercial até o handoff para operação e financeiro.

Não é:

- um segundo orçamento;
- um segundo financeiro;
- um segundo módulo de OS Aditiva;
- o lugar do previsto × real (pós-cálculo).

É a **casa do comercial**: listagens, filas e ações que hoje estão espalhadas em Orçamentos (sidebar solto), Instalação (gestão + precificação misturada), Financeiro (recebimentos + card de relatório técnico) e OS (aba Financeiro).

---

## 2. Problemas que o MVP resolve

1. Equipe comercial não encontra um hub “Vendas” — só “Orçamentos” e atalhos misturados.
2. Em equipe, precificar ocorrência / gerar caminho comercial de aditivo exige perfil `FINANCEIRO` e UI embutida em superfícies financeiras (`FinanceiroPermissionsGuard`, card em `InstalacaoRelatorioTecnicoCard`).
3. Vendedor de equipe vê (ou é empurrado para) contas a receber, pós-cálculo e fechamento — fora do job.
4. Ownership comercial (pipeline, responsável, follow-up de proposta) não tem home nem badges próprios.
5. Fronteira conceitual “preço ao cliente vs cobrar” não está explícita na navegação nem no RBAC.

**Fora do MVP (só documentado):** reescrever motor de cálculo, recriar OS Aditiva, alterar pós-cálculo/aba Financeiro da OS, comissionamento avançado, CRM completo, NF-e.

---

## 3. Princípios fechados

1. **Reutilizar** `orcamentos-v2`, `cliente`, chat/links públicos e **OS Aditiva** — não duplicar entidades.
2. **Não recriar** `OrcamentoAditivoInstalacao`, `InstalacaoSplitFinanceiroService.gerarOsAditiva`, nem o fluxo pai→filha já entregue.
3. Vendas **absorve UX/ownership** do caminho comercial; Financeiro permanece dono de cobrança/recebimento/conciliação/fechamento.
4. Campo (instalador) continua **sem R$** (já enforced no backend de instalação).
5. Solo = união de papéis na mesma pessoa; equipe = menor privilégio por `usuario_funcao` + perfis.
6. Handoffs são explícitos: Vendas → OS/PCP (fato operacional) e Vendas → Financeiro (obrigação de receber).
7. Toda consulta/mutação permanece multi-tenant (`loja_id` do token).
8. Migrations futuras, se necessárias, são **aditivas**; sem tabelas especulativas neste RP.
9. Navegação segue o padrão Module Nav (`frontend/src/lib/module-nav/` + `MODULE_NAV_REGISTRY`).
10. Textos ao usuário em pt-BR; erros públicos estáveis, sem vazamento de segredo.

---

## 4. Inventário do que já existe (reaproveitar)

### 4.1 Orçamentos V2 (núcleo comercial já pronto)

| Ativo | Path / artefato | Uso em Vendas |
|-------|-----------------|---------------|
| Lista + CRUD | `frontend/src/app/(main)/orcamentos-v2/` | Seção principal do hub Vendas |
| Formulário | `frontend/src/components/ui/orcamentos-v2/orcamento-v2-form.tsx` | Sem reescrita |
| Backend módulo | `backend/src/orcamentos-v2/` | Fonte autoritativa |
| Status | `backend/src/orcamentos-v2/enums/orcamento-status.enum.ts` (`rascunho` … `cancelado`) | Pipeline comercial |
| Motor / cálculo | `backend/src/motor-calculo-v2/`, `calculo-v2.controller.ts` | Precificação da proposta |
| Simulador | `frontend/src/app/(main)/orcamentos-v2/simulador/`, `SimuladorPrecificacao.tsx` | Ferramenta do vendedor |
| Links públicos | `links-v2.controller.ts` / `links-v2.service.ts` | Envio ao cliente |
| Página pública | `frontend/src/app/orcamento-v2/[id]/page.tsx` + API routes `frontend/src/app/api/orcamentos-v2/` | Aprovação/negociação externa |
| Chat V2 | `chat-v2.controller.ts` / `chat-v2.service.ts` | Negociação no orçamento |
| Mensagens (legado paralelo) | `backend/src/mensagens-negociacao/` | Unificar/apontar no hub; não criar terceiro chat |
| Responsável | `orcamento.responsavel_id` (Prisma) | Ownership do vendedor |
| Comissão padrão loja | `loja.comissao_padrao` | Input de preço (já no form) |
| Module nav atual | `frontend/src/lib/module-nav/operacionais.ts` → `orcamentosModuleNav` | Migrar para dentro de `vendasModuleNav` |
| Sidebar | `frontend/src/lib/sidebar-menu.tsx` (`/orcamentos-v2`) | Substituir item por **Vendas** (ou agrupar) |

### 4.2 OS Aditiva / split (reutilizar — não recriar)

| Ativo | Path / artefato | Nota |
|-------|-----------------|------|
| Modelo vínculo | `OrcamentoAditivoInstalacao` em `backend/prisma/schema.prisma` | OS pai + OS filha + orçamento sintético + snapshot |
| OS pai/filha | `OrdemServico.os_pai_id`, `tipo_vinculo_os` (`PRINCIPAL` \| `ADITIVA_INSTALACAO`) | Já na listagem OS |
| Ocorrências | `OcorrenciaInstalacao` + `StatusFinanceiroOcorrencia` | Fato de campo → precificação |
| Taxas sugestão | `TaxaOcorrenciaLoja` + seeder | Baseline de custo/preço |
| Serviço split | `backend/src/instalacao/services/instalacao-split-financeiro.service.ts` | `precificarOcorrencia`, `gerarOsAditiva`, fila |
| APIs | `instalacao.controller.ts`: `fila-precificacao`, `precificar`, `abonar`, `gerar-os-aditiva`, `os-aditivas` | Backend pronto |
| Proxies Next | `frontend/src/app/api/instalacao/ocorrencias/…`, `…/gerar-os-aditiva` | Reaproveitar |
| UI precificar | `PrecificarOcorrenciaDialog.tsx` | **Casa atual errada para equipe** (ver §4.3) |
| Fila grid | `InstalacaoOcorrenciasFilaGrid.tsx` | Existe; **ainda não plugada** na home de instalação |
| Card relatório / aditiva | `frontend/src/components/financeiro/InstalacaoRelatorioTecnicoCard.tsx` | Usado em Instalação **e** Recebimentos |
| Grid OS aditivas | `frontend/src/lib/os-grid-aditiva.utils.ts`, colunas em `os/columns.tsx` | Só leitura/contexto no comercial |
| Flag loja | `configuracao_instalacao_loja.os_aditiva_habilitada` | Config operacional, não recriar |
| Spec produto | `docs/modulo instalacao/13-plano-split-financeiro-os-aditiva.md` | Fonte do fluxo; implementação já avançou além do doc 14 |

**Decisão de produto:** o **motor** de OS Aditiva permanece no domínio Instalação/OS. Vendas passa a ser a **superfície comercial** (fila de precificação ao cliente + disparo “gerar aditivo comercial”), sem segundo gerador.

### 4.3 Onde a fronteira está “errada” hoje (inventário de misplacement)

| Comportamento | Onde mora hoje | Problema | Destino conceitual (Vendas) |
|---------------|----------------|----------|-----------------------------|
| Precificar ocorrência (`preco_cliente`) | Guard `FinanceiroPermissionsGuard` (`ADMINISTRADOR`, `FINANCEIRO`) em `instalacao.controller.ts` | Vendedor de equipe **não** pode precificar; quem precifica é “financeiro” | Ação comercial em Vendas (+ ADMIN); Financeiro só exceção/auditoria |
| Gerar OS Aditiva | Mesmo guard financeiro | Aditivo comercial tratado como ato financeiro | Ação comercial em Vendas; Financeiro recebe cobrança gerada |
| UI de precificação + gerar aditiva | `InstalacaoRelatorioTecnicoCard` sob `components/financeiro/`, embutido em workspace de instalação **e** `/financeiro/recebimentos` | Vendedor é empurrado ao financeiro / OS de instalação | Hub Vendas → “Aditivos / ocorrências a precificar” |
| Fila transversal | Componente pronto, rota API pronta; **não** há aba “Pendências” na page `/instalacao` | Spec doc 13 não refletida na home de instalação | Preferir sob Vendas; Instalação fica operacional |
| Aba “Financeiro” na OS | `frontend/src/app/(main)/os/[id]/page.tsx` + `OsPosCalculoPanel` | Mistura custo interno / fechamento com olhar comercial | **Não mexer agora**; futuro: comercial vê só “preço/aditivos” em Vendas |
| Pós-cálculo | `/financeiro/pos-calculo` + painel na OS | É margem real / fechamento — correto no Financeiro | Permanecer Financeiro |
| Contas a receber | `/financeiro/recebimentos` | Correto no Financeiro | Vendas só atalho “status da cobrança” (read-only) pós-aprovação |

### 4.4 Cobranças / Financeiro (handoff, não casa do vendedor)

| Ativo | Path | Relação com Vendas |
|-------|------|--------------------|
| `Cobranca` 1:1 orçamento | `schema.prisma` `Cobranca` | Criada na aprovação — Financeiro opera |
| Home financeiro | `/financeiro`, `financeiroModuleNav` | Fora do menu do vendedor de equipe |
| Contas a receber | `/financeiro/recebimentos` | Handoff após preço fechado |
| Pós-cálculo | `/financeiro/pos-calculo`, `feature-financeiro-previsto-real.md` | **Fora** de Vendas |
| Travas comerciais PCP | `docs/modulo instalacao/03-relatorio-fase-2-…`, serviços `pcp-bloqueio-sinal` | Operação; Vendas não reabre |

Sidebar já esconde Financeiro para quem não é `ADMINISTRADOR`/`FINANCEIRO` (`frontend/src/app/(main)/layout.tsx` → `podeVerFinanceiro`).

### 4.5 Clientes, papéis e RBAC

| Ativo | Situação |
|-------|----------|
| CRUD clientes | `frontend/src/app/(main)/clientes/`, `clientesModuleNav` — absorver como seção de Vendas (ou manter rota, mudar parent nav) |
| Enum função | `usuario_funcao`: `ADMINISTRADOR`, `FINANCEIRO`, `PRODUCAO`, `VENDAS`, `ESTOQUE` — **não há** `COMERCIAL`/`VENDEDOR` no enum Prisma; “Comercial” aparece só em docs de home (`07-permissoes-home.md`) |
| Label UI | `VENDAS` → “Vendas” (`admin-labels.ts`) |
| Instalação gestão | `InstalacaoGestaoPermissionsGuard`: `ADMINISTRADOR`, `FINANCEIRO`, `VENDAS` — VENDAS **vê** gestão, mas **não** precifica (guard financeiro) |
| OS | `OSPermissionsGuard`: `VENDAS` → `VISUALIZAR`, `CRIAR` |
| Orçamentos controller | `@Roles(UserRole.… VENDEDOR)` — nomenclatura **paralela** ao enum Prisma; alinhar na implementação do módulo |
| Perfis granulares | `perfil_permissao` / home (`orcamentos-v2.*`, etc.) — estender com `vendas.*` no MVP |

### 4.6 Navegação e homes

| Ativo | Path | Gap |
|-------|------|-----|
| Registry | `frontend/src/lib/module-nav/registry.ts` | Sem `vendas` |
| Orçamentos / clientes / OS / instalação | `operacionais.ts` | Módulos soltos na sidebar |
| Regra Module Nav | `.cursor/rules/module-nav-shell.mdc` | Novo módulo deve nascer com `vendasModuleNav` + home + `ModuleLayoutShell` |
| Home operacional / permissões | `docs/fase-0-home-operacional/07-permissoes-home.md` | Perfil “Comercial” proposto — mapear para função `VENDAS` + permissões |

### 4.7 OS e diagnóstico (contexto, sem alterar agora)

Do `DIAGNOSTICO-MODULO-OS.md`: OS aditiva de instalação e pós-cálculo já estão sólidos; faturamento NF não é do módulo OS. Vendas **não** assume faturamento fiscal; só preço e aditivo comercial.

---

## 5. Premissas necessárias para o módulo funcionar

### 5.1 Personas

| Persona | Job to be done | Vê R$ ao cliente? | Entra em Financeiro? |
|---------|----------------|-------------------|----------------------|
| **Vendedor (equipe)** | Propor, negociar, acompanhar pipeline, precificar aditivos comerciais | Sim (preço de venda) | Não |
| **Vendedor solo / dono** | Tudo acima + cobrança + operação | Sim | Sim (mesma pessoa, papéis unidos) |
| **Financeiro** | Cobrar, conciliar, fechar, pós-cálculo, abono excepcional | Sim (caixa / custo) | Sim (casa) |
| **Operação (PCP/produção)** | Executar OS sem negociar preço | Não na superfície de chão | Não |
| **Instalador (campo)** | Registrar ocorrência sem valores | Não | Não |
| **Administrador** | Configurar, bypass consciente, auditoria | Sim | Sim |

### 5.2 Ownership

- Cada orçamento tem **responsável comercial** (`responsavel_id`).
- Pipeline e filas de Vendas filtram por responsável (com visão “loja” para gestores/admin).
- OS Aditiva gerada a partir de ocorrências precificadas **pertence** ao ciclo comercial da OS pai (cliente/contrato), mas a **execução** continua sem PCP/expedição quando flags `pular_*` já existentes aplicam.
- Cobrança gerada no aditivo **pertence** ao Financeiro após o handoff.

### 5.3 Handoffs explícitos

```text
[Cliente / lead]
      │
      ▼
[Vendas: orçamento + negociação + aprovação]
      │
      ├──────────────► [OS / Arte / PCP / Expedição / Instalação]  (fatos, sem UI de preço ao vendedor de equipe)
      │
      └──────────────► [Financeiro: cobrança / receber / conciliar]

[Campo: ocorrência sem R$]
      │
      ▼
[Vendas: precificar preço ao cliente]  ──(reusa split)──► [OS Aditiva] ──► [Financeiro: cobrança]
      │
      └─(opcional)──► [Financeiro: abonar / auditoria / pós-cálculo]
```

### 5.4 O que NÃO entra no módulo Vendas

- Contas a pagar, conciliação bancária, fluxo de caixa.
- Pós-cálculo previsto × real e fechamento financeiro da OS.
- Apontamento PCP, kanban produção, expedição logística.
- Registro de ocorrência de campo (permanece Instalação/campo).
- Recriação de OS Aditiva / orçamento sintético.
- Emissão de NF-e/NFS-e (split fiscal permanece onde está).
- Alteração imediata da aba Financeiro da OS (dívida absorvida, implementação futura).

### 5.5 Premissas técnicas mínimas do MVP

1. Função `VENDAS` passa a ter permissões comerciais de precificação/aditivo **sem** abrir o módulo Financeiro na sidebar.
2. `ADMINISTRADOR` (e modo solo) mantém união de papéis.
3. Endpoints de precificar/gerar aditiva ganham política **comercial** (novo guard ou ampliação consciente) — sem mover a lógica de `InstalacaoSplitFinanceiroService`.
4. Module nav + item de sidebar **Vendas** agregam Orçamentos, Clientes, filas comerciais.
5. Feature flag / config de OS Aditiva por loja permanece; Vendas só consome.

---

## 6. Arquitetura de informação e mapa de telas

### 6.1 Sidebar

| Antes | Depois (MVP) |
|-------|----------------|
| Orçamentos → `/orcamentos-v2` | **Vendas** → `/vendas` (home do módulo) |
| Clientes → `/clientes` | Preferência: seção dentro de Vendas; rota pode permanecer `/clientes` no v1 para evitar quebra |
| Financeiro | Continua oculto para `VENDAS` (já é) |
| OS / Instalação / PCP… | Permanecem; vendedor de equipe usa só o necessário (leitura / criação OS já permitida) |

### 6.2 `vendasModuleNav` (proposto)

Home: `/vendas`

| id | Label | href sugerido | Origem |
|----|-------|---------------|--------|
| `visao-geral` | Visão geral | `/vendas` | Novo hub (cards + KPIs comerciais) |
| `orcamentos` | Orçamentos | `/orcamentos-v2` (ou `/vendas/orcamentos` alias) | Existente |
| `novo-orcamento` | Novo orçamento | `/orcamentos-v2/novo` | Existente |
| `clientes` | Clientes | `/clientes` | Existente |
| `negociacao` | Em negociação | `/vendas/negociacao` | Filtro/status + mensagens não lidas |
| `aditivos` | Aditivos / ocorrências | `/vendas/aditivos` | **Nova superfície** reusando fila + dialog + APIs de instalação |
| `simulador` | Simulador | `/orcamentos-v2/simulador` | Existente |
| `modelos` | Modelos (atalho) | `/produtos` | Existente; opcional no MVP |

### 6.3 O que cada papel vê

| Tela | Vendedor equipe | Financeiro | Operação |
|------|-----------------|------------|----------|
| Hub Vendas | Sim | Opcional (atalho) | Não |
| Orçamentos / chat / link | Sim | Leitura se necessário | Não |
| Aditivos a precificar | Sim (preço cliente) | Sim (auditoria/abono) | Não |
| Contas a receber | Não (só status resumido no card do orçamento) | Sim | Não |
| Pós-cálculo / aba Financeiro OS | Não (equipe) | Sim | Não |
| Agenda instalação / campo | Leitura gestão se já permitida | Sim | Sim (produção/campo) |
| Custo interno na precificação | **Decisão de implementação:** mostrar custo sugerido ao comercial **ou** só preço + margem alvo — fechar no kickoff (ver riscos) | Vê custo | Não |

### 6.4 Wireframe lógico do hub `/vendas`

1. **KPIs:** orçamentos em análise, aguardando cliente, aprovados no período, ocorrências pendentes de precificação, mensagens não lidas.
2. **Cards de recurso** (padrão Financeiro/Compras via `ModuleHubCards`).
3. **Fila curta:** “Precificar agora” (top N da fila de ocorrências).
4. **Atalhos:** Novo orçamento, Clientes, Simulador.

---

## 7. Épicos / backlog priorizado

Legenda de origem:

- 🏠 **Casa certa** — nasce em Vendas
- 📦 **Migrar conceitualmente** — hoje mora em OS/Financeiro/Instalação; destino Vendas (sem implementar agora onde marcado)
- 🔗 **Handoff** — permanece no domínio atual; Vendas só referencia
- ⏸️ **Congelado** — explícito do PO: não alterar nesta fase de código OS/financeiro

### Épico E0 — Fundação do módulo (MVP)

| ID | Item | Prioridade | Origem |
|----|------|------------|--------|
| E0-1 | Criar `docs` + RP (este documento) | P0 | 🏠 |
| E0-2 | `vendasModuleNav` + registry + home `/vendas` + layout shell | P0 | 🏠 |
| E0-3 | Sidebar: item Vendas; absorver entrada Orçamentos | P0 | 🏠 |
| E0-4 | Matriz RBAC `vendas.*` + mapear função `VENDAS` (sem abrir Financeiro) | P0 | 🏠 |
| E0-5 | Cards do hub apontando rotas existentes (orcamentos, clientes, simulador) | P0 | 🏠 |

### Épico E1 — Pipeline comercial (orçamento como coração)

| ID | Item | Prioridade | Origem |
|----|------|------------|--------|
| E1-1 | Visão “Em negociação” (filtros status + não lidas chat) | P0 | 🏠 sobre orçamentos-v2 |
| E1-2 | KPIs comerciais na home (contagens reais, sem mock) | P0 | 🏠 |
| E1-3 | Deep-link cliente → orçamentos (já parcial na ficha) | P1 | 🏠 |
| E1-4 | Unificar narrativa chat V2 × `mensagens-negociacao` na UX | P1 | 📦 docs/legado |
| E1-5 | Alinhar `@Roles(UserRole.VENDEDOR)` com `usuario_funcao.VENDAS` | P1 | 📦 dívida RBAC |

### Épico E2 — Aditivos comerciais (reuso OS Aditiva)

| ID | Item | Prioridade | Origem |
|----|------|------------|--------|
| E2-1 | Tela `/vendas/aditivos` plugando `InstalacaoOcorrenciasFilaGrid` + `PrecificarOcorrenciaDialog` | P0 | 📦 hoje em financeiro/instalação |
| E2-2 | Política de permissão: `VENDAS` (+ ADMIN) pode precificar e gerar OS Aditiva; Financeiro mantém abono/auditoria | P0 | 📦 guard atual financeiro |
| E2-3 | Remover/relocar CTA comercial de `/financeiro/recebimentos` (deixar só status de cobrança) | P1 | 📦 misplacement |
| E2-4 | Atalho na OS/Instalação: “Abrir em Vendas” para precificar (não duplicar UI) | P1 | 🔗 |
| E2-5 | Badge sidebar Vendas com contador de pendências de precificação | P1 | 🏠 |
| E2-6 | Documentar contrato: gerar aditiva **não** reabre OS pai; usa serviço existente | P0 (doc) | 🔗 |

### Épico E3 — Handoff Financeiro (só ponte)

| ID | Item | Prioridade | Origem |
|----|------|------------|--------|
| E3-1 | No detalhe do orçamento/aditivo: card read-only “Situação da cobrança” (status, saldo) | P1 | 🔗 |
| E3-2 | CTA “Ir ao Financeiro” apenas se `podeVerFinanceiro` | P1 | 🔗 |
| E3-3 | Não incluir contas a pagar / pós-cálculo no hub Vendas | — | 🔗 |

### Épico E4 — Fronteiras absorvidas (implementação futura — **não agora**)

Itens que o PO pediu para o RP **absorver**, sem tocar código de OS financeiro/custos nesta fase:

| ID | Item | Prioridade futura | Origem |
|----|------|-------------------|--------|
| E4-1 | Separar na OS a visão “comercial (preço/aditivos)” da aba “Financeiro (pós-cálculo/fechamento)” | P2 | ⏸️ / 📦 aba OS |
| E4-2 | Política de exposição de **custo interno** vs só preço ao cliente para perfil VENDAS | P2 | ⏸️ |
| E4-3 | Precificação de ocorrência como etapa explícita do funil comercial (estados + SLA) | P2 | 📦 |
| E4-4 | Revisão de copy/guards que chamam de “financeiro” o ato de precificar preço ao cliente | P2 | 📦 |
| E4-5 | Solo vs equipe: preset de loja (“modo único usuário” libera união de menus) | P2 | 🏠 |
| E4-6 | Comissão por vendedor (além de `comissao_padrao` da loja) | P3 | — |
| E4-7 | CRM leve (funil de leads antes do orçamento) | P3 | — |

### Épico E5 — Fora de escopo permanente deste módulo

- Recriar OS Aditiva / `OrcamentoAditivoInstalacao`
- Motor de pós-cálculo / previsto × real
- NF-e, conciliação, fluxo de caixa
- Apontamento e capacidade PCP

---

## 8. Critérios de aceite — MVP de Vendas

### 8.1 Navegação e casa

1. Existe item **Vendas** na sidebar com home `/vendas` e seções via Module Nav.
2. Orçamentos e simulador são alcançáveis a partir do hub sem parecer módulos “órfãos”.
3. Função `VENDAS` **não** vê item Financeiro na sidebar (comportamento atual preservado).

### 8.2 Pipeline

4. Vendedor cria/edita/envia orçamento (fluxos atuais) e vê lista filtrável por status e responsável.
5. Link público + chat de negociação continuam funcionando (regressão zero).
6. Aprovação do orçamento segue gerando OS/cobrança como hoje (Vendas não quebra o handoff).

### 8.3 Aditivos (reuso, não recriação)

7. Em `/vendas/aditivos`, usuário `VENDAS` ou `ADMINISTRADOR` lista ocorrências pendentes (API existente).
8. Precifica com `PrecificarOcorrenciaDialog` (ou equivalente) chamando o mesmo backend de split.
9. Gera OS Aditiva pelo endpoint existente; **não** há segundo gerador.
10. Instalador continua sem ver valores.
11. Financeiro continua podendo abonar/auditar conforme regra acordada.

### 8.4 Fronteiras

12. Nenhuma alteração obrigatória na aba Financeiro da OS nem no pós-cálculo para fechar o MVP.
13. Documentação do módulo declara explicitamente: **não recriar OS Aditiva**.

### 8.5 Qualidade

14. Multi-tenant: todas as filas/mutações com `loja_id` do token.
15. Sem dados mockados nas listagens/KPIs.
16. UI alinhada a Module Header / dark-light / pt-BR.

---

## 9. Riscos (solo vs equipe)

| Risco | Solo | Equipe | Mitigação |
|-------|------|--------|-----------|
| Vendedor não consegue precificar aditivo | Baixo (usa ADMIN/FINANCEIRO) | **Alto hoje** (guard só financeiro) | E2-2: permissão comercial |
| Vendedor “invade” Financeiro | Aceitável | Indesejável | Manter sidebar; não embutir CTAs de receber no hub |
| Duplicar UI de precificação em 3 lugares | Confusão | Confusão | Uma casa em Vendas + atalhos |
| Esconder custo interno do comercial e ele precificar no escuro | — | Margem ruim | Decidir na E4-2 antes de endurecer UI |
| Migrar rotas de orçamento quebra bookmarks | Médio | Médio | Aliases / redirects no MVP |
| Confundir `UserRole.VENDEDOR` com `usuario_funcao.VENDAS` | Bugs de auth | Bugs de auth | E1-5 |
| Doc 14 desatualizado vs código de aditiva | Planejamento errado | Idem | Tratar código + schema como fonte; docs instalação como histórico |
| Implementar E4 junto com MVP | Escopo explode | Idem | Congelar E4 até PO liberar |

---

## 10. Sequência sugerida de implementação (quando autorizada)

1. **Nav + home vazia com cards** apontando rotas existentes (valor imediato, baixo risco).
2. **RBAC comercial** em precificar/gerar aditiva + tela `/vendas/aditivos`.
3. **Limpeza de CTAs** em Recebimentos / copy “financeiro” no ato comercial.
4. **KPIs e fila de negociação**.
5. Só depois, com novo RP/delta: E4 (aba OS, custo vs preço, modo solo).

---

## 11. Checklist de não-objetivos (gate de PR futuro)

Antes de mergear qualquer PR rotulado “módulo Vendas”, o revisor confirma:

- [ ] Não criou segundo fluxo de OS Aditiva
- [ ] Não alterou pós-cálculo / fechamento financeiro da OS (salvo PR explícito do PO)
- [ ] Não abriu Contas a receber/pagar para função `VENDAS`
- [ ] Reusou `InstalacaoSplitFinanceiroService` / modelos Prisma existentes
- [ ] Module nav registrado em `registry.ts`
- [ ] Textos e erros em pt-BR

---

## 12. Glossário rápido

| Termo | Significado neste RP |
|-------|----------------------|
| Preço ao cliente | Valor comercial cobrado / proposto |
| Custo interno | Custo operacional (domínio financeiro/gestão) |
| OS Aditiva | OS filha de cobrança comercial de ocorrências — **já implementada** |
| Handoff | Passagem de ownership entre módulos sem duplicar o fato |
| Solo | Um usuário acumula Vendas + Financeiro + Admin |
| Equipe | Separação rígida de superfícies por função |

---

## 13. Histórico

| Data | Autor | Nota |
|------|-------|------|
| 2026-07-30 | Produto/arquitetura (agente) | RP inicial com inventário do repositório e premissas do PO |
