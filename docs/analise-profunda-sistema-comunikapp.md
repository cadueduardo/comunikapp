# Análise Profunda do Sistema ComunikApp

Data do levantamento: 2026-06-02

Base analisada: repositório local `c:\Projects\comunikapp`

Escopo: backend NestJS, frontend Next.js, schema Prisma/MySQL, módulos, relações funcionais, integrações e pontos de atenção.

## 1. Visão Executiva

O ComunikApp é uma plataforma SaaS multi-tenant para empresas de comunicação visual. O sistema organiza a operação em torno de uma loja (`loja_id`) e conecta cadastro comercial, catálogo técnico, orçamentos, cálculo de custos, ordens de serviço, arte/aprovação, PCP, estoque, financeiro mínimo e home operacional.

A arquitetura real do código é um monorepo com:

- Backend em NestJS 11, TypeScript, Prisma e MySQL.
- Frontend em Next.js 15 App Router, React 19, TypeScript e Tailwind CSS.
- Banco MySQL modelado em `backend/prisma/schema.prisma`.
- Comunicação REST predominante, com WebSocket para cálculo V2, arte/aprovação e eventos operacionais.
- Autenticação JWT global por middleware.
- Isolamento multi-tenant aplicado por `loja_id` em praticamente todos os serviços.

O fluxo de negócio central é:

1. Loja e usuários autenticam no sistema.
2. Cadastros-base alimentam orçamento: clientes, insumos, tipos de material, fornecedores, máquinas, funções, serviços manuais, custos indiretos, setores produtivos e configurações da loja.
3. Orçamentos V2 usam o motor de cálculo para consolidar materiais, mão de obra, máquinas, serviços, custos indiretos, margem, impostos e preço final.
4. Orçamento aprovado pode gerar cobrança financeira e Ordem de Serviço.
5. OS herda dados do orçamento, materiais calculados e regras de validação.
6. Arte/aprovação versiona arquivos por OS/produto, abre links públicos para cliente, registra mensagens e libera arte para PCP.
7. PCP organiza OS/itens em workflows, setores, etapas, apontamentos e kanban.
8. Estoque controla itens, localizações, movimentações, lotes, transferências e sobras/aproveitamentos.
9. Home operacional resume onboarding, alertas, KPIs, fluxo de trabalho e visão financeira.

## 2. Estrutura do Repositório

Principais diretórios:

- `backend/`: API NestJS, Prisma, scripts de banco, testes e documentação OpenAPI.
- `frontend/`: aplicação Next.js, páginas, componentes, hooks e API Routes/proxies.
- `docs/`: documentação funcional e técnica acumulada do projeto.
- `deploy/`: configuração Nginx, CORS, fail2ban e deploy.
- `scripts/`: automações PowerShell e shell para setup/update/deploy.
- `backup/`, `backup-modulo-usuarios/`, `tmp/`, `temp-build/`: material auxiliar ou histórico.

Arquivos relevantes:

- `backend/src/app.module.ts`: composição dos módulos ativos.
- `backend/src/main.ts`: bootstrap, CORS, helmet, rate limit, static uploads, Swagger opcional e porta.
- `backend/prisma/schema.prisma`: fonte principal do modelo de banco.
- `frontend/src/app/(main)/layout.tsx`: shell autenticado, sidebar e navegação principal.
- `frontend/src/lib/api-client.ts`: cliente HTTP centralizado para módulos.
- `frontend/src/lib/api.ts`: cliente HTTP alternativo com tratamento de sessão expirada e proxies.
- `ecosystem.config.js`: provável configuração PM2.
- `deploy/nginx/*.conf`: configuração de proxy e CORS para produção.

## 3. Stack Técnica

Backend:

- NestJS 11.
- TypeScript 5.4.
- Prisma 6.19.3.
- MySQL via `DATABASE_URL`.
- Passport JWT e `@nestjs/jwt`.
- `class-validator` e `ValidationPipe` global.
- `helmet` e `express-rate-limit`.
- `@nestjs/schedule` para jobs, usado no financeiro.
- `@nestjs/websockets` e Socket.IO.
- `nodemailer` para e-mail.
- `sharp` para thumbnails/imagens.
- `dxf-parser` para anexos de geometria no orçamento.
- `exceljs` para importação/exportação.

Frontend:

- Next.js 15.5.18 com App Router e Turbopack em dev.
- React 19.
- Tailwind CSS 4.
- Radix UI, shadcn-like components, Tabler Icons, Lucide.
- React Hook Form e Zod.
- Socket.IO client.
- TipTap/Quill para editores/chat/mensagens.
- Sentry browser instalado.

Banco:

- MySQL.
- Prisma Client.
- Migrations em `backend/prisma/migrations`.
- Há uso misto de Prisma tipado e SQL raw, especialmente no estoque.

## 4. Bootstrap, Segurança e Infra HTTP

O backend sobe em `backend/src/main.ts`.

Configurações principais:

- Timezone padrão `America/Sao_Paulo`.
- Porta padrão `4000`.
- Host padrão:
  - Produção: `127.0.0.1`.
  - Desenvolvimento: `0.0.0.0`.
- `trust proxy = 1`, necessário atrás de Nginx.
- CORS controlado por `CORS_VIA_PROXY` e `CORS_ORIGINS`.
- Origins fixos incluem `https://comunikapp.com.br` e `https://www.comunikapp.com.br`.
- Headers CORS aceitos incluem `Authorization`, `x-loja-id`, `x-user-roles` e `x-internal-token`.
- `helmet` ativo, com CSP desligado em dev e `crossOriginResourcePolicy: cross-origin`.
- Rate limit de 1000 requisições por 15 minutos, ignorando `OPTIONS`.
- `ValidationPipe` global com `whitelist`, `forbidNonWhitelisted` e `transform`.
- Uploads servidos em `/uploads`, com bloqueio de SVG inline por `Content-Disposition: attachment`.
- `/uploads/arte` em produção só é servido se `SERVE_PUBLIC_ARTE_UPLOADS=true`.
- Swagger só ativa se `ENABLE_SWAGGER=true`.

## 5. Autenticação e Multi-Tenant

Autenticação:

- O `JwtGlobalMiddleware` é aplicado globalmente no `AppModule`.
- O middleware valida `Authorization: Bearer <token>`.
- Ao validar, injeta `req.user` com:
  - `sub`
  - `email`
  - `loja_id`
  - `funcao`
  - `nome_completo`
  - `loja.id`
- `AuthService` gera token com dados do usuário e loja.
- `AuthService.validateUser` confere `usuario.id`, `usuario.loja_id`, `status === ATIVO` e `email_verificado`.

Rotas públicas principais:

- Login e 2FA: `/lojas/login`, `/lojas/login/2fa`.
- Cadastro/verificação: `/lojas`, `/lojas/verificar-email`, `/lojas/reenviar-verificacao`.
- Plataforma/beta: `/platform/convites/validar`, `/platform/interesse-beta`.
- Usuários: redefinição de senha e primeiro acesso.
- Estoque health: `/api/estoque/health`.
- Orçamento público V2: `/orcamentos-v2/:id/publico`, `/orcamentos-v2/:id/publico/acao`, `/orcamentos-v2/:id/reenviar-codigo`.
- Arte pública: links, comentários/mensagens públicas e download público com token.
- Rotas de teste/debug em desenvolvimento.

Multi-tenancy:

- A loja é o tenant lógico.
- A maioria dos modelos tem `loja_id`, `lojaId` ou relação com `loja`.
- Controllers obtêm loja via decorators como `@GetLoja()` ou `@CurrentLojaId()`.
- Serviços filtram consultas por `loja_id`/`lojaId`.
- O estoque tem um mecanismo adicional que aceita headers `x-loja-id` e `x-user-roles`, além do JWT.

Permissões:

- Há modelo `perfil_acesso`, `perfil_permissao` e `usuario_perfil`.
- Há `ModuleActivationGuard` que consulta via SQL raw a tabela `loja_modulo` para ativação de módulos. Essa tabela é referenciada pelo guard, mas não aparece como modelo Prisma no schema principal analisado.
- Sidebar do frontend ainda usa regras simples por `user.funcao` em alguns casos, como visibilidade do financeiro para `ADMINISTRADOR` e `FINANCEIRO`.

## 6. Módulos Backend

