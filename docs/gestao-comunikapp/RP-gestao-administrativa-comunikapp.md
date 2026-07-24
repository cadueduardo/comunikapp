# RP — Gestão Administrativa do ComunikApp

**Status:** proposta inicial pronta para implementação  
**Produto:** ComunikApp  
**Módulo:** Gestão interna da plataforma (backoffice SaaS)  
**Público:** proprietário e equipe interna do ComunikApp  
**Última atualização:** 24/07/2026

## 1. Resumo executivo

O ComunikApp precisa de um painel administrativo separado da operação cotidiana das lojas. Esse painel deve permitir que a equipe interna veja quais lojas participam da plataforma, controle seu acesso, acompanhe adoção, identifique riscos e administre aspectos comerciais básicos.

A primeira versão deve privilegiar controle, segurança e dados acionáveis. Não deve tentar substituir CRM comercial, billing completo ou observabilidade técnica. O foco é responder rapidamente:

- Quantas lojas estão ativas, em trial, inativas ou bloqueadas?
- Quem está usando o sistema e com que frequência?
- Quais módulos e fluxos cada loja utiliza?
- Quais lojas estão paradas, com onboarding incompleto ou próximas do fim do trial?
- Quem alterou o estado, plano, módulos ou limites de uma loja e por quê?

## 2. Contexto atual confirmado no repositório

O sistema já possui uma arquitetura multi-tenant baseada em `loja_id`.

O modelo Prisma `loja` já contém, entre outros:

- `id`, `nome`, `email`, `telefone`, `cnpj` e `cpf`;
- `status`: `PENDENTE_VERIFICACAO | ATIVO | INATIVO | BLOQUEADO`;
- `assinatura_ativa`;
- `data_inicio_trial` e `trial_restante_dias`;
- `criado_em` e `atualizado_em`;
- relacionamento com usuários e os principais dados operacionais.

O modelo `usuario` já contém `loja_id`, `status`, `ativo`, função, verificação de e-mail e 2FA.

Esses campos devem ser reutilizados. A implementação não deve criar uma segunda entidade de tenant nem um segundo campo concorrente de ativação.

## 3. Objetivos

### 3.1 Objetivos de negócio

- Centralizar a gestão das lojas em uma visão confiável.
- Reduzir o esforço manual para ativação, suspensão e acompanhamento.
- Apoiar onboarding, sucesso do cliente e decisões comerciais.
- Tornar mensurável a adoção do produto.
- Preparar a base para planos, cobrança e crescimento do SaaS.

### 3.2 Objetivos do usuário interno

- Encontrar uma loja em poucos segundos.
- Entender sua situação sem consultar diretamente o banco.
- Executar ações sensíveis com confirmação, motivo e rastreabilidade.
- Comparar períodos e lojas por indicadores consistentes.
- Exportar uma lista para acompanhamento operacional.

### 3.3 Não objetivos do MVP

- CRM comercial completo, funil de vendas ou campanhas.
- Emissão fiscal ou cobrança automatizada completa.
- Acesso irrestrito aos dados privados de uma loja.
- Edição direta de orçamentos, OS, clientes ou finanças da loja.
- Monitoramento de infraestrutura, logs de servidor e APM.
- Exclusão definitiva de loja e dados pelo painel.

## 4. Perfis administrativos e permissões

O backoffice deve usar identidade administrativa própria. Um usuário comum de loja, mesmo administrador da loja, nunca pode acessar rotas `/gestao`.

| Perfil | Permissões principais |
|---|---|
| `SUPER_ADMIN` | acesso total, gestão de administradores, alterações comerciais e bloqueios |
| `OPERACAO` | consultar lojas, acompanhar onboarding, ativar/inativar conforme política |
| `SUPORTE` | leitura, diagnóstico e registro de observações; sem alterar plano ou bloquear |
| `FINANCEIRO_SAAS` | assinatura, plano, trial, limites e histórico comercial |
| `ANALISTA` | dashboards agregados e exportações, preferencialmente sem dados sensíveis |

