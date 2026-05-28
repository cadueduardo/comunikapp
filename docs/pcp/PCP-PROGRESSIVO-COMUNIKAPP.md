# PCP Progressivo Comunikapp

Status: em execução  
Data: 28/05/2026  
Módulo: PCP - Planejamento e Controle de Produção

## 0. Registro De Implementação

### 28/05/2026 - Fase 3 (Segurança Apontamentos + Aplicar Padrão)

**Segurança multi-tenant em Apontamentos**

- Todos os endpoints de `pcp/apontamentos` passam a receber `loja_id` via `@LojaId()`.
- Criação, listagem, busca, edição e exclusão validam que OS/etapa/apontamento pertencem à loja autenticada.
- Testes: `apontamento.service.spec.ts`.

**Configuração**

- `POST /pcp/configuracao/aplicar-padrao` define nível **Organizado** (recomendação do produto).
- Testes: `pcp-configuracao.service.spec.ts`.

### 28/05/2026 - Fase 3 (Meu Setor + Dashboard Agregado)

**Meu Setor (`/pcp/meu-setor`)**

- Fila por operador com filtro "Somente minha fila" para administrador.
- Movimentação entre setores no modo `COMPLETO` (select por card).
- Refresh real após iniciar, pausar, concluir ou mover.
- Layout compacto: métricas inline, fila ocupa a maior parte da tela.
- Link "Voltar ao PCP", chips de status e seletor de setor para operador com múltiplos setores.

**Dashboard agregado**

- Endpoint `GET /pcp/dashboard` retorna, em uma chamada:
  - `configuracao` (`pcp_nivel`);
  - `stats` do Kanban geral;
  - `cards_atencao` (até 6 itens críticos);
  - `gargalos` (top 3 setores, somente no modo `COMPLETO`).
- Proxy frontend: `GET /api/pcp/dashboard`.
- Home `/pcp` passou a consumir o dashboard para indicadores, atenção e gargalos na sidebar.

**Entregas anteriores desta fase (mesma sessão)**

- Filtros do Kanban por setores (`operador`, `prioridade`, `prazo`, intervalo).
- Indicadores de gargalo por coluna (`score_gargalo`, `nivel_gargalo`).
- `POST /pcp/kanban/mover-setor/:itemOsId` com validação de workflow e `loja_id`.

### 28/05/2026 - Quinta Entrega Executada

Esta entrega iniciou a visão real do PCP Completo por setores produtivos, conforme a preocupação de enxergar todas as interações da produção em um único Kanban gerencial.

**Backend**

- Criado contrato `KanbanPorSetores` em `backend/src/pcp/entities/pcp.entities.ts`.
- Criado contrato `KanbanSetorColuna`, com totais por setor:
  - total;
  - pendentes;
  - em andamento;
  - pausadas.
- Criado endpoint:

```text
GET /pcp/kanban/por-setores
```

- O endpoint retorna somente dados da loja autenticada.
- A query busca setores produtivos ativos da loja e itens de workflow nos status:
  - `PENDENTE`;
  - `EM_ANDAMENTO`;
  - `PAUSADA`.
- Cards por item agora carregam `os_id`, permitindo abrir a OS correta mesmo quando o card representa um item/produto.

**Frontend**

- Criada API route:

```text
GET /api/pcp/kanban/por-setores
```

- A Home `/pcp` passou a ter comportamento específico para `pcp_nivel = COMPLETO`.
- No modo Completo, o bloco principal da Home mostra "Produção por setores".
- Cada setor produtivo vira uma coluna com:
  - nome do setor;
  - cor do setor;
  - total de itens;
  - itens na fila;
  - itens rodando;
  - itens pausados.
- Cards exibem:
  - número da OS;
  - cliente;
  - produto/serviço;
  - prioridade;
  - status da etapa;
  - operador atual;
  - prazo.
- Quando não há setores, a tela mostra estado vazio com atalho para cadastro de setores produtivos.
- Para os modos Essencial e Organizado, a Home continua usando o Kanban simples existente.

**Segurança E Escopo**

- A visão por setores é somente leitura nesta entrega.
- Movimentação por drag and drop entre setores ainda não foi ativada.
- A validação de loja fica no backend, não no frontend.
- Como o sistema ainda não possui alçadas reais e todos os usuários estão como admin, a implementação foi mantida compatível com o modelo futuro de permissões, mas sem bloquear a operação atual.

**Pendente Desta Fatia**

- Permitir filtros por setor, prioridade, prazo e operador.
- Adicionar indicadores de gargalo por setor.
- Evoluir "Meu Setor", que ainda precisa de revisão de UX. **Executado em 28/05/2026: UX compacta + fila por operador + mover setor.**
- Definir regra futura para movimentar cards entre setores respeitando workflow e permissões.

**Validação Executada**

```text
backend: npm test -- --runInBand src/pcp/services/pcp-kanban.service.spec.ts src/pcp/services/__tests__/workflow-assignment.service.spec.ts
backend: npm run build
frontend: npm run build
repo: git diff --check
```

Todos os comandos acima passaram.

### 28/05/2026 - Quarta Entrega Executada

