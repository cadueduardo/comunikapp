# Análise Profunda do Sistema ComunikApp

**Data do levantamento:** 2026-06-26  
**Versão anterior:** 2026-06-02  
**Base analisada:** repositório local `c:\Projects\comunikapp`

**Escopo:** backend NestJS, frontend Next.js, schema Prisma/MySQL, módulos, relações funcionais, integrações, fluxos operacionais e pontos de atenção.

**Schema SQL completo:** [`docs/comunikapp-schema-sql-completo.sql`](./comunikapp-schema-sql-completo.sql) — DDL gerado a partir do `schema.prisma` atual (90 models, ~2.100 linhas).

---

## Resumo das mudanças desde 2026-06-02

| Área | O que mudou |
|------|-------------|
| **Produtos finitos** | Módulo `ProdutosFinitosModule`, tabelas `produtos_finitos`, integração em orçamento via `tipo_item` / `produto_finito_id` |
| **Expedição** | Módulo `ExpedicaoModule`, kanban, assinatura, devolução para PCP (`retrabalho`), tabela `expedicoes_logistica` |
| **Arte & Aprovação** | Módulo autônomo em `backend/src/modules/arte-aprovacao/` com fila, kanban (`/arte`), workspace por OS, injeção no orçamento |
| **OS — liberação PCP** | Liberação **por item** (`item_ids`), status `PARCIALMENTE_LIBERADA`, colunas Arte Status e modais de detalhe no grid |
| **ItemOS** | Campos de arte por produto (`status_arte`, `responsabilidade_arte`, `data_prazo_arte`, designer atribuído) |
| **Frontend** | Menu: Modelos de Orçamento + Produtos (finitos), Arte & Aprovação, Expedição; badges na sidebar |
| **Catálogo (planejado)** | RP em `docs/catalogo de produtos/` — hub futuro; **não implementado** no código |
| **Banco** | ~68 migrations; schema com entrega/instalação, financeiro mínimo, onboarding operacional |

---

## 1. Visão Executiva

O ComunikApp é uma plataforma SaaS **multi-tenant** para empresas de comunicação visual. O tenant lógico é a **loja** (`loja_id`). O sistema cobre o ciclo comercial e produtivo: cadastros, orçamento com motor de cálculo V2, aprovação, cobrança, ordem de serviço, arte, PCP, expedição, estoque e home operacional.

### Arquitetura

| Camada | Tecnologia |
|--------|------------|
| Backend | NestJS 11, TypeScript, Prisma 6.19.3, MySQL |
| Frontend | Next.js 15.5 App Router, React 19, Tailwind CSS 4 |
| Tempo real | Socket.IO (cálculo V2, arte, eventos operacionais) |
| Auth | JWT global via middleware; 2FA opcional |
| Deploy | Nginx + PM2 (ver `deploy/`, regras em `.cursor/rules/`) |

### Fluxo de negócio central (atualizado)

```text
Loja/usuários
  → Cadastros (clientes, insumos, máquinas, funções, templates, produtos finitos)
  → Orçamento V2 (motor de cálculo; itens SOB_DEMANDA ou PRODUTO_FINITO)
  → Aprovação (interna ou link público) → Cobrança financeira
  → OS (comercial/direta/interna; múltiplos itens)
  → Arte por item (fila/kanban; link público cliente) — quando aplicável
  → Aprovação técnica / liberação PCP (total ou parcial por item)
  → PCP (workflows, setores, kanban, apontamentos)
  → Expedição (separação, entrega, assinatura; devolução → retrabalho)
  → Estoque (movimentações, sobras, aproveitamentos)
  → Home operacional (KPIs, onboarding, alertas)
```

### Princípios operacionais

- **Multi-tenancy:** quase todo dado filtrado por `loja_id`.
- **Orçamento V2 ativo;** módulo legado desabilitado no `AppModule`.
- **OS multi-item:** cada `ItemOS` pode ter prazos, geometria, arte e liberação PCP independentes.
- **Arte desacoplada da aba OS:** operação principal em `/arte` (fila + kanban).
- **Liberação PCP:** exclusivamente via fluxo de aprovação técnica da OS (removido atalho “Liberar PCP” do módulo arte).