Princípios:

- menor privilégio;
- negar por padrão;
- autenticação forte, com 2FA obrigatório para `SUPER_ADMIN`;
- sessão administrativa curta e revogável;
- toda mutação deve gerar auditoria;
- suporte não deve assumir a identidade de uma loja no MVP.

## 5. Navegação proposta

1. **Visão geral**
2. **Lojas**
3. **Detalhe da loja**
4. **Adoção e uso**
5. **Planos e módulos**
6. **Alertas**
7. **Auditoria**
8. **Administradores** — somente `SUPER_ADMIN`

O painel pode viver inicialmente no frontend atual, em área isolada `/gestao`, desde que use guardas e API administrativas próprias. No médio prazo, pode ser extraído para aplicação separada.

## 6. Funcionalidades

### F01 — Login administrativo

- Login separado ou fluxo explicitamente identificado como gestão.
- 2FA obrigatório para perfis críticos.
- Logout e revogação de sessão.
- Bloqueio temporário após tentativas excessivas.
- Registro de login bem-sucedido e falho.

**Critério:** nenhum token de usuário de loja deve autorizar uma rota administrativa.

### F01.1 — Convites e gestão da equipe administrativa

Um `SUPER_ADMIN` deve poder convidar pessoas para trabalhar na área administrativa do ComunikApp.

Dados obrigatórios do convite:

- nome completo;
- e-mail;
- perfil administrativo;
- mensagem opcional.

Fluxo:

1. `SUPER_ADMIN` informa nome, e-mail e perfil.
2. O sistema valida se o e-mail já possui conta ou convite pendente.
3. É criado um convite com token de uso único e validade configurável, inicialmente 72 horas.
4. A pessoa recebe um e-mail com o nome de quem convidou, perfil atribuído e link seguro.
5. Ao aceitar, confirma o e-mail, define a senha e configura 2FA quando obrigatório.
6. A conta administrativa somente se torna ativa após a conclusão do aceite.

O painel deve permitir:

- listar convites pendentes, aceitos, expirados e cancelados;
- reenviar um convite, invalidando o token anterior;
- cancelar um convite ainda não aceito;
- alterar o perfil de um administrador ativo;
- inativar um administrador e revogar imediatamente suas sessões;
- impedir que o último `SUPER_ADMIN` ativo seja inativado ou perca esse perfil;
- registrar todas essas ações na auditoria.

Regras de segurança:

- nunca enviar senha temporária por e-mail;
- armazenar apenas o hash do token do convite;
- token de uso único, expirável e invalidado após aceite, reenvio ou cancelamento;
- não revelar publicamente se determinado e-mail já possui conta;
- mudança para perfil `SUPER_ADMIN` deve exigir reautenticação do ator;
- o convidado não acessa nenhuma loja antes de concluir o cadastro.

### F01.2 — Convite de usuário para uma loja

Um administrador interno autorizado deve poder convidar uma pessoa para participar de uma loja, sem precisar definir uma senha em nome dela.

Dados obrigatórios:

- loja;
- nome completo;
- e-mail;
- função/perfil dentro da loja.

Dados opcionais:

- telefone;
- permissões ou perfis de acesso;
- módulos aos quais terá acesso, respeitando os módulos habilitados para a loja;
- mensagem de boas-vindas.

Fluxo:

1. O administrador localiza e seleciona a loja.
2. Informa nome, e-mail, função e permissões.
3. O sistema valida duplicidade e o limite de usuários do plano.
4. É criado um usuário pendente e um convite com validade inicial de 72 horas.
5. A pessoa recebe o link, confirma seu e-mail e define a própria senha.
6. Após o aceite, o usuário passa para `ATIVO`, desde que a loja também esteja ativa.

