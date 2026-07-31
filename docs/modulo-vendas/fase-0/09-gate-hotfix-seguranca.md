# Gate 0S — Hotfix de segurança anterior ao Módulo de Vendas

**Status:** [x] em execução — HS-01 concluído; HS-02, HS-03, HS-04 e HS-05 parcialmente entregues; HS-06 pendente (ver §2.0, §2.1 e §2.2)
**Natureza:** correção obrigatória do legado existente; não é fase funcional de Vendas
**Bloqueia:** Fases 1 a 14 e qualquer nova rota, card ou navegação de Vendas
**Origem:** DV-13, DV-16 e achados D-01, D-02 e D-08 da auditoria
**Referências:** RP §§4.10, 9, 10 e 15; artefatos 01–05 da Fase 0

---

## 1. Objetivo e regra de parada

Eliminar exposições já presentes em Orçamentos V2 antes de ampliar sua superfície.
O gate só termina com evidência automatizada de autorização efetiva, isolamento por
loja, fronteira pública única, segredo seguro e mutações resistentes a repetição e
concorrência.

Se uma correção depender de contrato ou migration ainda não aprovado para uso, o
comportamento vulnerável deve ser **negado/desabilitado de forma segura** até a fase
responsável. Não é permitido manter fail-open, bypass temporário ou validação apenas
no frontend.

## 2.0 Decisões operacionais ratificadas na execução

Dois achados de código exigiram decisão antes de implementar o HS-01. Ambos estão
resolvidos e registrados aqui para servirem de contrato de revisão.

### Piso de autorização por função (aprovado pelo PO)

`perfil_permissao` está vazia em produção: o `seed.ts` não a popula, nenhuma migration
insere linhas e a tela `usuarios/perfis/novo` é maquete — os checkboxes não guardam
estado e o botão de salvar não submete. Aplicar negação por padrão apenas sobre
`perfil_permissao` deixaria somente administradores operando Orçamentos V2.

Decisão: a autorização é a **união** entre o piso concedido por `usuario_funcao` e o
que estiver explicitamente cadastrado em `perfil_permissao`. Nada além disso é
permitido. O piso espelha a matriz de perfis do artefato 03 §4:

| Função | Permissões comerciais no piso |
| --- | --- |
| `ADMINISTRADOR` | todas do catálogo mínimo |
| `VENDAS` | ver, criar, editar, enviar, aceite.registrar |
| `FINANCEIRO` | ver |
| `PRODUCAO` | nenhuma |
| `ESTOQUE` | nenhuma |

Mudança de comportamento: hoje qualquer usuário autenticado fecha pedido e gera OS.
Após o hotfix, `PRODUCAO` e `ESTOQUE` perdem acesso comercial e `FINANCEIRO` fica em
leitura. O risco prático é nulo no momento porque a base ativa só possui usuários
administradores; quem precisar de exceção passa a recebê-la por `perfil_permissao`,
que agora é efetivamente consultada.

## 2.1 Fronteira pública: o que o HS-03 encontrou

A allowlist do `JwtGlobalMiddleware` e o decorador `@Public()` divergiam nos dois
sentidos, e cada sentido exigiu tratamento diferente.

**Aberto pelo middleware, sem declaração no handler.** Seis rotas anônimas de fato
não diziam isso no código: as três de `arte-aprovacao/links/public`, as duas de
`arte-aprovacao/mensagens/publico`, o callback OAuth do Google e o changelog
público. Receberam `@Public()`. Nenhuma mudança de acesso: apenas a declaração
passou a corresponder ao comportamento.

**Declarado `@Public()`, mas bloqueado pelo middleware.** Seis rotas de chat com o
cliente final — três em `orcamentos-v2` e três em `mensagens-negociacao` — nunca
constaram da allowlist e já respondiam `401`. Elas **não** foram abertas: abrir
exigiria token vinculado, DTO tipado e rate limit, que são o restante do HS-03 e o
HS-04. A declaração foi alinhada ao comportamento efetivo e as rotas seguem
autenticadas, agora com permissão comercial exigida. O contrato de chat com o
cliente final pertence às fases funcionais.

**Entradas mortas removidas:** `/lojas/health`, `/api/estoque/health` e
`/arte-aprovacao/comentarios/public` não correspondiam a nenhuma rota registrada.

