# Fase 0 — Matriz de rastreabilidade

**Documento:** entregável "Matriz de testes e rastreabilidade" da Fase 0
**Status:** aprovado — contrato funcional fechado em 2026-07-31
**Cobertura:** os 44 critérios de aceite do RP §8, mais os não-objetivos do RP §11

> Como usar: nenhuma fase pode marcar seu gate de conclusão sem que todos os
> critérios da sua linha estejam com endpoint, tela e teste identificados e
> aprovados. A coluna **Evidência** é preenchida durante a execução, com link para o
> teste ou para o PR.

Convenção de rotas: `/vendas/*` no frontend; `vendas/*` como prefixo dos
controllers novos no backend. Rotas marcadas como "existente" reutilizam o que já
está no repositório.

---

## 1. Critérios 8.1 — Navegação e casa (Fase 3)

| # | Critério | Backend | Frontend | Teste | Evidência |
|---|---|---|---|---|---|
| 1 | Item Vendas na sidebar com home `/vendas` e seções via Module Nav | — | `frontend/src/lib/module-nav/vendas.ts`, `registry.ts`, `app/(main)/vendas/page.tsx`, `layout.tsx` | Render do registry contendo `vendas`; smoke da rota | |
| 2 | Orçamentos e simulador alcançáveis pelo hub | — | `ModuleHubCards` em `/vendas` | Navegação por link até `/orcamentos-v2` e `/orcamentos-v2/simulador` | |
| 3 | Função `VENDAS` não vê Financeiro na sidebar | — | `app/(main)/layout.tsx` → `podeVerFinanceiro` | Teste de render com `funcao = VENDAS` | |

---

## 2. Critérios 8.2 — Pipeline (Fase 6)

| # | Critério | Backend | Frontend | Teste | Evidência |
|---|---|---|---|---|---|
| 4 | Vendedor cria/edita/envia orçamento e filtra por status e responsável | `orcamentos-v2` existente + `vendas/pipeline` (listagem por `status_comercial`) | `/vendas/negociacao` | Integração de listagem com filtro; regressão do CRUD atual | |
| 5 | Link público e chat continuam funcionando (regressão zero) | `links-v2`, `chat-v2` existentes | `chat-flutuante.tsx`, `/orcamento-v2/[id]` | Regressão de envio, leitura e não lidas | |
| 6 | Aprovação segue gerando OS/cobrança | `fecharPedidoInterno` refatorado (Fase 8) | — | Integração aceite → OS + cobrança | |

---

## 3. Critérios 8.3 — Aditivos (Fase 9)

| # | Critério | Backend | Frontend | Teste | Evidência |
|---|---|---|---|---|---|
| 7 | `VENDAS`/`ADMINISTRADOR` lista ocorrências pendentes | `instalacao/fila-precificacao` existente + `vendas.aditivo.ver` | `/vendas/aditivos` com `InstalacaoOcorrenciasFilaGrid` | Positivo e negativo por permissão | |
| 8 | Precifica chamando o mesmo backend de split | `instalacao/precificar` existente + `vendas.aditivo.precificar` | `PrecificarOcorrenciaDialog` | Integração confirmando o mesmo service | |
| 9 | Gera OS Aditiva pelo endpoint existente, sem segundo gerador | `instalacao/gerar-os-aditiva` existente | `/vendas/aditivos` | Busca no código por gerador duplicado; integração | |
| 10 | Instalador continua sem ver valores | `InstaladorPermissionsGuard` existente | app do instalador | Asserção de ausência de campo de valor no payload | |
| 11 | Financeiro continua podendo abonar/auditar | `instalacao/abonar` com `FinanceiroPermissionsGuard` | Superfície financeira | Negativo: vendedor não abona | |

---

## 4. Critérios 8.4 — Fronteiras (Fases 3, 9, 10)

| # | Critério | Verificação | Evidência |
|---|---|---|---|
| 12 | Nenhuma alteração obrigatória na aba Financeiro da OS nem no pós-cálculo | `git diff` não toca `OsPosCalculoPanel` nem `financeiro/pos-calculo` | |
| 13 | Documentação declara "não recriar OS Aditiva" | `docs/modulo-vendas/README.md` §Guardrails | |

---

## 5. Critérios 8.5 — Qualidade (Fases 2, 3, 11)