O painel deve permitir consultar o estado do convite, reenviar, cancelar e corrigir nome, função ou permissões antes do aceite.

Regras:

- o administrador interno precisa da permissão específica `STORE_USER_INVITE`;
- o convite deve ficar obrigatoriamente vinculado a uma única `loja_id`;
- uma pessoa não pode usar o convite para escolher ou trocar de loja;
- o backend deve impedir permissões superiores às autorizadas para quem convida;
- lojas inativas ou bloqueadas não recebem novos convites, salvo ação excepcional de `SUPER_ADMIN` com justificativa;
- cancelamento do convite deve inativar/remover logicamente o usuário pendente sem apagar auditoria;
- aceite, reenvio, cancelamento e falha de envio devem ser auditados;
- o MVP não permite transferir um usuário existente entre lojas.

### F02 — Dashboard geral

Cards do período selecionado:

- lojas totais;
- lojas ativas, pendentes, inativas e bloqueadas;
- trials em andamento e vencendo em 7 dias;
- novas lojas no período;
- lojas ativas nos últimos 7 e 30 dias;
- usuários ativos;
- lojas sem atividade há 7, 14 e 30 dias;
- volume de orçamentos e OS;
- taxa de ativação e onboarding concluído.

Gráficos:

- evolução de novas lojas;
- lojas ativas por semana/mês;
- adoção por módulo;
- distribuição por status/plano;
- funil de onboarding;
- ranking de lojas por uso, com contexto e sem gamificação pública.

Filtros globais:

- período;
- status;
- plano;
- módulo;
- faixa de atividade;
- trial/assinatura;
- busca por nome, e-mail, documento ou ID.

### F03 — Lista de lojas

Colunas mínimas:

- nome e ID;
- status;
- assinatura/trial;
- plano;
- usuários ativos;
- último acesso;
- última atividade relevante;
- quantidade de orçamentos e OS no período;
- onboarding;
- alertas;
- data de cadastro.

Recursos:

- busca, filtros, ordenação e paginação no servidor;
- filtros salvos futuramente;
- exportação CSV respeitando as permissões;
- atalhos para detalhe e ações autorizadas;
- estado vazio, carregamento e erro claros.

### F04 — Detalhe da loja

Abas:

**Resumo**

- dados cadastrais;
- status, plano, trial e assinatura;
- responsável principal;
- saúde/atividade;
- alertas e observações internas;
- linha do tempo das principais alterações.

**Uso**

- usuários ativos;
- acessos e dias ativos;
- recursos utilizados;
- volume por módulo;
- evolução no período;
- última atividade por módulo.

**Usuários**

- nome, e-mail mascarável, função, status, e-mail verificado, 2FA e último acesso;
- ativar/inativar usuário apenas se o perfil permitir;
- envio de redefinição/convite como ação separada e auditada.

**Plano e módulos**

- plano atual;
- módulos habilitados;
- limites contratados;
- início/fim do trial;
- histórico de alterações.

**Auditoria**

- ações administrativas relacionadas à loja;
- ator, data/hora, origem, motivo e valores antes/depois.

**Dados operacionais resumidos**

- clientes, orçamentos, OS, itens em produção, estoque e financeiro em números agregados;
- sem expor conteúdo sensível por padrão.

### F05 — Ciclo de vida da loja

Transições suportadas:

```text
PENDENTE_VERIFICACAO -> ATIVO
ATIVO -> INATIVO
ATIVO -> BLOQUEADO
INATIVO -> ATIVO
BLOQUEADO -> ATIVO
PENDENTE_VERIFICACAO -> BLOQUEADO
```

Semântica:

- `ATIVO`: acesso permitido, sujeito a assinatura/trial e módulos.
- `INATIVO`: participação encerrada ou pausada administrativamente; login negado.
- `BLOQUEADO`: suspensão imediata por segurança, inadimplência ou violação; login e APIs negados.
- `PENDENTE_VERIFICACAO`: onboarding/validação ainda não concluído.

