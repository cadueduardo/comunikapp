# Roadmap de Desenvolvimento do Projeto Comunikapp

Este documento descreve as fases e tarefas planejadas para o desenvolvimento do sistema Comunikapp, garantindo uma abordagem estruturada e incremental.

---

## Fase 0: Aquisição e Onboarding de Clientes

Esta fase foca na criação da porta de entrada para o sistema, permitindo que novos clientes conheçam e se cadastrem no Comunikapp.

- **[x] Tarefa 0.1: Desenvolvimento da Landing Page Pública**
  - Página de marketing com descrição dos benefícios, módulos e um Call to Action (CTA) claro para o teste gratuito.

- **[x] Tarefa 0.2: Implementação do Fluxo de Onboarding com Trial (detalhado)**
  - **1. Página de Cadastro (`/cadastro`):**
    - [x] Formulário solicitando: Nome completo, Email, Senha, Telefone, Nome da Loja.
    - [x] Adicionar opção para `Pessoa Física (CPF)` ou `Pessoa Jurídica (CNPJ)`.
    - [ ] Incluir botão "Cadastrar com Google" (a ser implementado futuramente).
  - **2. Submissão e Verificação (Backend):**
    - [x] Salvar `Loja` e `Usuario` com status `PENDENTE_VERIFICACAO`.
    - [x] Gerar e enviar códigos de verificação para o **email** do usuário.
    - [ ] Gerar e enviar códigos de verificação para o **WhatsApp/SMS** do usuário.
  - **3. Página de Verificação de Códigos:**
    - [x] Interface para o usuário inserir os códigos recebidos.
    - [x] Implementar lógica de "Reenviar código".
  - **4. Ativação e Início do Trial:**
    - [x] Após a validação dos códigos, alterar status para `ATIVO`.
    - [x] Registrar o início do trial de 30 dias.
    - [x] Efetuar login automático do usuário (via redirecionamento para login).
  - **5. Redirecionamento:**
    - [x] Redirecionar o usuário para a página inicial do sistema (`/dashboard`).

---

## Fase 1: Fundação e Estrutura Core

O objetivo desta fase é construir a espinha dorsal do sistema, focando na arquitetura multi-tenant, segurança e nos cadastros essenciais.

- **[x] Tarefa 1.1: Configuração do Ambiente de Desenvolvimento**
  - Definição das tecnologias (linguagem, framework, banco de dados).
  - Criação do repositório de código.
  - Setup do ambiente local.

- **[x] Tarefa 1.2: Desenho do Schema do Banco de Dados (Multi-Tenant)**
  - Implementar a estratégia de banco de dados compartilhado com a coluna `loja_id` em todas as tabelas relevantes.
  - Criar as tabelas iniciais para lojas e usuários.

- **[x] Tarefa 1.3: Módulo de Cadastro de Loja**
  - API e interface para uma nova empresa se cadastrar no sistema.
  - Criação do ambiente isolado da loja após a confirmação.

- **[x] Tarefa 1.4: Módulo de Cadastro e Autenticação de Usuários**
  - API e interface para o administrador da loja convidar e gerenciar usuários.
  - [x] Implementação de autenticação (login/logout) usando localStorage (temporário).
  - [x] Lógica de perfis de usuário (Admin, Vendas, etc.).
  - [x] Sistema completo de registro → verificação → ativação → login/logout.

- **[x] Tarefa 1.5: Implementação do API Gateway Básico**
  - [x] Implementar JWT para autenticação (substituir localStorage).
  - [x] Criar middleware para validação de token em todas as rotas.
  - [x] Garantir injeção automática de `loja_id` em requisições autenticadas.
  - [x] Adicionar guards de proteção nas rotas sensíveis.

- **[x] Tarefa 1.6: Implementação de Proteção de Dados Multi-Tenant**
  - Validar que usuários só acessem dados da própria loja.
  - Implementar filtros automáticos de `loja_id` no Prisma.

---

## Fase 2: Módulos Essenciais de Operação

Com a base pronta, o foco agora é entregar o valor principal do sistema: a capacidade de orçar e gerenciar clientes.

- **[x] Tarefa 2.0: Reestruturação das Rotas do Frontend**
  - Mover módulos (Clientes, Insumos, etc.) para o nível raiz da URL (ex: `/clientes` em vez de `/dashboard/clientes`).
  - Ajustar a estrutura de diretórios em `frontend/src/app` para refletir a nova arquitetura.
  - Atualizar a navegação (Sidebar, links) para as novas rotas.