**Endurecimento adicional:** o catálogo casa método e caminho exatos. A allowlist
anterior ignorava o método e liberava qualquer subcaminho por prefixo, de modo que
`/arte-aprovacao/links/public` abria tudo abaixo dele. `HEAD` é tratado como `GET`,
porque o Express roteia os dois para o mesmo handler.

### Ratificações pendentes para a Fase 2

- `vendas.proposta.excluir` foi acrescentada ao catálogo mínimo porque o endpoint
  `DELETE /orcamentos-v2/:id` já existe e a matriz do artefato 03 não previa ação
  destrutiva de proposta. No piso, só administrador exclui.
- A cobertura HTTP é feita pelo `VendasPermissionsGuard`, que nega endpoint sem
  `@RequerPermissaoVendas` e sem `@Public()`. O artefato 03 §2 exige `assertPode`
  dentro do service; isso foi mantido nas mutações mais sensíveis (`alterarStatus`,
  `fecharPedidoInterno`, `removerOrcamento`), que são as que podem receber chamada
  interna. Estender a checagem ao restante do service exigiria propagar `usuario_id`
  por assinaturas que hoje não o recebem, o que fica para a Fase 2.

## 2.2 Código de aprovação: o que mudou para quem usa o sistema

O contrato seguro tem efeito visível e precisa ser comunicado ao suporte antes do
deploy.

**Todos os códigos em circulação param de funcionar.** A migration zera os códigos
antigos. Cliente que tentar usar o código de um e-mail já recebido verá a mensagem
genérica de código inválido e deverá clicar em "Reenviar Código" na página da
proposta, ou pedir o reenvio à equipe comercial.

**O código deixou de ser digitável.** Eram 8 caracteres maiúsculos; agora são 43
caracteres que diferenciam maiúsculas de minúsculas. O e-mail e a página pública
foram ajustados para copiar e colar, e o campo perdeu a conversão automática para
maiúsculas — ela corromperia o token.

**Emitir é sempre reemitir.** Existe no máximo um código válido por orçamento. Enviar
a proposta, reenviar o código ou editar uma proposta já enviada gera um código novo e
derruba o anterior. Isso mantém o segredo amarrado à versão vigente da proposta, mas
significa que o cliente deve usar sempre o último e-mail recebido.

**Mudança de responsabilidade na emissão.** Alterar o status para "enviado" não gera
mais código. Emitir só faz sentido junto com a entrega, porque o valor em claro existe
apenas naquele instante — o banco guarda somente o hash. Quem emite é o envio da
proposta, o reenvio e o aviso de proposta atualizada.

**Limites que o suporte vai encontrar.** Cinco requisições públicas por minuto para o
mesmo par orçamento+IP, somando ações e reenvios; dez tentativas erradas travam o
código do orçamento até uma nova emissão.

### Bug corrigido junto: autor da ação chegava indefinido

`JwtGlobalMiddleware` grava `req.user.sub` e `JwtAuthGuard` grava `req.user.id`;
nenhum dos dois grava `user_id`. Como o controller desestruturava `user_id` e
`usuario_id`, todas as trilhas de auditoria de criação, envio, alteração de status,
exclusão e duplicação de orçamento gravavam autor indefinido. A identidade passou a
ser extraída por `extrairIdentidadeAutenticada`, fonte única que aceita as duas formas
e recusa sessão incompleta.

## 2. Escopo obrigatório

### HS-01 — Autorização efetiva em Orçamentos V2

- [x] Inventariar todos os endpoints e classificá-los por leitura, escrita, ação
      sensível e acesso público intencional. *(Sete controllers de Orçamentos V2;
      a fronteira pública ficou registrada em `common/security/rotas-publicas.ts`.)*
- [x] Proteger no backend todas as operações autenticadas com o padrão
      `VendasPermissionsService`/`assertPode()`, usando o catálogo mínimo necessário
      do artefato 03.
- [x] Derivar `usuario_id`, `loja_id`, função e versão de sessão exclusivamente da
      identidade autenticada; ignorar valores equivalentes enviados pelo cliente.
      *(Exceto versão de sessão, que segue validada só no middleware.)*
- [x] Negar por padrão permissão inexistente, perfil inválido, usuário/loja inativos
      e recurso de outra loja.
- [x] Manter `usuario_funcao` como fonte canônica; não ativar `RolesGuard` global e
      não tratar `@Roles` legado como autorização. *(`@Roles` removido de
      `orcamentos-v2.controller.ts` e `links-v2.controller.ts`; piso por função em
      `vendas-permissoes.ts`.)*