Regras:

- toda alteração exige confirmação;
- inativar/bloquear exige motivo e categoria;
- bloquear deve invalidar sessões e tokens existentes;
- reativar não deve restaurar automaticamente módulos removidos ou assinatura;
- nenhuma transição apaga dados;
- uma tela de loja bloqueada/inativa deve informar como contatar o suporte, sem revelar motivo interno;
- ações em lote ficam fora do primeiro MVP, salvo ativação inicial controlada.

**Regra crítica:** validar o status da loja no login e também nas requisições autenticadas. Conferir apenas no login deixa tokens antigos funcionando.

### F06 — Planos, trial, módulos e limites

Cadastro básico de plano:

- nome, código, descrição e status;
- duração padrão do trial;
- módulos incluídos;
- limites: usuários, armazenamento e outros recursos futuros;
- preço apenas informativo no MVP.

Por loja:

- plano atribuído;
- módulos habilitados/desabilitados com exceções;
- início e fim do trial;
- assinatura ativa;
- limites sobrescritos com justificativa;
- histórico de vigência.

Regras:

- dependências entre módulos devem respeitar `docs/arquitetura-modulos.md`;
- desabilitar módulo não apaga seus dados;
- menu, frontend e backend devem validar entitlement;
- mudança deve registrar antes/depois e motivo;
- vencimento automático e cobrança real são fase posterior, mas o modelo deve suportá-los.

### F07 — Métricas de uso por loja

O MVP deve combinar agregações dos dados existentes com eventos explícitos.

Métricas essenciais:

- `last_login_at`: último login válido de qualquer usuário;
- `last_activity_at`: última ação relevante;
- `active_users_7d` e `active_users_30d`;
- `active_days_30d`;
- quantidade criada no período: clientes, orçamentos, OS;
- orçamentos aprovados e taxa de conversão;
- OS abertas/concluídas;
- valor orçado e aprovado, quando o perfil puder vê-lo;
- uso por módulo;
- progresso do onboarding;
- erros relevantes percebidos pela loja, em fase posterior.

Uma loja é considerada **ativa no período** quando ao menos um usuário realizou uma ação relevante, e não apenas carregou uma página.

Eventos iniciais sugeridos:

- `auth.login_succeeded`;
- `client.created`;
- `budget.created`, `budget.sent`, `budget.approved`;
- `service_order.created`, `service_order.completed`;
- `inventory.movement_created`;
- `purchase_order.created`;
- `art.approval_requested`, `art.approved`;
- `installation.scheduled`, `installation.completed`;
- `module.opened` apenas como métrica auxiliar.

Cada evento deve conter:

- `event_name`;
- `occurred_at`;
- `loja_id`;
- `usuario_id`, quando houver;
- `module`;
- `entity_type` e `entity_id`, quando necessário;
- `properties` JSON sem conteúdo sensível;
- `source`.

Não enviar para telemetria: senha, token, documento completo, conteúdo de arte, mensagem privada, dados de cartão ou payload operacional integral.

### F08 — Saúde e alertas

Classificação inicial, sempre explicável:

- **Saudável:** atividade relevante recente e onboarding concluído.
- **Atenção:** sem atividade por 7 dias, onboarding parado ou trial perto do fim.
- **Risco:** sem atividade por 14 dias, nenhum orçamento/OS ou bloqueio comercial pendente.
- **Inativa:** sem atividade por 30 dias ou status inativo/bloqueado.

Alertas:

- trial vence em 7, 3 ou 1 dia;
- trial vencido;
- primeira semana sem atividade relevante;
- onboarding incompleto;
- nenhum usuário ativo;
- loja sem administrador;
- assinatura inativa com loja ativa;
- queda acentuada de atividade;
- erro de integração/conexão importante.

O score não deve ser uma caixa-preta. A interface deve mostrar os fatores que produziram a classificação.