- **[x] Tarefa 2.1: Módulo de CRM Básico (CRUD de Clientes)**
  - API e interface para cadastrar e gerenciar clientes (contato, endereço, histórico de interações).
  - Essencial para vincular orçamentos e pedidos.

- **[x] Tarefa 2.2: Módulo de Cadastro de Insumos (Backend - CRUD)**
  - API para gerenciar materiais, fornecedores e custos.

- **[x] Tarefa 2.2.1: Módulo de Configurações - Cadastros Auxiliares (Categorias e Fornecedores)**
  - API e interface para gerenciar as entidades de apoio do sistema.
  - [x] Backend: Refatorar `CategoriaInsumo` para `Categoria` genérica.
  - [x] Backend: Criar CRUD para `Fornecedores`.
  - [x] Frontend: Criar página de `Configurações` para abrigar os cadastros.
  - [x] Frontend: Implementar interface CRUD para `Categorias`.
  - [x] Frontend: Implementar interface CRUD para `Fornecedores`.

- **[x] Tarefa 2.3: Módulo de Cadastro de Insumos (Frontend - CRUD)**
  - Interface para gerenciar materiais, fornecedores e custos, seguindo a documentação `insumos.md`.

- **[x] Tarefa 2.4: Módulo de Configurações da Loja**
  - [x] API e interface para o administrador gerenciar os dados da loja (custos, margens, etc.).
  - [x] **Sub-tarefa 2.4.1: Upload de Logo com Preview**
    - [x] **Backend:** Criar endpoint para receber, salvar a imagem e atualizar a `logo_url` da loja.
    - [x] **Frontend:** Substituir o input de texto por um componente de upload de arquivo.
    - [x] **Frontend:** Implementar a funcionalidade de pré-visualização da imagem antes do envio.
    - [x] **Frontend:** Exibir o logo atual da loja na página de configurações.
  - [x] Cadastrar custos de mão de obra (custo/hora por função).
  - [x] Cadastrar custos de máquinas (custo/hora por máquina).
  - [x] Cadastrar custos indiretos/fixos (aluguel, contas, etc.).
  - [x] Cadastrar parâmetros de negócio (margem de lucro, impostos).

- **[x] Tarefa 2.5: Implementação do Motor de Cálculo de Orçamento**
  - [x] Lógica de backend (conforme detalhado no documento `calculo-custos-orcamento.md`).
  - [x] API que recebe os dados de um serviço e retorna o cálculo detalhado.
  - [x] Endpoint `POST /orcamentos/calcular` implementado.
  - [x] Documentação de teste criada em `backend/TESTE_MOTOR_CALCULO.md`.

- **[x] Tarefa 2.6: Módulo de Orçamento Rápido**
  - Interface para criar, salvar e gerenciar orçamentos, **vinculando-os a um cliente do CRM**.
  - Geração de um **link compartilhável, responsivo** e com data de validade para cada orçamento.
  - A página do orçamento deve ser profissional, com o **logo e timbrado da loja**.
  - A página deve permitir ao cliente **gerar um PDF** do orçamento e ser facilmente compartilhada via WhatsApp/e-mail.
  - **[x] Backend: CRUD completo de orçamentos implementado**
  - **[x] Backend: Motor de cálculo integrado ao CRUD**
  - **[x] Backend: Correção de validação de IDs (CUIDs em vez de UUIDs)**
  - **[x] Frontend: Página de listagem de orçamentos**
  - **[x] Frontend: Formulário de criação de orçamentos**
  - **[x] Frontend: Correção de validação de IDs (CUIDs em vez de UUIDs)**
  - **[x] Frontend: Página de visualização/edição de orçamentos**
  - **[x] Frontend: Link público compartilhável**
  - **[x] Frontend: Geração de PDF (via window.print otimizado para A4)**