---

## 2. Estrutura do Repositório

| Diretório | Conteúdo |
|-----------|----------|
| `backend/` | API NestJS, Prisma, migrations, testes, Swagger opcional |
| `frontend/` | Next.js App Router, componentes, hooks, proxies API |
| `docs/` | Documentação funcional/técnica (este arquivo, RP catálogo, etc.) |
| `deploy/` | Nginx, CORS, fail2ban |
| `scripts/` | Automações setup/deploy |

**Arquivos-chave**

| Arquivo | Função |
|---------|--------|
| `backend/src/app.module.ts` | Composição dos módulos ativos |
| `backend/src/main.ts` | Bootstrap, CORS, helmet, rate limit, uploads |
| `backend/prisma/schema.prisma` | Modelo de dados (fonte da verdade) |
| `backend/prisma/migrations/` | Histórico incremental (68 migrations) |
| `docs/comunikapp-schema-sql-completo.sql` | DDL completo para análise |
| `frontend/src/app/(main)/layout.tsx` | Shell autenticado, sidebar, badges |
| `frontend/src/lib/api-client.ts` | Cliente HTTP centralizado |

---

## 3. Stack Técnica

### Backend

- NestJS 11, TypeScript 5.4, Prisma 6.19.3
- Passport JWT, `class-validator`, `ValidationPipe` global
- `helmet`, `express-rate-limit`, `@nestjs/schedule` (job financeiro)
- `nodemailer`, `sharp`, `dxf-parser`, `exceljs`

### Frontend

- Next.js 15.5.18, React 19, Tailwind 4
- Radix/shadcn, Tabler Icons, Framer Motion
- React Hook Form + Zod, Socket.IO client, TipTap

### Banco

- MySQL via `DATABASE_URL`
- 90 models Prisma; uso misto de Prisma tipado e SQL raw (estoque)

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

### Rotas públicas (principais)

- Login/2FA: `/lojas/login`, `/lojas/login/2fa`
- Cadastro/verificação de loja
- Orçamento público V2
- Arte: links, mensagens e download com token
- Expedição: assinatura pública (quando configurada)
- Platform/beta, reset de senha, health estoque

### Permissões

- Modelo: `perfil_acesso`, `perfil_permissao`, `usuario_perfil`
- `ModuleActivationGuard` consulta `loja_modulo` (tabela **fora** do schema Prisma principal — risco documentado)
- Sidebar ainda usa regras por `usuario.funcao` em alguns módulos:
  - Financeiro: `ADMINISTRADOR`, `FINANCEIRO`
  - Expedição: `ADMINISTRADOR`, `PRODUCAO`, `ESTOQUE`

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
FinanceiroModule, ExpedicaoModule, PlatformModule
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
| `ProdutosFinitosModule` | **Produtos de prateleira/revenda** (SKU, preço, estoque, galeria) |
| `MaquinasModule`, `FuncoesModule`, `ServicosManuaisModule`, `CustosIndiretosModule` | Recursos de produção e custo |
| `OrcamentosV2Module` | Orçamentos multi-produto, chat, links públicos, aprovação |
| `MotorCalculoV2Module` | Preview e cálculo de custos/preço |
| `FinanceiroModule` | Cobranças, parcelas, recebimentos, job de vencimento |

#### Produção e operação

| Módulo | Responsabilidade |
|--------|------------------|
| `OSModule` | Ordens de serviço (comercial, direta, interna), aprovação técnica, liberação PCP |
| `ArteAprovacaoModule` | Versões, arquivos, links, fila, kanban, mensagens, config por loja |
| `PCPModule` | Workflows, instâncias, kanban, apontamentos, setores |
| `ExpedicaoModule` | Pós-produção: separação, entrega, rastreio, assinatura, devolução |
| `EstoqueModule` | Localizações, movimentações, lotes, transferências, sobras |
| `EstimativaTempoModule` | Tempo de máquina, compatibilidade material×máquina |

#### Suporte