### F09 — Observações internas e acompanhamento

- adicionar observação textual à loja;
- categoria: onboarding, suporte, comercial, financeiro ou geral;
- autor e data obrigatórios;
- fixar observação importante;
- editar preservando histórico ou criar nova versão;
- não expor observações aos usuários da loja.

Tarefas, responsáveis e follow-up automatizado ficam para uma evolução posterior.

### F10 — Auditoria

Auditar obrigatoriamente:

- login administrativo;
- criação/alteração de administrador;
- ativação, inativação e bloqueio de loja;
- mudança de plano, trial, assinatura, módulos e limites;
- ativação/inativação de usuário;
- exportação de dados;
- consulta excepcional de dados sensíveis;
- alterações de observações internas.

Campos mínimos:

- ID, data/hora UTC;
- administrador e perfil;
- ação e recurso;
- `loja_id`;
- estado anterior e novo em JSON sanitizado;
- motivo/categoria;
- IP e user agent, quando disponíveis;
- correlation/request ID.

Logs de auditoria são append-only na aplicação. Não haverá exclusão/edição pela interface.

### F11 — Exportação

- CSV da lista filtrada;
- geração assíncrona caso o volume cresça;
- colunas sensíveis condicionadas à permissão;
- registro de auditoria;
- limite de período e volume;
- arquivo temporário com expiração.

## 7. Indicadores e definições

| Indicador | Definição inicial |
|---|---|
| Lojas ativas | `loja.status = ATIVO` |
| Loja ativa 30d | teve ao menos um evento relevante nos últimos 30 dias |
| Usuário ativo 30d | usuário distinto com evento relevante nos últimos 30 dias |
| Taxa de ativação | lojas que concluíram o marco de ativação / lojas cadastradas no período |
| Marco de ativação | onboarding essencial concluído e primeiro orçamento ou OS criado |
| Conversão de orçamento | orçamentos aprovados / orçamentos enviados no período |
| Adoção de módulo | lojas ativas que executaram evento relevante do módulo / lojas com módulo habilitado |
| Retenção mensal | lojas ativas no mês anterior que também estiveram ativas no mês atual |
| Tempo até valor | tempo do cadastro até o marco de ativação |

Todas as métricas devem declarar timezone, período e regras de exclusão. O padrão de exibição é `America/Sao_Paulo`; armazenamento em UTC.

## 8. Modelo de dados proposto

Nomes finais devem seguir a convenção do schema existente.

### `admin_user`

- `id`, `nome`, `email`, `password_hash`;
- `role`, `status`;
- `two_factor_enabled`, `last_login_at`;
- timestamps.

### `admin_session`

- sessão/token revogável;
- administrador, expiração, revogação, IP e user agent.

### `admin_invitation`

- `id`, `nome`, `email`, `role`;
- `token_hash`, `expires_at`, `accepted_at`, `cancelled_at`;
- administrador que convidou;
- status derivado ou controlado: `PENDING | ACCEPTED | EXPIRED | CANCELLED`;
- timestamps e índices por e-mail/status.

### `store_user_invitation`

- `id`, `loja_id`, `usuario_id`;
- nome, e-mail, função e perfis/permissões propostos;
- `token_hash`, `expires_at`, `accepted_at`, `cancelled_at`;
- administrador que convidou;
- status e timestamps;
- índice obrigatório por loja, e-mail e status.

### `admin_audit_log`

- campos descritos em F10;
- índices por data, ator, loja e ação.

### `saas_plan`

- `id`, `code`, `name`, `description`, `active`;
- limites padrão e timestamps.

### `saas_module`

- `id`, `code`, `name`, `description`, `active`;
- dependências entre módulos em tabela associativa ou JSON validado.

### `saas_plan_module`

- plano, módulo, habilitado e limites específicos.

### `loja_subscription`

