# Análise Profunda do Sistema ComunikApp

**Data do levantamento:** 2026-07-09
**Versão anterior:** 2026-06-26
**Base analisada:** repositório local `c:\Projects\comunikapp`

**Escopo:** backend NestJS, frontend Next.js, schema Prisma/MySQL, módulos, relações funcionais, integrações, fluxos operacionais e pontos de atenção.

**Schema SQL completo:** [`docs/comunikapp-schema-sql-completo.sql`](./comunikapp-schema-sql-completo.sql) — DDL gerado a partir do `schema.prisma` atual (90 models, ~2.700 linhas).

---

## Resumo das mudanças desde 2026-06-26

| Área | O que mudou |
|------|-------------|
| **Instalação (Fase 2)** | Módulo `InstalacaoModule`, tabelas de lotes (`itens_os_instalacao`), ocorrências (`ocorrencias_instalacao`), pós-cálculo e fechamento. Portal do Instalador móvel (`/instalador`) com fotos e assinaturas. |
| **Split Financeiro** | Fluxo de precificação de ocorrências pelo gestor e geração de **OS Aditiva** (filha) com orçamento sintético associado, sem poluir PCP/estoque. |
| **Relatório & Split Fiscal** | Geração de Relatório Técnico (`RelatorioTecnicoInstalacao`) em PDF e split fiscal (separação NFe/NFSe). |
| **Bloqueio no Grid & PCP** | Trava de liberação logística por pendências financeiras no grid de instalações. Novo status `BLOQUEADO_AGUARDANDO_SINAL` no PCP controlado por sinal de pagamento. |
| **Catálogo & Personalização** | Hub unificado `/catalogo` com processos de decoração (`ProcessoDecoracao`), descontos de faixas de preço (Quantity Breaks), estampas (`Estampa`) com metadados para VDP, conjuntos de campos variáveis (`CampoVariavelDef`) e motor VDP (PDF print-ready dinâmico). |
| **Fulfillment por item** | Campos de fulfillment (`FulfillmentPadrao`/`ModoFulfillmentItem`) e propagação de personalização do Orçamento V2 para `ItemOS`. |
| **Integração Google Drive** | Hub de conexões (`LojaConexao`) via Google OAuth para criação automática de pastas e sincronização de arquivos de arte e produção. |
| **Saneamento do Banco** | Drop de 4 tabelas órfãs (`historico_custo_maquinas`, `historico_custo_funcoes`, `anexomensagem`, `modo_impressao`). Remoção de ~46MB de schemas e clients Prisma duplicados. Correção de migrations e índices de FK. |
| **Segurança (Auditoria)** | Correção de vulnerabilidade crítica de vazamento do código de aprovação e de IDOR multi-tenant em 4 endpoints de transição de OS. |

---

## 1. Visão Executiva

O ComunikApp é uma plataforma SaaS **multi-tenant** para empresas de comunicação visual. O tenant lógico é a **loja** (`loja_id`). O sistema cobre o ciclo comercial e produtivo: cadastros, orçamento com motor de cálculo V2, aprovação, cobrança, ordem de serviço, arte, PCP, expedição, instalações físicas de campo, pós-cálculo financeiro, estoque e home operacional.

### Arquitetura

| Camada | Tecnologia |
|--------|------------|
| Backend | NestJS 11, TypeScript, Prisma 6.19.3, MySQL |
| Frontend | Next.js 15.5 App Router, React 19, Tailwind CSS 4 |
| Tempo real | Socket.IO (cálculo V2, arte, eventos operacionais) |
| Auth | JWT global via middleware; 2FA opcional |
| Deploy | Nginx + PM2 (ver `deploy/`, heap do build ajustável via `BUILD_MAX_OLD_SPACE_MB`) |

### Fluxo de negócio central (atualizado)

```text
Loja/usuários
  → Cadastros (clientes, insumos, máquinas, funções, templates, produtos finitos, processos, estampas)
  → Orçamento V2 (itens SOB_DEMANDA via motor ou PRODUTO_FINITO personalizável com campos/estampas)
  → Aprovação (interna ou link público) → Cobrança financeira (trava de sinal PCP)
  → OS (comercial/direta/interna; múltiplos itens; vínculo automático com pasta do Google Drive)
  → Arte por item (fila/kanban; link público cliente) — quando aplicável
  → Aprovação técnica / liberação PCP (total ou parcial por item)
  → PCP (workflows, setores, kanban, apontamentos; bloqueio de sinal financeiro)
  → Expedição (separação, entrega, assinatura; status AGUARDANDO_INSTALACAO se houver serviço em campo)
  → Instalação por Lotes (alocação forecast, equipe, execução móvel no /instalador com assinatura/fotos)
  │     └── Ocorrências de campo → Precificação gestor → OS Aditiva filha com Split Financeiro
  → Conclusão da Instalação → Expedição concluída (Entregue/Finalizado)
  → Estoque (movimentações, sobras, aproveitamentos)
  → Home operacional (KPIs, onboarding com Google Drive, alertas)
```