- [x] Garantir paridade entre controller, jobs e chamadas internas: nenhum caminho
      alternativo pode contornar o service autorizado. *(Não há job comercial; as
      mutações sensíveis reforçam `assertPode` no service.)*

**Entregue:** os sete controllers de Orçamentos V2 — `orcamentos-v2`, `links-v2`,
`chat-v2`, `calculo-v2`, `impressao-v2`, `produto-detalhes` e `anexo-geometria` —
declaram permissão por endpoint e são cobertos pelo `VendasPermissionsGuard`, que
nega endpoint sem declaração.

**Falta:** a versão de sessão ainda não participa da decisão de autorização; segue
validada apenas no `JwtGlobalMiddleware`.

**Desempenho:** carregar permissões em consulta indexada e projeção mínima. Cache
curto só é permitido por `(loja_id, usuario_id, session_version)`, com invalidação em
alteração de usuário, perfil, permissão ou sessão. Revogação nunca pode depender do
TTL para produzir efeito.

### HS-02 — Isolamento multi-tenant e IDOR

- [x] Corrigir `links-v2.service.ts` e toda busca/mutação por ID para incluir
      `loja_id` derivado do contexto autorizado quando o fluxo for autenticado.
      *(Além de `links-v2`: `chat-v2` e `impressao-v2` deixaram de resolver
      orçamento por `findUnique({ id })`; `produto-detalhes` escopa pelo orçamento
      da loja; `marcarMensagemVisualizadaPublica` passou a vincular a mensagem ao
      orçamento; o cálculo em lote recarrega os orçamentos em vez de aceitar o
      objeto enviado pelo cliente.)*
- [ ] Revisar relações carregadas por `include`/`select` para impedir retorno
      indireto de cliente, proposta, anexo, acesso ou orçamento de outra loja.
- [x] Não diferenciar publicamente “não existe” de “existe, mas não pertence à
      loja”; usar resposta estável que não permita enumeração. *(Em `links-v2`,
      orçamento de outra loja e usuário inválido retornam o mesmo `404`.)*
- [ ] Testar leitura, alteração, aceite, geração de link e recurso relacionado com
      dois tenants reais de teste. *(Coberto em teste unitário de autorização;
      falta a integração com dois tenants.)*

### HS-03 — Fronteira pública única e mínima

- [x] Eleger uma única fonte de verdade para rotas públicas e eliminar a divergência
      entre `@Public()` e a allowlist do middleware.
      *(`common/security/rotas-publicas.ts` é o catálogo; o `JwtGlobalMiddleware`
      decide só por ele e o `RotasPublicasValidator` recusa a inicialização se
      alguma rota liberada não estiver declarada `@Public()` no handler.)*
- [x] Manter públicas somente as rotas indispensáveis ao fluxo vigente, documentadas
      por método e caminho; qualquer rota não listada exige autenticação.
      *(Ver §2.1 para o que saiu da fronteira.)*
- [x] Trocar bodies inline/`any` por DTOs tipados, `class-validator`, whitelist e
      rejeição de campos excedentes nas ações públicas.
      *(`AcaoClientePublicoDto`. As duas rotas anônimas de proposta são
      `POST :id/publico/acao` e `POST :id/reenviar-codigo`; a segunda não tem corpo.)*
- [x] Aplicar limite de tamanho, rate limit por finalidade e defesa contra
      enumeração. IP não pode ser a única chave de contenção.
      *(Limitador em `main.ts`, no mesmo padrão `express-rate-limit` já usado pelas
      rotas sensíveis do financeiro e do admin: chave por par (orçamento, IP), 5
      requisições por minuto em produção. A contenção que não depende de IP é o
      contador `codigo_aprovacao_tentativas`, gravado na linha do orçamento.)*
- [x] Retornar erros públicos genéricos, sem status interno, existência de conta,
      stack trace, ID interno ou detalhe de autorização.
      *(`CODIGO_APROVACAO_ERRO_PUBLICO` e `ACAO_PUBLICA_ERRO_GENERICO`. Orçamento
      inexistente, de status incompatível e código errado devolvem o mesmo texto; o
      reenvio devolve a mesma resposta de sucesso em qualquer recusa.)*
- [ ] Obter IP e user-agent da requisição por política de proxy confiável; nunca da
      query string fornecida pelo chamador. *(`main.ts` já define
      `trust proxy = 1`, mas falta a varredura dos pontos que leem
      `x-forwarded-for` diretamente.)*

