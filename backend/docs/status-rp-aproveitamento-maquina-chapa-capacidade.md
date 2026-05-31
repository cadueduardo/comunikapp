# Status do RP - Aproveitamento de Máquina, Chapa e Capacidade Produtiva

## Fase 1 - Base sem estoque

Implementada em 2026-05-31.

### Banco e Prisma

- Adicionados campos em `insumos` para parametrizar formato e cálculo de chapa:
  - `formato_material`
  - `largura_comercial`
  - `altura_comercial`
  - `comprimento_comercial`
  - `area_comercial`
  - `perda_padrao_percent`
  - `permite_simulacao_chapa`
  - `controla_estoque`
  - `permite_registrar_sobra`
  - `retalho_min_largura`
  - `retalho_min_altura`
  - `retalho_min_area`
  - `metodo_cobranca_padrao`
- Adicionado `ItemInsumo.calculo_chapa` para congelar a simulação no item de material do orçamento.
- Criada migration `20260531120000_add_calculo_chapa_base`.

### Backend

- Criado utilitário puro de cálculo de chapa em `backend/src/common/calculo-chapa`.
- Criado DTO forte para simulação de chapa.
- Implementados endpoints de insumos:
  - `GET /insumos/:id/calculo-chapa`
  - `POST /insumos/:id/simular-chapa`
- Implementados endpoints de orçamento:
  - `POST /orcamentos-v2/:id/itens/:itemId/simular-chapa`
  - `PUT /orcamentos-v2/:id/itens/:itemId/calculo-chapa`
- As simulações validam a loja autenticada e não exigem estoque.
- O cálculo usa as fórmulas mínimas do RP, sem nesting geométrico avançado.

### Frontend

- Criado utilitário `frontend/src/lib/calculo-chapa.ts`.
- Adicionados helpers no `api-client` para simulação e gravação do cálculo de chapa.

### Validação executada

- `npx prisma validate`
- `npm test -- --runInBand common/calculo-chapa/calculo-chapa.util.spec.ts`
- `npm run build` no backend
- `npm run build` no frontend

### Observações

- Migrations devem ser aplicadas no ambiente (`prisma migrate deploy`).
- UI do cálculo de chapa e decisão de sobra na OS implementadas nas fases 1 e 2.

## Fase 2 - OS e sobras simples

Implementada em 2026-05-31.

### Banco e Prisma

- Adicionados campos em `itens_os` para registrar a decisão tomada sobre sobra: `sobra_acao`, `sobra_observacao` e `sobra_registrada_id`.
- Estendido `estoque_sobras` para aceitar retalhos originados de OS, mesmo sem depender obrigatoriamente de um item de estoque existente.
- `estoque_id` passou a ser opcional.
- Adicionados `insumo_id`, dimensões, área disponível/original, origem por OS e observação interna.
- Adicionados índices por `insumo_id` e `os_origem_id`.
- Criada migration `20260531130000_add_os_sobra_simples`.

### Backend

- Criado controller `OSMateriaisController` e registrado no `OSModule`.
- Implementados endpoints de materiais/sobras da OS:
  - `GET /os/:id/materiais`
  - `POST /os/:id/itens/:itemId/ignorar-sobra`
  - `POST /os/:id/itens/:itemId/anotar-sobra`
  - `POST /os/:id/itens/:itemId/registrar-sobra`
- A listagem de materiais da OS retorna controle de estoque, permissão de registrar sobra, cálculo de chapa congelado e sobra estimada.
- A decisão de sobra é salva no `ItemOS` e registrada em log de OS.
- O registro de sobra cria uma entrada em `estoque_sobras` com origem `OS`, vinculando OS, item da OS, insumo e, opcionalmente, item de estoque.
- O cálculo de chapa salvo no item do orçamento agora é propagado para os materiais calculados e para os itens da OS.

### Frontend

- Adicionado helper `osApi` em `frontend/src/lib/api-client.ts` para consultar materiais da OS e registrar/anotar/ignorar sobras.

### Validação executada

- `npx prisma validate`
- `npm test -- --runInBand common/calculo-chapa/calculo-chapa.util.spec.ts`
- `npm run build` no backend
- `npm run build` no frontend

### Observações

- As migrations das Fases 1 e 2 foram criadas, mas não foram aplicadas automaticamente ao banco.
- A UI específica para decisão de sobra na tela da OS ainda não foi implementada.