### Princípios operacionais

- **Multi-tenancy:** quase todo dado filtrado por `loja_id` com validações rígidas de escopo no backend (prevenção contra IDOR).
- **Orçamento V2 ativo;** módulo legado desabilitado no `AppModule`.
- **OS multi-item:** cada `ItemOS` pode ter prazos, geometria, arte, personalização e liberação PCP independentes.
- **Arte desacoplada da aba OS:** operação principal em `/arte` (fila + kanban).
- **Liberação PCP:** exclusivamente via fluxo de aprovação técnica da OS.
- **Fulfillment flexível:** itens de prateleira podem ser despachados direto (`PICK`) ou fabricados/personalizados (`MAKE`).
- **Isolamento de OS Aditiva:** OSs filhas de instalação herdam propriedades de faturamento mas pulam PCP, expedição e validação de estoque (`pular_pcp`, `pular_expedicao`, `pular_validacao_estoque = true`) para evitar poluição fabril.

---

## 2. Estrutura do Repositório

| Diretório | Conteúdo |
|-----------|----------|
| `backend/` | API NestJS, Prisma, migrations, testes, Swagger opcional |
| `frontend/` | Next.js App Router, componentes, hooks, proxies API |
| `docs/` | Documentação funcional/técnica (este arquivo, especificações, etc.) |
| `deploy/` | Nginx, CORS, fail2ban |
| `scripts/` | Automações setup/deploy |

**Arquivos-chave**

| Arquivo | Função |
|---------|--------|
| `backend/src/app.module.ts` | Composição dos módulos ativos |
| `backend/src/main.ts` | Bootstrap, CORS, helmet, rate limit, uploads |
| `backend/prisma/schema.prisma` | Modelo de dados (fonte da verdade) |
| `backend/prisma/migrations/` | Histórico incremental de migrations saneado |
| `docs/comunikapp-schema-sql-completo.sql` | DDL completo limpo para análise |
| `docs/database/boas-praticas-schema-prisma.md` | Guia de governança de banco e migrations |
| `frontend/src/app/(main)/layout.tsx` | Shell autenticado, sidebar, badges |
| `frontend/src/lib/api-client.ts` | Cliente HTTP centralizado |

---

## 3. Stack Técnica

### Backend

- NestJS 11, TypeScript 5.4, Prisma 6.19.3
- Passport JWT, `class-validator`, `ValidationPipe` global
- `helmet`, `express-rate-limit`, `@nestjs/schedule` (job financeiro)
- `nodemailer`, `sharp`, `dxf-parser`, `exceljs`, `pdf-lib`/`pdfkit` (geração de relatórios técnicos)

### Frontend

- Next.js 15.5.18, React 19, Tailwind 4
- Radix/shadcn, Tabler Icons, Framer Motion
- React Hook Form + Zod, Socket.IO client, TipTap

### Banco

- MySQL via `DATABASE_URL`
- 90 models Prisma; uso misto de Prisma tipado e SQL raw (estoque). Tabelas e migrations saneadas em 2026-07.

---

## 4. Bootstrap, Segurança e Infra HTTP

Arquivo: `backend/src/main.ts`

- Timezone `America/Sao_Paulo`; porta padrão `4000`
- `trust proxy = 1` (atrás de Nginx)
- CORS: `CORS_VIA_PROXY`, `CORS_ORIGINS`; origins de produção `comunikapp.com.br`
- Rate limit: 1000 req / 15 min (ignora `OPTIONS`)
- Uploads em `/uploads`; arte pública só com `SERVE_PUBLIC_ARTE_UPLOADS=true` em produção
- Swagger: `ENABLE_SWAGGER=true`

---

## 5. Autenticação e Multi-Tenant

### JWT global

`JwtGlobalMiddleware` em todas as rotas. Payload inclui `sub`, `email`, `loja_id`, `funcao`, `nome_completo`.

### Correções de Segurança (Auditoria 2026-07)

- **IDOR mitigado nas OS:** Endpoints de transição e agendamento de OS agora exigem validação explícita de `loja_id`.
- **Vazamento de Código de Aprovação corrigido:** Endpoint `reenviar-codigo` não devolve mais o código no payload HTTP da resposta, direcionando-o estritamente por e-mail.
- **Geração Segura de IDs:** Removido uso de `Math.random()` substituído pelo CUID nativo do Prisma.