- **[x] Tarefa 2.7: Refatoração Avançada dos Custos e Parâmetros da Loja**
  - **Problema identificado:** A estrutura atual de custos é simplificada e não representa a complexidade real de uma gráfica/loja de produção.
  - **Objetivo:** Desenvolver CRUDs específicos para máquinas, funções (mão de obra) e custos indiretos, com integração ao motor de cálculo, automação de rateio, simulação de cenários e relatórios analíticos, garantindo granularidade, flexibilidade e transparência.
  - **[x] Sub-tarefa 2.7.1: CRUD de Máquinas**
    - [x] **Backend:** Criar modelo `Maquina` com campos: nome, tipo, custo_hora, status, capacidade, observações, histórico de custos
    - [x] **Backend:** Implementar API CRUD para máquinas, incluindo consulta de histórico de custos
    - [x] **Frontend:** Criar página `/configuracoes/maquinas` com interface CRUD e visualização do histórico
    - [x] **Frontend:** Formulário de criação/edição de máquinas com campos detalhados
    - [x] **Backend:** Implementar proteção contra exclusão de máquinas usadas em funções
    - [x] **Frontend:** Tratamento de erros aprimorado com mensagens específicas
  - **[x] Sub-tarefa 2.7.2: CRUD de Funções (Mão de Obra)**
    - [x] **Backend:** Criar modelo `Funcao` com campos: nome, custo_hora, descricao, maquina_id (opcional), histórico de custos
    - [x] **Backend:** Implementar API CRUD para funções, incluindo histórico
    - [x] **Frontend:** Página `/configuracoes/funcoes` com interface CRUD e histórico
    - [x] **Frontend:** Formulário de criação/edição de funções, permitindo vínculo com máquinas
    - [x] **Backend:** Implementar proteção contra exclusão de funções usadas em orçamentos
    - [x] **Frontend:** Tratamento de erros aprimorado com mensagens específicas
  - **[x] Sub-tarefa 2.7.3: Sistema de Proteção de Dados e Tratamento de Erros**
    - [x] **Backend:** Implementar filtro de exceção global (`HttpExceptionFilter`) para tratamento padronizado de erros
    - [x] **Backend:** Substituir `Error` por `BadRequestException` em todos os services para retornar códigos HTTP adequados
    - [x] **Backend:** Implementar proteção contra exclusão de dados referenciados:
      - [x] **Insumos:** Não podem ser excluídos se usados em orçamentos
      - [x] **Funções:** Não podem ser excluídas se usadas em orçamentos
      - [x] **Categorias:** Não podem ser excluídas se usadas em insumos
      - [x] **Fornecedores:** Não podem ser excluídos se usados em insumos
      - [x] **Máquinas:** Já tinha proteção implementada
    - [x] **Frontend:** Implementar tratamento de erros aprimorado em todos os módulos:
      - [x] **Insumos:** Captura e exibe mensagens específicas do backend
      - [x] **Funções:** Captura e exibe mensagens específicas do backend
      - [x] **Categorias:** Captura e exibe mensagens específicas do backend
      - [x] **Fornecedores:** Captura e exibe mensagens específicas do backend
      - [x] **Clientes:** Tratamento de erro melhorado
      - [x] **Orçamentos:** Tratamento de erro melhorado
    - [x] **UX:** Mensagens claras e orientativas explicando por que a exclusão não é possível e como resolver
    - [x] **Integridade:** Prevenção de exclusões que quebrariam relacionamentos no banco de dados

  - **[x] Sub-tarefa 2.7.4: CRUD de Custos Indiretos**
    - [x] **Backend:** Criar modelo `CustoIndireto` com campos: nome, valor_mensal, categoria, ativo, regra_rateio (ex: proporcional ao tempo de máquina, valor do orçamento, etc.), histórico de alterações
    - [x] **Backend:** Implementar API CRUD para custos indiretos, com histórico e regras de rateio
    - [x] **Frontend:** Página `/configuracoes/custos-indiretos` com interface CRUD, visualização de histórico e configuração de regras de rateio
    - [x] **Frontend:** Formulário de criação/edição de custos indiretos e suas regras
  - **[x] Sub-tarefa 2.7.5: Atualização do Motor de Cálculo**
    - [x] **Backend:** Adaptar motor de cálculo para:
      - Utilizar máquinas e funções específicas selecionadas em cada orçamento
      - Aplicar custos indiretos automaticamente, conforme regras de rateio configuradas
      - Permitir simulação de cenários (ex: troca de máquina/função, alteração de parâmetros)
      - Registrar detalhamento dos custos por item e por orçamento
    - [x] **Backend:** Implementar API para simulação de cenários de orçamento
    - [x] **Frontend:** Atualizar formulário de orçamento para:
      - Selecionar máquinas/funções por item
      - Exibir custos detalhados por máquina/função/custo indireto em sidebar ou painel
      - Permitir simulação de cenários e comparação de resultados
    - [x] **Frontend:** Visualização clara dos custos rateados e totais
  - **[ ] Sub-tarefa 2.7.6: Relatórios Analíticos e Histórico**
    - [ ] **Backend:** Implementar geração de relatórios analíticos:
      - Composição de custos por orçamento
      - Margem de contribuição por máquina/função
      - Participação dos custos indiretos
      - Histórico de alterações de custos
    - [ ] **Frontend:** Página de relatórios com filtros, gráficos e exportação
  - **[ ] Sub-tarefa 2.7.7: Integração com Compras e Estoque**
    - [ ] **Backend:** Ao aprovar orçamento, verificar disponibilidade de insumos e capacidade de máquinas
    - [ ] **Backend:** Gerar automaticamente requisições de compra ou alertas para insumos/capacidades em falta
    - [ ] **Frontend:** Notificações e sugestões de ação para o usuário
  - **[ ] Sub-tarefa 2.7.8: Migração de Dados e Compatibilidade**
    - [ ] **Backend:** Criar migrations para novos modelos
    - [ ] **Backend:** Implementar lógica de migração dos dados existentes, mantendo compatibilidade com orçamentos anteriores
    - [ ] **Backend:** Garantir logs e rastreabilidade de alterações
  - **Diferenciais e melhorias incorporadas:**
    - Rateio automatizado e configurável de custos indiretos
    - Simulação de cenários de orçamento
    - Histórico detalhado de custos e alterações
    - Relatórios analíticos avançados
    - Integração proativa com compras e estoque
    - Transparência total para o usuário final