| Módulo | Responsabilidade |
|--------|------------------|
| `AuthModule`, `UsuariosModule` | Autenticação, perfis, 2FA |
| `NotificacoesModule`, `MailModule`, `MensagensNegociacaoModule` | Comunicação |
| `WebsocketsModule` | Gateway geral + namespaces especializados |
| `ConfiguracoesModule` | Centros de trabalho, modalidades entrega, tipos instalação |
| `HomeOperacionalModule` | Dashboard operacional, onboarding |
| `PlatformModule` | Convites beta, interesse plataforma |

### 6.3 ProdutosFinitosModule (novo)

- **Path:** `backend/src/produtos-finitos/`
- **Tabelas:** `CategoriaProdutoFinito`, `ProdutoFinito`, `GaleriaProdutoFinito`
- **API:** CRUD de produtos finitos, categorias, upload de imagens
- **Orçamento:** `ProdutoOrcamento.tipo_item` = `PRODUTO_FINITO` com `produto_finito_id`; preço em snapshot (`preco_unitario`/`preco_total`), bypass do motor de cálculo
- **Frontend:** `/produtos-finitos`

### 6.4 ExpedicaoModule (novo)

- **Path:** `backend/src/expedicao/`
- **Controller:** `expedicao`, `expedicao/assinaturas`
- **Tabela:** `ExpedicaoLogistica` com enums `ModalidadeExpedicao`, `StatusExpedicao`
- **Modalidades:** retirada, transportadora, frota própria, instalação no local
- **Fluxo:** OS concluída no PCP → expedição → assinatura/recebimento → conclusão
- **Devolução:** status `DEVOLVIDA`; OS marcada `retrabalho=true`; nova expedição permitida após retrabalho
- **Integração:** `FinanceiroModule`, `HomeOperacionalModule`, notificações
- **Guard:** `ExpedicaoPermissionsGuard`
- **Frontend:** `/expedicao` (kanban); visível para funções de produção/estoque/admin

### 6.5 ArteAprovacaoModule (evoluído)

- **Path:** `backend/src/modules/arte-aprovacao/` (extraído/refatorado)
- **Controllers:**

| Prefixo | Função |
|---------|--------|
| `arte-aprovacao/versoes` | CRUD versões, status, liberação designer |
| `arte-aprovacao/versoes/:id/arquivos` | Upload, thumbnail |
| `arte-aprovacao/links` | Links públicos de aprovação |
| `arte-aprovacao/mensagens` | Chat interno |
| `arte-aprovacao/mensagens/publico` | Chat cliente (token) |
| `arte-aprovacao/fila` | Fila de trabalho do designer |
| `arte-aprovacao/os` | Contexto OS (itens, prazos arte) |
| `arte-aprovacao/orcamento` | Injeção de dados arte no orçamento |
| `arte-aprovacao/configuracao` | `ConfiguracaoArteLoja` por tenant |
| `arte-aprovacao/notificacoes` | Alertas do módulo |

- **WebSocket:** namespace `/arte-aprovacao`
- **ItemOS:** `status_arte`, `responsabilidade_arte`, `politica_cobranca_arte`, `designer_atribuido_id`, `data_prazo_arte`, fila (`arte_fila_desde`, `arte_assumido_em`)
- **Frontend:** `/arte` (fila + kanban), `/arte/aprovacao/[token]` (público)
- **Regra:** liberação para PCP ocorre na **aprovação técnica da OS**, não no módulo arte

### 6.6 OSModule — liberação parcial PCP (novo)

**Status OS:** inclui `PARCIALMENTE_LIBERADA` quando apenas parte dos itens foi liberada.

**Campos ItemOS (liberação):**

- `status_liberacao_pcp`: `PENDENTE`, `LIBERADO`, `EM_PRODUCAO`, `CONCLUIDO`
- `liberado_pcp_por`, `liberado_pcp_em`

**API aprovação técnica:**

- `PATCH` com `item_ids?: string[]` — libera apenas itens selecionados
- Utilitário: `backend/src/os/utils/os-liberacao-pcp.util.ts` (`resolveIdsAlvoLiberacao`, elegibilidade por item)
- Serviços: `aprovacao-tecnica.service.ts`, `os.service.ts`
- Controllers: `workflow-comercial.controller.ts`, `os-direta-interna.controller.ts` (ambos repassam `item_ids`)

