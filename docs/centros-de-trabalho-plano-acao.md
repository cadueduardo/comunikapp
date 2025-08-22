# Plano de Ação — Módulo Centros de Trabalho

Este documento descreve como o módulo "Centros de Trabalho" será implementado e versionado, em fases, seguindo as premissas do projeto. Deve ser atualizado ao término de cada fase para orientar continuidade por outros agentes.

Referências obrigatórias: ver `docs/premissas melhores praticas.md` e `docs/centros-de-trabalho-calc-comunicacao-visual.md`.

## Governança
- Branch de trabalho: `feature/centros-de-trabalho`.
- Em cada fase: implementação → testes unitários (≥ 80% no escopo) → teste do usuário (validação manual) → atualizar este documento (seção "Progresso e Notas") → commit no branch → prosseguir.
- Linguagem e termos: pt-br; manter layout atual das telas de orçamento/produtos; alterações visuais apenas no novo módulo.
- Prisma: usar somente `@prisma/client` (sem outputs customizados).

## Escopo do Módulo
- Menu próprio: Centros de Trabalho (cards: Máquinas, Funções, Serviços Manuais, Custos Indiretos; Modos de Impressão dentro de Máquinas).
- Motor de cálculo: automação por parâmetros (m²/h, setup, eficiência, acompanhamento do operador), com override manual.
- Integrações futuras (opcional): import CSV/JSON de modos a partir de RIPs.

---

## Fase 0 — Preparação (documentos congelados)
- Revisar e congelar `docs/centros-de-trabalho-calc-comunicacao-visual.md` (campos, fórmulas, defaults, navegação).
- Fechar rotas e nomes das páginas do módulo (pt-br).
- Saída: documentos revisados; check de aderência às premissas.

Status: CONCLUÍDA

## Fase 1 — Modelagem de Dados (Prisma)
- Adicionar/alterar entidades:
  - `maquina`: modo_producao, velocidade_m2_h, velocidade_ml_h, largura_util_m, eficiencia_percent, setup_min, custo_hora.
  - `modo_impressao` (filho de `maquina`): nome_modo, qualidade/passadas, velocidade_m2_h, consumo_tinta_ml_m2, padrao, ativo.
  - `funcao`: tipo_calculo, fator_acompanhamento, horas_por_m2, horas_por_unidade, setup_min, maquina_id?, custo_hora.
  - `servico_manual`: tipo_unidade, custo_hora/preco_base, horas_por_m2/por_unidade/velocidade_ml_h, eficiencia_percent, setup_min.
  - `custo_indireto` permanece; apenas reorganizado no módulo (navegação).
- Testes: validar migrações; mapear DTOs mínimos.

Status: CONCLUÍDA

## Fase 2 — Backend (Motor de Cálculo)
- Implementar cálculo automático:
  - Máquinas: M2_H, ML_H, MANUAL (setup + eficiência).
  - Funções: ACOMPANHA_MAQUINA, POR_M2, POR_UNIDADE, MANUAL (setup).
  - Serviços Manuais: iguais às funções por tipo.
  - Indiretos: custo_indireto_por_hora = soma(valor_mensal ativos) / horas_produtivas_mensais.
  - Override manual: respeitar horas do item quando marcado.
- Fallback: sem parâmetros → MANUAL (comportamento atual).
- Testes: unit de fórmulas; snapshots de cenários reais (ex.: banner 1,2 m², quantidade 2, margem 20%).

## Fase 3 — API/DTOs e OpenAPI
- Estender DTOs sem quebra (campos opcionais).
- Publicar/atualizar OpenAPI (descrições pt-br, exemplos, limites).
- Testes: unit de validação (class-validator/zod) e contratos.

## Fase 4 — Módulo de Menu (Frontend)
- Criar item de menu "Centros de Trabalho" e página inicial em cards:
  - Máquinas (com aba Modos de Impressão)
  - Funções
  - Serviços Manuais
  - Custos Indiretos
- Testes: unit de rotas e rendering baseline.

