# Fase 0 — Auditoria do estado real do repositório

**Documento:** entregável "Inventário atualizado de reuso e dívidas" da Fase 0
**Data da auditoria:** 2026-07-31
**Branch:** `feat/modulo-vendas`
**Método:** leitura direta do código e do `schema.prisma`. Todo item abaixo tem
evidência de arquivo e linha. Nada aqui é suposição.

> Regra de uso: este documento substitui o inventário do RP §4 sempre que houver
> divergência. O RP descreve a intenção de produto; este documento descreve o que
> existe hoje.

---

## 1. Veredito da auditoria

O RP §4 está **correto no que afirma**, mas é **incompleto no que omite**. A
auditoria confirmou todos os ativos listados no RP e encontrou **oito dívidas P0
não mapeadas** que alteram materialmente o custo e a ordem das fases.

A mais grave: **o módulo de orçamentos não tem autorização funcionando**. Não existe
`RolesGuard`. O decorator `@Roles(...)` é metadata inerte. A autenticação está
coberta por um middleware global sólido, mas nada limita **o que** um usuário
autenticado pode fazer. Isso significa que a Fase 2 do plano não é "criar permissões
`vendas.*`" — é **construir o mecanismo de autorização que o projeto assume
existir**.

| # | Dívida descoberta | Severidade | Fase afetada |
|---|---|---|---|
| D-01 | Não existe `RolesGuard`; `@Roles` não autoriza nada. Qualquer usuário autenticado da loja opera todo o Orçamentos V2 | **P0 — segurança** | 2 |
| D-02 | IDOR em `links-v2.service.ts`; duas listas divergentes de rota pública; `JwtAuthGuard` ausente no controller (redundante, mas frágil) | P1 — segurança | 2 |
| D-03 | Máquina de estados existe mas está desligada do caminho de escrita | **P0** | 6 |
| D-04 | Dois vocabulários de status de orçamento em uso simultâneo | **P0** | 1, 6 |
| D-05 | Quatro tabelas de histórico/versão, três nunca escritas | **P0** | 1, 6 |
| D-06 | `cliente` não tem responsável comercial nem contatos | **P0** | 1, 4 |
| D-07 | Validade da proposta é texto livre, não data | **P0** | 1, 6 |
| D-08 | Aprovação não é transacional e a idempotência tem corrida | **P0** | 8 |
| D-09 | `notificacao` é endereçada à loja, não ao usuário | P1 | 5 |
| D-10 | `AlcadasOrcamentoService` já ocupa o nome "alçadas" | P1 | 7 |

---

## 2. D-01 — Não existe RolesGuard (bloqueador de segurança)

### Evidência

`backend/src/auth/decorators/roles.decorator.ts` tem 7 linhas e apenas grava
metadata:

```1:7:backend/src/auth/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../enums/user-role.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: (UserRole | string)[]) =>
  SetMetadata(ROLES_KEY, roles);
```

Busca por `ROLES_KEY` em todo o `backend/src` retorna **apenas esse arquivo**. Não
existe nenhuma classe que leia essa metadata via `Reflector`. Não existe arquivo
`*roles*.guard.ts`. O único `APP_GUARD` do repositório é o `AdminBoundaryGuard`,
registrado localmente em `backend/src/admin/admin.module.ts:84` e escopado à área
administrativa da plataforma.

### Consequência

As 10 permissões granulares hoje declaradas em `@Roles(...)` nos controllers de
`backend/src/orcamentos-v2/` — `orcamentos.calcular`, `orcamentos.validar`,
`orcamentos.consultar`, `orcamentos.chat.enviar`, `orcamentos.chat.consultar`,
`orcamentos.impressao.gerar`, `orcamentos.links.criar`, `orcamentos.links.consultar`,
`orcamentos.links.editar`, `orcamentos.links.remover` — **não são verificadas em
nenhum momento**. Qualquer usuário autenticado da loja executa todas.

O mesmo vale para as 27 ocorrências de `@Roles(UserRole.ADMIN, UserRole.GERENTE,
UserRole.VENDEDOR, ...)` em `orcamentos-v2.controller.ts`.

### Como a autorização realmente funciona hoje