### 6.1 AppModule

Arquivo: `backend/src/app.module.ts`.

Módulos ativos importados:

- `PrismaModule`
- `AuthModule`
- `LojasModule`
- `ClientesModule`
- `CategoriasModule`
- `FornecedoresModule`
- `InsumosModule`
- `NotificacoesModule`
- `EstoqueModule`
- `TiposMaterialModule`
- `ProdutosModule`
- `MaquinasModule`
- `FuncoesModule`
- `CustosIndiretosModule`
- `MailModule`
- `MensagensNegociacaoModule`
- `UsuariosModule`
- `WebsocketsModule`
- `ServicosManuaisModule`
- `OrcamentosV2Module`
- `MotorCalculoV2Module`
- `OSModule`
- `PCPModule`
- `ConfiguracoesModule`
- `ArteAprovacaoModule`
- `HomeOperacionalModule`
- `EstimativaTempoModule`
- `FinanceiroModule`
- `PlatformModule`

Observação: módulo de orçamento legado está explicitamente desabilitado; V2 é o fluxo ativo.

### 6.2 PrismaModule

Responsabilidade:

- Disponibilizar `PrismaService`.
- `PrismaService` estende `PrismaClient`.
- Conecta no banco no `onModuleInit`.

Relações:

- É base de quase todos os módulos.

### 6.3 AuthModule

Responsabilidade:

- Gerar JWT.
- Validar usuário autenticado.
- Gerar e validar challenge token para 2FA.
- Prover `JwtStrategy`, `JwtAuthGuard`, `TwoFactorService`.

Relações:

- Importa Prisma, Passport e JWT.
- Exporta AuthService, TwoFactorService, JwtAuthGuard e JwtModule.
- Usado por módulos CRUD e autenticação de WebSocket.

### 6.4 LojasModule

Controllers:

- `LojasController` em `/lojas`.

Services:

- `LojasService`.
- `PendingSignupService`.

Responsabilidade:

- Cadastro/onboarding de loja.
- Login.
- Login com 2FA.
- Verificação e reenvio de e-mail.
- Consulta de usuário atual (`/lojas/me`).
- Consulta/edição da loja atual.
- Upload de logo.
- Trial/configurações comerciais.

Relações:

- Loja é raiz de tenant.
- Cria usuário inicial da loja.
- Usa MailModule para verificação e comunicação.
- Usa AuthModule para token.
- Pode usar convite de plataforma durante cadastro.

### 6.5 UsuariosModule

Controllers:

- `/usuarios`.
- `/usuarios/perfis`.

Services:

- `UsuariosService`.
- `PerfisAcessoService`.

Responsabilidade:

- CRUD de usuários da loja.
- Ativação/desativação.
- Primeiro acesso/definição de senha.
- Reenvio de código.
- Solicitação e confirmação de redefinição de senha.
- Setup, confirmação e desativação de 2FA.
- Perfis de acesso e associação usuário-perfil.

Tabelas:

- `usuario`.
- `password_reset_token`.
- `perfil_acesso`.
- `perfil_permissao`.
- `usuario_perfil`.

Relações:

- Usuário pertence a loja.
- Usuário é autor/aprovador/liberador em arte.
- Usuário registra recebimentos financeiros.
- Usuário pode operar PCP e apontamentos.

### 6.6 PlatformModule

Controller:

- `/platform`.

Services/guards:

- `PlatformService`.
- `PlatformAdminGuard`.

Responsabilidade:

- Administração de plataforma.
- Convites de cadastro.
- Interesse beta.
- Feedback beta.

Tabelas:

- `convites_cadastro`.
- Relações com loja/usuário convidado.

Relações:

- Importa Auth, Mail, Prisma e Lojas.
- Alimenta fluxo de cadastro por convite.

### 6.7 ClientesModule

Controller:

- `/clientes`.

Service:

- `ClientesService`.

Responsabilidade:

- CRUD de clientes.
- Busca por texto.
- Dados de pessoa física/jurídica, contato, endereço, origem e segmento.

Tabela:

- `cliente`.

Relações:

- Cliente pertence à loja.
- Cliente tem orçamentos.
- Cliente tem ordens de serviço.
- Cliente pode ter cobranças financeiras.

### 6.8 CategoriasModule

Controller:

- `/categorias`.

Responsabilidade:

- CRUD de categorias de insumos.

Tabela:

- `categorias`.

Relações:

- Categoria pertence à loja.
- Categoria classifica `Insumo`.

### 6.9 FornecedoresModule

Controller:

- `/fornecedores`.

Responsabilidade:

- CRUD de fornecedores.

Tabela:

- `fornecedor`.

Relações:

- Fornecedor pertence à loja.
- Fornecedor se relaciona com insumos.

### 6.10 TiposMaterialModule

Controller:

- `/tipos-material`.

Responsabilidade:

- CRUD de tipos de material.
- Lógica padrão de consumo.
- Correções específicas como `corrigir-ilhos`.

Tabela:

- `tipomaterial`.

Relações:

- Tipo de material pertence à loja.
- Tipo de material se relaciona com insumos.
- Influencia cálculo de consumo, materiais, estoque e orçamento.

### 6.11 InsumosModule

Controller:

- `/insumos`.

Responsabilidade:

- CRUD de insumos.
- Importação via planilha.
- Download de template.
- Simulação de chapa.
- Configuração de consumo, dimensões comerciais, unidade de compra/uso, controle de estoque e sobras.

Tabelas:

- `insumos`.
- `historico_preco_insumos`.
- Relações com `categorias`, `fornecedor`, `tipomaterial`.

Campos importantes:

- `custo_unitario`.
- `unidade_compra`, `unidade_uso`, `fator_conversao`.
- `logica_consumo`.
- `parametros_consumo`.
- `formato_material`.
- `largura_comercial`, `altura_comercial`, `comprimento_comercial`, `area_comercial`.
- `perda_padrao_percent`.
- `permite_simulacao_chapa`.
- `controla_estoque`.
- `permite_registrar_sobra`.
- `retalho_min_*`.
- `metodo_cobranca_padrao`.

Relações:

- É insumo de orçamento, produto template e estoque.
- Pode ser base de cálculo de chapa e sobras.
- Pode ser controlado ou não pelo estoque.

### 6.12 ProdutosModule

Controller:

- `/produtos`.

Responsabilidade:

- Templates/produtos reutilizáveis.
- CRUD de `TemplateProduto`.
- Cálculo de produto.
- Carregar produto para orçamento.

Tabelas:

- `template_produtos`.
- `item_template_produtos`.
- `maquina_template_produtos`.
- `funcao_template_produtos`.

Relações:

- Produto template pertence à loja.
- Produto template usa insumos, máquinas e funções.
- Orçamento V2 pode reaproveitar dados de produto.

### 6.13 MaquinasModule

Controller:

- `/maquinas`.

Responsabilidade:

- CRUD de máquinas.
- Busca por tipo.
- Custos/hora, status, capacidade, setor, modos de impressão e velocidades.

Tabelas:

- `maquina`.
- `historico_custo_maquinas`.
- `modo_impressao`.

Relações:

- Máquina pertence à loja.
- Pode pertencer a setor produtivo.
- Usada em orçamentos, produtos template, estimativa de tempo e PCP.

### 6.14 FuncoesModule

Controller:

- `/funcoes`.

Responsabilidade:

- CRUD de funções/mão de obra.
- Custo/hora e tipo de cálculo.
- Associação opcional a máquina e setor.

Tabelas:

- `funcao`.
- `historico_custo_funcoes`.

Relações:

- Usada em orçamento, produto template e custos de produção.

### 6.15 ServicosManuaisModule

Controller:

- `/servicos-manuais`.

Responsabilidade:

- Serviços manuais que entram no orçamento como custo de produção.
- Custo/hora, setor e tipo de cálculo.

Tabela:

- `servico_manual`.

Relações:

- Item de `ProdutoOrcamento`.
- Associável a setor produtivo.

### 6.16 CustosIndiretosModule

Controller:

- `/custos-indiretos`.

Responsabilidade:

- CRUD de custos indiretos.
- Valor mensal, categoria, regra de rateio e vínculo opcional com setor.

Tabela:

- `custoindireto`.

Relações:

- Usado pelo motor de cálculo.
- Pode ser rateado geral ou por setor.
- Relaciona-se com `ItemCustoIndireto` no orçamento.