- **[x] Tarefa 2.8: Sistema de Tipos de Material e Lógica de Consumo**
  - **Objetivo:** Implementar sistema avançado para tipos de materiais com lógicas de consumo personalizadas, permitindo cálculos automáticos baseados em parâmetros específicos de cada tipo de material.
  - **[x] Sub-tarefa 2.8.1: Backend - Modelo de Tipos de Material**
    - [x] **Backend:** Criar modelo `TipoMaterial` com campos: nome, logica_consumo, parametros_padrao (JSON), descricao
    - [x] **Backend:** Implementar API CRUD para tipos de material
    - [x] **Backend:** Relacionar `Insumo` com `TipoMaterial` (opcional)
    - [x] **Backend:** Implementar proteção contra exclusão de tipos usados em insumos
  - **[x] Sub-tarefa 2.8.2: Frontend - Interface de Tipos de Material**
    - [x] **Frontend:** Criar página `/configuracoes/tipos-material` com interface CRUD
    - [x] **Frontend:** Formulário de criação/edição de tipos de material com configuração de parâmetros
    - [x] **Frontend:** Interface para configurar lógicas de consumo (espacamento, quantidade por m², multiplicador, quantidade fixa)
    - [x] **Frontend:** Tratamento de erros aprimorado
  - **[x] Sub-tarefa 2.8.3: Integração com Formulário de Orçamento**
    - [x] **Frontend:** Atualizar formulário de orçamento para aplicar lógicas de consumo automáticas
    - [x] **Frontend:** Implementar sugestões automáticas de quantidade baseadas no tipo de material
    - [x] **Frontend:** Exibir explicações detalhadas dos cálculos realizados
    - [x] **Frontend:** Permitir aplicação manual das sugestões
  - **[x] Sub-tarefa 2.8.4: Melhorias no Cadastro de Insumos**
    - [x] **Frontend:** Adicionar campo de seleção de tipo de material no formulário de insumos
    - [x] **Frontend:** Exibir informações do tipo de material na listagem de insumos
    - [x] **Frontend:** Melhorar UX com informações contextuais sobre tipos de material

- **[x] Tarefa 2.9: Sistema de Mensagens de Negociação**
  - **Objetivo:** Implementar sistema de comunicação entre loja e cliente durante o processo de negociação de orçamentos.
  - **[x] Sub-tarefa 2.9.1: Backend - Modelo de Mensagens**
    - [x] **Backend:** Criar modelo `MensagemNegociacao` com campos: orcamento_id, remetente_tipo (loja/cliente), conteudo, data_envio, lida
    - [x] **Backend:** Implementar API CRUD para mensagens de negociação
    - [x] **Backend:** Implementar sistema de notificações para novas mensagens
  - **[x] Sub-tarefa 2.9.2: Frontend - Interface de Negociação**
    - [x] **Frontend:** Criar interface de chat para negociação de orçamentos
    - [x] **Frontend:** Implementar sistema de notificações em tempo real
    - [x] **Frontend:** Integrar com página de visualização de orçamentos