## Fase 5 — Padronização de CRUDs (Biblioteca de Componentes)
Reaproveitar o padrão de "Estoque/Itens" (imagem de referência) como baseline visual. Criar componentes globais reutilizáveis em `src/components/crud/` e `src/components/data-table/` (nomes sugestivos):
- `CrudPage` (shell da página): título, breadcrumbs, ações.
- `ViewSwitch` (alternador Tabela/Cards): desktop grid por padrão; cards no mobile.
- `DataGrid` (tabela padronizada): colunas, ordenação, paginação, coluna de ações (Editar/Excluir/…)
- `CardGrid` (cards responsivos): exibe itens em cards com ações.
- `CrudToolbar` (busca/filtros/ações): campo de busca, filtros, botão "Novo".
- `Pagination` e `EmptyState` padronizados.
- `StatusBadge`, `MoneyCell`, `DateCell` para consistência visual.
- `ConfirmDialog` (modal padrão do sistema) e `Toast` para sucesso, conforme premissas.
- Props e exemplos documentados; responsividade igual ao estoque/itens.
- Testes: unit de componentes (renderização, props principais) e testes visuais simples (snapshot).

## Fase 6 — CRUDs do Módulo
- Máquinas: listagem (DataGrid/CardGrid), criar/editar, aba Modos de Impressão.
- Funções: listagem e regras de cálculo.
- Serviços Manuais: listagem e parâmetros.
- Custos Indiretos: mover navegação para o módulo (sem alterar regras atuais).
- Testes: unit e smoke por formulário/lista.

## Fase 7 — Orçamento/Produtos (Automação sem mudar o visual)
- Cálculo automático em memória (FE) com base nos parâmetros dos Centros de Trabalho.
- Exibir "Horas calculadas automaticamente" (read-only) + toggle de override para inputs atuais.
- Tooltip com fórmula (velocidade, eficiência, setup, área, quantidade).
- Testes: unit das funções de cálculo no FE; validação com backend/grid.

## Fase 8 — Import de Modos (Opcional)
- Import CSV/JSON para `modo_impressao` por máquina; preview e validação.
- Testes: parsers/validações.

## Fase 9 — Observabilidade e QA
- Logs padronizados do cálculo (entrada → horas → custos → preço).
- Cobertura de testes ≥ 80% no escopo alterado.

---

## Padronização de CRUD — Diretrizes (Base: Estoque/Itens)
- Desktop: DataGrid por padrão; alternador para Cards.
- Mobile: Cards por padrão; alternador ativo.
- Colunas padrão: código/ID, nome/título, status (badge), valores monetários formatados, última atualização; coluna de ações.
- Ações: Editar, Excluir (confirm modal), ações extras contextuais.
- Toolbar: busca, filtros contextuais, botão "Novo".
- Navegação: breadcrumbs, botão "Voltar" consistente.
- Acessibilidade: labels/aria, foco navegável, contraste.
- Não duplicar lógica — componentes globais devem ser reaproveitados em todos CRUDs.

---

## Progresso e Notas (atualizar ao fim de cada fase)
- Fase 0: [x] concluída — branch criado e documentos congelados.
- Fase 1: [x] concluída — modelagem Prisma e migrações versionadas.
- Fase 2: [ ] em andamento — motor com automação e override (fallback manual); testes unitários iniciais do cálculo criados.
- Fase 3: [ ] pendente
- Fase 4: [ ] pendente
- Fase 5: [ ] pendente
- Fase 6: [ ] pendente
- Fase 7: [ ] pendente
- Fase 8: [ ] pendente
- Fase 9: [ ] pendente

---

## Critérios de Aceite Globais por Fase
- Lints e build verdes.
- Unit tests ≥ 80% no escopo alterado.
- Teste do usuário aprovado (validação manual).
- Documentação atualizada (este arquivo + OpenAPI, quando aplicável).
- Commit no branch `feature/centros-de-trabalho` com mensagem padronizada.