## Fase 3 - PCP capacidade

Implementada em 2026-05-31.

### Banco e Prisma

- Adicionados campos de planejamento em `maquina`:
  - `usar_no_pcp`
  - `horas_disponiveis_dia`
  - `dias_produtivos`
  - `permite_agendamento_simultaneo`
  - `tempo_minimo_entre_servicos_min`
  - `considerar_eficiencia_na_capacidade`
- Criada migration `20260531140000_add_pcp_capacidade_maquinas`.

### Backend

- Criado `PCPCapacidadeService`.
- Criado controller `PCPCapacidadeController` e registrado no `PCPModule`.
- Implementados endpoints:
  - `GET /pcp/capacidade/setores`
  - `GET /pcp/capacidade/maquinas`
  - `GET /pcp/capacidade/setores/:setorId/carga`
- A carga considera instâncias de setor com status `PENDENTE`, `EM_ANDAMENTO` e `PAUSADA`.
- Itens concluídos/cancelados não entram na soma.
- A capacidade de setor usa `horas_produtivas_mensais / 22` quando disponível, com fallback de 8h/dia.
- A capacidade de máquina usa `horas_disponiveis_dia`, fallback do setor ou 8h/dia, e pode aplicar `eficiencia_percent`.
- Como ainda não há coluna dedicada de máquina prevista na etapa, a máquina é lida de `parametros_tecnicos` do `ItemOS`; quando ausente, o item aparece em `sem_maquina_definida`.
- A criação de OS a partir do orçamento agora preserva as máquinas do produto em `parametros_tecnicos.maquinas`.

### Frontend

- Adicionado helper `pcpApi` em `frontend/src/lib/api-client.ts` para consultar carga por setor, carga de um setor e ocupação por máquina.

### Validação executada

- `npx prisma validate`
- `npm test -- --runInBand common/calculo-chapa/calculo-chapa.util.spec.ts`
- `npm run build` no backend
- `npm run build` no frontend

### Banco local

- Migrations aplicadas localmente com `npx prisma migrate deploy`:
  - `20260529140000_add_convite_lead_fields`
  - `20260531120000_add_calculo_chapa_base`
  - `20260531130000_add_os_sobra_simples`
  - `20260531140000_add_pcp_capacidade_maquinas`

### Observações

- A Home PCP ainda não foi redesenhada para mostrar esses indicadores visualmente; os dados já estão disponíveis por API.
- A tela de máquinas ainda não recebeu um bloco visual dedicado para os novos campos de planejamento.

## Ambiente local de teste

Preparado em 2026-05-31.

- Banco local `comunikapp` atualizado; `npx prisma migrate status` retornou schema em dia.
- Backend iniciado em `http://localhost:4000`.
- Frontend iniciado em `http://localhost:3000`.
- Checagens HTTP:
  - `GET http://localhost:3000/login` retornou `200`.
  - `GET http://localhost:4000/pcp/capacidade/setores` sem token retornou `401`, confirmando rota ativa e protegida.

## Fase 4 - Estoque completo de sobras

Implementada em 2026-05-31.

### Banco e Prisma

- Estendido `estoque_aproveitamentos` com:
  - `os_destino_id`
  - `item_os_destino_id`
  - `insumo_id`
  - `area_aproveitada`
  - `economia_gerada`
- Expandido enum `estoque_sobras_status` com `PARCIALMENTE_APROVEITADA`.
- Criada migration `20260531150000_add_estoque_aproveitamento_completo`.

### Backend

- Reforçado `SobrasService.registrarAproveitamento`:
  - valida status `DISPONIVEL` ou `PARCIALMENTE_APROVEITADA`;
  - bloqueia quantidade maior que disponível;
  - bloqueia economia negativa;
  - valida OS/item de destino pela loja autenticada;
  - grava histórico em `estoque_aproveitamentos`;
  - atualiza status para `PARCIALMENTE_APROVEITADA` ou `APROVEITADA`;
  - atualiza `area_disponivel`, `quantidade_aproveitada` e `economia_gerada`.
- Adicionado descarte de sobra com motivo obrigatório.
- Adicionados endpoints:
  - `POST /api/estoque/sobras/:id/aproveitar`
  - `POST /api/estoque/sobras/:id/descartar`