- `loja_id`, `plan_id`;
- status, início/fim de trial, início/fim de vigência;
- cancelamento e motivo;
- fornecedor externo/ID externo futuramente.

### `loja_module_entitlement`

- `loja_id`, `module_id`;
- habilitado, origem (`PLAN | OVERRIDE | TRIAL`);
- vigência, limite sobrescrito e motivo.

### `product_usage_event`

- contrato definido em F07;
- índices por `(loja_id, occurred_at)`, `(event_name, occurred_at)` e `(usuario_id, occurred_at)`;
- política de retenção definida antes de produção.

### `loja_usage_daily`

Agregado diário por loja para evitar consultas pesadas nas tabelas transacionais:

- data, loja;
- usuários ativos, eventos e dias ativos;
- contadores por domínio;
- `last_activity_at`;
- versão da regra de agregação.

### `loja_internal_note`

- loja, autor, categoria, conteúdo, fixada e timestamps.

### Campos complementares

Adicionar `last_login_at` ao usuário somente se a captura de eventos não atender às telas operacionais. Para trial, preferir uma data final derivável e não manter dois valores divergentes (`trial_restante_dias` versus datas) sem uma fonte de verdade explícita.

## 9. API administrativa inicial

Prefixo sugerido: `/api/admin/v1`.

```text
POST   /auth/login
POST   /auth/2fa/verify
POST   /auth/logout
GET    /administrators
PATCH  /administrators/:id
POST   /administrator-invitations
GET    /administrator-invitations
POST   /administrator-invitations/:id/resend
DELETE /administrator-invitations/:id
POST   /administrator-invitations/:token/accept
GET    /dashboard/summary
GET    /dashboard/timeseries
GET    /stores
GET    /stores/:id
PATCH  /stores/:id/status
GET    /stores/:id/usage
GET    /stores/:id/users
POST   /stores/:id/user-invitations
GET    /stores/:id/user-invitations
PATCH  /stores/:id/user-invitations/:invitationId
POST   /stores/:id/user-invitations/:invitationId/resend
DELETE /stores/:id/user-invitations/:invitationId
POST   /store-user-invitations/:token/accept
PATCH  /stores/:id/users/:userId/status
GET    /stores/:id/modules
PUT    /stores/:id/subscription
PUT    /stores/:id/modules/:moduleCode
GET    /stores/:id/audit
GET    /stores/:id/notes
POST   /stores/:id/notes
GET    /plans
POST   /exports/stores
GET    /audit
```

Requisitos:

- validação DTO;
- paginação cursor ou offset consistente;
- filtros no servidor;
- rate limit específico;
- RBAC por rota e por ação;
- correlation ID;
- respostas sem segredos;
- OpenAPI;
- testes de isolamento entre tenants e de autorização administrativa.

## 10. Regras de segurança e privacidade

- O painel não pode aceitar `loja_id` do cliente como prova de autorização.
- Queries administrativas devem ser explícitas e ficar em módulo separado.
- Queries normais continuam sempre limitadas ao `loja_id` do token.
- Senhas e segredos nunca aparecem na UI ou auditoria.
- Dados pessoais devem ser minimizados e mascarados conforme perfil.
- Exportações devem expirar e ser auditadas.
- Acesso excepcional a detalhes da loja deve exibir aviso e motivo.
- Não implementar “entrar como usuário” no MVP. Se necessário depois, usar sessão de impersonação explícita, temporária, somente leitura por padrão e fortemente auditada.
- Bloqueio de loja deve revogar sessões.
- Alterações críticas podem exigir reautenticação.
- Definir retenção e descarte de telemetria conforme LGPD antes da produção.

## 11. Requisitos não funcionais