**Frontend:**

- Grid OS: coluna **Arte Status**, status parcial clicável
- `AprovarOSModal`: checkboxes por item, “Liberar restante”
- `OsDetalheModals.tsx`: detalhe liberação e detalhe arte

**Elegibilidade PCP por item:** considera arte (quando `responsabilidade_arte` exige aprovação) e status de liberação.

### 6.7 OrcamentosV2Module (destaques atuais)

- Multi-produto via `ProdutoOrcamento`
- Entrega: `ModalidadeEntrega`, snapshot de endereço
- Instalação por produto: `TipoInstalacao`, regras de cobrança, endereço snapshot
- Geometria: largura, altura, profundidade, área, perímetro, anexo DXF
- Arte no orçamento: campos propagados para `ItemOS` na geração da OS
- Tipos de item: `SOB_DEMANDA` (motor) vs `PRODUTO_FINITO` (snapshot)

### 6.8 PCPModule

- Workflows por categoria de produto
- `WorkflowInstancia` + `WorkflowInstanciaSetor` por item/setor
- Kanban, apontamentos, relatórios
- Integração com status OS e badge `retrabalho` após devolução da expedição

### 6.9 FinanceiroModule

- Cobrança 1:1 com orçamento aprovado
- Parcelas, recebimentos, logs
- Job `@Cron` para parcelas vencidas
- Visível na sidebar para admin/financeiro

### 6.10 EstoqueModule

- CRUD com SQL raw em partes (introspecção de colunas)
- Sobras vinculadas a OS; aproveitamentos em orçamentos futuros
- Integração com insumos (`controla_estoque`)

---

## 7. Frontend

### 7.1 Shell autenticado

Arquivo: `frontend/src/app/(main)/layout.tsx`

- `UserContext` + redirect se não autenticado
- `SidebarBadgeSync` + `useSidebarContadores` — badges em OS, Arte, PCP, Financeiro, Expedição
- Lembrete 2FA opcional

### 7.2 Navegação principal (sidebar)

| Label | Rota | Observação |
|-------|------|------------|
| Dashboard | `/dashboard` | Home operacional |
| Orçamentos | `/orcamentos-v2` | V2 ativo |
| Clientes | `/clientes` | |
| Insumos | `/insumos` | |
| Estoque | `/estoque` | |
| Modelos de Orçamento | `/produtos` | Templates (`TemplateProduto`) |
| Produtos | `/produtos-finitos` | Prateleira/revenda |
| Ordens de Serviço | `/os` | Badge contador |
| Arte & Aprovação | `/arte` | Fila + kanban; badge |
| Financeiro | `/financeiro/recebimentos` | Só admin/financeiro |
| PCP | `/pcp/*` | Submenu: kanban, workflows, etapas, etc. |
| Expedição | `/expedicao` | Só admin/produção/estoque |
| Centros de Trabalho | `/centros-de-trabalho` | |
| Usuários | `/usuarios` | |
| Configurações | `/configuracoes` | Inclui arte, 2FA |

### 7.3 Páginas OS (destaques)

- `/os` — grid com status parcial, arte status, modais
- `/os/[id]` — detalhe multi-aba (produtos, arte, PCP, histórico)
- Aprovação técnica via modal com seleção de itens

### 7.4 Arte

- `/arte` — operação central (não depende só da aba OS)
- `/arte/aprovacao/[token]` — aprovação pública cliente

### 7.5 Clientes HTTP

- `api-client.ts` — módulos tipados
- `api.ts` — sessão expirada, proxies Next.js

---

## 8. Banco de Dados

### 8.1 Convenções

- MySQL; IDs majoritariamente `cuid()` ou `uuid()`
- Multi-tenant: `loja_id` / `lojaId`
- Nomenclatura mista legada (`orcamento`, `usuario`) e PascalCase (`OrdemServico`)
- Enums Prisma para status de arte, expedição, cobrança, etc.

### 8.2 Arquivo SQL completo

**[`docs/comunikapp-schema-sql-completo.sql`](./comunikapp-schema-sql-completo.sql)**