- Mantida compatibilidade com `POST /api/estoque/sobras/:id/aproveitamento`.

### Frontend

- Adicionados helpers em `estoqueApi`:
  - `getSobras`
  - `getSobraById`
  - `createSobra`
  - `aproveitarSobra`
  - `descartarSobra`

### Validação executada

- `npx prisma validate`
- `npm test -- --runInBand common/calculo-chapa/calculo-chapa.util.spec.ts`
- `npx prisma migrate deploy`
- `npm run build` no backend
- `npm run build` no frontend

### Observações

- A tela existente de sobras ainda não ganhou botões dedicados para aproveitar/descartar; as rotas e helpers já estão disponíveis.

## Complemento da Fase 3 - Home PCP com carga e ocupacao

Implementado em 2026-05-31.

### Frontend

- Atualizada a Home PCP em `frontend/src/app/(main)/pcp/page.tsx`.
- No modo PCP Completo, a tela agora consulta os endpoints de capacidade ja existentes.
- Adicionado painel "Carga produtiva por setor" com:
  - horas programadas;
  - horas disponiveis;
  - ocupacao percentual;
  - status de carga;
  - quantidade de itens programados.
- Adicionado painel "Ocupacao por maquina" com:
  - maquinas ordenadas por maior ocupacao;
  - horas programadas;
  - horas disponiveis;
  - ocupacao percentual;
  - destaque para itens sem maquina definida.
- O botao Atualizar tambem recarrega carga por setor e ocupacao por maquina.

### Validacao executada

- `npm run build` no frontend.

## Complemento da Fase 3 - Supervisao do setor

Implementado em 2026-05-31.

### Backend

- Enriquecido o card do Kanban por setor/fila do setor com:
  - `tempo_previsto_min`;
  - `tempo_previsto_horas`;
  - `maquina_prevista`.
- A maquina prevista e lida de `ItemOS.parametros_tecnicos`, preservando o vinculo congelado vindo do orcamento/OS quando existir.

### Frontend

- Atualizada a tela `frontend/src/app/(main)/pcp/meu-setor/page.tsx`.
- No modo PCP Completo, a tela agora mostra um resumo de capacidade do setor selecionado com:
  - horas previstas;
  - horas disponiveis;
  - ocupacao percentual;
  - status de carga;
  - maquinas com carga no setor;
  - quantidade de itens sem maquina definida.
- Atualizado `frontend/src/components/pcp/FilaOperador.tsx` para exibir, nos cards da fila:
  - tempo previsto;
  - maquina prevista, quando houver.

### Validacao executada

- `npm run build` no backend.
- `npm run build` no frontend com `.next` limpo.
- `GET http://localhost:3000/pcp` retornou 200.
- `GET http://localhost:3000/pcp/meu-setor` retornou 200.

## Complemento UI — Cadastros e telas operacionais (Fases 1, 2 e 4)

Implementado em 2026-05-31 (continuidade do RP).

### Frontend — Máquinas (Fase 3 / §4)

- Adicionado bloco **Planejamento / PCP** em `maquina-form.tsx`:
  - `usar_no_pcp`
  - `horas_disponiveis_dia`
  - `permite_agendamento_simultaneo`
  - `tempo_minimo_entre_servicos_min`
  - `considerar_eficiencia_na_capacidade`
- Páginas novo/editar de máquinas (Centros de Trabalho e Configurações) passam a enviar e carregar os novos campos.

### Frontend — Insumos (Fase 1 / §3)

- Adicionado card **Formato do material / Cálculo da chapa** em `insumo-form.tsx`.
- Edição de insumo carrega os campos de chapa do backend.

### Frontend — OS Materiais (Fase 2 / §6)

- Criado `OSMateriaisPanel` e integrado na aba **Materiais** da OS (`os/[id]/page.tsx`).
- Exibe materiais previstos, cálculo de chapa congelado e ações:
  - ignorar sobra;
  - anotar sobra;
  - registrar como retalho (quando permitido).

### Frontend — Estoque sobras (Fase 4)

- Tela de detalhe da sobra (`estoque/sobras/[id]`) com botões **Aproveitar** e **Descartar**, usando `estoqueApi`.

## Complemento UI — Orçamento: cálculo da chapa por material (Fase 1 / §5)

Implementado em 2026-05-31.

### Frontend

