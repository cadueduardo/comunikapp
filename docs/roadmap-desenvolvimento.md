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

- **[ ] Tarefa 1.5: Implementação do API Gateway**
  - Configurar um gateway central para todas as requisições de API.
  - Implementar a lógica de validação de token e encaminhamento para os serviços/módulos corretos.
  - Garantir que o gateway force a validação de `loja_id` em todas as chamadas.

---

## Fase 2: Módulos Essenciais de Operação

Com a base pronta, o foco agora é entregar o valor principal do sistema: a capacidade de orçar e gerenciar clientes.

- **[ ] Tarefa 2.1: Módulo de CRM Básico (CRUD de Clientes)**
  - API e interface para cadastrar e gerenciar clientes (contato, endereço, histórico de interações).
  - Essencial para vincular orçamentos e pedidos.

- **[ ] Tarefa 2.2: Módulo de Cadastro de Insumos (CRUD)**
  - API e interface para gerenciar materiais, fornecedores e custos.

- **[ ] Tarefa 2.3: Módulo de Configurações da Loja**
  - API e interface para o administrador cadastrar:
    - **Upload de logo e dados para timbrado do orçamento.**
    - Custos de mão de obra (custo/hora por função).
    - Custos de máquinas (custo/hora por máquina).
    - Custos indiretos/fixos (aluguel, contas, etc.).
    - Parâmetros de negócio (margem de lucro, impostos).

- **[ ] Tarefa 2.4: Implementação do Motor de Cálculo de Orçamento**
  - Lógica de backend (conforme detalhado no documento `calculo-custos-orcamento.md`).
  - API que recebe os dados de um serviço e retorna o cálculo detalhado.

- **[ ] Tarefa 2.5: Módulo de Orçamento Rápido**
  - Interface para criar, salvar e gerenciar orçamentos, **vinculando-os a um cliente do CRM**.
  - Geração de um **link compartilhável, responsivo** e com data de validade para cada orçamento.
  - A página do orçamento deve ser profissional, com o **logo e timbrado da loja**.
  - A página deve permitir ao cliente **gerar um PDF** do orçamento e ser facilmente compartilhada via WhatsApp/e-mail.

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