Existem **três mecanismos paralelos**, nenhum deles ligado a `@Roles`:

| Mecanismo | Fonte da decisão | Onde é usado |
|---|---|---|
| Guards de função | `request.user.funcao`, populado pelo middleware global, comparado contra `Set` hardcoded | OS, Instalação, Expedição, Estoque |
| Services de permissão | Query em `perfil_permissao` por par `(modulo, acao)` | Compras, Contas a Pagar, Pós-Cálculo, aprovações de OS |
| `@Roles` | — | **Nada** |

Orçamentos V2 não usa nenhum dos dois primeiros. É o único domínio comercial sem
camada de autorização.

Guards de função existentes:

| Guard | Funções aceitas | Arquivo |
|---|---|---|
| `FinanceiroPermissionsGuard` | `ADMINISTRADOR`, `FINANCEIRO` | `backend/src/instalacao/guards/financeiro-permissions.guard.ts` |
| `InstalacaoGestaoPermissionsGuard` | `ADMINISTRADOR`, `FINANCEIRO`, `VENDAS` | `backend/src/instalacao/guards/instalacao-gestao-permissions.guard.ts` |
| `InstaladorPermissionsGuard` | `ADMINISTRADOR`, `PRODUCAO` | `backend/src/instalacao/guards/instalador-permissions.guard.ts` |
| `ExpedicaoPermissionsGuard` | `ADMINISTRADOR`, `PRODUCAO`, `ESTOQUE` | `backend/src/expedicao/guards/expedicao-permissions.guard.ts` |
| `OSPermissionsGuard` | matriz função → ação, com `VENDAS → VISUALIZAR, CRIAR` | `backend/src/os/guards/os-permissions.guard.ts` |

O padrão de permissão granular que **funciona** é o de Compras
(`backend/src/compras/services/compras-permissions.service.ts`): um objeto
`COMPRAS_PERMISSOES` com 13 strings e um método `assertPode()` chamado
explicitamente dentro dos services. É esse o padrão que Vendas deve seguir, não o
`@Roles`.

### Decisão exigida

Ver **DV-13** em `02-registro-de-decisoes.md`. Vendas não pode nascer em cima de um
mecanismo inerte, e também não pode consertar o RBAC de todo o ERP dentro do seu
escopo.

---

## 3. D-02 — Autenticação está coberta; a lacuna é de autorização

### A autenticação é global e sólida

`backend/src/app.module.ts:99–104` aplica `JwtGlobalMiddleware` a **todas** as
rotas. O middleware (`backend/src/common/middleware/jwt-global.middleware.ts`) faz
bem mais do que validar assinatura:

| Verificação | Linhas |
|---|---|
| Token obrigatório fora da allowlist | 132–137 |
| Rejeita token administrativo ou de sessão da plataforma | 142–149 |
| Exige `status: 'ATIVO'`, `ativo: true`, `email_verificado: true` | 151–179 |
| Exige loja com `status = 'ATIVO'` | 181–185 |
| Valida `loja_session_version` — sessão revogável | 187–194 |
| Valida que o slug do host/origin bate com a loja do token | 205–223 |
| Popula `req.user` com dados frescos do banco, não do payload | 196–203 |

Isso atende diretamente ao requisito do `AGENTS.md` de que "bloqueio/inativação deve
ser validado também nas requisições já autenticadas".

**Portanto, a ausência de `@UseGuards(JwtAuthGuard)` na classe de
`orcamentos-v2.controller.ts` (linhas 46–49) não é um buraco de autenticação.** O
guard aparece em apenas 5 métodos (75, 368, 382, 404, 423) e é redundante com o
middleware. O risco é de manutenção: quem ler o controller conclui que 9 dos 14
endpoints são abertos, e uma futura mudança no middleware não teria rede de
proteção no controller.

### A lacuna real é autorização

O middleware autentica, mas **não autoriza**. Como `@Roles` é inerte (D-01), o
resultado é:

> Qualquer usuário autenticado e ativo da loja — inclusive `PRODUCAO`, `ESTOQUE` ou
> `FINANCEIRO` — pode criar, editar, excluir, alterar status, enviar, calcular,
> duplicar e **fechar pedido** de qualquer orçamento da própria loja.