Esta entrega priorizou segurança no PCP antes de avançar para features mais complexas.

**Segurança Backend**

- `PUT /pcp/configuracao` agora só permite alteração por usuário com função `ADMINISTRADOR`.
- Operações críticas do Kanban agora validam permissão operacional:
  - iniciar produção;
  - concluir etapa;
  - pausar produção;
  - atualizar status da OS.
- Funções autorizadas para movimentação operacional do PCP:
  - `ADMINISTRADOR`;
  - `PRODUCAO`.
- Usuário que não é `ADMINISTRADOR` não pode iniciar, pausar ou concluir em nome de outro operador.
- O operador informado no payload precisa existir, estar ativo, ter email verificado e pertencer à mesma loja.
- Atualização de status da OS deixou de aceitar string livre.
- Criado enum `StatusKanbanOS` e DTO `AtualizarStatusOSDto`.
- Status recebidos do frontend agora são mapeados para status persistidos válidos:
  - `FILA` -> `LIBERADA_PARA_PCP`;
  - `PRODUCAO` -> `PRODUCAO`;
  - `CONCLUIDA` -> `FINALIZADA`;
  - `REJEITADA` -> `REJEITADA`.

**Arquivos Alterados**

- `backend/src/pcp/dto/kanban.dto.ts`
- `backend/src/pcp/controllers/pcp-kanban.controller.ts`
- `backend/src/pcp/services/pcp-kanban.service.ts`
- `backend/src/pcp/controllers/pcp-configuracao.controller.ts`
- `backend/src/pcp/services/pcp-configuracao.service.ts`
- `backend/src/pcp/services/pcp-kanban.service.spec.ts`

**Validação Executada**

```text
backend: npm test -- --runInBand src/pcp/services/pcp-kanban.service.spec.ts src/pcp/services/__tests__/workflow-assignment.service.spec.ts
backend: npm run build
```

Todos os comandos acima passaram.

**Observação Para Próximos Agentes**

Todo endpoint novo do PCP deve seguir estes princípios:

- Não confiar em `lojaId`, `operadorId`, `status` ou permissões vindas do frontend.
- Validar `loja_id` em toda leitura e escrita.
- Preferir enums/DTOs com whitelist para status e ações.
- Validar função/perfil antes de alterar produção ou configuração.
- Não permitir operação em nome de outro usuário sem regra explícita de administrador.

### 28/05/2026 - Terceira Entrega Executada

Esta entrega conectou a experiência visual do Kanban da Home ao nível progressivo do PCP.

**Frontend**

- `frontend/src/components/ui/kanban-board.tsx` passou a aceitar colunas customizadas via prop `columns`.
- Criado tipo exportado `KanbanColumn`.
- O Kanban continua com colunas padrão quando nenhuma configuração customizada é enviada, preservando a página `/pcp/kanban`.
- A Home `/pcp` agora monta colunas conforme `pcp_nivel`:
  - Essencial: `Aguardando`, `Produzindo`, `Pronto`, `Bloqueado`.
  - Organizado: `Pré-produção`, `Produção`, `Pronto`, `Bloqueios`.
  - Completo: `Fila do PCP`, `Em execução`, `Pronto`, `Bloqueado`.
- O filtro de status do Kanban passa a respeitar colunas customizadas.
- Drag and drop continua atualizando o status destino definido pela coluna.

**Validação Executada**

```text
frontend: npm run build
```

Build executado com sucesso.

**Pendente Desta Fatia**

- Evoluir backend para retornar colunas realmente dinâmicas por nível.
- Separar status intermediários reais para o modo Organizado, em vez de apenas renomear os buckets atuais.
- No modo Completo, evoluir para colunas por setor produtivo quando houver dados suficientes.

### 28/05/2026 - Segunda Entrega Executada

Esta entrega iniciou a refatoração prática da Home do PCP para deixar a primeira tela mais objetiva e alinhada ao modelo progressivo.

**Frontend**

- Reescrita a Home do PCP em `frontend/src/app/(main)/pcp/page.tsx`.
- A Home agora consulta `GET /api/pcp/configuracao`.
- Se `pcp_nivel` ainda não estiver definido, a tela mostra aviso operacional com atalho para `/pcp/configuracao`.
- Se `pcp_nivel` estiver definido, a Home mostra o selo do nível:
  - `Essencial`
  - `Organizado`
  - `Completo`
- A descrição da Home muda conforme o nível escolhido.
- A Home usa dados reais do hook `useKanbanData`.
- Indicadores principais exibidos:
  - Na fila;
  - Em produção;
  - Atrasadas;
  - Prontas.
- O Kanban passa a ser o elemento central da Home.
- Adicionada lista lateral "Precisa de atenção", calculada a partir de:
  - cards com alerta;
  - cards atrasados;
  - cards sem prazo.
- Atalhos laterais mudam conforme o nível:
  - Essencial: Kanban, OS, Configuração.
  - Organizado: Kanban, Workflows, Configuração.
  - Completo: Meu Setor, Setores, Workflows.
- Clique no card da Home navega para `/os/{id}`.