- **[x] Tarefa 2.10: Sistema de Notificações**
  - **Objetivo:** Implementar sistema de notificações para manter usuários informados sobre eventos importantes.
  - **[x] Sub-tarefa 2.10.1: Backend - Modelo de Notificações**
    - [x] **Backend:** Criar modelo `Notificacao` com campos: usuario_id, tipo, titulo, mensagem, lida, data_criacao, dados_extras (JSON)
    - [x] **Backend:** Implementar API CRUD para notificações
    - [x] **Backend:** Implementar sistema de criação automática de notificações
  - **[x] Sub-tarefa 2.10.2: Frontend - Interface de Notificações**
    - [x] **Frontend:** Criar componente de notificações no header
    - [x] **Frontend:** Implementar página de listagem de notificações
    - [x] **Frontend:** Implementar marcação de notificações como lidas

- **[x] Tarefa 2.11: WebSockets e Tempo Real**
  - **Objetivo:** Implementar comunicação em tempo real para chat e notificações.
  - **[x] Sub-tarefa 2.11.1: Backend - WebSocket Gateway**
    - [x] **Backend:** Instalar e configurar Socket.IO com NestJS
    - [x] **Backend:** Criar WebsocketsGateway com autenticação JWT
    - [x] **Backend:** Implementar salas por orçamento e loja
    - [x] **Backend:** Integrar com serviço de mensagens para eventos em tempo real
  - **[x] Sub-tarefa 2.11.2: Frontend - WebSocket Client**
    - [x] **Frontend:** Instalar socket.io-client
    - [x] **Frontend:** Criar hook useWebSocket para gerenciar conexões
    - [x] **Frontend:** Integrar WebSocket com ChatFlutuante
    - [x] **Frontend:** Implementar indicadores de status de conexão
    - [x] **Frontend:** Adicionar indicador de digitação em tempo real

- **[x] Tarefa 2.12: Sistema Completo de Aprovação de Orçamentos**
  - **Objetivo:** Implementar fluxo completo desde rascunho até aprovação, com páginas públicas profissionais e sistema de códigos de segurança.
  - **[x] Sub-tarefa 2.12.1: Backend - Fluxo de Aprovação**
    - [x] **Backend:** Implementar estados de orçamento (rascunho, enviado, aprovado, rejeitado, negociando)
    - [x] **Backend:** Sistema de códigos de aprovação por email via Ethereal
    - [x] **Backend:** API de envio de orçamento para cliente com link público
    - [x] **Backend:** Endpoint de aprovação por código de segurança
    - [x] **Backend:** Sistema de logs e histórico de ações do cliente
  - **[x] Sub-tarefa 2.12.2: Frontend - Página Pública Profissional**
    - [x] **Frontend:** Página pública responsive otimizada para impressão A4
    - [x] **Frontend:** Layout profissional com logo dinâmico da loja
    - [x] **Frontend:** Exibição apenas de dados comerciais (sem custos internos)
    - [x] **Frontend:** Botões de ação (Aprovar, Rejeitar, Negociar, PDF)
    - [x] **Frontend:** Sistema de códigos de aprovação por email
    - [x] **Frontend:** Integração com chat de negociação
  - **[x] Sub-tarefa 2.12.3: Melhorias no Fluxo de Orçamentos**
    - [x] **Frontend:** Botões contextuais baseados no status do orçamento
    - [x] **Frontend:** Navegação inteligente via badges clicáveis
    - [x] **Frontend:** Interface de edição para orçamentos em rascunho
    - [x] **Frontend:** Sistema de envio de orçamento após edição

- **[x] Tarefa 2.13: Sistema de Compartilhamento Nativo**
  - **Objetivo:** Implementar compartilhamento nativo de orçamentos para dispositivos móveis e PWA.
  - **[x] Sub-tarefa 2.13.1: Backend - URLs Públicas**
    - [x] **Backend:** Endpoints públicos para visualização de orçamentos
    - [x] **Backend:** Dados otimizados para visualização do cliente
  - **[x] Sub-tarefa 2.13.2: Frontend - Web Share API**
    - [x] **Frontend:** Integração com Web Share API nativa
    - [x] **Frontend:** Detecção inteligente de dispositivos (mobile, PWA, touch)
    - [x] **Frontend:** Fallback para clipboard em desktop
    - [x] **Frontend:** Componente ShareButton reutilizável
    - [x] **Frontend:** Hook useShareCapabilities para detecção de recursos

