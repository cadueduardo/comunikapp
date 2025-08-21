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
- Fase 2: [ ] em andamento — motor com automação e override (fallback manual).
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