Não há vazamento entre lojas nesse caminho, porque o `loja_id` vem do `req.user`
populado pelo middleware. O problema é de menor privilégio dentro da loja.

### Duas listas de rota pública que podem divergir

O `@Public()` do `JwtAuthGuard` e a allowlist do middleware são **listas
independentes**. O middleware libera apenas dois padrões de Orçamentos V2
(linhas 108–114):

```text
/orcamentos-v2/:id/publico
/orcamentos-v2/:id/publico/acao
/orcamentos-v2/:id/reenviar-codigo
```

Endpoints marcados `@Public()` no controller que **não** estão nessa allowlist e,
portanto, exigem JWT apesar da anotação:

| Endpoint | Linha do controller |
|---|---|
| `GET :id/mensagens/publico` | 304 |
| `POST :id/mensagens/publico` | 316 |
| `POST :id/publico/mensagens/:mensagemId/visualizar` | 352 |
| `GET orcamentos-v2/links/publico/:token` | 424 de `links-v2.controller.ts` |

A divergência precisa ser verificada em runtime na Fase 1: ou esses endpoints estão
efetivamente inacessíveis ao cliente, ou o caminho real passa pelo BFF do Next com
credencial. Em qualquer dos casos, manter duas fontes de verdade para "rota pública"
é frágil.

### IDOR remanescente

Em `backend/src/orcamentos-v2/services/links-v2.service.ts`:

- `validarOrcamento` (linhas 422–436) busca o orçamento **por `id` sem `loja_id`**. Como o `id` vem da requisição, é IDOR cross-tenant real, contra `docs/database/boas-praticas-schema-prisma.md` §Segurança.
- `validarPermissoesUsuario` (linhas 438–451) contém `// TODO: Implementar validação de permissões do usuário` e só verifica se o usuário existe.

---

## 4. D-03 e D-04 — Status: máquina de estados desligada e vocabulário duplo

### A máquina de estados existe e está correta

`backend/src/orcamentos-v2/services/validacao-v2.service.ts:605–636` implementa
`obterTransicoesValidas` exatamente como documentado em
`docs/fase-0-home-operacional/01-status-oficiais.md`:

```text
rascunho     → em_analise | cancelado
em_analise   → aprovado | rejeitado | rascunho | cancelado
aprovado     → em_execucao | cancelado
rejeitado    → rascunho | em_analise
em_execucao  → concluido | cancelado
concluido    → (terminal)
cancelado    → rascunho
```

### Mas o caminho real de escrita não a usa

`OrcamentosV2Service.alterarStatus` (`orcamentos-v2.service.ts:2923–3032`) recebe
`novoStatus: string`, **não chama `validarTransicaoStatus`** e grava direto no
banco (linha 2970). Qualquer string é aceita.

### E o vocabulário real é outro

| Vocabulário | Valores | Onde vive |
|---|---|---|
| Enum `OrcamentoStatus` | `rascunho`, `em_analise`, `aprovado`, `rejeitado`, `em_execucao`, `concluido`, `cancelado` | `backend/src/orcamentos-v2/enums/orcamento-status.enum.ts` |
| Strings realmente gravadas | `rascunho`, `pendente`, `enviado`, `negociando`, `aprovado`, `rejeitado`, `cancelado` | `orcamentos-v2.service.ts:2356, 2426, 2956, 3055` |

`pendente`, `enviado` e `negociando` **não existem no enum**. Como
`obterTransicoesValidas` retorna `[]` para status desconhecido, se a validação
fosse ligada hoje o fluxo de envio quebraria.

Há ainda um **segundo eixo de status** no mesmo registro: `orcamento.status_aprovacao`
(`PENDENTE` / `APROVADO` / `REJEITADO` / `NEGOCIANDO`), gravado em paralelo ao
`status`, sem regra de consistência entre os dois.

E um terceiro enum, `StatusAprovacao`, em
`backend/src/orcamentos-v2/interfaces/orcamento.interface.ts:407–412`, com valores
minúsculos (`pendente`, `aprovado`, `rejeitado`, `condicional`) que não batem com
os do banco.