### HS-04 — Tokens, códigos e dados sensíveis

- [x] Remover `Math.random()` de qualquer segredo de aprovação.
      *(`gerarCodigoAprovacao` foi excluído.)*
- [x] Gerar segredo com CSPRNG e entropia adequada; persistir somente hash com
      comparação resistente a timing.
      *(`common/security/codigo-aprovacao.ts`: `randomBytes(32)` em base64url,
      SHA-256 no banco e `timingSafeEqual` na comparação. O valor em claro existe
      apenas entre a emissão e o envio do e-mail.)*
- [x] Vincular o segredo à finalidade e ao orçamento/versão aplicável, com expiração,
      revogação, uso único e limite de tentativas.
      *(O hash mora na linha do orçamento, então serve só àquele orçamento. Expira em
      30 dias — mesma validade da proposta —, é revogado ao cancelar/rejeitar, é
      consumido uma única vez e trava em 10 tentativas. Editar a proposta reemite o
      código, o que amarra o segredo à versão vigente.)*
- [x] Invalidar códigos legados ativos que não atendam ao contrato ou forçar sua
      reemissão segura.
      *(A migration `20260731143000_orcamento_codigo_aprovacao_seguro` zera todos os
      `codigo_aprovacao` em texto claro. Sem backfill: um código de ~41 bits não vira
      segredo válido só por ser hasheado. A reemissão é sob demanda, pelo botão de
      reenvio na página pública ou pelo reenvio da proposta.)*
- [ ] Remover código, token, senha e dados pessoais desnecessários de logs,
      telemetria, erros e auditoria; revisar também logs históricos acessíveis.
      *(Parcial: `LinksV2Service.acessarLinkPublico` não registra mais o token, o
      `console.log` que imprimia o código de aprovação em bloco foi removido e a
      listagem autenticada deixou de devolver `codigo_aprovacao` no corpo da resposta.
      Falta a varredura dos logs de depuração remanescentes em `orcamentos-v2` e a
      revisão dos logs históricos já gravados.)*

O contrato aprovado pelo PO foi o **seguro completo com migration aditiva**, mantendo
o aceite público funcionando. O meio-termo em texto claro está rejeitado por não
encerrar o HS-04; a desativação total permanece apenas como contingência de rollout
caso o fluxo seguro apresente falha crítica. O aceite B2B completo (contato aprovador
e versão imutável) continua nas Fases 1, 4, 6 e 8 — o hotfix não simula essa
autoridade.

**Rollout expand-and-contract.** Etapas 1 a 4 (adicionar campos, emitir tokens novos,
ler pelo hash, invalidar o legado) estão nesta entrega. A etapa 5 — remover a coluna
`codigo_aprovacao` e seu índice único — fica para entrega posterior. Não há período de
leitura dupla: a leitura já nasce apontando só para o hash. O rollback é fail-closed
por construção, porque a invalidação do texto claro é irreversível; reverter a
migration desativa o aceite público em vez de reabri-lo com segredo fraco.

### HS-05 — Atomicidade, idempotência e concorrência do aceite existente

- [ ] Centralizar os caminhos interno e público em um único caso de uso no backend.
      *(Não feito. `processarAcaoClientePublico` e `fecharPedidoInterno` continuam
      separados. Unificar exige o contrato de aceite das fases funcionais.)*
- [x] Impedir que repetição, clique duplo ou requisições concorrentes criem mais de
      uma OS, cobrança ou efeito equivalente para o mesmo aceite.
      *(No caminho público, o consumo do código é a chave de idempotência: só uma
      requisição marca `codigo_aprovacao_usado_em`, e as demais recebem o estado atual
      sem disparar efeito. Coberto por teste de clique duplo.)*
- [x] Usar garantias estruturais já disponíveis (`@unique`) e transação curta para
      estado e efeitos locais. Consulta prévia isolada não é idempotência.
      *(A serialização vem de dois `UPDATE ... WHERE` condicionais dentro de um
      `$transaction`: um exige "não usado, não revogado, não expirado e abaixo do
      limite"; o outro exige o status de origem. Nenhuma decisão depende de leitura
      anterior.)*
- [x] Não silenciar falha parcial. Se um efeito não puder compartilhar transação,
      registrar estado recuperável e processamento idempotente; não afirmar sucesso
      antes da conclusão contratada.
      *(Falha na geração da OS reverte status e consumo do código juntos e responde
      erro — o cliente continua com um código utilizável em vez de ficar sem saída.
      Falha na cobrança segue não revertendo a aprovação, como já era, e é registrada
      para tratamento manual.)*