**Validação Executada**

```text
frontend: npm run build
```

Observação: o primeiro build falhou por cache gerado inconsistente em `.next` (`[turbopack]_runtime.js` ausente). O diretório `.next` foi removido e o build foi executado novamente com sucesso. Não houve erro de compilação da alteração.

**Pendente Desta Fatia**

- Criar endpoint agregado específico de dashboard PCP no backend.
- Adaptar o próprio `KanbanBoard` para colunas dinâmicas por nível.
- Remover/ajustar telas auxiliares que ainda usam dados demonstrativos.
- Melhorar os textos com encoding quebrado em telas antigas do PCP.

### 28/05/2026 - Primeira Entrega Executada

Esta primeira entrega iniciou a execução prática do PCP progressivo, com foco em fundação técnica, configuração por loja e correções operacionais críticas.

**Documentação**

- Documento canônico criado: `docs/pcp/PCP-PROGRESSIVO-COMUNIKAPP.md`.
- `docs/pcp/README.md` atualizado para apontar este documento como referência atual.
- Documento mantido em UTF-8 com acentuação em português.

**Backend**

- Criado campo `loja.pcp_nivel` em `backend/prisma/schema.prisma`.
- Criada migration: `backend/prisma/migrations/20260528100000_add_pcp_nivel_loja/migration.sql`.
- Criado DTO: `backend/src/pcp/dto/pcp-configuracao.dto.ts`.
- Criado service: `backend/src/pcp/services/pcp-configuracao.service.ts`.
- Criado controller: `backend/src/pcp/controllers/pcp-configuracao.controller.ts`.
- Registrado `PCPConfiguracaoController` e `PCPConfiguracaoService` em `backend/src/pcp/pcp.module.ts`.
- Endpoints reais disponíveis:

```text
GET /pcp/configuracao
PUT /pcp/configuracao
```

**Onboarding**

- Adicionado step `configurar_producao` em `backend/src/home-operacional/enums/onboarding-step.enum.ts`.
- Adicionada etapa "Definir como o PCP vai funcionar" no catálogo do onboarding.
- Detecção automática da etapa concluída quando `pcp_nivel` é `ESSENCIAL`, `ORGANIZADO` ou `COMPLETO`.

**Frontend**

- Criada API route: `frontend/src/app/api/pcp/configuracao/route.ts`.
- Criada tela: `frontend/src/app/(main)/pcp/configuracao/page.tsx`.
- Menu lateral do PCP recebeu item "Configuração".
- Tela permite escolher:
  - `ESSENCIAL`
  - `ORGANIZADO`
  - `COMPLETO`

**Correções Operacionais Do PCP**

- `frontend/src/components/ui/kanban-board.tsx` não usa mais `mockData` quando a API retorna vazio.
- `backend/src/pcp/controllers/pcp-kanban.controller.ts` passou a enviar `lojaId` para operações críticas.
- `backend/src/pcp/services/pcp-kanban.service.ts` agora valida loja em:
  - fila por setor;
  - iniciar produção;
  - concluir etapa;
  - pausar produção;
  - atualizar status da OS.
- `pausarProducao` foi implementado de fato:
  - busca etapa em andamento;
  - muda status para `PAUSADA`;
  - registra apontamento `PAUSA`;
  - preserva motivo e observações.
- `iniciarProducao` também retoma etapa pausada, registrando apontamento `RETOMADA`.
- `frontend/src/hooks/useMeuSetor.ts` agora envia `operadorId` ao pausar produção.

**Validação Executada**

```text
backend: npm run db:generate
backend: npm test -- --runInBand src/pcp/services/pcp-kanban.service.spec.ts src/pcp/services/__tests__/workflow-assignment.service.spec.ts
backend: npm run build
frontend: npm run build
repo: git diff --check
```

Todos os comandos acima passaram.

**Pendente Para Runtime**

- Aplicar migration no banco de desenvolvimento antes de testar a tela em execução:

```text
cd backend
npm run db:migrate
```

**Próxima Fatia Recomendada**

Refatorar a Home do PCP para consumir `pcp_nivel` e renderizar experiências diferentes:

- Essencial: Kanban simples + indicadores básicos + lista "Precisa de atenção".
- Organizado: etapas padrão de comunicação visual + bloqueios.
- Completo: visão por setor, fila, gargalos e apontamentos.

## 1. Objetivo

Este documento define como o PCP do Comunikapp deve funcionar para empresas de comunicação visual de pequeno, médio e maior porte, sem obrigar uma empresa pequena a operar como uma indústria complexa.

A decisão central é criar um PCP progressivo, com três níveis de maturidade:

- **Essencial:** quadro simples de produção.
- **Organizado:** etapas padrão de comunicação visual.
- **Completo:** setores, operadores, workflows por produto e métricas.

O sistema deve funcionar no primeiro dia mesmo sem configuração avançada. A empresa pode evoluir de um nível para outro conforme sua operação amadurece.

## 2. Princípios