### 6.17 ConfiguracoesModule

Controllers:

- `/configuracoes/parametros`.
- `/configuracoes/validacoes-automaticas`.
- `/configuracoes/regras-validacao`.
- `/configuracoes/campos-validacao`.
- `/centros-de-trabalho/setores-produtivos`.
- Rotas de teste em ambiente não produção.

Services:

- `ParametrosService`.
- `ValidacoesAutomaticasService`.
- `RegrasValidacaoService`.
- `ExecucaoRegraService`.
- `SetoresProdutivosService`.

Responsabilidade:

- Parâmetros da loja.
- Regras configuráveis de validação.
- Execução e histórico de validações.
- Campos disponíveis para validação.
- Centros de trabalho/setores produtivos.

Tabelas:

- `regras_validacao`.
- `execucoes_regras`.
- `setores_produtivos`.

Relações:

- OS usa validações automáticas.
- PCP usa setores produtivos.
- Máquinas, funções, serviços e custos indiretos podem pertencer a setores.

### 6.18 MotorCalculoV2Module

Controller:

- `/motor-calculo-v2`.

Endpoints principais:

- `POST /calcular`.
- `POST /calcular/simplificado`.
- `POST /preview`.
- `POST /validar`.
- `GET /estatisticas`.
- `GET /health`.

Services:

- `MotorCalculoV2Service`.
- `BusinessRulesEngineService`.
- `PipelineExecutorService`.
- `RateioCustosIndiretosService`.
- `EventProducerService`.
- `InputIntegrationService`.
- `CalculoWebSocketGateway`.

Responsabilidade:

- Fonte de cálculo de custos e preço de orçamento V2.
- Validação de input.
- Pipeline de cálculo.
- Aplicação de regras de negócio.
- Rateio de custos indiretos.
- Eventos e preview via WebSocket.

Relações:

- Usado por `OrcamentosV2Module`.
- Usado indiretamente por formulário de orçamento no frontend.
- Alimenta preço final, custo total, margem, impostos e itens calculados.

### 6.19 OrcamentosV2Module

Controllers:

- `/orcamentos-v2`.
- `/orcamentos-v2/calculo`.
- `/orcamentos-v2/chat`.
- `/orcamentos-v2/links`.
- `/orcamentos-v2/impressao`.
- `/orcamentos-v2/produto`.
- `/orcamentos-v2/anexos-geometria`.

Services:

- `OrcamentosV2Service`.
- `IntegracaoMotorService`.
- `ValidacaoV2Service`.
- `TransformacaoV2Service`.
- `NotificacaoV2Service`.
- `ChatV2Service`.
- `LinksV2Service`.
- `ImpressaoV2Service`.
- `ValidacaoEstoqueService`.
- `InsumosAutocompleteService`.
- `AnexoGeometriaService`.
- `DxfParserService`.
- `DxfSugestaoInsumoService`.
- `OrcamentoOrigemSobraService`.

Repositories:

- `OrcamentosV2Repository`.
- `ProdutosV2Repository`.

Responsabilidade:

- CRUD de orçamento V2.
- Duplicação.
- Rascunho.
- Cálculo e recálculo.
- Envio para aprovação.
- Aprovação/rejeição.
- Fechamento de pedido.
- Geração de OS.
- Criação de cobrança financeira após aprovação.
- Mensagens/chat de negociação.
- Links públicos.
- Versões/histórico.
- Impressão/relatórios.
- Anexos de geometria e parsing DXF.
- Sugestão de insumos baseada em geometria.
- Busca de origem/candidatos de sobra.

Tabelas principais:

- `orcamento`.
- `ProdutoOrcamento`.
- `ItemInsumo`.
- `ItemMaquina`.
- `ItemFuncao`.
- `ItemServicoManual`.
- `ItemCustoIndireto`.
- `HistoricoOrcamento`.
- `VersaoOrcamento`.
- `MensagemChat`.
- `LinkPublico`.
- `AcessoLink`.
- `aprovacaoOrcamento`.
- `orcamento_historico`.
- `orcamento_logs`.

Relações:

- Orçamento pertence à loja e cliente.
- Orçamento tem produtos.
- Produto de orçamento tem materiais, máquinas, funções, serviços manuais e custos indiretos.
- Orçamento pode gerar OS via `OSService`.
- Orçamento aprovado gera cobrança via `CobrancasService`.
- Orçamento dispara notificações e e-mails.
- Orçamento pode consumir estoque para validação e origem de sobras.

Fluxo real de criação:

1. Valida dados de entrada.
2. Prepara dados para persistência.
3. Gera número com `DocumentCodeService`.
4. Cria orçamento e produtos.
5. Calcula via motor V2 quando aplicável.
6. Persiste custos calculados.
7. Cria histórico.
8. Notifica criação.
9. Retorna orçamento formatado.

### 6.20 MensagensNegociacaoModule

Controller:

- `/orcamentos/:orcamentoId/mensagens`.

Responsabilidade:

- Mensagens de negociação associadas ao orçamento.
- Mensagens públicas e autenticadas.
- Anexos.
- Marcação de visualização.

Tabelas:

- `mensagemnegociacao`.
- `anexomensagem`.

Relações:

- Conecta orçamento e notificação.
- WebSocket está referenciado, mas no serviço há trechos indicando notificação WebSocket desabilitada em algumas rotas.

### 6.21 NotificacoesModule

Controller:

- `/notificacoes`.

Responsabilidade:

- Criar/listar notificações.
- Contar não visualizadas.
- Marcar individualmente ou todas como visualizadas.
- Deletar.

Tabela:

- `notificacao`.

Relações:

- Usado por orçamentos, mensagens, arte e potencialmente PCP/OS.

### 6.22 DocumentosModule

Controller:

- `/documentos`.

Responsabilidade:

- Sequenciamento e validação de códigos.
- Geração de números para OS e orçamento.
- Estatísticas e próximo número.

Tabela:

- `document_sequences`.

Relações:

- `OrcamentosV2Service` usa para número de orçamento.
- `OSService` usa para número de OS.

### 6.23 OSModule

Controllers:

- `/os`.
- `/os/workflows`.
- `/os/workflow`.
- `/os/validacoes`.
- `/os/calculo-material`.
- `/os/centro-custo`.
- `/os/aprovacao-alcada`.
- `/os/alcadas-orcamento`.
- `/os/prazo`.
- `/os/produtos`.
- `/os/admin`.
- Rotas de debug/teste em dev.

Services:

- `OSService`.
- `ImpressaoOSService`.
- `WorkflowService`.
- `AprovacaoAlcadaService`.
- `WorkflowInstanciaService`.
- `EstoqueApontamentoService`.
- `AprovacaoTecnicaService`.
- `AlcadasOrcamentoService`.
- `CentroCustoService`.
- `ValidacaoEstoqueService`.
- `EventosAutomaticosService`.
- `OSApprovalPermissionsService`.
- `OSValidacoesService`.
- `CalculoMaterialUnidadeService`.
- `OSPrazoService`.
- `OSProdutoPrazoService`.
- `OSAdminService`.
- `CorrecaoMateriaisHelper`.

Responsabilidade:

- CRUD de Ordem de Serviço.
- Criação direta comercial ou interna.
- Criação a partir de orçamento.
- Aprovação técnica.
- Aprovação gerencial/orçamentária.
- Agendamento de instalação.
- Impressão da OS.
- Movimentação de etapas.
- Materiais por OS e por item.
- Decisão sobre sobras: ignorar, anotar ou registrar.
- Validações automáticas.
- Integração com PCP.
- Prazos por OS e por produto.
- Alçadas e centro de custo.
- Recuperação administrativa de status.

Tabelas:

- `ordens_servico`.
- `itens_os`.
- `movimentacoes_os`.
- `checklists_os`.
- `ordem_servico_logs`.
- `execucoes_regras`.
- `workflows_os`.
- `workflow_instancia`.
- `etapa_instancia`.
- `checklist_instancia`.
- `apontamento`.

Relações:

- OS pertence à loja e cliente.
- OS pode ter orçamento vinculado.
- OS tem itens.
- OS tem workflow e movimentações.
- OS tem artes e mensagens de arte.
- OS tem apontamentos PCP.
- OS é destino de sobras/aproveitamentos.