### Rotas públicas (principais)

- Login/2FA: `/lojas/login`, `/lojas/login/2fa`
- Cadastro/verificação de loja
- Orçamento público V2
- Arte: links, mensagens e download com token
- Expedição: assinatura pública (quando configurada)
- Relatório técnico de instalação (visualização autenticada via token de PDF)

### Permissões

- Modelo: `perfil_acesso`, `perfil_permissao`, `usuario_perfil`
- `ModuleActivationGuard` consulta `loja_modulo` (tabela externa ao Prisma).
- Sidebar ainda usa regras por `usuario.funcao` em alguns módulos:
  - Financeiro: `ADMINISTRADOR`, `FINANCEIRO`
  - Expedição: `ADMINISTRADOR`, `PRODUCAO`, `ESTOQUE`
  - Instalação: `ADMINISTRADOR`, `PRODUCAO`, `ESTOQUE` (conforme permissões Sidebar)

---

## 6. Módulos Backend

### 6.1 AppModule — módulos ativos

Arquivo: `backend/src/app.module.ts`

```
PrismaModule, AuthModule, LojasModule, ClientesModule, CategoriasModule,
FornecedoresModule, InsumosModule, NotificacoesModule, EstoqueModule,
TiposMaterialModule, ProdutosModule, ProdutosFinitosModule, MaquinasModule,
FuncoesModule, CustosIndiretosModule, MailModule, MensagensNegociacaoModule,
UsuariosModule, WebsocketsModule, ServicosManuaisModule, OrcamentosV2Module,
MotorCalculoV2Module, OSModule, PCPModule, ConfiguracoesModule,
ArteAprovacaoModule, HomeOperacionalModule, EstimativaTempoModule,
FinanceiroModule, ExpedicaoModule, InstalacaoModule, CatalogoModule,
PlatformModule, ConexoesModule
```

**Desabilitado:** `OrcamentosModule` (legado).

### 6.2 Módulos por domínio

#### Comercial e cadastro

| Módulo | Responsabilidade |
|--------|------------------|
| `LojasModule` | Tenant, login, onboarding, logo, trial |
| `ClientesModule` | CRM |
| `CategoriasModule`, `FornecedoresModule`, `InsumosModule`, `TiposMaterialModule` | Catálogo de materiais |
| `ProdutosModule` | **Modelos de orçamento** (`TemplateProduto` e itens) |
| `CatalogoModule` | **Hub de Catálogo** (Produtos finitos, processos de decoração, estampas, conjuntos de campos, motor VDP) |
| `ProdutosFinitosModule` | CRUD de produtos de prateleira (vinculado ao catálogo) |
| `MaquinasModule`, `FuncoesModule`, `ServicosManuaisModule`, `CustosIndiretosModule` | Recursos de produção e custo |
| `OrcamentosV2Module` | Orçamentos multi-produto, personalização, grade, chat, links públicos, aprovação |
| `MotorCalculoV2Module` | Preview e cálculo de custos/preço |
| `FinanceiroModule` | Cobranças, parcelas, recebimentos, job de vencimento |

#### Produção e operação

| Módulo | Responsabilidade |
|--------|------------------|
| `OSModule` | Ordens de serviço (comercial, direta, interna), aprovação técnica, liberação PCP, OS aditiva |
| `ArteAprovacaoModule` | Versões, arquivos, links, fila, kanban, mensagens, config por loja |
| `PCPModule` | Workflows, instâncias, kanban, apontamentos, setores, bloqueio por sinal financeiro |
| `ExpedicaoModule` | Pós-produção: separação, entrega, rastreio, assinatura, devolução |
| `InstalacaoModule` | Pós-produção: lotes de instalação, agenda, equipe, ocorrências, split financeiro |
| `EstoqueModule` | Localizações, movimentações, lotes, transferências, sobras |
| `EstimativaTempoModule` | Tempo de máquina, compatibilidade material×máquina |

#### Suporte

| Módulo | Responsabilidade |
|--------|------------------|
| `AuthModule`, `UsuariosModule` | Autenticação, perfis, 2FA, preferências |
| `NotificacoesModule`, `MailModule`, `MensagensNegociacaoModule` | Comunicação |
| `WebsocketsModule` | Gateway geral + namespaces especializados |
| `ConfiguracoesModule` | Centros de trabalho, modalidades entrega, tipos instalação |
| `HomeOperacionalModule` | Dashboard operacional, onboarding (Google Drive) |
| `PlatformModule` | Convites beta, interesse plataforma |
| `ConexoesModule` | Integrações OAuth, Google Drive API |

