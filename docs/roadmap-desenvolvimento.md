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
  - **[ ] Frontend: Página de visualização/edição de orçamentos**
  - **[ ] Frontend: Link público compartilhável**
  - **[ ] Frontend: Geração de PDF**

- **[ ] Tarefa 2.7: Refatoração Avançada dos Custos e Parâmetros da Loja**
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

  - **[ ] Sub-tarefa 2.7.4: CRUD de Custos Indiretos**
    - [ ] **Backend:** Criar modelo `CustoIndireto` com campos: nome, valor_mensal, categoria, ativo, regra_rateio (ex: proporcional ao tempo de máquina, valor do orçamento, etc.), histórico de alterações
    - [ ] **Backend:** Implementar API CRUD para custos indiretos, com histórico e regras de rateio
    - [ ] **Frontend:** Página `/configuracoes/custos-indiretos` com interface CRUD, visualização de histórico e configuração de regras de rateio
    - [ ] **Frontend:** Formulário de criação/edição de custos indiretos e suas regras
  - **[ ] Sub-tarefa 2.7.5: Atualização do Motor de Cálculo**
    - [ ] **Backend:** Adaptar motor de cálculo para:
      - Utilizar máquinas e funções específicas selecionadas em cada orçamento
      - Aplicar custos indiretos automaticamente, conforme regras de rateio configuradas
      - Permitir simulação de cenários (ex: troca de máquina/função, alteração de parâmetros)
      - Registrar detalhamento dos custos por item e por orçamento
    - [ ] **Backend:** Implementar API para simulação de cenários de orçamento
    - [ ] **Frontend:** Atualizar formulário de orçamento para:
      - Selecionar máquinas/funções por item
      - Exibir custos detalhados por máquina/função/custo indireto em sidebar ou painel
      - Permitir simulação de cenários e comparação de resultados
    - [ ] **Frontend:** Visualização clara dos custos rateados e totais
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

- **[ ] Tarefa 5.1: Responsividade da Interface**
  - Garantir que todo o sistema seja funcional e agradável em desktops e dispositivos móveis.

- **[ ] Tarefa 5.2: Segurança e Backups**
  - Implementar rotinas de backup automático do banco de dados.
  - Realizar uma auditoria de segurança em todo o sistema.

- **[ ] Tarefa 5.3: Módulo de Gateway de Pagamento para Cliente Final**
  - Módulo opcional para a loja processar pagamentos de seus próprios clientes.
  - Implementação da arquitetura de adaptadores para suportar diferentes gateways (Mercado Pago, etc.).
  - Interface para a loja configurar suas próprias credenciais de API.

- **[ ] Tarefa 5.4: Módulos Opcionais Adicionais (Exemplos)**
  - Desenvolvimento de módulos avançados como `Emissão de NF-e` ou `PCP/Produção Setorizada` para serem disponibilizados no marketplace. 