- **[x] Tarefa 2.14: Integração com API dos Correios**
  - **Objetivo:** Automatizar preenchimento de endereços no cadastro de clientes.
  - **[x] Sub-tarefa 2.14.1: Frontend - Busca Automática de CEP**
    - [x] **Frontend:** Integração com API ViaCEP dos Correios
    - [x] **Frontend:** Formatação automática de CEP (00000-000)
    - [x] **Frontend:** Busca automática quando CEP completo é digitado
    - [x] **Frontend:** Preenchimento automático de logradouro, bairro, cidade, estado
    - [x] **Frontend:** Campos bloqueados após busca (apenas número e complemento editáveis)
    - [x] **Frontend:** Feedback visual durante busca e tratamento de erros
    - [x] **Frontend:** Página de teste criada (/test-cep) para validação

---

## Fase 3: Módulos Complementares e Gestão

Expandir as funcionalidades para cobrir outras áreas da operação diária da loja.

- **[ ] Tarefa 3.1: Módulo de Gestão de Ordens de Serviço (OS)**
  - API e interface para converter um orçamento aprovado em uma **Ordem de Serviço** com numeração única.
  - A visão da OS focará nos dados de produção (insumos, medidas), omitindo valores financeiros.
  - Acompanhamento de status (Na fila, Em produção, Finalizado, Entregue).
  - Integração com o módulo de estoque para dar baixa nos materiais.

- **[ ] Tarefa 3.2: Módulo de Controle Financeiro Básico**
  - API e interface para gerenciar contas a pagar e a receber.
  - Geração de um fluxo de caixa simples.

- **[ ] Tarefa 3.3: Módulo de Estoque Simples**
  - API e interface para controle de entrada e saída de insumos.
  - Alertas de estoque mínimo.

- **[ ] Tarefa 3.4: Relatórios Básicos**
  - Geração de relatórios essenciais (vendas, custos, lucros).

---

## Fase 4: Marketplace e Painel do Administrador do SaaS

Construir as funcionalidades que caracterizam o sistema como um SaaS modular e comercial.

- **[ ] Tarefa 4.1: Desenvolvimento do Marketplace Interno**
  - Interface para o administrador da loja ver, instalar e remover módulos.
  - Lógica para ativar/desativar as tabelas e APIs de um módulo para uma loja específica.

- **[ ] Tarefa 4.2: Painel do Administrador do SaaS**
  - Interface para o dono do Comunikapp gerenciar todas as lojas.
  - Visualização de métricas de uso e assinaturas.
  - Ferramentas de suporte.

- **[ ] Tarefa 4.3: Integração do Gateway de Pagamento (Stripe)**
  - Implementar o módulo de pagamentos seguindo o Padrão de Adaptador.
  - Integração com a API do Stripe para criar e gerenciar assinaturas.
  - Lógica para lidar com o fim do período de trial e gerenciar o status das assinaturas.
  - Configuração de webhooks para sincronizar o status dos pagamentos.

- **[ ] Tarefa 4.4: API Gateway Robusto (Evolução da 1.5)**
  - Implementar rate limiting por loja/usuário.
  - Sistema completo de logs de auditoria e métricas.
  - Health checks e monitoramento de performance.
  - Implementar cache distribuído para otimização.
  - Gateway com balanceamento de carga para múltiplos serviços.

---

## Fase 5: Polimento e Funcionalidades Adicionais

Foco em experiência do usuário, segurança e funcionalidades opcionais.

- **[x] Tarefa 5.1: Responsividade da Interface**
  - Garantir que todo o sistema seja funcional e agradável em desktops e dispositivos móveis.
  - [x] Implementação de responsividade para módulos principais (Insumos, Orçamentos, Clientes)
  - [x] Switch de visualização (tabela ↔ cards) para desktop
  - [x] Cards otimizados para mobile
  - [x] Hook `useIsMobile` para detecção de dispositivo

- **[ ] Tarefa 5.2: Segurança e Backups**
  - Implementar rotinas de backup automático do banco de dados.
  - Realizar uma auditoria de segurança em todo o sistema.

- **[ ] Tarefa 5.3: Módulo de Gateway de Pagamento para Cliente Final**
  - Módulo opcional para a loja processar pagamentos de seus próprios clientes.
  - Implementação da arquitetura de adaptadores para suportar diferentes gateways (Mercado Pago, etc.).
  - Interface para a loja configurar suas próprias credenciais de API.

- **[ ] Tarefa 5.4: Módulos Opcionais Adicionais (Exemplos)**
  - Desenvolvimento de módulos avançados como `Emissão de NF-e` ou `PCP/Produção Setorizada` para serem disponibilizados no marketplace.

---

## Fase 6: Melhorias e Otimizações Recentes

Foco em melhorias específicas identificadas durante o desenvolvimento e uso do sistema.