Gerado com:

```bash
cd backend
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script -o ../docs/comunikapp-schema-sql-completo.sql
```

Contém: `CREATE TABLE`, índices, FKs e enums — estado **consolidado** do schema, não o histórico de migrations.

### 8.3 Modelos por domínio (90 models)

#### Tenant e acesso

`loja`, `usuario`, `PasswordResetToken`, `ConviteCadastro`, `perfil_acesso`, `perfil_permissao`, `usuario_perfil`, `OnboardingOperacional`

#### CRM e catálogo

`cliente`, `Insumo`, `Categoria`, `fornecedor`, `categoriaInsumo`, `tipomaterial`, `TemplateProduto`, `ItemTemplateProduto`, `MaquinaTemplateProduto`, `FuncaoTemplateProduto`, `ServicoTemplateProduto`, `maquina`, `modo_impressao`, `funcao`, `servico_manual`, `custoindireto`, históricos de preço/custo

#### Produtos finitos (novo)

`CategoriaProdutoFinito`, `ProdutoFinito`, `GaleriaProdutoFinito`

#### Orçamentos

`orcamento`, `ProdutoOrcamento`, `ItemInsumo`, `ItemMaquina`, `ItemFuncao`, `ItemServicoManual`, `ItemCustoIndireto`, `aprovacaoOrcamento`, `HistoricoOrcamento`, `VersaoOrcamento`, `OrcamentoHistorico`, `OrcamentoLog`, `MensagemChat`, `LinkPublico`, `AcessoLink`, `mensagemnegociacao`, `anexomensagem`, `notificacao`, `ModalidadeEntrega`, `TipoInstalacao`

#### Financeiro

`Cobranca`, `CobrancaParcela`, `CobrancaRecebimento`, `CobrancaLog`

#### OS e produção

`document_sequence`, `OrdemServico`, `ItemOS`, `MovimentacaoOS`, `ChecklistOS`, `OrdemServicoLog`, `RegraValidacao`, `ExecucaoRegra`

#### PCP / workflow

`WorkflowOS`, `WorkflowSetor`, `WorkflowCategoria`, `WorkflowCategoriaRegra`, `WorkflowInstancia`, `WorkflowInstanciaSetor`, `EtapaInstancia`, `ChecklistInstancia`, `Apontamento`, `SetorProdutivo`

#### Expedição (novo)

`ExpedicaoLogistica` (+ enums `ModalidadeExpedicao`, `StatusExpedicao`)

#### Arte (expandido)

`ConfiguracaoArteLoja`, `ArteVersao`, `ArteArquivo`, `ArteComentario`, `ArteLinkAprovacao`, `ArteMensagem`

#### Estoque

`estoque`, `estoque_localizacoes`, `estoque_itens`, `estoque_movimentacoes`, `estoque_lotes`, `estoque_transferencias`, `estoque_sobras`, `estoque_aproveitamentos`

### 8.4 Campos relevantes — OrdemServico

- Tipos: `tipo_os` (COMERCIAL/INTERNA), `origem_os`, `prioridade`
- Aprovação técnica: `aprovacao_tecnica_status`, auditoria
- Aprovação gerencial (OS interna)
- Instalação: `data_instalacao_agendada`
- Comercial: valores, margem, satisfação
- **Expedição:** `retrabalho` (boolean)
- Soft delete: `ativo`, `inativado_em`, snapshot

### 8.5 Campos relevantes — ItemOS

- Geometria: largura, altura, profundidade, área, perímetro, anexo DXF
- Prazos: `data_inicio_producao`, `data_prazo_produto`, `data_prazo_arte`
- PCP: `status_liberacao_pcp`, `liberado_pcp_*`
- Arte: `responsabilidade_arte`, `status_arte`, `designer_atribuido_id`, fila
- Sobras: `sobra_acao`, `sobra_registrada_id`

### 8.6 Campos relevantes — ProdutoOrcamento

- `tipo_item`: `SOB_DEMANDA` | `PRODUTO_FINITO`
- `produto_finito_id` → `ProdutoFinito`
- Instalação completa (snapshot endereço, custos, tempo)
- Campos de arte (propagados para ItemOS)