**Implicação para o plano:** a Fase 1 não vai "definir a fonte canônica de status".
Vai ter que **reconciliar três vocabulários e religar a máquina de estados**, com
backfill dos registros gravados fora do enum.

---

## 5. D-05 — Quatro tabelas de histórico, três nunca escritas

| Modelo | Linhas no schema | Escrito? |
|---|---|---|
| `HistoricoOrcamento` | 1770–1789 | **Sim, parcialmente** — só na criação (`orcamentos-v2.service.ts:674`) e na exclusão (`:1637`) |
| `VersaoOrcamento` | 1791–1807 | **Não** — o writer `criarNovaVersao` (`:1853`) existe, mas a única chamada está comentada em `:1533–1537` com `// TEMPORARIAMENTE DESABILITADO` |
| `OrcamentoHistorico` | 114–129 | **Não** — nenhum `create` em todo o backend |
| `OrcamentoLog` | 83–98 | **Não** — `registrarLog` (`:3547–3561`) só faz `logger.log`, com o comentário `// Por enquanto, apenas log no console` |
| `aprovacaoOrcamento` | 1896–1911 | **Não** — nenhum writer; só lido em `transformacao-v2.service.ts:1834` |

O campo `orcamento.versao_atual` existe (`Int @default(1)`) mas nenhuma versão é
efetivamente persistida.

**Implicação:** o critério de aceite RP 8.6 (17) — "a versão aceita pelo cliente é
identificável e imutável" — não tem nenhuma base hoje. Não é integração com algo
existente; é construção do zero sobre tabelas órfãs que precisam ser escolhidas ou
descartadas.

---

## 6. D-06 — `cliente` não suporta carteira

Modelo `cliente` em `backend/prisma/schema.prisma:436–472`.

| Necessidade do RP | Existe? | Observação |
|---|---|---|
| Responsável comercial (FK para `usuario`) | **Não** | O campo `responsavel String?` (linha 456) é texto livre e representa o contato **dentro do cliente**, não um vendedor |
| Vendedores participantes | **Não** | — |
| Tabela de contatos e papéis | **Não** | Um único contato por cliente, em campos escalares (`email`, `telefone`, `whatsapp`, `responsavel`, `cargo_responsavel`) |
| Histórico de transferência de carteira | **Não** | — |
| Status prospect | **Sim** | `cliente_status_cliente`: `ATIVO`, `INATIVO`, `PROSPECT`, `BLOQUEADO` |
| Origem/canal | **Parcial** | `origem String?`, texto livre sem enum |
| Deduplicação | **Não** | `documento` não tem `@unique`; existe apenas o índice `[loja_id, documento]` |

O único vínculo cliente ↔ vendedor hoje é indireto, via `orcamento.responsavel_id`
(`schema.prisma:1471`) — por orçamento, não por cliente.

**Implicação:** a Fase 4 exige migration nova obrigatória. Não é reaproveitamento.

### Frontend de clientes

`frontend/src/app/(main)/clientes/page.tsx` já segue o template de Fornecedores no
essencial: `DataTable`, `columns.tsx`, toggle iniciando em `'table'` (linha 23),
`useIsMobile`, toggle oculto no mobile (linha 116), `ClienteCard`, `ConfirmDialog`.

Divergências a corrigir quando a tela for absorvida por Vendas:

- grid de cards usa `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` (linha 184) em vez do padrão `grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3`;
- erro de carregamento só faz `console.error` (linhas 35, 58), sem toast nem estado de erro;
- cores fixas de light mode: `bg-gray-200` (97–98), `bg-gray-100` (117), `text-gray-500` (151) e badges `bg-green-100 text-green-800` em `columns.tsx:97–101`;
- `createColumns` recriado a cada render (linha 91), sem `useMemo`;
- sem `ModuleHeader`.

O backend `backend/src/clientes/clientes.controller.ts` **não tem paginação de
servidor** — nenhum `take`/`skip`. O critério RP 8.8 (34) exige paginação no
servidor.

---

## 7. D-07 — Validade da proposta é texto livre

`orcamento.validade_proposta` é `String? @default("30 dias")`. Não é data.
`prazo_entrega` é `String? @default("10 a 15 dias úteis")`, parseado em runtime por
`CobrancaVencimentoService.parsePrazoEntrega`.