### 6.3 ProdutosFinitosModule

- **Tabelas:** `CategoriaProdutoFinito`, `ProdutoFinito`, `GaleriaProdutoFinito`
- **Orçamento:** `ProdutoOrcamento.tipo_item` = `PRODUTO_FINITO` com `produto_finito_id`; bypass do motor de cálculo.
- **Evolução:** Integrado ao Catálogo. Coluna `personalizavel` e `fulfillment_padrao` (ESTOQUE, PRODUCAO, HIBRIDO).

### 6.4 ExpedicaoModule

- **Evolução de Integração com Instalação:**
  - OS com produto que exige instalação (`instalacao_necessaria = true`) gera expedição com status **`AGUARDANDO_INSTALACAO`** (em vez de `AGUARDANDO_SEPARACAO`).
  - Quando todos os lotes de instalação forem finalizados, a expedição é automaticamente promovida para **`ENTREGUE_FINALIZADO`**.
  - Novo status: `AGUARDANDO_FECHAMENTO` para conciliação antes do faturamento final.

### 6.5 ArteAprovacaoModule

- **WebSocket:** namespace `/arte-aprovacao`
- **ItemOS:** `status_arte`, `responsabilidade_arte`, `politica_cobranca_arte`, `designer_atribuido_id`, `data_prazo_arte`, fila.
- **Integração Drive:** Vincula `arte_drive_folder_id` ao item da OS para sincronização automática de arquivos de produção na pasta da nuvem correspondente à OS.

### 6.6 OSModule — Liberação parcial PCP e OS Aditiva

- **Status OS:** inclui `PARCIALMENTE_LIBERADA` quando apenas parte dos itens foi liberada.
- **OS Aditiva (Split Financeiro):** Permite criar OS filha vinculada a uma OS principal (`os_pai_id`) para faturar ocorrências adicionais de campo.
  - Carrega as flags `pular_pcp = true`, `pular_expedicao = true`, `pular_validacao_estoque = true` para evitar que a OS aditiva entre no fluxo logístico ou fabril.

### 6.7 OrcamentosV2Module

- Multi-produto via `ProdutoOrcamento`.
- Suporte a personalização complexa via `PersonalizacaoOrcamento` (vinculada a estampas, processos de decoração e campos customizáveis).

### 6.8 PCPModule

- Kanban, workflows, apontamentos.
- **Bloqueio por sinal financeiro:** Implementa `PcpBloqueioSinalService` e o status `BLOQUEADO_AGUARDANDO_SINAL`. Se a loja exigir sinal financeiro e este não estiver pago, a produção do item da OS fica bloqueada no PCP.

### 6.9 FinanceiroModule

- Cobrança 1:1 com orçamento aprovado.
- Job `@Cron` para parcelas vencidas.
- **Novos status de parcelas:** `AGUARDANDO_RELATORIO_TECNICO` e `A_FATURAR` (usados para retenção contratual DEC-04).

### 6.10 EstoqueModule

- Sobras vinculadas a OS; aproveitamentos em orçamentos futuros.
- Tabelas de localizações, lotes e sobras.

### 6.11 InstalacaoModule (Fase 2 - Completo)

- **Path:** `backend/src/instalacao/`
- **Estrutura:**
  - `instalacao.controller.ts`: CRUD de lotes de instalação, forecast, reagendamento e controle de equipe.
  - `instalacao-anexo.controller.ts`: Upload de assinaturas e fotos de evidências de campo.
  - `instalacao-relatorio.controller.ts`: Emissão e segurança de Relatórios Técnicos (PDF).
  - `instalador.controller.ts`: Endpoints simplificados e performáticos para o app móvel do instalador (`/instalador`).
- **Principais Serviços:**
  - `instalacao.service.ts`: Gerencia o ciclo de vida dos lotes, finalização de instalações e automação de status de expedição.
  - `item-os-instalacao-criacao.service.ts`: Hook PCP (ou transição de OS para `FINALIZADA`) que gera automaticamente lotes (`ItemOSInstalacao`) para itens com flag de instalação. Permite também criação de lotes manuais.
  - `instalacao-pos-calculo.service.ts`: Consolida custos/preços de ocorrências. Exige fechamento financeiro dos extras antes de liberar a parcela Saldo contratual do pai.
  - `instalacao-split-financeiro.service.ts`: Criação atômica de **OS Aditiva** e Orçamento Sintético associado para ocorrências de campo faturáveis.
  - `instalacao-split-fiscal.service.ts`: Efetua a divisão fiscal entre serviços (NFS-e) e produtos (NF-e).
  - `instalacao-relatorio-pdf.service.ts`: Gera o PDF do Relatório Técnico consolidado.
  - `pcp-bloqueio-sinal.service.ts`: Bloqueio de fluxo de produção/instalação caso haja pendências financeiras de sinal inicial.