## Handoff (continuidade para o próximo agente)
Resumo do dia (estado da Fase 2):
- Código de automação criado em `backend/src/orcamentos/calculo-automacao.ts` com funções puras para horas de máquinas e funções (suporte a eficiência e setup). Sem lints.
- `OrcamentosService` integrado parcialmente:
  - Máquinas (M2_H): quando `horas_utilizadas` não informado, calcula horas a partir de `areaTotalM2` do orçamento, `velocidade_m2_h`, `eficiencia_percent` e `setup_min`. Fallback manual preservado.
  - Funções: automações para `POR_M2`, `ACOMPANHA_MAQUINA` e `POR_UNIDADE` quando horas não informadas, usando `areaTotalM2`, `horasMaquinas` e `quantidade_produto`. Fallback manual preservado.
  - Quantidade aplicada nos totais, mantendo alinhamento com o preview (que permanece client-side, inalterado).
- Testes unitários básicos criados em `backend/src/orcamentos/__tests__/calculo-automacao.spec.ts` cobrindo M2_H, POR_M2, ACOMPANHA_MAQUINA e POR_UNIDADE (com eficiência e setup). Ampliar para Serviços Manuais e ML_H.
- Pendências: muitos lints em `OrcamentosService` (pré-existentes e alguns de formatação após logs). Corrigir gradualmente apenas nas áreas tocadas para não ampliar escopo.

Próximos passos sugeridos (amanhã):
1) Concluir limpeza mínima de lints no `OrcamentosService` apenas nas linhas alteradas (quebras de linha e nomes de variáveis). Evitar refactors amplos agora.
2) Ampliar testes unitários para `calculo-automacao.ts` cobrindo:
   - Máquinas: M2_H com/sem eficiência e setup; fallback manual.
   - Funções: POR_M2, ACOMPANHA_MAQUINA, POR_UNIDADE; fallback manual; eficiência e setup.
   - Serviços Manuais e (quando modelado) ML_H; casos-limite; meta ≥ 80% de cobertura no arquivo.
3) Validar na UI: orçamento com máquina M2_H e função ACOMPANHA_MAQUINA; conferir preview x grid após salvar. Em caso de divergência, revisar multiplicadores de quantidade e cálculo de horas.
4) Commitar testes e ajustes.

Notas operacionais:
- Commit: usar mensagens ASCII simples para evitar glitches do PSReadLine no PowerShell.
- Prisma: não usar output customizado; usar `migrate diff` sem shadow DB se necessário.
- Multi-tenant: garantir filtros por `loja_id` em todas as consultas.

Critérios de aceite parciais da Fase 2 para encerrar este ciclo:
- Testes unitários passando para `calculo-automacao.ts` (≥80% no arquivo).
- Preview e grid iguais após salvar para ao menos 1 cenário com M2_H + ACOMPANHA_MAQUINA e 1 cenário com POR_M2.
- Lints limpos nas linhas alteradas.


Resumo rápido (estado atual):
- Branch de trabalho: `feature/centros-de-trabalho`.
- Prisma atualizado com novos campos/modelos/enums (multi-tenant `loja_id`):
  - `maquina`: `modo_producao`, `setup_min`, `velocidade_m2_h`, `eficiencia_percent`.
  - `funcao`: `tipo_calculo`, `fator_acompanhamento`, `horas_por_m2`, `horas_por_unidade`, `eficiencia_percent`.
  - Novos modelos: `modo_impressao`, `servico_manual` com `@@unique([loja_id, nome])`.
  - Enums: `maquina_modo_producao` (M2_H, ML_H, MANUAL) e `funcao_tipo_calculo` (ACOMPANHA_MAQUINA, POR_M2, POR_UNIDADE, MANUAL).
- Migração gerada por diff (sem shadow DB): `backend/prisma/migrations/20250821184507_ct_fase1_modelagem/migration.sql`.
- Observação Windows: `npx prisma generate` pode falhar com EPERM em `query_engine-windows.dll.node`. Evitar output customizado. Se necessário, fechar processos que travam a DLL e tentar novamente.