Não existem os campos `enviado_em`, `expira_em` nem `aceito_em`. O campo
`data_aprovacao` existe, mas no fluxo interno de aprovação
(`fecharPedidoInterno`, `:3217–3225`) **não é gravado** — só a cobrança recebe
`data_aprovacao: new Date()` (`:3398`).

Expiração real só existe em `LinkPublico.data_expiracao`, e o link público não é o
canal usado pelo fluxo de aprovação (ver seção 9).

**Implicação:** DV-07 (expiração e revalidação) e o critério RP 8.6 (21) —
"proposta expirada não pode ser aceita silenciosamente" — dependem de migration.

---

## 8. D-08 — Aprovação não é transacional

`OrcamentosV2Service.fecharPedidoInterno` (`orcamentos-v2.service.ts:3129–3326`):

1. Idempotência é feita por **consulta prévia** — `ordemServico.findFirst({ loja_id, orcamento_id })` na linha 3159. Não há constraint de unicidade nem lock. Duas requisições concorrentes passam pela checagem antes de qualquer escrita.
2. **Não há `$transaction`** englobando o fluxo. Update do orçamento (`:3217`), criação da OS (`:3227`) e criação da cobrança (`:3259`) são operações independentes.
3. A criação da cobrança está em `try/catch` que só loga, com comentário explícito de que a aprovação **não é revertida** se ela falhar.
4. A compensação é manual e parcial: o `catch` externo (`:3299–3325`) restaura o estado apenas para falhas na criação da OS.

O caminho público (`processarAcaoClientePublico`, `:2323`) é pior:

- `@Body()` tipado inline, **sem DTO nem `class-validator`** (controller `:283`);
- a mensagem de erro **expõe o status atual do orçamento** a um chamador não autenticado (`:2364–2369`);
- `codigo_aprovacao` tem 8 caracteres gerados com `Math.random()` (`gerarCodigoAprovacao`, `:2271–2299`) — não é criptograficamente seguro — e não há rate limit nem contador de tentativas;
- o aceite **não grava evidência alguma**: nem `data_aprovacao`, nem `aprovado_por`, nem IP, nem user-agent. Os campos `cliente_nome`/`cliente_email` recebidos no body são ignorados;
- passa a string literal `'CLIENTE_PUBLICO'` na posição do `usuarioId` (`:2471`);
- não faz a checagem prévia de OS existente que o caminho interno faz.

Do lado bom: `CobrancasService.criarCobrancaParaOrcamento`
(`backend/src/financeiro/services/cobrancas.service.ts:73–183`) **é idempotente por
design** (`findUnique` por `orcamento_id`, que é `@unique`) e usa `$transaction`
para cobrança + parcelas + log. Esse é o padrão a replicar.

**Implicação:** o critério RP 8.6 (19) — "repetir aceite não duplica OS, cobrança,
notificação ou pedido" — hoje é falso, e a Fase 8 é maior do que o plano assume.

---

## 9. Chat, links e canal público — o que é legado não é o que parece

### Dois caminhos de chat, ambos ativos

| | `MensagemChat` (V2) | `mensagemnegociacao` (legado) |
|---|---|---|
| Schema | `schema.prisma:1810–1830` | `schema.prisma:1319–1332` |
| Rotas | `orcamentos-v2/chat/...` e `orcamentos-v2/:id/mensagens...` | `orcamentos/:orcamentoId/mensagens...` |
| Endpoints ativos | Sim, em dois controllers | Sim |
| Consumido pelo frontend | **Sim** | **Não** — nenhuma chamada em `frontend/src` |
| Marca de leitura | `lida` + `data_leitura` (o segundo nunca é preenchido) | `visualizada` |
| Autor externo | Não modelado | `autor_nome`, `autor_email` |
| `loja_id` | Não tem | Não tem |

Ambos os módulos estão registrados em `backend/src/app.module.ts` (linhas 76 e 80).