| # | Critério | Verificação | Evidência |
|---|---|---|---|
| 14 | Multi-tenant em todas as filas e mutações | Revisão de todo `findFirst`/`findMany` novo; teste cross-tenant com duas lojas | |
| 15 | Sem dados mockados em listagens e KPIs | Revisão de PR; nenhum array literal em componente de listagem | |
| 16 | UI alinhada a Module Header, dark/light e pt-BR | Revisão visual nos dois temas; `ModuleHeader` presente | |

---

## 6. Critérios 8.6 — Integridade comercial e gates (Fases 6, 7, 8)

| # | Critério | Backend | Frontend | Teste | Evidência |
|---|---|---|---|---|---|
| 17 | Versão aceita identificável e imutável | `versao_aceita_id` (M1.2), snapshot em `VersaoOrcamento` | Painel de negociação com versão vigente | Unitário: alteração material invalida aceite | |
| 18 | Aprovação comercial, arte, sinal e técnica são eventos distintos | `pedido_gate` (M8.2) | Acompanhamento do pedido | Unitário por gate; matriz de aplicabilidade | |
| 19 | Repetir aceite não duplica OS, cobrança, notificação ou pedido | `pedido_comercial.orcamento_id @unique` (M8.1) | — | Concorrência: duas requisições simultâneas geram um efeito | |
| 20 | Desconto/margem fora da alçada negado no backend | `politica_alcada_comercial`, `solicitacao_alcada_comercial` (M7.1, M7.2) | Fila de alçadas do gestor | Negativo: aprovação forjada pelo cliente HTTP é rejeitada | |
| 21 | Proposta expirada não é aceita silenciosamente | `expira_em` (M1.3) + job de expiração | Aviso de revalidação | Unitário com data no timezone da loja | |
| 22 | Cancelamento pós-aceite preserva histórico e compensa efeitos | `pedido_comercial.cancelado_em` | Ação de cancelar pedido | Integração: cobrança e OS recebem tratamento compensatório | |

---

## 7. Critérios 8.7 — Listagens e UX (Fases 4, 5, 10, 11)

| # | Critério | Verificação | Evidência |
|---|---|---|---|
| 23 | Toda listagem segue o template de `fornecedores/` | Auditoria de cada listagem: desktop abre em Tabela, toggle para Cards, mobile força Cards, `columns.tsx`, card dedicado, grid `grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3`, ações equivalentes | |
| 24 | KPIs e filas paginam no backend, sem N+1, sem custo sem permissão | Revisão de query; teste de volume; asserção de ausência de campo de custo | |
| 25 | Prazo/validade com timezone da loja; dinheiro em `Decimal` e máscara BRL compartilhada | Unitário de timezone e arredondamento | |
| 26 | Anexos e links com tipo/tamanho, storage privado, expiração, revogação e tenant | Teste de link revogado, expirado e cross-tenant | |

Listagens sujeitas ao critério 23: `/vendas/carteira`, `/vendas/negociacao`,
`/vendas/atividades`, `/vendas/aditivos`, `/vendas/pedidos` e a tela de Clientes
absorvida. A de Clientes exige as correções listadas em
`01-auditoria-estado-real.md` §6.

---

## 8. Critérios 8.8 — Clientes e carteira (Fase 4)

| # | Critério | Backend | Frontend | Teste | Evidência |
|---|---|---|---|---|---|
| 27 | Clientes dentro de Vendas, não como módulo global | `registry.ts` sem `clientesModuleNav` isolado | `/vendas/clientes` com alias de `/clientes` | Redirect preserva bookmark | |
| 28 | Vendedor entra em Minha carteira, não na lista completa | `vendas/carteira` com `carteira.ver.propria` | `/vendas/carteira` | Negativo: vendedor sem `ver.todos` não recebe a lista completa | |
| 29 | Gestor alterna os quatro escopos | mesmo endpoint, escopo por permissão | seletor de escopo | Positivo por escopo, negativo cross-loja | |
| 30 | Cadastro atribui responsável sem tornar o registro privado | `cliente.responsavel_comercial_id` (M4.1) | Novo cliente/prospect | Outro módulo continua resolvendo o mesmo cliente | |
| 31 | Deduplicação por loja, sem revelar outro tenant | campos normalizados (M4.3) | Aviso de duplicidade | Cross-tenant: documento igual em outra loja não aparece | |
| 32 | Transferência autorizada e auditada, preservando histórico | `cliente_transferencia_carteira` (M4.2) | Diálogo com motivo e impacto | Orçamentos antigos mantêm o responsável histórico | |
| 33 | Outros domínios acessam o cliente pelo contexto, com campos mínimos | endpoints existentes | — | Payload de cada domínio não traz carteira nem dados comerciais | |
| 34 | Busca, paginação, filtros e contadores no servidor | paginação em `clientes.controller.ts` | controles de página | Teste de volume; ausência de permissão negada no backend | |