- **Regra de Entrada:** A OS/Lotes entram em Instalação somente após a baixa de produção (setores concluídos no PCP ou OS `FINALIZADA`).

### 6.12 CatalogoModule (Novo)

- **Path:** `backend/src/catalogo/`
- **Funcionalidades:**
  - `processo-decoracao.service.ts`: Gerencia CRUD de `ProcessoDecoracao` (como serigrafia, bordado, laser) contendo setups fixos (`custo_setup`) e tabela de preços regressivos por faixas de volume (Quantity Breaks).
  - `estampas`: CRUD de estampas vinculadas a processos, incluindo upload da imagem de arte-mestra e definição de bounding boxes/metadados para VDP.
  - `conjuntos-campos`: CRUD de `ConjuntoCampos` e `CampoVariavelDef` para campos dinâmicos customizados (texto, número, data).
  - `arte-producao.service.ts` & `vdp-pdf-merge.provider.ts`: Motor VDP que realiza o merge do arquivo de arte-mestra com os dados variáveis preenchidos ou enviados via planilha (CSV), gerando um PDF final pronto para impressão (`print-ready PDF`).

### 6.13 ConexoesModule (Novo)

- **Path:** `backend/src/conexoes/`
- **Funcionalidades:**
  - `google-oauth.service.ts`: Autenticação OAuth 2.0 por loja para conexões do ecossistema Google.
  - `google-drive-storage.service.ts`: Gerenciamento e criação automatizada de estrutura de pastas para Ordens de Serviço e armazenamento de arquivos de arte, fotos e thumbnails na nuvem de forma transparente.

---

## 7. Frontend

### 7.1 Shell autenticado

Arquivo: `frontend/src/app/(main)/layout.tsx`

- `UserContext` + redirect se não autenticado.
- `SidebarBadgeSync` + `useSidebarContadores` — badges em tempo real sincronizados na sidebar (inclui contadores para OS, Arte, PCP, Financeiro, Expedição, Instalações).

### 7.2 Navegação principal (sidebar)

| Label | Rota | Observação |
|-------|------|------------|
| Dashboard | `/dashboard` | Home operacional, alertas e onboarding |
| Orçamentos | `/orcamentos-v2` | V2 ativo |
| Clientes | `/clientes` | CRM |
| Insumos | `/insumos` | Materiais |
| Estoque | `/estoque` | Lotes, sobras, movimentações |
| Modelos de Orçamento | `/produtos` | Templates (`TemplateProduto`) |
| Catálogo de produtos | `/catalogo` | Hub unificado (Finitos, Personalização, Estampas, Campos) |
| Ordens de Serviço | `/os` | Badge contador |
| Arte & Aprovação | `/arte` | Fila + kanban; badge; Drive integrado |
| Financeiro | `/financeiro/recebimentos` | Só admin/financeiro; badge |
| PCP | `/pcp/*` | Submenu: kanban, workflows, etapas; badge |
| Expedição | `/expedicao` | Só admin/produção/estoque; badge |
| Instalações | `/instalacao` | Lista, Calendário e Fila de Pendências/Precificação; badge |
| Centros de Trabalho | `/centros-de-trabalho` | Recursos |
| Configurações | `/configuracoes` | Inclui 2FA, Conexões (Drive), Config. de Arte/Instalação |

### 7.3 Páginas OS (destaques)

- `/os` — grid com status parcial de liberação PCP e status da arte.
- `/os/[id]` — detalhe multi-aba contendo a nova aba **Instalação** (`InstalacaoOsPainel`), exibindo calendários de forecast, tabela de lotes, ocorrências e botão "Novo Lote".

### 7.4 Portal do Instalador (Mobile)

- **Rota:** `/instalador`
- Interface otimizada para mobile que permite ao instalador na rua consultar sua agenda de instalações do dia, abrir rotas de endereços, relatar ocorrências rapidamente (fotos e texto) e finalizar lotes de instalação capturando assinaturas na tela do dispositivo.

---

## 8. Banco de Dados

### 8.1 Convenções

- MySQL; IDs majoritariamente `cuid()` ou `uuid()`.
- Multi-tenant por linha: campo `loja_id` em tabelas do tenant.
- Nomenclatura mista legada e PascalCase.

### 8.2 Saneamento e Limpeza (Auditoria 2026-07)