Fluxo real de criação:

1. Gera número sequencial.
2. Valida dados.
3. Valida estoque sem bloquear criação.
4. Define status inicial conforme tipo:
   - Comercial: aprovação técnica.
   - Interna: aprovação orçamentária.
   - Padrão: fila.
5. Serializa materiais/insumos calculados.
6. Persiste OS.
7. Registra movimentação inicial.
8. Executa regras automáticas de validação.
9. Retorna OS formatada com alertas de estoque.

### 6.24 PCPModule

Controllers:

- `/pcp`.
- `/pcp/workflows`.
- `/pcp/workflow-templates`.
- `/pcp/setores-produtivos`.
- `/pcp/etapas`.
- `/pcp/apontamentos`.
- `/pcp/notificacoes`.
- `/pcp/kanban`.
- `/pcp/configuracao`.
- `/pcp/capacidade`.
- `/pcp/relatorios`.

Services:

- `WorkflowService`.
- `WorkflowAssignmentService`.
- `EtapaService`.
- `ApontamentoService`.
- `OSPCPIntegrationService`.
- `NotificacoesPCPService`.
- `PCPKanbanService`.
- `PCPConfiguracaoService`.
- `PCPDashboardService`.
- `PCPCapacidadeService`.
- `PCPRelatoriosService`.
- `ValidacaoEstoqueService`.

Responsabilidade:

- Templates e instâncias de workflow.
- Atribuição de workflow para OS.
- Setores produtivos.
- Etapas e checklists.
- Apontamentos de produção.
- Kanban geral, por setor e fila do operador.
- Iniciar, pausar, mover e concluir itens.
- Dashboard PCP.
- Capacidade de setores e máquinas.
- Relatórios de ocupação e previsto vs realizado.

Tabelas:

- `workflows_os`.
- `workflow_setores`.
- `workflow_categorias`.
- `workflow_categoria_regras`.
- `workflow_instancia`.
- `workflow_instancia_setor`.
- `etapa_instancia`.
- `checklist_instancia`.
- `apontamento`.
- `setores_produtivos`.
- `itens_os`.
- `ordens_servico`.

Relações:

- PCP consome OS e itens liberados.
- PCP usa setores do ConfiguracoesModule.
- PCP emite eventos por WebSocket.
- `OSPCPIntegrationService` atualiza status da OS para `EM_WORKFLOW`, `PAUSADA`, `FINALIZADA` ou `CANCELADA` conforme workflow.

### 6.25 ArteAprovacaoModule

Controllers:

- `/arte-aprovacao/versoes`.
- `/arte-aprovacao/versoes/:versaoId/arquivos`.
- `/arte-aprovacao/links`.
- `/arte-aprovacao/notificacoes`.
- `/arte-aprovacao/mensagens`.
- `/arte-aprovacao/mensagens/publico`.

Services:

- `ArteVersaoService`.
- `ArteArquivoService`.
- `ArteThumbnailService`.
- `ArteLinkAprovacaoService`.
- `ArteNotificacaoService`.
- `ArteMensagemService`.
- `ArteWebSocketGateway`.

Responsabilidade:

- Criar versões de arte por OS e opcionalmente por produto/serviço.
- Upload/download de arquivos.
- Geração de thumbnails.
- Soft delete e restore de versões.
- Link público para aprovação pelo cliente.
- Aprovação/revisão/rejeição.
- Aprovação múltipla.
- Mensagens internas e públicas por OS/produto/versão.
- Notificações por e-mail.
- WebSocket em namespace de arte.
- Liberação final da arte para PCP pelo designer.

Tabelas:

- `arte_versoes`.
- `arte_arquivos`.
- `arte_comentarios`.
- `arte_links_aprovacao`.
- `arte_mensagens`.

Relações:

- Arte pertence à OS.
- Arte pode apontar para produto/serviço pelo `servico_id`.
- Arte tem autor, aprovador, liberador e excluidor como usuários.
- Link público tem token, expiração, aprovação e comentário do cliente.
- Mensagem de arte se liga a OS, produto e opcionalmente versão.

Regra importante:

- `liberarParaPCP` exige que a arte tenha sido aprovada pelo cliente, ainda não esteja liberada e tenha arquivos associados.

### 6.26 EstoqueModule

Controllers:

- `/api/estoque/health`.
- `/api/estoque/localizacoes`.
- `/api/estoque/itens`.
- `/api/estoque/movimentacoes`.
- `/api/estoque/relatorios`.
- `/api/estoque/lotes`.
- `/api/estoque/transferencias`.
- `/api/estoque/sobras`.

Services:

- `SobrasService`.
- `MovimentacoesService`.
- `LotesService`.
- `TransferenciasService`.
- `ItensEstoqueService`.
- `LocalizacoesService`.
- `DashboardEstoqueService`.
- `RelatoriosEstoqueService`.
- `EstoqueAccessGuard`.

Responsabilidade:

- Endereçamento hierárquico.
- Cadastro de itens de estoque.
- Movimentações de entrada, saída e ajuste.
- Relatórios de baixo estoque e vencimento.
- Lotes.
- Transferências entre localizações.
- Sobras/retalhos.
- Aproveitamento de sobras.
- Métricas de economia.

Tabelas:

- `estoque_localizacoes`.
- `estoque_itens`.
- `estoque_movimentacoes`.
- `estoque_lotes`.
- `estoque_transferencias`.
- `estoque_sobras`.
- `estoque_aproveitamentos`.
- Tabela legada `estoque`.

Ponto técnico importante:

- O módulo de estoque usa bastante SQL raw e introspecção de `information_schema` para tolerar variações de colunas (`insumoId` vs `insumo_id`, `unidadeMedida` vs `unidade_medida`, etc.).
- Isso indica histórico de migrações/compatibilidade e aumenta risco de divergência entre schema Prisma e banco real.

Relações:

- Estoque se liga a insumos.
- Movimentações podem referenciar orçamento.
- Sobras podem se ligar a OS, item de OS e insumo.
- OS pode registrar sobras geradas pelo material.
- Orçamento pode buscar origem/candidatos de sobra.

### 6.27 FinanceiroModule

Controller:

- `/financeiro`.

Endpoints principais:

- `GET /financeiro/cobrancas`.
- `GET /financeiro/cobrancas/export.csv`.
- `GET /financeiro/cobrancas/:id`.
- `POST /financeiro/cobrancas/:id/recebimentos`.
- `POST /financeiro/cobrancas/:id/cancelar`.

Services:

- `CobrancasService`.
- `ParcelasBuilderService`.
- `StatusRollupService`.
- `CobrancaVencimentoService`.
- `VencimentoCobrancasJob`.

Responsabilidade:

- Financeiro mínimo de recebíveis.
- Criar cobrança automaticamente quando orçamento é aprovado.
- Construir parcelas conforme condição de pagamento.
- Registrar recebimentos.
- Calcular status consolidado.
- Cancelar cobrança com auditoria.
- Exportar CSV.
- Job diário de vencimentos.

Tabelas:

- `cobrancas`.
- `cobranca_parcelas`.
- `cobranca_recebimentos`.
- `cobranca_logs`.

Relações:

- Cobrança é 1:1 com orçamento.
- Cobrança pertence à loja.
- Pode apontar para cliente.
- Recebimento pode apontar para usuário.
- Home operacional consome resumo financeiro.

Status:

- Cobrança: `PREVISTA`, `PARCIAL_PAGO`, `LIQUIDADO`, `VENCIDO`, `CANCELADA`.
- Parcela: `PREVISTO`, `PARCIAL_PAGO`, `LIQUIDADO`, `VENCIDO`, `CANCELADA`.

### 6.28 HomeOperacionalModule

Controller:

- `/home-operacional`.

Services:

- `OnboardingService`.
- `ConfiguracaoRecomendadaService`.
- `SystemStateService`.
- `FluxoTrabalhoService`.
- `HomeCacheService`.
- `AlertasOperacionaisService`.
- `KpiDashboardService`.
- `ResumoFinanceiroService`.

Responsabilidade:

- Onboarding operacional por loja.
- Aplicar configuração recomendada.
- Banner de estado do sistema.
- Fluxo de trabalho operacional.
- Alertas.
- KPIs.
- Resumo financeiro simples.
- Cache da home.

Tabela:

- `onboarding_operacional`.

Relações:

- Consome dados de orçamentos, OS, estoque, financeiro e configurações.
- Financeiro e orçamento invalidam cache em ações relevantes.

### 6.29 EstimativaTempoModule

Controller:

- `/estimativa-tempo`.

Services:

- `EstimativaTempoService`.
- `CompatibilidadeMaterialMaquinaService`.

Responsabilidade:

- Estimativa de tempo de máquina.
- Compatibilidade material-máquina.

Relações:

- Usa máquinas, materiais/tipos e parâmetros de produção.
- Complementa cálculo e planejamento.

### 6.30 WebsocketsModule

Providers:

- `WebsocketsGateway`.
- `WebsocketsService`.

Responsabilidade:

- Gateway geral Socket.IO.
- Rooms por loja.
- Emissão de eventos operacionais para tenants.

Relações:

- Usado por OS, PCP e mensagens.
- Arte e cálculo V2 têm gateways próprios.

### 6.31 MailModule

Provider:

- `MailService`.

Responsabilidade:

- Envio de e-mail via Nodemailer.
- Usado em cadastro, convites, arte/aprovação e orçamento.

## 7. Frontend

### 7.1 Estrutura

O frontend usa Next.js App Router:

- `frontend/src/app/(main)`: área autenticada.
- `frontend/src/app/api`: API Routes/proxies.
- `frontend/src/app/login`, `cadastro`, `primeiro-acesso`, `esqueci-senha`, `redefinir-senha`: autenticação e acesso.
- `frontend/src/app/orcamento-v2/[id]`: orçamento público/externo.
- `frontend/src/app/arte/aprovacao/[token]`: aprovação pública de arte.

Principais diretórios de componentes:

- `brand`.
- `chat`.
- `clientes`.
- `configuracoes`.
- `crud`.
- `data-table`.
- `feedback`.
- `financeiro`.
- `forms`.
- `home-operacional`.
- `layout`.
- `orcamentos-v2`.
- `os`.
- `pcp`.
- `providers`.
- `theme`.
- `ui`.

### 7.2 Layout Autenticado

Arquivo: `frontend/src/app/(main)/layout.tsx`.

Responsabilidade:

- Verificar usuário via `UserContext`.
- Redirecionar para `/login` se não autenticado.
- Renderizar shell com sidebar e header.
- Gerenciar lembrete de 2FA.
- Exibir botão de feedback beta.

Navegação principal:

- Dashboard.
- Orçamentos.
- Clientes.
- Insumos.
- Estoque.
- Produtos.
- Ordens de Serviço.
- Financeiro, se função for `ADMINISTRADOR` ou `FINANCEIRO`.
- PCP.
- Centros de Trabalho.
- Usuários.
- Configurações.

### 7.3 UserContext

Arquivo: `frontend/src/contexts/UserContext.tsx`.

Responsabilidade:

- Guardar usuário atual.
- Buscar `/lojas/me`.
- Persistir `access_token`.
- Persistir `loja_id`, `user_roles`, `user_id` no localStorage.
- Logout.
- Reautenticação quando evento `session-expired` é disparado.

Ponto de atenção:

- O token fica em `localStorage`, o que é simples, mas aumenta exposição a XSS. Não há evidência de cookie HttpOnly para sessão principal.

### 7.4 Clientes HTTP

`frontend/src/lib/api-client.ts`:

- Usa `buildApiUrl`.
- Métodos estáticos `get`, `post`, `put`, `patch`, `delete`.
- Recebe token explicitamente.
- Centraliza helpers por domínio: `categoriasApi`, `fornecedoresApi`, `lojasApi`, `platformApi`, `insumosApi`, `estoqueApi`, `produtosApi`, `orcamentosApi`, `osApi`, `pcpApi`, `clientesApi`, `maquinasApi`, `funcoesApi`, `custosIndiretosApi`, `servicosManuaisApi`, `tiposMaterialApi`, `usuariosApi`.

`frontend/src/lib/api.ts`:

- Usa token do localStorage automaticamente.
- Dispara evento `session-expired` em 401.
- Envia `x-loja-id` e `x-user-roles` para endpoints de estoque.
- Tem `apiRequestServer` para Route Handlers.

`frontend/src/lib/config.ts`:

- `buildApiUrl` usa `NEXT_PUBLIC_API_URL`/`ENV_CONFIG.API_URL`.
- No server-side, se base URL for relativa, cai para `BACKEND_URL` ou `http://localhost:4000`.

### 7.5 Rotas de UI por Módulo

Área autenticada:

- `/dashboard`: home operacional/dashboard.
- `/clientes`: lista.
- `/clientes/novo`, `/clientes/editar/[id]`, `/clientes/[id]`.
- `/insumos`: lista.
- `/insumos/novo`, `/insumos/editar/[id]`.
- `/produtos`, `/produtos/novo`, `/produtos/[id]/editar`.
- `/orcamentos-v2`: lista.
- `/orcamentos-v2/novo`: criação/edição por query/id.
- `/orcamentos-v2/simulador`.
- `/os`: lista.
- `/os/novo`, `/os/[id]`, `/os/[id]/imprimir`.
- `/pcp`: dashboard.
- `/pcp/kanban`.
- `/pcp/meu-setor`.
- `/pcp/workflows`, `/pcp/workflows/novo`, `/pcp/workflows/[id]`, `/pcp/workflows/[id]/editar`.
- `/pcp/etapas`.
- `/pcp/apontamentos`.
- `/pcp/relatorios`.
- `/pcp/configuracao`.
- `/estoque`: dashboard.
- `/estoque/itens`, novo/editar.
- `/estoque/localizacoes`, novo/editar.
- `/estoque/lotes`, novo/editar/detalhe.
- `/estoque/movimentacoes`, entrada/saida/ajuste.
- `/estoque/sobras`, novo/editar/detalhe.
- `/estoque/transferencias`, nova.
- `/estoque/relatorios`.
- `/financeiro/recebimentos`.
- `/centros-de-trabalho`: visão central.
- `/centros-de-trabalho/setores-produtivos`.
- `/centros-de-trabalho/maquinas`.
- `/centros-de-trabalho/funcoes`.
- `/centros-de-trabalho/servicos`.
- `/centros-de-trabalho/custos-indiretos`.
- `/usuarios`, `/usuarios/gestao`, `/usuarios/perfis`.
- `/configuracoes`, categorias, fornecedores, tipos de material, máquinas, funções, custos indiretos, loja e validações automáticas.
- `/admin-plataforma/convites`.

Rotas públicas:

- `/`.
- `/login`.
- `/cadastro`, `/cadastro/verificar`.
- `/primeiro-acesso`.
- `/esqueci-senha`.
- `/redefinir-senha`.
- `/orcamento-v2/[id]`.
- `/arte/aprovacao/[token]`.
- `/arte/aprovacao/sucesso`.
- `/beta`.

Rotas de teste/debug:

- `/test-api`, `/test-cep`, `/test-insumo`, `/test-login`, `/test-produtos`, `/chat-demo`, `/debug-logs`.

### 7.6 API Routes do Next

O frontend contém proxies/handlers para:

- Arte/aprovação: comentários, links, mensagens, notificações, versões, uploads.
- Centros de trabalho/setores produtivos.
- Configurações/regras/campos.
- Estoque: itens, localizações, lotes, movimentações, sobras, transferências.
- Fornecedores.
- Insumos.
- Lojas/login/me/verificação.
- Orçamento público V2.
- OS e validações.
- PCP: configuração, dashboard, kanban, workflows.
- Produtos.

Função prática:

- Compatibilizar chamadas do frontend, preservar URLs `/api/*` e encaminhar ao backend.
- Em alguns módulos, o frontend também chama diretamente o backend via `NEXT_PUBLIC_API_URL`.

## 8. Banco de Dados

### 8.1 Convenções

- Banco MySQL.
- IDs majoritariamente `String @id @default(cuid())`.
- Multi-tenancy por `loja_id` ou `lojaId`.
- Muitas tabelas usam `criado_em`/`atualizado_em`.
- Alguns modelos usam nomes legados em minúsculo (`loja`, `usuario`, `orcamento`), outros PascalCase (`Insumo`, `OrdemServico`, `ArteVersao`).
- Há `@@map` para algumas tabelas; outras usam o nome do modelo como tabela.
- Há enums Prisma para status, tipos e funções.