- Lista e dashboard devem responder em até 2 s no p95 para o volume inicial.
- Métricas podem ter defasagem máxima de 15 minutos no MVP.
- Ação de bloqueio deve surtir efeito em até 1 minuto, idealmente imediato.
- Toda mutação crítica deve ser idempotente ou protegida contra duplo clique.
- Datas armazenadas em UTC e apresentadas no timezone configurado.
- Interface responsiva, priorizando desktop.
- WCAG AA nas telas principais.
- Dashboards não devem consultar grandes tabelas operacionais sem agregação/indexação.
- Erros devem ser observáveis por correlation ID, sem vazar detalhes internos.

## 12. Experiência das telas

### Visão geral

Topo com período e filtros; cards de situação; gráficos de tendência; listas “precisam de atenção” e “atividade recente”.

### Lojas

Tabela densa e legível, busca persistente, chips de status e painel de filtros. Ações destrutivas não devem ficar expostas como clique único.

### Detalhe

Cabeçalho fixo com nome, status, plano, saúde e última atividade. Abas organizam os dados. Ações críticas ficam em menu próprio, com confirmação que mostra o impacto.

### Confirmação de bloqueio/inativação

Exibir:

- loja alvo;
- estado atual e futuro;
- impacto no acesso;
- seletor de motivo;
- justificativa obrigatória;
- confirmação final.

## 13. Critérios de aceite do MVP

1. Somente administradores autorizados acessam `/gestao` e `/api/admin/v1`.
2. É possível listar, buscar, filtrar e abrir qualquer loja.
3. A tela da loja apresenta cadastro, usuários, status, trial/assinatura e métricas essenciais.
4. Um operador autorizado consegue ativar, inativar e bloquear uma loja.
5. Loja inativa/bloqueada perde acesso no login e em sessão já existente.
6. Toda alteração crítica aparece na auditoria com ator, motivo e antes/depois.
7. O dashboard apresenta números consistentes com as definições deste documento.
8. Métricas são isoladas por loja e testadas contra vazamento entre tenants.
9. É possível atribuir plano e habilitar/desabilitar módulos.
10. Backend bloqueia módulo desabilitado, independentemente do menu frontend.
11. A lista filtrada pode ser exportada por perfil autorizado.
12. Nenhuma ação do MVP exclui definitivamente dados da loja.
13. Um `SUPER_ADMIN` pode convidar um administrador informando nome, e-mail e perfil, e acompanhar, reenviar ou cancelar o convite.
14. Um administrador com permissão pode selecionar uma loja e convidar um usuário informando nome, e-mail, função e permissões.
15. O convidado define a própria senha por link de uso único; nenhuma senha é enviada por e-mail.
16. Convites expirados, cancelados ou já utilizados não podem ser aceitos.
17. Convites administrativos e de loja geram auditoria em todas as mudanças de estado.

## 14. Fases de implementação

### Fase 0 — Contratos e segurança

- confirmar papéis e matriz de permissão;
- decidir fonte de verdade de trial/assinatura;
- inventariar módulos e eventos;
- criar ADR sobre identidade administrativa;
- testes de status da loja em autenticação e requests;
- definir retenção LGPD.

### Fase 1 — Controle operacional mínimo

- `admin_user`, autenticação e RBAC;
- convite por nome, e-mail e perfil para administradores;
- convite por nome, e-mail e função para usuários vinculados a uma loja;
- auditoria append-only;
- lista e detalhe básico de lojas;
- ativar, inativar e bloquear;
- revogação de sessões;
- dashboard com contagens obtidas das entidades existentes.

**Esta é a menor entrega segura e útil.**

### Fase 2 — Adoção e sucesso do cliente

- eventos de uso;
- agregado diário;
- métricas por loja;
- saúde e alertas;
- observações internas;
- exportação.

### Fase 3 — Comercial e produto

- planos, módulos, entitlements e limites;
- histórico de assinatura;
- dependências de módulos;
- trial automatizado;
- integração futura com cobrança.

### Fase 4 — Escala

- alertas automáticos e notificações;
- tarefas de acompanhamento;
- coortes e retenção avançada;
- webhooks;
- suporte assistido/impersonação segura, somente se necessário;
- observabilidade e SLOs do SaaS.