- **Tabelas excluídas:** `historico_custo_maquinas`, `historico_custo_funcoes`, `anexomensagem`, e `modo_impressao` foram completamente removidas do banco de dados (estavam sem uso/vazias).
- **Consolidação do Schema:** Schema reduzido para 90 models e arquivos órfãos limpos.
- **FK Indexes:** 6 índices FK adicionados para otimização de performance no MySQL.

### 8.3 Modelos por domínio (90 models)

#### Tenant, acesso e conexões
`loja`, `usuario`, `PasswordResetToken`, `ConviteCadastro`, `perfil_acesso`, `perfil_permissao`, `usuario_perfil`, `OnboardingOperacional`, `LojaConexao` (novo)

#### CRM e catálogo
`cliente`, `Insumo`, `Categoria`, `fornecedor`, `categoriaInsumo`, `tipomaterial`, `TemplateProduto`, `ItemTemplateProduto`, `MaquinaTemplateProduto`, `FuncaoTemplateProduto`, `ServicoTemplateProduto`, `maquina`, `funcao`, `servico_manual`, `custoindireto`, históricos de preço/custo

#### Catálogo de produtos & Personalização (novo)
`CategoriaProdutoFinito`, `ProdutoFinito`, `GaleriaProdutoFinito`, `ProcessoDecoracao`, `ConjuntoCampos`, `CampoVariavelDef`, `Estampa`, `ProdutoFinitoModo`, `ProdutoFinitoEstampa`, `ProdutoFinitoProcesso`, `PersonalizacaoOrcamento`

#### Orçamentos
`orcamento`, `ProdutoOrcamento`, `ItemInsumo`, `ItemMaquina`, `ItemFuncao`, `ItemServicoManual`, `ItemCustoIndireto`, `aprovacaoOrcamento`, `HistoricoOrcamento`, `VersaoOrcamento`, `OrcamentoHistorico`, `OrcamentoLog`, `MensagemChat`, `LinkPublico`, `AcessoLink`, `mensagemnegociacao`, `notificacao`, `ModalidadeEntrega`, `TipoInstalacao`

#### Financeiro
`Cobranca`, `CobrancaParcela`, `CobrancaRecebimento`, `CobrancaLog`

#### OS e produção
`document_sequence`, `OrdemServico`, `ItemOS`, `MovimentacaoOS`, `ChecklistOS`, `OrdemServicoLog`, `RegraValidacao`, `ExecucaoRegra`

#### PCP / workflow
`WorkflowOS`, `WorkflowSetor`, `WorkflowCategoria`, `WorkflowCategoriaRegra`, `WorkflowInstancia`, `WorkflowInstanciaSetor`, `EtapaInstancia`, `ChecklistInstancia`, `Apontamento`, `SetorProdutivo`

#### Expedição
`ExpedicaoLogistica` (+ enums `ModalidadeExpedicao`, `StatusExpedicao`)

#### Arte
`ConfiguracaoArteLoja` (novo), `ArteVersao`, `ArteArquivo`, `ArteComentario`, `ArteLinkAprovacao`, `ArteMensagem`

#### Instalação (novo)
`ConfiguracaoInstalacaoLoja`, `ItemOSInstalacao`, `OcorrenciaInstalacao`, `OrcamentoAditivoInstalacao`, `RelatorioTecnicoInstalacao`, `TaxaOcorrenciaLoja`

#### Estoque
`estoque`, `estoque_localizacoes`, `estoque_itens`, `estoque_movimentacoes`, `estoque_lotes`, `estoque_transferencias`, `estoque_sobras`, `estoque_aproveitamentos`

---

## 9. Fluxos de Negócio Integrados

### 9.1 Cadastro e onboarding
1. Criação de loja → verificação e-mail → login.
2. Integração do Google Drive via OAuth no onboarding operacional.

### 9.2 Catálogo & Orçamento V2
1. O produto de prateleira é cadastrado no catálogo e definido como `personalizavel = true`.
2. No orçamento V2, o usuário seleciona o produto, o modo de personalização (`ESTAMPA`, `IMPRINT_LIVRE` etc.) e preenche os campos variáveis (`CampoVariavelDef`) ou seleciona a estampa.
3. Se houver dados variáveis massivos, o usuário faz o upload do CSV e o motor VDP projeta o merge do PDF print-ready.
4. Orçamento aprovado gera OS + Cobrança comercial.

### 9.3 Geração de OS e Vínculo Drive
1. OS herda os produtos e cria `ItemOS` com `valores_personalizacao` e `modo_fulfillment` (`PICK` se em estoque, `MAKE` se exigir produção/personalização).
2. O sistema aciona o `GoogleDriveStorageService` para criar de forma síncrona uma pasta estruturada da OS no Drive e armazena o id em `ItemOS.arte_drive_folder_id`.