---

## 9. Fluxos de Negócio Integrados

### 9.1 Cadastro e acesso

1. Criação de loja → verificação e-mail → login (2FA opcional)
2. JWT com `loja_id` → localStorage no frontend
3. Onboarding operacional na home

### 9.2 Orçamento V2

1. `/orcamentos-v2/novo` — produtos sob demanda (motor) ou produto finito (snapshot)
2. Preview: WebSocket `/calculo-v2` ou HTTP motor
3. Persistência multi-produto + itens de custo
4. Envio, negociação, aprovação interna ou pública
5. Fechamento → OS + cobrança

### 9.3 Geração de OS

1. Herda produtos → `ItemOS` com geometria, prazos, arte
2. Validação de estoque e regras (`RegraValidacao`)
3. Status inicial conforme tipo (fila, pendências arte, etc.)

### 9.4 Arte (fluxo atual)

1. Itens com `responsabilidade_arte` ≠ `NAO_APLICAVEL` entram na fila (`/arte`)
2. Designer assume item → cria `ArteVersao` + arquivos
3. Link público → cliente aprova/revisa (`ArteMensagem`)
4. `status_arte` no item atualizado
5. **Não** libera PCP diretamente no módulo arte

### 9.5 Liberação PCP (total ou parcial)

1. Gestor abre aprovação técnica na OS
2. Seleciona itens (`item_ids`) elegíveis (arte ok quando exigida)
3. Itens liberados: `status_liberacao_pcp = LIBERADO`
4. OS: `LIBERADA` (todos) ou `PARCIALMENTE_LIBERADA` (subset)
5. PCP recebe itens no kanban/workflow
6. “Liberar restante” no modal para itens pendentes

### 9.6 PCP → Expedição

1. Item/setor concluído no workflow
2. OS pronta para expedição
3. `ExpedicaoLogistica` criada (modalidade, status kanban)
4. Assinatura/recebimento → conclusão
5. Devolução → `DEVOLVIDA`, OS `retrabalho=true`, retorno ao PCP

### 9.7 Estoque e financeiro

- Movimentações por consumo/OS; sobras e aproveitamentos
- Cobrança parcelada; recebimentos na UI financeiro

---

## 10. WebSockets

| Namespace | Uso |
|-----------|-----|
| `/calculo-v2` | Preview de orçamento em tempo real |
| `/arte-aprovacao` | Mensagens e notificações de arte |
| Gateway geral | Eventos operacionais (PCP, etc.) |

---

## 11. Arquivos, Uploads e Mídia

- Uploads: `backend/uploads/` servidos em `/uploads`
- Arte: thumbnails via `sharp`
- Geometria: `dxf-parser` no orçamento
- Produtos finitos: galeria de imagens
- SVG em uploads: `Content-Disposition: attachment`

---

## 12. Observações de Qualidade e Riscos

| Risco | Detalhe |
|-------|---------|
| Schema legado misto | PascalCase/minúsculo, `loja_id`/`lojaId`, Prisma + raw SQL |
| `loja_modulo` fora do Prisma | Guard de ativação pode divergir de migrations |
| JWT em localStorage | Exposição XSS; cookies HttpOnly exigiriam refactor |
| Serviços grandes | `OrcamentosV2Service`, `OSService` — alta complexidade |
| Docs vs código | Vários RPs em `docs/`; validar sempre no código |
| Liberação parcial | Dois controllers OS devem repassar `item_ids` (bug corrigido em 2026-06) |
| Expedição | Regra “um ativo por OS” é de negócio, não UNIQUE no banco |

---

## 13. Mapa de Dependências Funcionais