## 15. Backlog priorizado

### P0 — obrigatório

- isolamento da área administrativa;
- RBAC;
- auditoria;
- lista/detalhe;
- controle de status;
- revogação de sessão;
- indicadores básicos;
- testes de segurança multi-tenant.

### P1 — importante

- telemetria de eventos;
- usuários ativos e última atividade;
- saúde/alertas;
- planos/módulos;
- observações;
- exportação.

### P2 — evolução

- billing automatizado;
- coortes;
- automações;
- filtros salvos;
- tarefas e responsáveis;
- impersonação controlada;
- API/webhooks externos.

## 16. Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Vazamento entre lojas | testes de tenant, filtros obrigatórios e revisão de queries |
| Token antigo funciona após bloqueio | verificar status em request e revogar sessões |
| Dashboard degrada banco transacional | eventos, agregados diários, índices e cache curto |
| Métricas divergentes | glossário único, versão das regras e testes de reconciliação |
| Dois controles de assinatura/trial | definir fonte de verdade antes da migration |
| Admin com poder excessivo | RBAC, 2FA, reautenticação e auditoria |
| Desabilitar menu sem bloquear API | entitlement obrigatório no backend |
| Auditoria contendo segredo | sanitização e allowlist de campos |
| Score de saúde enganoso | regras visíveis e fatores explicáveis |

## 17. Decisões pendentes antes de codificar

1. Quem serão os primeiros administradores e quais papéis são realmente necessários?
2. A identidade administrativa ficará em tabela separada ou provedor de identidade externo?
3. Qual é a fonte de verdade atual da assinatura?
4. Quais módulos comerciais existem no lançamento e quais dependências são oficiais?
5. Qual é o marco de ativação da loja para o negócio?
6. Quais valores financeiros podem aparecer para suporte, operação e analistas?
7. Qual retenção será adotada para eventos, auditoria e exportações?
8. Loja inativa pode acessar uma tela de cobrança ou fica totalmente impedida?
9. O trial é prorrogável? Quem pode prorrogá-lo e por quanto tempo?
10. Quais lojas internas/demonstração devem ser excluídas das métricas?

As perguntas não impedem a construção da Fase 1, desde que sejam usados defaults conservadores e feature flags.

## 18. Orientação para o próximo agente

Antes de implementar:

1. ler este documento, `docs/arquitetura-modulos.md` e `docs/cadastro-loja-usuario.md`;
2. inspecionar `backend/prisma/schema.prisma`, `backend/src/auth` e `backend/src/lojas`;
3. localizar todos os pontos de emissão/validação do JWT;
4. conferir instruções locais em `AGENTS.md`, se existirem;
5. registrar as decisões da seção 17;
6. propor migrations aditivas, sem reutilizar `usuario` como administrador global por conveniência;
7. começar pelos testes de autorização e bloqueio, depois API e interface;
8. não implementar exclusão de loja nem impersonação no primeiro ciclo.

### Entregável recomendado para o primeiro PR

- modelos de administrador, sessão e auditoria;
- modelos e endpoints de convite administrativo;
- guard/RBAC da área administrativa;
- validação central do status da loja;
- endpoints de lista, detalhe e mudança de status;
- revogação de sessão ao bloquear/inativar;
- testes unitários/e2e de autorização e isolamento;
- documentação OpenAPI;
- sem dashboard visual ainda, se isso reduzir o risco e acelerar a base segura.

## 19. Definição de pronto

Uma funcionalidade só está pronta quando:

- possui autorização backend;
- respeita isolamento multi-tenant;
- tem validação e tratamento de erro;
- gera auditoria quando altera estado;
- possui testes de caminho feliz e negação;
- está documentada;
- possui estado de loading/erro/vazio no frontend;
- passou por revisão de privacidade;
- não depende apenas de restrição visual.