Onde continuar (Fase 2 — Backend/motor):
- Arquivo-alvo principal: `backend/src/orcamentos/orcamentos.service.ts`.
  - Funções a evoluir: `calcularCustosMaquinas` e `calcularCustosFuncoes`.
  - Manter preview no frontend 100% client-side e persistir o cálculo no backend.
- DTOs relacionados: `backend/src/orcamentos/dto/calcular-orcamento.dto.ts` e `backend/src/orcamentos/dto/resultado-calculo.dto.ts`.

Regras de cálculo a implementar (incremental, sem quebrar compatibilidade):
- Máquinas (`maquina.modo_producao`):
  - M2_H: horas = (area_total / velocidade_m2_h) × (100/eficiencia) + (setup_min/60).
  - ML_H: horas = (comprimento_linear_total / velocidade_ml_h) × (100/eficiencia) + (setup_min/60). Obs.: `velocidade_ml_h` ainda não modelado — avaliar inserir quando necessário.
  - MANUAL: usar `horas_utilizadas` informado (override manual).
- Funções (`funcao.tipo_calculo`):
  - ACOMPANHA_MAQUINA: horas = horas_da_máquina × (fator_acompanhamento || 1).
  - POR_M2: horas = area_total × horas_por_m2.
  - POR_UNIDADE: horas = quantidade_produto × horas_por_unidade.
  - MANUAL: usar `horas_trabalhadas` informado.
- Eficiência: aplicar como multiplicador de tempo (ex.: 80% → divide velocidade por 0,8 ou multiplica horas por 1/0,8).
- Setup: somar `setup_min/60` às horas do item.
- Quantidade: multiplicar totais por `quantidade_produto` quando fizer sentido. Manter coerência FE/BE.

Entradas necessárias no cálculo:
- `area_total`, `quantidade_produto` e listas de máquinas/funções do orçamento (DTO atual). Se faltar parâmetro, usar fallback MANUAL sem erro.

Cuidados e premissas obrigatórias:
- Multi-tenant: sempre filtrar por `loja_id`.
- Preview: não alterar UX/format do `CalculoPreview.tsx`.
- Persistência: backend deve refletir o preview ao salvar/atualizar (já ajustado em `findAll`/`update`).
- Prisma Decimal: converter com helper seguro (ex.: `toNumberSafe`).
- Fallback manual: não quebrar cenários incompletos.
- `@prisma/client` padrão (sem output customizado).

Testes/validação (ao finalizar Fase 2):
- Unit: fórmulas (máquinas/funções) com cenários M2_H, POR_M2, POR_UNIDADE, ACOMPANHA_MAQUINA, MANUAL.
- Smoke/E2E: orçamento preview × grid igual, com `quantidade_produto` > 1.
- Build/lint: verdes; DTOs compatíveis; OpenAPI na próxima fase.

Comandos úteis (PowerShell):
- `cd backend; npx prisma format`
- Migração por diff (sem shadow DB):
  - Criar pasta: `cd backend; $ts = Get-Date -Format "yyyyMMddHHmmss"; $mig = "prisma/migrations/" + $ts + "_ct_fase2_calculo"; New-Item -ItemType Directory -Path $mig -Force | Out-Null`
  - Gerar diff: `$env:DATABASE_URL=(Get-Content .env | Where-Object {$_ -match '^DATABASE_URL='} | ForEach-Object {$_ -replace '^DATABASE_URL=\"?','' -replace '\"$',''}); npx prisma migrate diff --from-url \"$env:DATABASE_URL\" --to-schema-datamodel prisma/schema.prisma --script | Set-Content -Path $mig\migration.sql`

Critérios de aceite (Fase 2):
- Preview e grid iguais após salvar/atualizar.
- Automação aplicada quando parâmetros presentes; fallback manual quando faltarem.
- Logs de cálculo claros (entrada → horas → custos → preço final).
- Unit tests ≥ 80% nas fórmulas.