1. O PCP deve ser simples por padrão.
2. O Kanban deve ser o coração visual da produção.
3. A home do PCP deve mostrar o que precisa de ação agora.
4. Configuração não deve atrapalhar operação.
5. A OS é o documento-mãe, mas o PCP deve controlar produto/item quando necessário.
6. Workflows devem existir, mas não devem dominar a experiência de empresas pequenas.
7. Toda complexidade avançada deve ser opcional, progressiva e reversível.
8. A empresa deve poder começar no modo Essencial e evoluir sem perder histórico.

## 3. Problema Atual

O PCP atual já possui uma base técnica relevante:

- OS liberada para PCP.
- Workflow e instância de workflow.
- Workflow por setores.
- Instância por item da OS.
- Kanban geral.
- Meu Setor.
- Apontamentos básicos.
- Templates de workflow.

Mas a experiência ainda é confusa porque:

- A home parece um menu de funcionalidades, não uma central de produção.
- O Kanban ainda mistura status geral com fluxo produtivo.
- Algumas telas ainda usam dados de demonstração.
- Workflows aparecem como protagonista, mesmo sendo configuração.
- Falta uma decisão clara sobre o nível de controle da empresa.
- Pequenas empresas podem se assustar com setores, operadores, tempos, categorias e regras.

## 4. Modelo De Maturidade Do PCP

### 4.1 Nível 1 - Essencial

**Público**

- Empresa pequena.
- Poucos usuários.
- Uma pessoa pode vender, operar máquina, finalizar e entregar.
- Não existe separação formal por setor.
- O objetivo é enxergar andamento das OS sem burocracia.

**Promessa**

"Controle sua produção em um quadro simples."

**Kanban**

```text
Aguardando -> Produzindo -> Finalizando -> Pronto
```

**Unidade visual do card**

- OS ou item principal da OS.

**Campos mínimos do card**

- Número da OS.
- Cliente.
- Produto ou serviço.
- Prazo.
- Prioridade.
- Alertas essenciais.

**Ações**

- Iniciar.
- Pausar.
- Concluir.
- Ver OS.
- Marcar como entregue, quando aplicável.

**Não exige**

- Setores produtivos.
- Operador por etapa.
- Workflow por produto.
- Apontamento obrigatório.
- Tempo estimado.
- Checklists avançados.

**Regras**

- Toda OS aprovada tecnicamente ou liberada para PCP entra em `Aguardando`.
- Qualquer usuário com permissão de produção pode mover cards.
- A movimentação do card atualiza o status operacional.
- Se a OS tiver múltiplos produtos, pode aparecer como um card único no início.

### 4.2 Nível 2 - Organizado

**Público**

- Empresa pequena em crescimento ou média.
- Já existe uma sequência comum de trabalho.
- Pode haver mais de uma pessoa, mas sem setores rigorosos.
- O objetivo é organizar o fluxo por etapas da comunicação visual.

**Promessa**

"Organize sua produção por etapas comuns do mercado."

**Kanban padrão**

```text
Pré-produção -> Impressão -> Corte -> Acabamento -> Instalação/Entrega -> Pronto
```

**Modelos iniciais sugeridos**

- Banner: `Impressão -> Acabamento -> Entrega`.
- Adesivo: `Arte/Pré-produção -> Impressão -> Recorte -> Entrega`.
- Placa/ACM: `Corte -> Impressão/Adesivo -> Montagem -> Instalação/Entrega`.
- Letra caixa: `Corte/CNC -> Pintura -> Montagem -> Elétrica -> Instalação`.
- Impressão simples: `Impressão -> Acabamento -> Pronto`.

**Unidade visual do card**

- Preferencialmente produto/item da OS.
- Para OS simples, pode continuar aparecendo como OS.

**Campos do card**

- OS.
- Cliente.
- Produto.
- Etapa atual.
- Prazo.
- Prioridade.
- Bloqueios: arte, material, prazo, aprovação.

**Ações**

- Iniciar etapa.
- Concluir etapa.
- Pular etapa não aplicável.
- Pausar.
- Ver OS.
- Ver arquivos/arte.

**Não exige no início**

- Operador fixo por setor.
- Apontamento obrigatório.
- Tempo real detalhado.
- Capacidade produtiva.

### 4.3 Nível 3 - Completo

**Público**

- Empresa média ou maior.
- Possui setores, máquinas, funções e operadores.
- Precisa medir gargalos, produtividade, prazos e custo real.
- Pode ter OS com vários produtos em rotas diferentes.

**Promessa**

"Controle por setores, operadores, etapas e indicadores."

**Kanban**

- Colunas dinâmicas baseadas nos setores produtivos cadastrados.
- Cards por produto/item da OS.
- Suporte a rotas diferentes dentro da mesma OS.

Exemplo:

```text
Pré-produção -> Impressão Digital -> CNC/Corte -> Acabamento -> Montagem -> Qualidade -> Expedição -> Instalação
```

**Recursos**

- Setores produtivos.
- Workflows por produto.
- Workflow sugerido automaticamente.
- Fila por operador ou setor.
- Apontamento de início, pausa, retomada, conclusão e refugo.
- Tempo previsto vs tempo real.
- Alertas de atraso.
- Alertas de gargalo.
- Relatórios de produtividade.
- Consumo real vs planejado.
- Controle de instalação.