**Armadilha de nomenclatura:** os métodos que o frontend realmente usa se chamam
`enviarMensagemChatLegado` e `buscarMensagensPublicasLegado`, mas gravam na tabela
**V2** `MensagemChat`. O módulo genuinamente órfão é `mensagens-negociacao` — que,
apesar de sem consumidor, mantém endpoints `@Public()` de escrita expostos.

O contrato canônico deve ser `MensagemChat`, e o módulo `mensagens-negociacao`
precisa de decisão de descontinuação com preservação de histórico.

### O link público não é o canal de aprovação

`LinkPublico` (`schema.prisma:1832–1857`) tem token de 32 caracteres hex
(`randomBytes(16)`), expiração, revogação por `ativo`, contagem de visualizações,
senha com `bcrypt` e registro de acesso em `AcessoLink`.

Mas o fluxo real do cliente usa `/orcamento-v2/{id}` com `codigo_aprovacao`
(montado em `orcamentos-v2.service.ts:1563`), **não o link público**. Além disso:

- o modelo tem campos duplicados de duas gerações (`expira_em` vs `data_expiracao`, `visualizacoes_max`/`visualizacoes_atual` vs `visualizacoes`/`max_visualizacoes`); o código só usa os campos "V2" e os outros quatro nunca são lidos nem escritos;
- IP e user-agent do `AcessoLink` vêm de **query string** (`links-v2.controller.ts:458–459`), não da requisição — inutilizáveis como evidência;
- erros de incremento e de registro de acesso são engolidos silenciosamente.

---

## 10. D-09 — Notificações não têm destinatário

Existe uma única tabela `notificacao` (`schema.prisma:1334–1350`), compartilhada por
Orçamentos V2 e PCP. Campos: `tipo`, `titulo`, `mensagem`, `orcamento_id?`,
`loja_id`, `visualizada`, `dados_extras`, `criado_em`.

**Não existe `usuario_id` nem `destinatario_id`.** O escopo é a loja inteira.

Inventário dos canais existentes:

| Serviço | Domínio | Persiste | Canal |
|---|---|---|---|
| `backend/src/notificacoes/notificacoes.service.ts` | Genérico | `notificacao` | in-app |
| `backend/src/orcamentos-v2/services/notificacao-v2.service.ts` | Orçamentos V2 | via o anterior | in-app + e-mail (`MailService`) |
| `backend/src/pcp/services/notificacoes-pcp.service.ts` | PCP | `notificacao` | in-app |
| `backend/src/modules/arte-aprovacao/services/arte-notificacao.service.ts` | Arte | **não persiste** | e-mail, com nodemailer próprio, sem passar pelo `MailService` |
| `backend/src/expedicao/services/expedicao-notificacao.service.ts` | Expedição | **não persiste** | WebSocket |

Achado adicional: `notificacoes-pcp.service.ts:141` grava `loja_id: 'default'`
hardcoded, com `// TODO: Pegar loja_id do contexto`. É uma quebra de isolamento
multi-tenant em produção, fora do escopo de Vendas, mas precisa de registro.

**Implicação:** a Home acionável da Fase 5 e o critério RP 8.9 (35) —
"o usuário identifica suas pendências prioritárias" — exigem notificação por
usuário. Isso é migration nova, e o RP não previa.

---

## 11. D-10 — O nome "alçadas" já está ocupado

`backend/src/os/services/alcadas-orcamento.service.ts` já existe. Trata de limites
de aprovação de **orçamento de centro de custo em OS**, não de desconto comercial.

Dois problemas:

1. As configurações são **hardcoded** no método `getConfiguracoesAlcada()` (linhas 46–69), com as funções `SUPERVISOR`, `GERENTE`, `DIRETOR` e `ADMIN` — **nenhuma delas existe no enum `usuario_funcao`**. Não há tabela `Alcada*` no Prisma.
2. A Fase 7 vai criar governança de alçada comercial. Sem decisão explícita, nascem dois conceitos de "alçada" no mesmo ERP.

Existe também `backend/src/os/services/os-approval-permissions.service.ts`, que
implementa quatro níveis de aprovação de OS (`APROVAR_TECNICA`,
`APROVAR_ORCAMENTARIA`, `APROVAR_GERENCIAL`, mais `DEFINIR_PRAZO` em
`os-prazo.service.ts`) consultando `perfil_permissao`. É o precedente mais próximo
do que a alçada comercial precisa e deve ser reaproveitado como padrão.