### 8.2 Modelos por Domínio

Tenant e usuários:

- `loja`
- `usuario`
- `PasswordResetToken`
- `ConviteCadastro`
- `perfil_acesso`
- `perfil_permissao`
- `usuario_perfil`

CRM:

- `cliente`

Catálogo e precificação:

- `Insumo`
- `Categoria`
- `fornecedor`
- `categoriaInsumo`
- `tipomaterial`
- `TemplateProduto`
- `ItemTemplateProduto`
- `MaquinaTemplateProduto`
- `FuncaoTemplateProduto`
- `maquina`
- `modo_impressao`
- `funcao`
- `servico_manual`
- `custoindireto`
- `HistoricoPrecoInsumo`
- `HistoricoCustoMaquina`
- `HistoricoCustoFuncao`

Orçamentos:

- `orcamento`
- `ProdutoOrcamento`
- `ItemInsumo`
- `ItemMaquina`
- `ItemFuncao`
- `ItemServicoManual`
- `ItemCustoIndireto`
- `funcaoorcamento`
- `maquinaorcamento`
- `itemorcamento`
- `aprovacaoOrcamento`
- `HistoricoOrcamento`
- `VersaoOrcamento`
- `OrcamentoHistorico`
- `OrcamentoLog`
- `MensagemChat`
- `LinkPublico`
- `AcessoLink`
- `mensagemnegociacao`
- `anexomensagem`
- `notificacao`

Financeiro:

- `Cobranca`
- `CobrancaParcela`
- `CobrancaRecebimento`
- `CobrancaLog`

Documentos:

- `document_sequence`

OS:

- `OrdemServico`
- `ItemOS`
- `MovimentacaoOS`
- `ChecklistOS`
- `OrdemServicoLog`

Workflow e PCP:

- `WorkflowOS`
- `WorkflowSetor`
- `WorkflowCategoria`
- `WorkflowCategoriaRegra`
- `WorkflowInstancia`
- `WorkflowInstanciaSetor`
- `EtapaInstancia`
- `ChecklistInstancia`
- `Apontamento`
- `SetorProdutivo`

Estoque:

- `estoque`
- `estoque_localizacoes`
- `estoque_itens`
- `estoque_movimentacoes`
- `estoque_lotes`
- `estoque_transferencias`
- `estoque_sobras`
- `estoque_aproveitamentos`

Arte/aprovação:

- `ArteVersao`
- `ArteArquivo`
- `ArteComentario`
- `ArteLinkAprovacao`
- `ArteMensagem`

Configurações e home:

- `RegraValidacao`
- `ExecucaoRegra`
- `OnboardingOperacional`

### 8.3 Relações Principais

Loja:

- `loja` é raiz de tenant.
- Relaciona-se com clientes, usuários, insumos, categorias, fornecedores, máquinas, funções, serviços, custos indiretos, orçamentos, OS, estoque, perfis, workflows, setores, arte e financeiro.

Cliente:

- `cliente.loja_id -> loja.id`.
- `cliente` tem muitos `orcamento`.
- `cliente` tem muitas `OrdemServico`.
- `cliente` pode ter muitas `Cobranca`.

Orçamento:

- `orcamento.loja_id -> loja.id`.
- `orcamento.cliente_id -> cliente.id`.
- `orcamento` tem muitos `ProdutoOrcamento`.
- `orcamento` tem histórico, versões, mensagens, links, aprovações e logs.
- `orcamento` tem uma `Cobranca` por `orcamento_id @unique`.
- `orcamento` pode ter muitas `OrdemServico` associadas.

Produto de orçamento:

- `ProdutoOrcamento.orcamento_id -> orcamento.id`.
- Tem `ItemInsumo`, `ItemMaquina`, `ItemFuncao`, `ItemServicoManual`, `ItemCustoIndireto`.
- Pode carregar geometria: largura, altura, profundidade, área, perímetro, unidade, origem e arquivo.

Insumo:

- `Insumo.loja_id -> loja.id`.
- `Insumo.categoriaId -> Categoria.id`.
- `Insumo.fornecedorId -> fornecedor.id`.
- `Insumo.tipoMaterialId -> tipomaterial.id`.
- Usado em orçamento, template de produto e estoque.

OS:

- `OrdemServico.loja_id -> loja.id`.
- `OrdemServico.cliente_id -> cliente.id`.
- `OrdemServico.orcamento_id -> orcamento.id` opcional.
- Tem `ItemOS`.
- Tem `WorkflowInstancia` 1:1.
- Tem `MovimentacaoOS`, `ChecklistOS`, `Apontamento`, `OrdemServicoLog`.
- Tem `ArteVersao` e `ArteMensagem`.

PCP:

- `WorkflowOS.loja_id -> loja.id`.
- `WorkflowInstancia.os_id -> OrdemServico.id`.
- `WorkflowInstancia.workflow_id -> WorkflowOS.id`.
- `EtapaInstancia.workflow_instancia_id -> WorkflowInstancia.id`.
- `WorkflowInstanciaSetor.workflow_instancia_id -> WorkflowInstancia.id`.
- `WorkflowInstanciaSetor.setor_id -> SetorProdutivo.id`.
- `WorkflowInstanciaSetor.item_os_id -> ItemOS.id` opcional.
- `WorkflowInstanciaSetor.operador_id -> usuario.id` opcional.
- `Apontamento.os_id -> OrdemServico.id`.
- `Apontamento.etapa_instancia_id -> EtapaInstancia.id` opcional.

Arte:

- `ArteVersao.os_id -> OrdemServico.id`.
- `ArteVersao.autor_id/aprovado_por/liberado_por/excluido_por -> usuario.id`.
- `ArteArquivo.versao_id -> ArteVersao.id`.
- `ArteComentario.versao_id -> ArteVersao.id`.
- `ArteComentario.usuario_id -> usuario.id`.
- `ArteLinkAprovacao.versao_id -> ArteVersao.id`.
- `ArteMensagem.os_id -> OrdemServico.id`.
- `ArteMensagem.versao_id -> ArteVersao.id` opcional.

Estoque:

- `estoque_itens.insumoId -> Insumo.id` na intenção funcional.
- `estoque_itens.localizacaoId -> estoque_localizacoes.id`.
- `estoque_movimentacoes.estoqueId -> estoque_itens.id`.
- `estoque_lotes.estoqueId -> estoque_itens.id`.
- `estoque_transferencias.estoqueId -> estoque_itens.id`.
- Sobras se ligam a insumo, estoque, OS e item de OS conforme campos.

Financeiro:

- `Cobranca.loja_id -> loja.id`.
- `Cobranca.orcamento_id -> orcamento.id` com unicidade.
- `Cobranca.cliente_id -> cliente.id` opcional.
- `Cobranca` tem parcelas, recebimentos e logs.
- `CobrancaRecebimento.usuario_id -> usuario.id` opcional.

Validações:

- `RegraValidacao.loja_id -> loja.id`.
- `ExecucaoRegra.regra_id -> RegraValidacao.id`.
- `ExecucaoRegra.os_id -> OrdemServico.id` opcional.
- `ExecucaoRegra.orcamento_id -> orcamento.id` opcional.

## 9. Fluxos de Negócio Integrados

### 9.1 Cadastro da Loja e Acesso

1. Usuário cria loja por `/lojas`.
2. Sistema cria loja e usuário inicial.
3. Verificação de e-mail é exigida.
4. Login em `/lojas/login`.
5. Se 2FA estiver ativo, retorna challenge e exige `/lojas/login/2fa`.
6. JWT passa a carregar `loja_id`.
7. Frontend persiste token e dados básicos no localStorage.

### 9.2 Configuração Inicial

Cadastros necessários para operação:

- Clientes.
- Categorias.
- Fornecedores.
- Tipos de material.
- Insumos.
- Máquinas.
- Funções.
- Serviços manuais.
- Custos indiretos.
- Setores produtivos.
- Configurações da loja.
- Regras de validação.

A Home Operacional mostra onboarding e pode aplicar configurações recomendadas.

### 9.3 Orçamento V2