## 5. Decisão Pelo Onboarding

O nível do PCP deve ser definido no onboarding da Home Operacional, porque a escolha depende da maturidade da empresa, não de uma configuração técnica isolada.

### 5.1 Nova Etapa Do Onboarding

Adicionar etapa:

```text
Configurar produção
```

Pergunta:

```text
Como você quer controlar sua produção agora?
```

Opções:

1. **Essencial**  
   "Quero apenas acompanhar minhas OS em um quadro simples."

2. **Organizado**  
   "Quero controlar por etapas comuns da comunicação visual."

3. **Completo**  
   "Quero controlar por setores, operadores e produtividade."

### 5.2 Recomendação Automática

O sistema pode recomendar um nível com base em dados existentes:

- Até 3 usuários e nenhum setor cadastrado: recomendar **Essencial**.
- Sem setores, mas com produtos variados: recomendar **Organizado**.
- Com setores produtivos, máquinas ou funções cadastradas: recomendar **Completo**.
- Se a loja já usa workflow por item: recomendar **Completo**.

A recomendação não deve travar a escolha.

### 5.3 Checklist Dinâmico

Se escolher **Essencial**:

- Escolher nível de produção.
- Confirmar colunas do quadro simples.
- Testar envio de uma OS para produção.

Se escolher **Organizado**:

- Escolher nível de produção.
- Revisar etapas padrão.
- Escolher modelos por tipo de serviço.
- Testar envio de uma OS para produção.

Se escolher **Completo**:

- Escolher nível de produção.
- Cadastrar ou revisar setores produtivos.
- Vincular máquinas/funções, quando existir.
- Criar ou revisar workflows.
- Testar envio de produto da OS para setor.
- Habilitar apontamentos.

### 5.4 Configurações Posteriores

A escolha também deve existir em:

```text
Configurações > PCP > Nível de controle da produção
```

Regras:

- Evoluir deve ser simples.
- Rebaixar deve ser permitido, mas com aviso sobre visões que ficarão ocultas.
- Histórico nunca deve ser apagado.

## 6. Home Do PCP

### 6.1 Objetivo Da Home

A home do PCP deve responder:

- O que preciso fazer agora?
- O que está atrasado?
- O que está bloqueado?
- Onde está o gargalo?
- O que entra na produção hoje?
- O que está pronto para entrega ou instalação?

Ela não deve ser apenas uma página com atalhos.

### 6.2 Home No Nível Essencial

Primeira tela:

- Kanban simples em destaque.
- Indicadores pequenos.
- Lista "Precisa de atenção".

Indicadores:

- Aguardando.
- Produzindo.
- Atrasadas.
- Prontas.

Lista "Precisa de atenção":

- OS sem prazo.
- OS atrasada.
- OS sem arte, se arte for obrigatória.
- OS sem material suficiente, se estoque estiver ativo.

### 6.3 Home No Nível Organizado

Primeira tela:

- Kanban por etapas padrão.
- Bloco "Bloqueios".
- Bloco "Entregas e instalações".

Indicadores:

- Em pré-produção.
- Em produção.
- Em acabamento.
- Aguardando instalação/entrega.
- Atrasadas.
- Bloqueadas.

Lista "Precisa de atenção":

- Sem arte aprovada.
- Sem material.
- Sem etapa definida.
- Prazo vencido.
- Instalação sem data.

### 6.4 Home No Nível Completo

Primeira tela:

- Visão de produção por setor.
- Cards por produto/item.
- Alertas de gargalo.
- Fila por setor.

Indicadores:

- Itens em fila.
- Itens em andamento.
- Itens atrasados.
- Itens bloqueados.
- Setor mais carregado.
- Workflows pendentes.

Blocos:

- Kanban por setores.
- Precisa de decisão do PCP.
- Carga por setor.
- Instalações.
- Qualidade/refugo.
- Próximas entregas.

## 7. Kanban

### 7.1 Regras Comuns

O Kanban deve:

- Ser a visualização principal do PCP.
- Usar dados reais sempre.
- Nunca mostrar dados mockados em produção.
- Permitir filtro por prazo, cliente, prioridade e alerta.
- Permitir abrir a OS ou produto.
- Ter estados vazios honestos e orientados a ação.

### 7.2 Cards

Card mínimo:

- Número da OS.
- Cliente.
- Produto/serviço.
- Prazo.
- Prioridade.
- Status/etapa.
- Alertas.

Card expandido:

- Materiais principais.
- Arquivos/arte.
- Observações de produção.
- Responsável.
- Histórico curto.
- Ações.

### 7.3 Alertas Visuais

Alertas principais:

- Atrasado.
- Vence hoje.
- Falta arte.
- Falta material.
- Sem prazo.
- Sem workflow.
- Pausado.
- Refugo/retrabalho.
- Instalação pendente.

### 7.4 Drag And Drop

**Essencial**

- Pode mover livremente entre colunas, respeitando permissões.

**Organizado**

- Pode mover para próxima etapa.
- Pode pular etapa com motivo.

**Completo**