---

## 12. Ativos confirmados do RP §4 (reuso válido)

Todos verificados e existentes:

| Ativo | Caminho |
|---|---|
| Split financeiro / OS Aditiva | `backend/src/instalacao/services/instalacao-split-financeiro.service.ts` |
| Dialog de precificação | `frontend/src/components/instalacao/PrecificarOcorrenciaDialog.tsx` |
| Fila de ocorrências | `frontend/src/components/instalacao/InstalacaoOcorrenciasFilaGrid.tsx` |
| Card de relatório técnico | `frontend/src/components/financeiro/InstalacaoRelatorioTecnicoCard.tsx` |
| Vínculo pai/filha | `OrcamentoAditivoInstalacao`, `schema.prisma:3359–3376` |
| Cobrança 1:1 | `Cobranca`, `schema.prisma:140–180`, `orcamento_id @unique` |
| Registry de navegação | `frontend/src/lib/module-nav/registry.ts` — 17 módulos, nenhum `vendas` |
| Template de CRUD | `frontend/src/app/(main)/fornecedores/` |
| Motor de cálculo | `backend/src/motor-calculo-v2/` |

Confirmado também que **não existe** `/vendas` em nenhuma camada: sem rota, sem
`vendasModuleNav`, sem entrada no registry, sem item de sidebar.

### Tamanho do service central

`backend/src/orcamentos-v2/services/orcamentos-v2.service.ts` tem **4.072 linhas** e
47 métodos, acumulando CRUD, validação de entrega/terceirização, cálculo de chapa,
orquestração do motor, histórico, portal público, código de aprovação, chat
(duplicando `ChatV2Service`), máquina de estados, geração de OS, ponte financeira e
notificações. Para comparação, `chat-v2.service.ts` (795 linhas) e
`links-v2.service.ts` (542 linhas) trazem no cabeçalho o comentário
`✅ ARQUIVO ≤ 400 LINHAS (CONFORME PREMISSAS)`, que nenhum dos dois cumpre.

O RP §4.9 (6) já proíbe ampliá-lo. Esta auditoria confirma e reforça: qualquer
comportamento novo de Vendas nasce em service próprio.

---

## 13. Impacto no plano de ação

| Fase | Ajuste exigido pela auditoria |
|---|---|
| 1 | Reconciliar 3 vocabulários de status; escolher entre 4 tabelas de histórico; migration de validade/expiração/aceite |
| 2 | **Construir o mecanismo de autorização**, não apenas declarar permissões. Fechar D-02 nos endpoints tocados |
| 4 | Migration obrigatória de carteira e contatos; corrigir paginação de servidor em Clientes |
| 5 | Migration de destinatário de notificação |
| 6 | Religar a máquina de estados ao caminho de escrita; eleger `MensagemChat`; decidir o destino de `mensagens-negociacao` e do `LinkPublico` |
| 7 | Resolver a colisão com `AlcadasOrcamentoService`; seguir o padrão de `os-approval-permissions.service.ts` |
| 8 | Transação e idempotência reais; substituir `Math.random()`; registrar evidência de aceite |

---

## 14. Itens fora do escopo de Vendas, registrados para outro dono

Encontrados durante a auditoria, não corrigíveis dentro deste módulo:

- `notificacoes-pcp.service.ts:141` — `loja_id: 'default'` hardcoded.
- `backend/src/common/guards/module-activation.guard.ts:37` — **fail-open**: retorna `true` no `catch`.
- `frontend/src/app/(main)/usuarios/perfis/novo/page.tsx:18–19` — grade de permissões hardcoded (`orcamentos`, `produtos`, `estoque`, `compras`, `pcp` × `visualizar`, `criar`, `editar`, `excluir`, `aprovar`) que **não corresponde** a nenhuma permissão consultada pelo backend.
- `frontend/src/lib/api-client.ts:981, 1020–1022, 1027` — chamadas para rotas que não existem em nenhum controller.
- `ContasPagarPermissionsService` duplica integralmente a lógica de `ComprasPermissionsService`.