### 9.4 Liberação PCP
1. Gestor abre a aprovação técnica e seleciona quais itens liberar.
2. **Trava de Sinal:** Se configurada a exigência de sinal financeiro inicial e a parcela não estiver compensada, o item fica bloqueado no PCP com status `BLOQUEADO_AGUARDANDO_SINAL`.
3. Após compensação, o status avança para `LIBERADO` e cai nos setores fabris.

### 9.5 PCP para Expedição e Instalação (Gatilho Unificado)
1. Conclusão da fabricação no PCP ou marcação de OS como `FINALIZADA` dispara a baixa de produção (`ItemOSInstalacaoCriacaoService.processarBaixaProducaoOs`).
2. Se o item exige instalação (`instalacao_necessaria = true`):
   - A expedição logística é gerada diretamente no status **`AGUARDANDO_INSTALACAO`** (impedindo que seja separada/despachada de forma independente).
   - São criados automaticamente os lotes de instalação (`ItemOSInstalacao`) com as quantidades correspondentes. Se o endereço for placeholder, os lotes ficam pendentes de alocação manual pelo gestor.

### 9.6 Gestão de Instalação e Execução de Campo
1. O gestor visualiza os lotes pendentes na fila `/instalacao` e define datas, turnos e equipes.
2. **Trava Financeira no Grid:** Caso o cliente possua pendências de parcelas de saldo vencidas, a liberação de entrega e instalação é sinalizada como bloqueada no grid operacional (popover de aviso com link para o financeiro).
3. O instalador abre o aplicativo móvel `/instalador`, visualiza sua rota e inicia o trabalho.
4. Ao concluir, o instalador captura fotos como evidência e colhe a assinatura do cliente em tela.
5. Se tudo correr bem e todos os lotes forem concluídos, o status da expedição avança automaticamente para **`ENTREGUE_FINALIZADO`**.

### 9.7 Split Financeiro (Intercorrências de Campo)
1. Se ocorrerem problemas na execução (ex: cliente ausente, falta de material, retrabalho técnico):
   - O instalador registra uma ocorrência no app que entra na fila de pendências do gestor como `PENDENTE_PRECIFICACAO`.
   - O gestor revisa a ocorrência, ajusta o custo operacional e precifica o valor do repasse cobrado do cliente, mudando para `PRECIFICADO`.
   - O gestor aciona a geração de **OS Aditiva**: o sistema cria de forma atômica um orçamento sintético extra, gera uma OS filha vinculada à OS pai (`tipo_vinculo_os = ADITIVA_INSTALACAO` com flags de bypass `pular_pcp`, `pular_expedicao`, `pular_validacao_estoque = true`), cria a fatura correspondente e marca as ocorrências como `FATURADO`.
2. Para aprovar o faturamento da OS pai (liberando a retenção contratual DEC-04), é exigido que todas as ocorrências de campo já tenham sido precificadas ou faturadas via OS Aditiva.
3. O Relatório Técnico PDF consolida o split fiscal (discriminação entre mercadorias/serviços) e anexa o histórico de ocorrências aditivas faturadas para controle do cliente.

---

## 10. WebSockets

| Namespace | Uso |
|-----------|-----|
| `/calculo-v2` | Preview de orçamento em tempo real |
| `/arte-aprovacao` | Mensagens e notificações de arte |
| Gateway geral | Eventos operacionais (PCP, badging da sidebar) |

---

## 11. Arquivos, Uploads e Mídia

- Uploads: `backend/uploads/` servidos em `/uploads`.
- Integração Google Drive: centralização e espelhamento das pastas de OS, uploads de thumbnails e arquivos de produção de alta resolução diretamente no storage na nuvem.

---

## 12. Observações de Qualidade e Riscos

| Risco | Detalhe | Mitigação |
|-------|---------|-----------|
| **Faturamento em duplicidade** | Ocorrências faturadas via OS aditiva e cobradas em duplicidade na cobrança principal. | Substituição total da "parcela extra" pelo fluxo de OS Aditiva com trava em `InstalacaoPosCalculoService`. |
| **Vazamento de OS Aditiva no PCP** | OS aditiva (que não exige produção) aparecer na fábrica gerando retrabalho de controle. | Coação arquitetural via flags `pular_pcp = true` e `pular_expedicao = true` no `OSService` e hooks de fluxo. |
| **Token OAuth Expirado (Drive)** | Perda de conexão síncrona com o Google Drive que impeça o upload ou criação de pastas de OS. | Tratamento de exceção gracefully: fallback para armazenamento local temporário `/uploads` com fila de re-sincronização. |
| **IDOR no Financeiro/OS** | Modificações de status ou cobranças de outras lojas devido a IDs sequenciais ou falta de validação de escopo. | Auditoria rígida e mitigação de segurança (2026-07) forçando a verificação concomitante do `loja_id`. |