- Movimento deve respeitar workflow, dependência, setor e permissão.
- Se não puder mover, o sistema deve explicar o bloqueio.

## 8. Workflows

### 8.1 Papel Do Workflow

Workflow é configuração de rota produtiva.

Ele não deve ser a primeira coisa que o usuário pequeno vê.

### 8.2 No Nível Essencial

Não exigir workflow.

Usar fluxo interno simples:

```text
Aguardando -> Produzindo -> Finalizando -> Pronto
```

### 8.3 No Nível Organizado

Usar modelos padrão por tipo de serviço.

O usuário pode ajustar:

- Remover etapa.
- Reordenar etapa.
- Adicionar etapa simples.

Sem obrigar cadastro de setor.

### 8.4 No Nível Completo

Workflow deve ser composto por setores produtivos.

Deve permitir:

- Setores em sequência.
- Tempos estimados.
- Obrigatoriedade.
- Regras de sugestão.
- Aplicação por produto da OS.

## 9. Meu Setor

### 9.1 Essencial

Pode não aparecer como menu principal.

Quando aparecer, deve ser "Minha fila":

- Próximo trabalho.
- Em andamento.
- Pausados.

### 9.2 Organizado

Mostrar fila por etapa:

- O que está em Impressão.
- O que está em Corte.
- O que está em Acabamento.

Usuário escolhe a etapa que quer ver.

### 9.3 Completo

Mostrar fila real por setor e operador:

- Itens pendentes.
- Itens em andamento.
- Itens pausados.
- Atrasados.
- Ações de apontamento.

## 10. Apontamentos

### 10.1 Essencial

Apontamento opcional e automático:

- Mover para `Produzindo` cria início simples.
- Mover para `Pronto` cria conclusão simples.

### 10.2 Organizado

Apontamento semi-automático:

- Iniciar etapa.
- Concluir etapa.
- Pausar com motivo.

### 10.3 Completo

Apontamento completo:

- Início.
- Pausa.
- Retomada.
- Conclusão.
- Refugo.
- Quantidade produzida.
- Tempo real.
- Operador.
- Observações.

## 11. Relatórios

### 11.1 Essencial

Relatórios simples:

- OS produzidas no período.
- OS atrasadas.
- Tempo médio simples.

### 11.2 Organizado

Relatórios por etapa:

- Tempo por etapa.
- Atrasos por etapa.
- Trabalhos concluídos por período.

### 11.3 Completo

Relatórios avançados:

- Produtividade por setor.
- Produtividade por operador.
- Lead time por tipo de produto.
- Gargalos.
- Refugo.
- Retrabalho.
- Previsto vs realizado.
- Consumo planejado vs real.

## 12. Regras De Dados E Backend

### 12.1 Configuração Da Loja

Criar ou reaproveitar configuração por loja:

```json
{
  "pcp_nivel": "ESSENCIAL | ORGANIZADO | COMPLETO",
  "pcp_onboarding_concluido": true,
  "pcp_colunas_essencial": ["AGUARDANDO", "PRODUZINDO", "FINALIZANDO", "PRONTO"],
  "pcp_etapas_organizado": ["PRE_PRODUCAO", "IMPRESSAO", "CORTE", "ACABAMENTO", "INSTALACAO_ENTREGA", "PRONTO"]
}
```

Preferência:

- Usar estrutura de parâmetros/configurações existente se ela já suportar chave-valor por loja.
- Evitar criar tabela nova se configurações atuais forem suficientes.

### 12.2 Endpoints Recomendados

Dashboard:

```text
GET /pcp/dashboard
```

Retorna dados já adaptados ao nível da loja.

Kanban:

```text
GET /pcp/kanban
PUT /pcp/kanban/cards/:id/mover
```

Configuração:

```text
GET /pcp/configuracao
PUT /pcp/configuracao
POST /pcp/configuracao/aplicar-padrao
```

Status em 28/05/2026:

- `GET /pcp/configuracao` implementado.
- `PUT /pcp/configuracao` implementado.
- `GET /pcp/dashboard` implementado.
- `POST /pcp/configuracao/aplicar-padrao` implementado (define nível Organizado).

Onboarding:

```text
POST /home-operacional/onboarding/pcp
```

ou endpoint equivalente já usado pela Home Operacional.

### 12.3 Multi-Tenant

Toda query deve respeitar `loja_id`.

Pontos críticos:

- Buscar fila por setor deve validar se o setor pertence à loja.
- Atualizar status de OS deve validar se a OS pertence à loja.
- Apontamentos devem validar OS, item, setor e operador dentro da loja.

## 13. Permissões

Perfis sugeridos:

- Administrador: configura nível, setores, workflows e permissões.
- Gestor/PCP: movimenta produção, atribui workflow, altera prioridade.
- Operador: vê fila, inicia, pausa e conclui itens permitidos.
- Comercial: consulta status e bloqueios, mas não controla produção.

Essencial:

- Administrador e Gestor podem tudo no PCP.
- Operador pode mover cards se autorizado.

Organizado:

- Gestor pode pular etapa.
- Operador pode iniciar/concluir etapa.