1. Usuário abre `/orcamentos-v2/novo`.
2. Frontend consulta catálogos e envia produtos, materiais e parâmetros.
3. Preview pode usar WebSocket `/calculo-v2` ou HTTP `/motor-calculo-v2/preview`.
4. `OrcamentosV2Service` valida e transforma dados.
5. `DocumentCodeService` gera número.
6. Prisma cria orçamento e produtos.
7. `IntegracaoMotorService` chama motor V2.
8. Custos calculados são persistidos.
9. Histórico e notificações são gerados.
10. Orçamento pode ser enviado para aprovação.

### 9.4 Aprovação do Orçamento e Pedido

Fluxos possíveis:

- Interno/autenticado: vendedor/usuário aprova ou fecha pedido.
- Público: cliente acessa link/código e aprova/rejeita/negocia.

Ao fechar pedido:

- Status de orçamento muda.
- Pode ser gerada OS.
- Financeiro cria cobrança e parcelas.
- Home operacional tem cache invalidado.
- Notificações são enviadas.

### 9.5 OS a partir de Orçamento

1. Orçamento aprovado é usado como origem.
2. OS herda cliente, produtos, materiais, geometria, valores e prioridade.
3. `OSService` gera número de OS.
4. Materiais calculados são serializados em JSON.
5. OS valida estoque e regras automáticas.
6. Itens de OS podem carregar dados por produto.
7. OS entra no fluxo de aprovação, fila ou workflow conforme tipo.

### 9.6 Arte e Aprovação

1. Designer cria `ArteVersao` para OS/produto.
2. Upload de arquivos cria `ArteArquivo` e thumbnail.
3. Link público é criado com token.
4. Cliente acessa `/arte/aprovacao/[token]`.
5. Cliente aprova ou solicita revisão.
6. Mensagens públicas e internas ficam em `ArteMensagem`.
7. WebSocket atualiza chat/notificações em tempo real.
8. Após aprovação do cliente, designer libera para PCP.

### 9.7 PCP

1. OS ou item é liberado para PCP.
2. PCP sugere ou atribui workflow.
3. Instância de workflow é criada.
4. Setores/etapas/checklists são criados.
5. Kanban lista itens por setor.
6. Operador inicia, pausa, move ou conclui item.
7. Apontamentos registram tempo, quantidade produzida e refugo.
8. Status da OS é atualizado por integração.
9. Relatórios consolidam capacidade, ocupação e previsto/realizado.

### 9.8 Estoque

1. Insumos com `controla_estoque` alimentam estoque.
2. Itens de estoque ficam em localizações.
3. Movimentações alteram saldo atual.
4. Lotes controlam validade/fabricação/status.
5. Transferências movem quantidade entre localizações.
6. OS pode registrar sobras.
7. Sobras podem ser aproveitadas em orçamento/OS futuros.

### 9.9 Financeiro

1. Orçamento aprovado chama `criarCobrancaParaOrcamento`.
2. Serviço de parcelas calcula entradas/saldos/parcelamento.
3. Cobrança, parcelas e log são criados em transação.
4. Tela `/financeiro/recebimentos` lista cobranças.
5. Recebimento atualiza parcela, cobrança e log.
6. Status rollup recalcula saldo, liquidação e vencimento.
7. Job diário recategoriza vencidas.

## 10. WebSockets

Gateways identificados:

- Geral: `backend/src/websockets`.
- Cálculo V2: namespace `/calculo-v2`.
- Arte/aprovação: namespace `/arte-aprovacao`.

Uso:

- Cálculo em tempo real no formulário de orçamento.
- Mensagens e contador de arte.
- Eventos por loja, como workflow iniciado.

Frontend:

- `use-calculo-websocket.ts`.
- `use-arte-websocket.ts`.
- `use-websocket.ts`, com fallback/polling para chat legado.

Ponto de atenção:

- Há serviços com comentários indicando WebSocket futuro ou temporariamente desabilitado. Nem todo evento prometido por comentários está necessariamente ativo.

## 11. Arquivos, Uploads e Mídia

Backend:

- Uploads servidos por `/uploads`.
- Arte usa `/uploads/arte` e pode ser bloqueada em produção.
- `sharp` gera thumbnails.
- Downloads públicos de arte exigem token query.
- SVGs recebem header para download/sandbox.

Frontend:

- Componentes de upload em arte/aprovação.
- Logos da marca em `frontend/public/brand`.

## 12. Observações de Qualidade e Riscos

### 12.1 Schema e SQL raw

O schema Prisma é grande e parcialmente legado. Há mistura de:

- Modelos PascalCase e minúsculos.
- `loja_id` e `lojaId`.
- Prisma tipado e SQL raw.
- Estoque com introspecção dinâmica de colunas.

Risco:

- Divergência entre banco real, migrations e Prisma.
- Refactors podem quebrar estoque se colunas reais diferirem do schema.

### 12.2 Guard de módulo sem modelo Prisma explícito

`ModuleActivationGuard` consulta `loja_modulo`, mas o modelo não aparece no schema analisado.

Risco:

- Ativação modular pode depender de tabela criada fora do Prisma.
- Migrações novas podem não preservar esse contrato.

### 12.3 Token em localStorage

Frontend guarda JWT em localStorage.

Risco:

- Maior exposição em caso de XSS.
- Uma estratégia com cookie HttpOnly reduziria exposição, mas exigiria ajuste de CORS/SSR/API Routes.

### 12.4 Codificação de texto

Há arquivos com caracteres mojibake em README e código, indicando histórico de encoding.

Risco:

- Documentos e mensagens podem renderizar incorretamente.
- Logs e strings de UI podem sair quebrados.

### 12.5 Módulos extensos

`OrcamentosV2Service` e `OSService` concentram muita regra, apesar de comentários citarem limite de linhas.

Risco:

- Alta complexidade para manutenção.
- Maior chance de efeitos colaterais ao ajustar cálculo, materiais ou status.

### 12.6 Estado real vs documentação

O repositório contém muita documentação de planos, handoffs e fases. Alguns módulos descritos em docs podem estar parcial ou totalmente implementados; este relatório prioriza código e schema atuais.

## 13. Mapa de Dependências Funcionais

Dependências principais:

- `Lojas` -> raiz de todos os módulos.
- `Usuarios/Auth` -> autenticação e autorização.
- `Clientes` -> orçamentos, OS e financeiro.
- `Insumos/Categorias/Fornecedores/TiposMaterial` -> orçamento, estoque e produtos.
- `Maquinas/Funcoes/ServicosManuais/CustosIndiretos` -> motor de cálculo e PCP.
- `MotorCalculoV2` -> orçamento.
- `OrcamentosV2` -> OS, financeiro, notificações, e-mail, documentos, estoque.
- `OS` -> PCP, arte, estoque, validações, documentos.
- `ArteAprovacao` -> OS, usuários, notificações, e-mail, WebSocket.
- `PCP` -> OS, setores produtivos, WebSocket.
- `Estoque` -> insumos, OS, orçamento.
- `Financeiro` -> orçamento, cliente, usuário, home operacional.
- `HomeOperacional` -> leitura agregada de vários módulos.

Diagrama textual:

```text
loja
  -> usuario/auth/perfis
  -> cliente
      -> orcamento
          -> produto_orcamento
              -> itens: insumo, maquina, funcao, servico_manual, custo_indireto
          -> motor_calculo_v2
          -> mensagem/chat/link/publico
          -> cobranca -> parcelas -> recebimentos/logs
          -> ordem_servico
              -> item_os
              -> validacoes/logs/movimentacoes
              -> arte_versao -> arquivos/links/mensagens
              -> workflow_instancia -> etapas/checklists/apontamentos
              -> workflow_instancia_setor -> setor_produtivo
              -> sobras/aproveitamentos
  -> estoque
      -> localizacoes
      -> itens -> movimentacoes/lotes/transferencias/sobras
  -> home_operacional
```

## 14. Inventário de Tabelas Principais