- **[x] Tarefa 6.1: Melhorias no Formulário de Orçamento**
  - [x] **Sub-tarefa 6.1.1: Cálculo Automático de Área**
    - [x] Implementar cálculo automático de área baseado em largura e altura
    - [x] Suporte a diferentes unidades de medida (mm, cm, m)
    - [x] Campo de área somente leitura com cálculo automático
  - [x] **Sub-tarefa 6.1.2: Sugestões Inteligentes de Quantidade**
    - [x] Implementar sugestões automáticas baseadas no tipo de material
    - [x] Aplicar lógicas de consumo personalizadas (espacamento, quantidade por m², etc.)
    - [x] Exibir explicações detalhadas dos cálculos realizados
    - [x] Permitir aplicação manual das sugestões
  - [x] **Sub-tarefa 6.1.3: Preview de Cálculo em Tempo Real**
    - [x] Implementar sidebar com preview do cálculo
    - [x] Exibir custos detalhados por categoria (materiais, máquinas, funções, custos indiretos)
    - [x] Mostrar valores unitários e totais
    - [x] Botão para calcular orçamento sem salvar
  - [x] **Sub-tarefa 6.1.4: Melhorias na UX**
    - [x] Interface mais intuitiva com accordions para organizar seções
    - [x] Validação em tempo real dos campos
    - [x] Mensagens de erro mais claras e específicas
    - [x] Tratamento de erros aprimorado

- **[x] Tarefa 6.2: Sistema de Aprovação e Página Pública Profissional**
  - [x] **Sub-tarefa 6.2.1: Fluxo de Aprovação Seguro**
    - [x] Sistema de códigos de aprovação por email via Ethereal
    - [x] Endpoint de aprovação com validação de código
    - [x] Estados de orçamento (rascunho, enviado, aprovado, rejeitado, negociando)
    - [x] Logs e histórico de ações do cliente
  - [x] **Sub-tarefa 6.2.2: Página Pública Otimizada**
    - [x] Layout A4 profissional otimizado para impressão
    - [x] Logo dinâmico com ajuste automático de proporções
    - [x] Exibição apenas de dados comerciais (sem custos internos)
    - [x] Botões de ação contextuais (Aprovar, Rejeitar, Negociar, PDF)
    - [x] Integração com sistema de chat para negociação
  - [x] **Sub-tarefa 6.2.3: Melhorias na Navegação**
    - [x] Badges clicáveis na lista de orçamentos
    - [x] Navegação inteligente baseada no status
    - [x] Interface de edição para orçamentos em rascunho
    - [x] Sistema de envio após edição

- **[x] Tarefa 6.3: Sistema de Compartilhamento Nativo e Web Share API**
  - [x] **Sub-tarefa 6.3.1: Detecção Inteligente de Dispositivos**
    - [x] Detecção de dispositivos móveis, PWA e touch
    - [x] Componente ShareButton reutilizável
    - [x] Hook useShareCapabilities para detecção de recursos
  - [x] **Sub-tarefa 6.3.2: Implementação Web Share API**
    - [x] Integração com Web Share API nativa
    - [x] Fallback inteligente para clipboard em desktop
    - [x] Feedback visual diferenciado por método de compartilhamento
    - [x] Tratamento robusto de erros e cancelamentos

- **[x] Tarefa 6.4: Integração com API dos Correios (ViaCEP)**
  - [x] **Sub-tarefa 6.4.1: Busca Automática de Endereços**
    - [x] Integração com API ViaCEP dos Correios
    - [x] Formatação automática de CEP (00000-000)
    - [x] Busca automática quando CEP de 8 dígitos é digitado
    - [x] Preenchimento automático de logradouro, bairro, cidade, estado
  - [x] **Sub-tarefa 6.4.2: Interface Otimizada**
    - [x] Campos bloqueados após busca (apenas número e complemento editáveis)
    - [x] Feedback visual durante busca com loading spinner
    - [x] Tratamento de erros (CEP inválido, não encontrado, erro de conexão)
    - [x] Interface limpa focada na experiência automática
    - [x] Página de teste (/test-cep) para validação da integração

- **[ ] Tarefa 6.5: Correções de Linter e Qualidade de Código**
  - [ ] **Sub-tarefa 6.5.1: Correções de TypeScript**
    - [ ] Corrigir uso de `any` em tipos de dados
    - [ ] Substituir variáveis `let` por `const` quando apropriado
    - [ ] Remover variáveis não utilizadas
    - [ ] Corrigir escape de caracteres em strings JSX
  - [ ] **Sub-tarefa 6.5.2: Melhorias de Performance**
    - [ ] Otimizar re-renders desnecessários
    - [ ] Implementar memoização onde apropriado
    - [ ] Reduzir complexidade de componentes grandes