Completo:

- Operador só atua em setor permitido.
- Gestor pode reatribuir, pausar e corrigir fluxo.

## 14. Fases De Execução

### Fase 0 - Decisões E Contratos

Objetivo:

Definir o contrato funcional antes de refatorar telas.

Entregas:

- Aprovar este documento.
- Definir nomenclatura final dos níveis: Essencial, Organizado, Completo.
- Definir colunas padrão do Essencial.
- Definir etapas padrão do Organizado.
- Definir onde salvar `pcp_nivel`.
- Definir permissões mínimas por perfil.

Aceite:

- Produto aprova os três níveis.
- Time técnico aprova impacto no backend.
- Nenhuma tela é alterada sem contrato de dados definido.

### Fase 1 - PCP Essencial Funcional

Objetivo:

Entregar um PCP simples, utilizável por pequena empresa.

Entregas:

- Configuração `pcp_nivel`.
- Onboarding com escolha do nível.
- Home do PCP em modo Essencial.
- Kanban sem dados mockados.
- Colunas simples.
- Movimento básico de card.
- Estado vazio correto.
- Alertas básicos.

Backend:

- Endpoint de dashboard PCP.
- Endpoint de Kanban adaptado ao nível Essencial.
- Movimento com validação de loja.

Frontend:

- Nova home do PCP focada no quadro.
- Indicadores simples.
- Lista "Precisa de atenção".

Aceite:

- Uma OS liberada aparece automaticamente em `Aguardando`.
- Usuário consegue mover até `Pronto`.
- Nenhum dado fictício aparece.
- Pequena empresa consegue usar sem cadastrar setor.

### Fase 2 - PCP Organizado

Objetivo:

Adicionar etapas padrão de comunicação visual sem exigir setor produtivo.

Entregas:

- Modelos padrão por tipo de serviço.
- Kanban por etapas.
- Pular etapa com motivo.
- Bloqueios simples.
- Home adaptada ao nível Organizado.
- Apontamento semi-automático.

Backend:

- Resolver etapa atual por OS/item.
- Aplicar modelo padrão.
- Criar movimentações/auditoria.

Frontend:

- Preview de etapas no onboarding.
- Quadro por etapas.
- Card com alertas de arte/material/prazo.

Aceite:

- Usuário escolhe Organizado e recebe etapas padrão.
- OS pode seguir fluxo de comunicação visual sem setor cadastrado.
- Produto pode pular etapa não aplicável com motivo.

### Fase 3 - PCP Completo Por Setores

Objetivo:

Ativar a operação por setores, operadores e workflows por produto.

Entregas:

- Kanban dinâmico por setores.
- Cards por item da OS.
- Workflow por produto.
- Fila por setor.
- Permissão por operador/setor.
- Pausa real.
- Conclusão libera próximo grupo.
- Home com carga por setor.

Backend:

- Fortalecer `WorkflowInstanciaSetor`.
- Garantir multi-tenant em todas as queries.
- Implementar pausa real.
- Implementar filtros por setor, operador, prioridade e prazo.

Frontend:

- Kanban dinâmico.
- Meu Setor completo.
- Modal de atribuição de workflow simplificado.
- Tela de workflows movida para contexto de configuração ou reduzida como setup.

Aceite:

- OS com vários produtos pode ter produtos em setores diferentes.
- Operador vê apenas sua fila/setor quando aplicável.
- Gestor vê gargalos por setor.
- Pausar altera dados reais e aparece no Kanban.

### Fase 4 - Apontamentos E Relatórios Reais

Objetivo:

Substituir telas demonstrativas por dados operacionais reais.

Entregas:

- Tela de apontamentos real.
- Tela de etapas real ou incorporada ao detalhe da OS/produto.
- Relatórios reais por período.
- Refugo e retrabalho.
- Tempo previsto vs real.

Backend:

- Endpoints agregados de relatório.
- Queries por período com `loja_id`.
- Exportação CSV ou Excel, se necessário.

Frontend:

- Remover dados hardcoded.
- Gráficos reais.
- Filtros de período.

Aceite:

- Relatórios não mostram números fictícios.
- Gestor consegue medir atrasos, lead time e produção por período.

### Fase 5 - Integrações Avançadas

Objetivo:

Integrar PCP com estoque, compras, instalação e financeiro real.

Entregas:

- Reserva/baixa de material conforme regra definida.
- Alertas de compra.
- Agenda de instalação.
- Fotos/evidências de instalação.
- Custo real vs orçado.
- Indicadores avançados.

Aceite:

- PCP mostra impacto real de material e prazo.
- Instalações aparecem como parte do fluxo produtivo.
- Gestor compara previsto vs realizado.

## 15. Backlog Técnico Imediato

Prioridade alta:

- Remover `mockData` do Kanban principal. **Executado em 28/05/2026 para `frontend/src/components/ui/kanban-board.tsx`.**
- Criar endpoint agregado de dashboard PCP. **Executado em 28/05/2026: `GET /pcp/dashboard`.**
- Implementar pausa real. **Executado em 28/05/2026 para `PCPKanbanService.pausarProducao`.**
- Corrigir queries sem validação de `loja_id`. **Parcialmente executado em 28/05/2026: Kanban + Apontamentos com escopo por loja; revisar Etapas/Notificações se necessário.**
- Corrigir textos com encoding quebrado nas telas do PCP.
- Separar configuração de workflow da home operacional.
- Criar estado vazio correto para PCP sem OS.