```text
loja
  ├── usuario / auth / perfis
  ├── cliente
  │     └── orcamento
  │           ├── produto_orcamento (SOB_DEMANDA | PRODUTO_FINITO)
  │           │     ├── produto_finito (opcional)
  │           │     └── itens: insumo, maquina, funcao, servico, custo_indireto
  │           ├── motor_calculo_v2
  │           ├── cobranca → parcelas → recebimentos
  │           └── ordem_servico
  │                 ├── item_os (arte, liberação PCP, geometria)
  │                 ├── arte_versao → arquivos / links / mensagens
  │                 ├── workflow_instancia → setores / etapas / apontamentos
  │                 ├── expedicoes_logistica
  │                 └── sobras → aproveitamentos
  ├── produtos_finitos / categorias / galeria
  ├── configuracao_arte_loja
  ├── estoque → localizações / movimentações / lotes
  └── home_operacional / onboarding
```

---

## 14. Inventário de Rotas Backend (resumo)

### OS e liberação

- `GET/PATCH /os/*` — CRUD, status, aprovação técnica com `item_ids`
- `GET /os/liberacao-pcp/*` — filas por status incl. `PARCIALMENTE_LIBERADA`
- Detalhes liberação/arte por OS (endpoints de detalhe no módulo OS)

### Arte

- `arte-aprovacao/versoes`, `fila`, `os`, `orcamento`, `configuracao`, `links`, `mensagens`

### Expedição

- `expedicao/*` — kanban, transições, criação a partir da OS
- `expedicao/assinaturas/*` — captura de assinatura

### Produtos finitos

- `produtos-finitos/*` — CRUD, categorias, imagens

### Demais (inalterados em essência)

- `lojas`, `usuarios`, `clientes`, `insumos`, `orcamentos-v2`, `motor-calculo-v2`, `pcp/*`, `financeiro/*`, `estoque/*`, `home-operacional/*`

*Lista exaustiva de endpoints: Swagger com `ENABLE_SWAGGER=true` ou inspeção dos controllers.*

---

## 15. Roadmap documentado (não implementado)

### Hub Catálogo de Produtos

Documentação em **`docs/catalogo de produtos/`**:

- Hub unificado (finitos, personalização/processos, estampas, conjuntos de campos)
- **Modelos de Orçamento** permanecem em `/produtos` (menu lateral)
- Orçamento **preenche variáveis**; cadastro **vincula** templates/processos
- Plano de implementação em `10-plano-implementacao.md`

**Status:** planejamento apenas; código atual usa módulos separados (templates + produtos finitos).

---

## 16. Conclusão Técnica

O ComunikApp evoluiu de um ERP de comunicação visual com orçamento/OS/PCP para uma plataforma que cobre **produtos de prateleira**, **arte operacional em módulo dedicado**, **liberação PCP granular por item** e **expedição pós-produção** com retrabalho.

**Pontos fortes**

- Modelo multi-item consistente (orçamento → OS → PCP → expedição)
- Motor de cálculo V2 maduro para sob demanda
- Arte com fila, kanban e aprovação pública
- Financeiro mínimo integrado ao fechamento
- Schema documentado em SQL completo para análise externa

**Prioridades de evolução sugeridas**

1. Implementar hub Catálogo conforme RP (ou consolidar UX atual)
2. Unificar permissões sidebar → `perfil_permissao`
3. Modelar `loja_modulo` no Prisma
4. Continuar decomposição de `OSService` / `OrcamentosV2Service`
5. Avaliar cookies HttpOnly para JWT

---

## Apêndice A — Comandos úteis

```bash
# Regenerar SQL completo do schema
cd backend
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script -o ../docs/comunikapp-schema-sql-completo.sql

# Aplicar migrations em ambiente
npx prisma migrate deploy

# Gerar client após mudança no schema
npx prisma generate
```

## Apêndice B — Referências cruzadas

| Documento | Conteúdo |
|-----------|----------|
| [`comunikapp-schema-sql-completo.sql`](./comunikapp-schema-sql-completo.sql) | DDL MySQL completo |
| [`catalogo de produtos/README.md`](./catalogo%20de%20produtos/README.md) | RP hub catálogo (planejado) |
| `backend/prisma/schema.prisma` | Fonte da verdade do modelo |
| `backend/src/app.module.ts` | Módulos ativos |
| `.cursor/rules/deploy-cors-nginx-pm2-guardrails.mdc` | Deploy produção |

---

*Documento gerado por análise do código e schema em 2026-06-26. Para divergências, prevalece o repositório.*