- Criado `CalculoChapaMaterialPanel` em `frontend/src/components/orcamentos-v2/CalculoChapaMaterialPanel.tsx`.
- Integrado em `MaterialSection` (variante orçamento) por linha de material.
- `ProdutoSection` e `orcamento-v2-form` repassam `orcamentoId`.
- Materiais carregados na edição incluem `item_insumo_id` e `calculo_chapa` do `ItemInsumo`.
- Simulação via API quando há orçamento salvo; simulação local antes do primeiro save.

## Complemento PCP — Iniciar com máquina (§9)

Implementado em 2026-05-31.

### Backend

- `IniciarProducaoDto` aceita `maquinaId` opcional.
- `PCPKanbanService.iniciarProducao` grava máquina em `ItemOS.parametros_tecnicos` quando informada.
- Validação de máquina por `loja_id` e status ativo.

### Frontend

- `IniciarProducaoMaquinaDialog` lista máquinas do setor via `GET /pcp/capacidade/maquinas`.
- `FilaOperador` abre o diálogo quando o item não tem `maquina_prevista`.
- `useMeuSetor` envia `maquinaId` no POST de início.

## Testes backend (§16)

Implementado em 2026-05-31.

- `backend/src/pcp/services/pcp-capacidade.service.spec.ts` (classificação de carga, soma por setor, sem máquina).
- Testes existentes: `calculo-chapa.util.spec.ts`, `pcp-kanban.service.spec.ts`.
- `pcp-relatorios.service.spec.ts`, `orcamento-origem-sobra.service.spec.ts`.

---

## RP principal — status final

**Concluído** (Fases 1 a 6 + complementos de UI e §9), conforme critérios de aceite §17.

## Fase 6 — Origem inteligente de sobras por orçamento

Implementada em 2026-05-31.

### Backend

- `OrcamentoOrigemSobraService`:
  - `GET /orcamentos-v2/origem-sobra/busca?q=` — busca orçamentos por número, cliente, descrição.
  - `GET /orcamentos-v2/:id/candidatos-sobra` — materiais do orçamento com sugestão de retalho.
- Preenchimento automático: insumo, dimensões comerciais, cálculo de chapa congelado, sobra estimada, descrição e origem.
- `SobrasService.criarSobra` aceita `insumoId` sem item de estoque (origem ORCAMENTO).

### Frontend

- Tela `estoque/sobras/novo` refeita: passo 1 orçamento → passo 2 lista de materiais com Registrar / Ignorar.
- Helpers `orcamentosApi.buscarOrigemSobra` e `getCandidatosSobra`.

### Testes

- `orcamento-origem-sobra.service.spec.ts`

## Fase 5 — Refinamento (retalhos, economia, relatórios PCP)

Implementada em 2026-05-31.

### Backend

- `buscarSugestoesSobras` aceita filtro `insumoId` (compatível com material do orçamento).
- `calcularMetricasEconomia` retorna `sobrasDisponiveis`, `areaDisponivelM2`, `economiaUltimos30Dias`.
- `PCPRelatoriosService` + `GET /pcp/relatorios/ocupacao-maquinas` e `GET /pcp/relatorios/previsto-realizado`.

### Frontend

- `SobrasRetalhosSugestaoPanel` no painel de aproveitamento do material (orçamento).
- Proxy `GET /api/estoque/sobras/sugestoes/buscar`.
- Dashboard de economia ampliado em `estoque/sobras`.
- Página `pcp/relatorios` com dados reais (sem mock).

### Validação final (§17)

| Critério | Status |
|----------|--------|
| Simulação de chapa no orçamento (sem estoque) | OK |
| Área, sobra, aproveitamento e cobrança no orçamento | OK |
| Cálculo congelado na OS | OK |
| Ignorar / anotar / registrar sobra na OS | OK |
| Registro em `estoque_sobras` | OK |
| Histórico em `estoque_aproveitamentos` | OK |
| Carga por setor e ocupação por máquina (PCP) | OK |
| Tempo previsto na supervisão de setor | OK |
| Telas operacionais sem mock | OK |
| Testes críticos (`calculo-chapa`, `origem-sobra`, `pcp-capacidade`, `pcp-relatorios`) | OK |

### Pendências fora do escopo

- Nesting geométrico avançado e agrupamento opcional de materiais iguais na origem de sobra (refinamento futuro).