- **[ ] Tarefa 6.6: Melhorias na Documentação**
  - [ ] **Sub-tarefa 6.6.1: Documentação de API**
    - [ ] Criar documentação Swagger/OpenAPI para todas as rotas
    - [ ] Documentar exemplos de uso para endpoints complexos
    - [ ] Incluir códigos de erro e suas causas
  - [ ] **Sub-tarefa 6.6.2: Documentação de Componentes**
    - [ ] Documentar props e interfaces de componentes complexos
    - [ ] Criar guias de uso para funcionalidades avançadas
    - [ ] Manter documentação atualizada com mudanças

- **[ ] Tarefa 6.7: Testes e Qualidade**
  - [ ] **Sub-tarefa 6.7.1: Testes Unitários**
    - [ ] Implementar testes para funções de cálculo
    - [ ] Testar validações de formulário
    - [ ] Cobrir casos de erro e edge cases
  - [ ] **Sub-tarefa 6.7.2: Testes de Integração**
    - [ ] Testar fluxos completos de criação de orçamentos
    - [ ] Validar integração entre frontend e backend
    - [ ] Testar cenários de erro e recuperação

---

## Status Atual do Projeto

### ✅ Módulos Concluídos
- **Onboarding e Autenticação:** Sistema completo de cadastro, verificação e login
- **CRM Básico:** Cadastro e gestão de clientes com integração API dos Correios
- **Cadastros Auxiliares:** Categorias, fornecedores, tipos de material
- **Insumos:** Sistema completo de cadastro com lógicas de consumo
- **Configurações:** Máquinas, funções, custos indiretos com histórico
- **Orçamentos Completo:** 
  - Formulário avançado com cálculo automático e preview
  - Sistema de rascunho, envio e aprovação
  - Página pública profissional para clientes
  - Códigos de aprovação por email
  - Geração de PDF otimizada para A4
- **Sistema de Aprovação:** Fluxo completo cliente com códigos de segurança
- **Responsividade:** Interface adaptada para desktop e mobile
- **Sistema de Notificações:** Notificações em tempo real
- **Mensagens de Negociação:** Chat em tempo real com anexos
- **WebSockets:** Comunicação tempo real para chat e notificações
- **Sistema de Compartilhamento:** Web Share API nativa com fallback
- **Integração Correios:** Busca automática de endereços por CEP

### 🔄 Em Desenvolvimento
- **Relatórios Analíticos:** Composição de custos e margens por orçamento
- **Integração com Compras:** Verificação de disponibilidade de insumos

### 📋 Próximas Prioridades
1. **Módulos de Gestão:** Ordens de Serviço (OS) e controle financeiro básico
2. **Relatórios Analíticos:** Composição de custos, margens e histórico
3. **Correções de Qualidade:** Resolver erros de linter e melhorar código
4. **Testes:** Implementar testes unitários e de integração
5. **Documentação:** Melhorar documentação técnica e de usuário

### 🎯 Objetivos de Curto Prazo
- **Sistema Pronto para Produção:** Módulo de orçamentos está completo e funcional
- **Expandir para Gestão:** Implementar OS e controle financeiro básico
- **Qualidade e Estabilidade:** Implementar testes e resolver warnings
- **Preparar para Usuários:** Sistema estável para demonstração e testes reais

### 🚀 Marcos Importantes Recentes
- ✅ **Sistema de Orçamentos Completo:** Fluxo completo rascunho → envio → aprovação/negociação
- ✅ **Experiência do Cliente:** Página pública A4 com códigos de aprovação por email
- ✅ **Comunicação Tempo Real:** Chat com anexos, WebSockets e notificações em tempo real
- ✅ **Automação Inteligente:** CEP automático via ViaCEP e compartilhamento nativo Web Share API
- ✅ **UX Profissional:** Interface responsiva, navegação intuitiva e feedback visual otimizado

### 📊 Estatísticas do Desenvolvimento
- **Total de Tarefas Principais:** 14 tarefas concluídas na Fase 2
- **Funcionalidades Implementadas:** Sistema completo de orçamentos end-to-end
- **Integrações Externas:** ViaCEP (Correios), Ethereal (Email), Web Share API
- **Tecnologias em Uso:** Next.js, NestJS, Prisma, Socket.IO, TypeScript
- **Status do Sistema:** Pronto para testes com usuários reais 