| Domínio | Tabelas/modelos |
|---|---|
| Tenant e acesso | `loja`, `usuario`, `password_reset_token`, `convites_cadastro`, `perfil_acesso`, `perfil_permissao`, `usuario_perfil` |
| CRM | `cliente` |
| Catálogo | `insumos`, `categorias`, `fornecedor`, `tipomaterial`, `categoriaInsumo` |
| Produto/template | `template_produtos`, `item_template_produtos`, `maquina_template_produtos`, `funcao_template_produtos` |
| Produção/custos | `maquina`, `modo_impressao`, `funcao`, `servico_manual`, `custoindireto`, históricos de custo |
| Orçamento | `orcamento`, `ProdutoOrcamento`, `ItemInsumo`, `ItemMaquina`, `ItemFuncao`, `ItemServicoManual`, `ItemCustoIndireto`, históricos, versões, links e mensagens |
| OS | `ordens_servico`, `itens_os`, `movimentacoes_os`, `checklists_os`, `ordem_servico_logs` |
| PCP/workflow | `workflows_os`, `workflow_setores`, `workflow_categorias`, `workflow_categoria_regras`, `workflow_instancia`, `workflow_instancia_setor`, `etapa_instancia`, `checklist_instancia`, `apontamento`, `setores_produtivos` |
| Arte | `arte_versoes`, `arte_arquivos`, `arte_comentarios`, `arte_links_aprovacao`, `arte_mensagens` |
| Estoque | `estoque`, `estoque_localizacoes`, `estoque_itens`, `estoque_movimentacoes`, `estoque_lotes`, `estoque_transferencias`, `estoque_sobras`, `estoque_aproveitamentos` |
| Financeiro | `cobrancas`, `cobranca_parcelas`, `cobranca_recebimentos`, `cobranca_logs` |
| Configuração | `regras_validacao`, `execucoes_regras`, `onboarding_operacional`, `document_sequences` |

## 15. Inventário de Rotas Backend por Domínio

Autenticação/lojas:

- `/lojas`
- `/lojas/login`
- `/lojas/login/2fa`
- `/lojas/verificar-email`
- `/lojas/reenviar-verificacao`
- `/lojas/me`
- `/lojas/minha-loja`
- `/lojas/logo`

Usuários:

- `/usuarios`
- `/usuarios/:id`
- `/usuarios/:id/desativar`
- `/usuarios/2fa/status`
- `/usuarios/2fa/setup`
- `/usuarios/2fa/confirm`
- `/usuarios/2fa/disable`
- `/usuarios/perfis`

Cadastros:

- `/clientes`
- `/clientes/search`
- `/categorias`
- `/fornecedores`
- `/insumos`
- `/insumos/importar`
- `/insumos/template`
- `/insumos/:id/calculo-chapa`
- `/insumos/:id/simular-chapa`
- `/tipos-material`
- `/produtos`
- `/produtos/calcular`
- `/produtos/:id/carregar-para-orcamento`
- `/maquinas`
- `/maquinas/tipo/:tipo`
- `/funcoes`
- `/servicos-manuais`
- `/custos-indiretos`

Configurações:

- `/configuracoes/parametros`
- `/configuracoes/validacoes-automaticas/dashboard`
- `/configuracoes/validacoes-automaticas/executar`
- `/configuracoes/regras-validacao`
- `/configuracoes/campos-validacao`
- `/centros-de-trabalho/setores-produtivos`

Orçamentos e cálculo:

- `/orcamentos-v2`
- `/orcamentos-v2/:id`
- `/orcamentos-v2/:id/status`
- `/orcamentos-v2/:id/calcular`
- `/orcamentos-v2/:id/validar-estoque`
- `/orcamentos-v2/:id/enviar`
- `/orcamentos-v2/:id/fechar-pedido`
- `/orcamentos-v2/:id/duplicar`
- `/orcamentos-v2/:id/publico`
- `/orcamentos-v2/:id/publico/acao`
- `/orcamentos-v2/:id/exportar/:formato`
- `/orcamentos-v2/chat/:orcamentoId/mensagens`
- `/orcamentos-v2/links`
- `/orcamentos-v2/impressao`
- `/orcamentos-v2/anexos-geometria`
- `/motor-calculo-v2/calcular`
- `/motor-calculo-v2/preview`
- `/motor-calculo-v2/validar`

OS:

- `/os`
- `/os/:id`
- `/os/:id/avancar-etapa`
- `/os/:id/imprimir`
- `/os/:id/materiais`
- `/os/:id/liberar-para-pcp`
- `/os/:id/retirar-do-pcp`
- `/os/:id/aprovar-tecnica`
- `/os/:id/agendar-instalacao`
- `/os/comercial`
- `/os/interna`
- `/os/workflows`
- `/os/workflow/instancia`
- `/os/validacoes/:id/executar`
- `/os/calculo-material/:id`
- `/os/prazo/:id`
- `/os/produtos/:osId/item/:itemId/definir-prazo`
- `/os/produtos/:osId/item/:itemId/liberar-pcp`
- `/os/admin/recuperar-status`

PCP:

- `/pcp/dashboard`
- `/pcp/kanban/geral`
- `/pcp/kanban/fila-setor/:setorId`
- `/pcp/kanban/por-setores`
- `/pcp/kanban/iniciar/:itemOsId`
- `/pcp/kanban/concluir/:itemOsId`
- `/pcp/kanban/pausar/:itemOsId`
- `/pcp/kanban/mover-setor/:itemOsId`
- `/pcp/configuracao`
- `/pcp/configuracao/aplicar-padrao`
- `/pcp/capacidade/setores`
- `/pcp/capacidade/maquinas`
- `/pcp/relatorios/ocupacao-maquinas`
- `/pcp/relatorios/previsto-realizado`
- `/pcp/workflows`
- `/pcp/workflow-templates`
- `/pcp/etapas`
- `/pcp/apontamentos`

Arte:

- `/arte-aprovacao/versoes`
- `/arte-aprovacao/versoes/os/:osId`
- `/arte-aprovacao/versoes/produto/:produtoId`
- `/arte-aprovacao/versoes/:id/aprovar`
- `/arte-aprovacao/versoes/:id/rejeitar`
- `/arte-aprovacao/versoes/aprovar-multiplas`
- `/arte-aprovacao/versoes/:id/liberar-para-pcp`
- `/arte-aprovacao/versoes/:versaoId/arquivos`
- `/arte-aprovacao/links`
- `/arte-aprovacao/links/public/:token`
- `/arte-aprovacao/links/public/:token/approve`
- `/arte-aprovacao/mensagens`
- `/arte-aprovacao/mensagens/publico/:token`
- `/arte-aprovacao/notificacoes/*`

Estoque:

- `/api/estoque/health`
- `/api/estoque/localizacoes`
- `/api/estoque/itens`
- `/api/estoque/movimentacoes`
- `/api/estoque/relatorios`
- `/api/estoque/lotes`
- `/api/estoque/transferencias`
- `/api/estoque/sobras`

Financeiro:

- `/financeiro/cobrancas`
- `/financeiro/cobrancas/export.csv`
- `/financeiro/cobrancas/:id`
- `/financeiro/cobrancas/:id/recebimentos`
- `/financeiro/cobrancas/:id/cancelar`

Home:

- `/home-operacional/onboarding`
- `/home-operacional/banner-estado`
- `/home-operacional/fluxo`
- `/home-operacional/alertas`
- `/home-operacional/kpis`
- `/home-operacional/resumo-financeiro`

## 16. Conclusão Técnica

O ComunikApp já opera como um sistema modular de gestão completo, com domínio central em orçamento/produção para comunicação visual. A base mais crítica está em quatro eixos:

- Orçamento V2 e Motor de Cálculo: definem custo, preço e materiais.
- OS: transforma venda em execução operacional.
- PCP: organiza execução por workflows, setores e apontamentos.
- Estoque/Financeiro: fecham controle físico e recebível.

As relações de banco e módulos mostram forte acoplamento funcional entre orçamento, OS, PCP, arte e estoque. Isso é coerente com o negócio, mas exige cuidado ao alterar qualquer contrato de materiais, produtos, status ou `loja_id`.

Os maiores pontos de atenção para evolução são:

- Reduzir uso de SQL raw no estoque ou documentar rigorosamente o contrato real das colunas.
- Normalizar nomes e padrões entre `loja_id` e `lojaId`.
- Formalizar tabela/modelo de ativação modular (`loja_modulo`) se ela continuar sendo contrato do sistema.
- Separar regras grandes de orçamento e OS em serviços menores por fluxo.
- Fortalecer permissões reais por perfil em vez de lógica por função no frontend.
- Avaliar sessão via cookie HttpOnly para reduzir risco do token em localStorage.
- Corrigir encoding/mojibake em arquivos e strings de UI/log.