---

## 9. Critérios 8.9 — Jornada operacional (Fases 5 a 11)

| # | Critério | Backend | Frontend | Teste | Evidência |
|---|---|---|---|---|---|
| 35 | Pendências prioritárias visíveis ao entrar | agregador da home + `notificacao.usuario_id` (M5.2) | `/vendas` | Escopo por permissão; sem N+1 | |
| 36 | Demanda capturada sem perder dados em duplicidade ou falta de permissão | `vendas/atendimento` | Novo atendimento | Dados digitados preservados no conflito | |
| 37 | Novo orçamento herda cliente, contato, responsável e contexto | `orcamentos-v2` existente | Ficha 360º | Integração de pré-preenchimento | |
| 38 | Preview fiel antes do envio, com versão, validade, destinatário e canal | `vendas/proposta/preview` | Diálogo de envio | Snapshot igual ao documento do cliente | |
| 39 | Versão, mensagens e próxima ação na mesma superfície | `chat-v2` + versões | `/vendas/negociacao/[id]` | Não lidas sem N+1 | |
| 40 | Após o aceite, vendedor chega ao acompanhamento, não a Financeiro/PCP | `vendas/pedidos` | `/vendas/pedidos/[id]` | Redirecionamento correto por perfil | |
| 41 | Gates mostram responsável, motivo, prazo e ação | `pedido_gate` (M8.2) | Painel de gates | Sem exposição de campo interno indevido | |
| 42 | Ocorrência vira pendência acionável, com ida e volta ao pedido | fila existente + `vendas.aditivo.*` | `/vendas/aditivos` | Fluxo completo precificar → enviar → aceitar → voltar | |
| 43 | Sucesso só após confirmação do backend | — | todas as mutações | Teste de falha de rede não mostra sucesso | |
| 44 | Jornadas utilizáveis por teclado, mobile e desktop, validadas com três personas | — | todas | Acessibilidade + teste com vendedor solo, de equipe e gestor | |

---

## 10. Não-objetivos do RP §11 (gate de PR)

Verificados em **todo** PR rotulado "módulo Vendas":

| Item | Como verificar |
|---|---|
| Não criou segundo fluxo de OS Aditiva | Busca por novo gerador; diff não cria service equivalente |
| Não alterou pós-cálculo / fechamento financeiro da OS | `git diff` limpo nesses caminhos |
| Não abriu Contas a receber/pagar para `VENDAS` | Nenhuma permissão de Vendas concede Financeiro |
| Reusou `InstalacaoSplitFinanceiroService` e modelos existentes | Revisão de import |
| Module nav registrado em `registry.ts` | Presença de `vendasModuleNav` |
| Textos e erros em pt-BR | Revisão de PR |
| Não misturou status comercial com status de execução | `status_comercial` não contém estado de execução |
| Preservou versão enviada/aceita e invalidou aceite quando necessário | Teste do critério 17 |
| Handoffs transacionais e idempotentes | Teste do critério 19 |
| Aplicou alçada no backend | Teste do critério 20 |
| Cobriu tenant e revogação em links, anexos, chats e consultas por ID | Teste do critério 26 |

---

## 11. Rastreabilidade inversa: decisão → o que destrava

| Decisão | Destrava |
|---|---|
| DV-13 | Toda a Fase 2; sem ela nenhuma permissão de Vendas funciona |
| DV-14 | M1.1, critérios 4 e 12; a máquina de estados inteira |
| DV-15 | M1.2, M1.4, critério 17 |
| DV-16 | A ordem de execução de todas as fases |
| DV-01 | M8.1, critérios 19 e 40 |
| DV-02 | Critério 17 |
| DV-03 | M8.2, critérios 18 e 41 |
| DV-04 | M7.1, M7.2, critério 20 |
| DV-05 | Linha `preco.custo.ver` da matriz RBAC |
| DV-06 | Evidência do gate G1, M1.2, M4.3 |
| DV-07 | M1.3, critério 21 |
| DV-08 | M5.2, critério 35 |
| DV-09 | Escopo de SLA: Fase 13 ou Fase 5 |
| DV-10 | Escopo de pós-venda na Fase 13 |
| DV-11 | M4.1, M4.2, critérios 28 e 32 |
| DV-12 | Critérios 28 e 29; estratégia de rollout da Fase 12 |