---

## 13. Mapa de Dependências Funcionais

```text
loja
  ├── usuario / auth / perfis / preferencias
  ├── cliente
  │     └── orcamento
  │           ├── produto_orcamento (SOB_DEMANDA | PRODUTO_FINITO)
  │           │     ├── produto_finito (opcional; modos / estampas / processos)
  │           │     ├── personalizacao_orcamento (modo, estampa, valores)
  │           │     └── itens: insumo, maquina, funcao, servico, custo_indireto
  │           ├── motor_calculo_v2
  │           ├── cobranca → parcelas → recebimentos
  │           └── ordem_servico
  │                 ├── item_os (arte, liberação PCP, geometria, valores_personalizacao, drive_folder_id)
  │                 ├── arte_versao → arquivos / links / mensagens
  │                 ├── workflow_instancia → setores / etapas / apontamentos (bloqueio de sinal financeiro)
  │                 ├── expedicoes_logistica (status AGUARDANDO_INSTALACAO)
  │                 ├── itens_os_instalacao (lotes; forecast, assinatura, fotos)
  │                 │     └── ocorrencias_instalacao (visitas, materiais; precificação)
  │                 ├── ordens_servico (filhas aditivas; split financeiro)
  │                 ├── relatorios_tecnicos_instalacao (PDF; split fiscal)
  │                 └── sobras → aproveitamentos
  ├── processos_decoracao / conjuntos_campos / estampas (VDP engine)
  ├── configuracao_arte_loja / configuracao_instalacao_loja
  ├── loja_conexao (Google Drive OAuth)
  ├── estoque → localizações / movimentações / lotes
  └── home_operacional / onboarding (Google Drive integration)
```

---

## 14. Inventário de Rotas Backend (resumo)

### OS, Liberação e Aditivos

- `GET/PATCH /os/*` — CRUD, status, aprovação técnica com `item_ids`.
- `GET /os/liberacao-pcp/*` — filas por status.
- `POST /instalacao/os/:osId/gerar-os-aditiva` — geração de OS aditiva a partir de ocorrências precificadas.
- `POST /instalacao/os/:osId/aprovar-financeiro` — aprovação do faturamento principal (libera parcela saldo).

### Instalação

- `GET/POST/PATCH /instalacao/lotes/*` — forecast, equipes, alocações de lotes.
- `GET/PATCH /instalacao/ocorrencias/*` — fila de precificação de campo, precificar ocorrência, abonar.
- `POST /instalador/ocorrencias` — registro de intercorrência pelo instalador em campo (sem valores).
- `GET/POST /instalacao/cep/:cep` — consulta de endereço para lotes.
- `GET/POST /instalacao/os/:osId/relatorio-tecnico` — geração de PDF do Relatório Técnico com split fiscal.

### Catálogo de Produtos e VDP

- `GET/POST/PATCH /catalogo/personalizacao/*` — processos de decoração e faixas de preço.
- `GET/POST/PATCH /catalogo/estampas/*` — cadastro de estampas, templates de arte-mestra.
- `POST /catalogo/arte-producao/vdp` — geração de PDF print-ready via merge VDP.

### Integrações (Conexões)

- `GET/POST /conexoes/*` — status e autenticação OAuth do Google Drive.

---

## 15. Roadmap e Evoluções Futuras

Com a consolidação do **Módulo de Instalações** e a implementação do **Hub de Catálogo & VDP**, as prioridades de evolução técnica e funcional sugeridas para o sistema são:

1. **Importação Automatizada de Lotes:** Implementação de importação de planilhas para distribuição massiva de endereços de instalação (rollouts grandes - DEC-13).
2. **Notificações Integradas de Campo:** Disparos automáticos via WhatsApp de lembretes de instalação para clientes e agendamentos para instaladores na rua.
3. **Consolidação de Permissões (RBAC):** Migrar todas as regras de visualização direta baseadas em string de funções na sidebar para o modelo dinâmico de `perfil_permissao`.
4. **Resiliência de Integração Google Drive:** Otimizar tratamento de tokens expirados e automatizar fila de re-sincronização de upload em caso de falha de conexão síncrona.

---

*Documento atualizado em 2026-07-09 após auditoria de banco de dados, correção de segurança e conclusão do módulo de Instalação e Hub do Catálogo.*