- [x] Não executar e-mail, webhook ou rede externa dentro de transação de banco.
      *(A transação cobre apenas os dois UPDATEs. OS, cobrança e notificação rodam
      depois dela.)*
- [ ] Gravar auditoria sanitizada na mesma transação da mutação sensível.
      *(Bloqueado: `registrarLog` só escreve no logger. Persistir auditoria em
      `OrcamentoLog` é pré-requisito e não estava no recorte desta entrega.)*

O hotfix estabiliza o aceite existente. `pedido_comercial`, snapshot contratual,
evidência B2B completa, gates e novos handoffs continuam nas fases previstas; não
devem ser criados antecipadamente apenas para encerrar este gate.

### HS-06 — Observabilidade sem vazamento

- [ ] Registrar negações, rate limit, token inválido/expirado, conflito de
      idempotência e falha de handoff com correlação e campos sanitizados.
- [ ] Definir métricas agregadas e alertas para aumento anormal de `401`, `403`,
      `404` público, `429`, conflitos e falhas parciais.
- [ ] Proibir alta cardinalidade por token, e-mail, documento, IP bruto ou payload.
- [ ] Documentar procedimento de rollback que preserve a negação por padrão.

## 3. Fora do escopo do hotfix

- Criar navegação, home, cards, KPIs ou telas do novo módulo.
- Implantar carteira, contatos, pipeline, `status_comercial`, gates ou alçadas.
- Criar `pedido_comercial`, nova versão de proposta ou automação comercial.
- Corrigir o RBAC global de todos os módulos ou ativar `RolesGuard` global.
- Fazer drops/renomes destrutivos ou migrations especulativas.
- Declarar validade jurídica de assinatura eletrônica.

## 4. Testes e evidências obrigatórias

- [ ] Matriz endpoint × público/autenticado × permissão × tenant revisada.
- [x] Testes unitários de permissão, token, expiração, tentativas e sanitização.
      *(`vendas-permissions.service.spec.ts` para permissão;
      `codigo-aprovacao.spec.ts`, 11 casos, para entropia, hash, expiração UTC e
      comparação; `orcamentos-v2-aceite-publico.spec.ts`, 12 casos, para código
      inválido, expirado, revogado, teto de tentativas, ausência de código e resposta
      sem vazamento do segredo.)*
- [ ] Integração com dois tenants cobrindo leitura e mutação por IDs trocados.
- [x] Testes por persona: sem permissão, vendedor, gestor e administrador.
      *(`vendas-permissions.service.spec.ts`, 15 casos: piso por função, perfil ativo
      e inativo, outra loja, usuário inativo e inexistente.)*
- [x] Concorrência/retry comprova no máximo um conjunto de efeitos por aceite.
      *(`orcamentos-v2-aceite-publico.spec.ts`: clique duplo com o mesmo código gera
      uma única OS e devolve a mesma resposta. O teste simula as condições dos
      `updateMany`; falta o ensaio com concorrência real em banco.)*
- [x] Rotas não declaradas públicas retornam autenticação obrigatória.
      *(`rotas-publicas.spec.ts`, 39 casos, e `rotas-publicas.validator.spec.ts`,
      que inicializa o `AppModule` real e falha se houver divergência.)*
- [ ] Erros e logs não contêm token, código, stack, payload sensível ou status
      interno indevido.
- [ ] Teste de carga focado no caminho de autorização demonstra ausência de N+1 e
      regressão aceitável registrada; consultas críticas possuem plano/índice
      revisado quando aplicável.
- [ ] Testes do backend afetado, validação Prisma quando houver schema, typecheck,
      build e `git diff --check` aprovados.

## 5. Gate de conclusão

- [ ] HS-01 a HS-06 concluídos com evidência vinculada no PR.
- [ ] Nenhuma vulnerabilidade P0/P1 do escopo permanece aberta sem contenção que
      negue o comportamento vulnerável.
- [ ] Revisão de segurança independente confirma OWASP, tenant e menor privilégio.
- [ ] Rollback testado e incapaz de reabrir acesso fail-open.
- [ ] RP, plano, OpenAPI e matriz de rastreabilidade refletem o comportamento final.
- [ ] **GATE 0S CONCLUÍDO — FASE 1 LIBERADA.**