Prioridade média:

- Criar configuração `pcp_nivel`. **Executado em 28/05/2026.**
- Integrar escolha ao onboarding. **Executado em 28/05/2026 como etapa `configurar_producao`.**
- Adaptar Home PCP por nível. **Parcialmente executado em 28/05/2026: Home consulta `pcp_nivel`, muda textos/atalhos e centraliza Kanban real. Ainda falta dashboard backend agregado e Kanban com colunas por nível.**
- Adaptar Kanban por nível. **Parcialmente executado em 28/05/2026: `KanbanBoard` aceita colunas customizadas e a Home altera colunas por nível. Ainda falta backend com colunas/status dinâmicos reais.**
- Criar Kanban por setores para o modo Completo. **Parcialmente executado em 28/05/2026: `GET /pcp/kanban/por-setores` retorna colunas por setor produtivo e a Home usa essa visão quando `pcp_nivel = COMPLETO`. Ainda falta drag and drop entre setores, filtros e indicadores de gargalo.**
- Criar testes frontend mínimos. **Executado em 28/05/2026: `frontend/src/lib/pcp/pcp.utils.ts` + `npm run test:pcp` (`validar-pcp.mjs`).**

Prioridade baixa:

- Relatórios avançados.
- Previsão de prazo.
- Otimização de capacidade.
- Simulação de gargalos.

## 16. Critérios De Qualidade

Antes de concluir qualquer fase:

- Não pode haver dados mockados em tela operacional.
- Não pode haver movimentação sem validar `loja_id`.
- Toda movimentação crítica deve validar permissão do usuário autenticado.
- Status recebido do frontend deve passar por whitelist/mapeamento antes de persistir.
- Não pode quebrar fluxo atual de OS.
- Deve haver estado vazio claro.
- Deve haver teste backend para regra crítica.
- Toda nova decisão deve estar documentada.

### 16.1 Checklist De Aceite E Teste Final - Fase 3 (Completo Por Setores)

Classificação de status da fase:

- **Fase 3 Parcial:** visão por setores funcionando em modo leitura.
- **Fase 3 Rollout:** filtros + indicadores de gargalo + testes mínimos.
- **Fase 3 Concluída:** movimentação entre setores com validação de workflow/permissão + Meu Setor revisado + dashboard agregado.

Checklist obrigatório antes de marcar uma entrega da Fase 3:

- [x] Documento atualizado em UTF-8 no registro de implementação.
- [x] Não há regressão de segurança em multi-tenant (`loja_id`) nas queries e operações críticas (Kanban + Apontamentos).
- [x] Endpoints críticos validam permissão por perfil antes de executar ação.
- [x] Status/ações vindos do frontend passam por whitelist/mapeamento no backend.
- [x] Home `/pcp` no modo `COMPLETO` exibe visão por setores sem dados mockados.
- [x] Clique no card abre a OS correta por `os_id`.
- [x] Estado vazio para ausência de setores aparece com chamada clara para ação.
- [ ] Build backend e frontend concluídos com sucesso (validar no deploy local).
- [x] Testes críticos de backend do PCP executados e aprovados.
- [x] Testes frontend mínimos (`npm run test:pcp`).
- [x] `git diff --check` sem erros.

Checklist funcional de teste final (manual):

1. Definir nível `COMPLETO` em `/pcp/configuracao`.
2. Garantir setores ativos em `/centros-de-trabalho/setores-produtivos`.
3. Garantir OS/item com workflow passando por setores.
4. Acessar `/pcp` e validar colunas por setor e totais de fila/rodando/pausado.
5. Validar abertura correta da OS ao clicar no card.
6. Validar estado vazio quando não houver setores cadastrados.
7. Validar escopo por loja: nenhum dado de outra loja deve aparecer.

## 17. Decisões Pendentes

1. O nome final dos níveis será Essencial, Organizado e Completo?
2. No modo Essencial, o card representa OS inteira ou item principal?
3. No modo Organizado, quais etapas padrão ficam ativas por default?
4. A configuração do nível será obrigatória no onboarding ou poderá ser pulada?
5. Quem pode mudar o nível do PCP depois?
6. A tela de Workflows deve sair de `/pcp` e ir para Configurações?
7. O modo Essencial deve permitir drag and drop livre ou apenas botões de ação?

## 18. Recomendação Final

O Comunikapp deve recomendar o nível **Organizado** como padrão para comunicação visual, mas permitir **Essencial** com um clique.

Racional:

- Essencial é bom para empresas muito pequenas.
- Organizado representa melhor a realidade da comunicação visual sem exigir setup pesado.
- Completo deve ser uma evolução natural, não a primeira experiência.

Assim, o PCP fica simples para quem precisa de simplicidade e forte para quem amadurecer a operação.
