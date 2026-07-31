# Gate 0S — Hotfix de segurança anterior ao Módulo de Vendas

**Status:** [x] em execução — **o gate NÃO está concluído**
**Situação por item:** HS-01 e HS-05 concluídos; HS-04 concluído no código e validado
em banco real (§2.7), restando apenas a revisão dos logs históricos de produção;
HS-06 concluído exceto métricas e alertas, bloqueados por ausência de backend de
observabilidade; HS-02 e HS-03 parcialmente entregues. Detalhamento em §2.0 a §2.8 e
critérios de saída em §5.
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

**Emissão só onde há entrega, e no máximo um código válido por vez.** Alterar o status
para "enviado" não gera mais código: emitir só faz sentido junto com a entrega, porque
o valor em claro existe apenas naquele instante. Os três pontos de emissão são o envio
inicial, o reenvio solicitado e o envio da proposta atualizada — e cada um derruba o
código anterior.

**Editar uma proposta enviada revoga o código na hora.** A revogação é incondicional e
acontece antes da tentativa de envio. Se o aviso de atualização não puder ser entregue
— cliente sem e-mail cadastrado, falha de SMTP —, a proposta fica sem código utilizável
até um reenvio explícito. É a direção segura: melhor exigir reenvio do que manter um
código válido apontando para uma versão da proposta que não existe mais.

**Limites que o suporte vai encontrar.** Nas rotas públicas de proposta valem dois
limites por minuto: 5 requisições para o mesmo par (orçamento, IP) e 20 para o mesmo
IP em qualquer orçamento. Além disso, 10 tentativas erradas travam o código daquele
orçamento até uma nova emissão.

**Plano de comunicação antes do deploy.** Nesta ordem, para o cliente final: abrir o
link recebido no e-mail; copiar e colar o código, nunca digitá-lo. Para a equipe
comercial: propostas ainda aguardando resposta precisam de reenvio explícito.

Não há reemissão automática em massa, por decisão registrada: disparar e-mail para
toda a base de propostas abertas geraria mensagem inesperada e duplicidade de
comunicação. A reemissão é sob demanda — pelo botão "Reenviar Código" na página da
proposta ou pelo reenvio manual da equipe. Se uma campanha de reemissão for desejada,
ela é uma decisão operacional separada.

## 2.3 Contrato de manuseio do token no cliente

Aprovado pelo PO. **Magic link está fora deste contrato** e não deve ser implementado
sem decisão específica: "seguir o link recebido" significa abrir a página pública pelo
e-mail e colar o token separadamente.

| Regra | Como está garantida |
| --- | --- |
| URL sem token, código ou segredo | O link do e-mail é `/orcamento-v2/{id}`, sem parâmetro |
| Token entregue no corpo do e-mail | `MailService.blocoCodigoAprovacao` |
| Página pública recebe por formulário | Campo controlado no diálogo de aprovação |
| Envio apenas por POST, nunca em query string ou path | `POST /api/orcamentos-v2/{id}/publico/acao`, token no corpo JSON |
| Sem conversão automática para maiúsculas | O `onChange` não transforma o valor |
| Sem `localStorage`, `sessionStorage`, cookie ou estado na URL | Auditado: o token só existe no `useState` do componente |
| Limpar o campo após o envio | `setCodigoAprovacao('')` no `finally`, em sucesso ou falha |
| `Referrer-Policy: no-referrer` | `next.config.mjs` para `/orcamento-v2/:id`; o Nginx do app já enviava |
| `Cache-Control: no-store` | `next.config.mjs` na página e nas duas rotas de proxy |
| Página não indexável | `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet` |
| Logs sem corpo nem token | Proxies do Next logam só `error.name`; a página não loga o objeto de erro |
| Mensagens genéricas | Ver §2.6 |

Por que o token fica fora da URL: query string vaza por histórico do navegador,
cabeçalho `Referer` e log de acesso do proxy — exatamente os canais que este hotfix
está fechando. Pelo mesmo motivo a limpeza do campo acontece também quando a
requisição falha: recolar custa menos do que manter o segredo vivo na memória da aba.

## 2.4 Dois defeitos encontrados na auditoria deste contrato

**O botão "Reenviar Código" respondia 405.** O arquivo
`frontend/src/app/api/orcamentos-v2/[id]/reenviar-codigo/route.ts` estava **vazio** e
versionado desde `5cd857a2`. Um `route.ts` sem exports faz o Next registrar a rota sem
nenhum método e responder 405, além de ter precedência sobre o rewrite de fallback que
levaria ao Nest. O defeito é anterior ao Gate 0S, mas passou a ser crítico: com os
códigos legados invalidados, o reenvio é o caminho de recuperação de todo cliente com
proposta aberta. O handler foi implementado.

**O rate limit estava cego para o IP do cliente.** O navegador chama `/api/*`, que o
Nginx encaminha ao BFF do Next (`127.0.0.1:3001`); o route handler abre uma **conexão
nova** para o Nest (`BACKEND_URL`, `127.0.0.1:4001`) sem repassar `X-Forwarded-For`.
O Nest via, portanto, o IP do processo Next em toda requisição pública, e as duas
chaves do §2.5 colapsavam em uma só. O efeito prático era pior do que ausência de
limite: o teto por IP viraria um **limite global** de 20 requisições por minuto para
todos os clientes somados, negando serviço a quem tem proposta legítima.

Corrigido em `frontend/src/lib/client-ip.ts`, que repassa o IP do cliente. A origem é
confiável porque o Nginx **sobrescreve** `X-Forwarded-For` com `$remote_addr` na borda
(`deploy/nginx/snippets/comunikapp-app-proxy.conf`), em vez de anexar — o chamador não
escolhe o valor. O valor é validado antes do repasse.

- [ ] **Validar em produção** que `req.ip` no Nest corresponde ao IP real do cliente.
      Se o `BACKEND_URL` apontar para um host servido por Nginx, aquele Nginx
      sobrescreve `X-Forwarded-For` de novo e anula o repasse.

## 2.5 Rate limit das rotas públicas de proposta

Implementado com `express-rate-limit` em `main.ts`, o mesmo mecanismo já usado pelas
rotas sensíveis do financeiro e do admin. Uma segunda biblioteca de rate limit foi
descartada: manter dois mecanismos para o mesmo problema é dívida sem contrapartida.

**Dois limitadores encadeados**, porque cada um cobre um abuso diferente:

| Chave | Teto (produção) | Abuso que contém |
| --- | --- | --- |
| `(orçamento, IP)` | 5 por minuto | força bruta contra um orçamento específico |
| `IP` | 20 por minuto | varredura trocando o id do orçamento a cada requisição |

O limite composto sozinho não conteria enumeração — bastaria trocar o id para ganhar
um contador novo. O limite por IP sozinho puniria clientes legítimos de propostas
diferentes que saíssem pelo mesmo IP corporativo. Os dois juntos cobrem os dois casos.

**Origem do IP.** `req.ip`, resolvido pela política `trust proxy = 1` definida no
início do bootstrap. Nenhum header livre nem parâmetro de query participa da chave.
Endereços IPv6 são colapsados na /64 por `ipKeyGenerator`: sem isso, um atacante com
um bloco IPv6 residencial teria um contador novo por endereço.

**Os dois limites dependem do repasse de IP descrito em §2.4.** Se o BFF do Next
deixar de repassar `X-Forwarded-For`, ou se passar a falar com o Nest através de um
Nginx que sobrescreva o cabeçalho, as duas chaves voltam a colapsar no IP do processo
Next. Está anotado em `main.ts`, no ponto onde os limitadores são construídos.

**A chave não vaza.** Ela existe apenas no armazenamento interno do limitador. A
resposta de excesso é a mesma nos dois limitadores e não menciona o orçamento.

**Não substitui o contador persistente.** O limite de borda é complementar. Quem trava
o alvo quando o atacante troca de IP é `codigo_aprovacao_tentativas`, gravado na linha
do orçamento e compartilhado por todas as instâncias.

**Restrição de escala registrada.** O armazenamento é em memória do processo. Com mais
de uma instância do backend, o limite passa a valer por instância e o teto efetivo se
multiplica. Antes de escalar horizontalmente, os limitadores sensíveis — estes e os do
financeiro e do admin — precisam de store compartilhado, preferencialmente Redis. Está
anotado no próprio `main.ts`.

## 2.6 Alcance da indistinguibilidade das respostas públicas

Para quem **não** apresenta o código correto, todas as recusas de `APROVAR` são a mesma
resposta, com o mesmo status e o mesmo texto: código inválido, expirado, revogado,
acima do limite de tentativas, orçamento em status incompatível e orçamento
inexistente. A recusa por inexistência usa deliberadamente o texto de código inválido —
se usasse o texto genérico de ação, o endereço público viraria um verificador de IDs de
orçamento. Coberto por dois testes que comparam status e corpo das recusas.

**Uma exceção, e por que ela não é oráculo.** Código já consumido devolve o estado atual
da proposta em vez de erro. Isso é o que sustenta a idempotência exigida pelo HS-05:
clique duplo, retry do navegador e reenvio de formulário não podem gerar uma segunda OS.
O desfecho só é alcançável **depois** que a comparação de hash confirmou a posse do
segredo — quem não tem o código recebe a recusa genérica em qualquer situação. Ou seja,
o único agente capaz de distinguir "usado" de "inválido" é quem já detém o token, e para
ele isso não é informação nova.

Fica registrado o que **não** foi endereçado: o tempo de resposta ainda difere um pouco
entre orçamento inexistente (sem escrita) e código errado (que incrementa o contador de
tentativas). Explorar isso exige medição estatística sob o rate limit de 5 por minuto e
não revelaria mais do que a existência do id. Não foi tratado nesta entrega.

## 2.7 Validação da migration do HS-04 em banco real — concluída

A migration `20260731143000_orcamento_codigo_aprovacao_seguro` foi escrita à mão
porque, na entrega anterior, não havia MySQL alcançável. O banco foi encontrado
depois (instalação do XAMPP, sem serviço registrado) e a validação foi executada.

**Ambiente e método.** MariaDB 10.4.32 local. A validação **não** rodou no banco de
trabalho: foi feito um clone completo (`mysqldump` → `comunikapp_gate0s`, 126 tabelas,
108 migrations já aplicadas), de modo que o baseline fosse o real e nada do ambiente
do desenvolvedor fosse alterado.

- [x] **Aplicar a migration.** `prisma migrate deploy` aplicou as duas pendentes
      (`20260730123600_os_status_enum_unificado` e a do código seguro) sem erro.
- [x] **Inspecionar campos e índices contra o schema.** Confirmado em
      `information_schema`: `codigo_aprovacao_hash CHAR(64) NULL`,
      `codigo_aprovacao_expira_em DATETIME(3) NULL`,
      `codigo_aprovacao_tentativas INT NOT NULL DEFAULT 0`,
      `codigo_aprovacao_usado_em DATETIME(3) NULL`,
      `codigo_aprovacao_revogado_em DATETIME(3) NULL`. Nenhum índice sobre o hash —
      correto, a busca é sempre por `id` do orçamento. O `UNIQUE` legado sobre
      `codigo_aprovacao` continua existindo, como previsto pela fase *expand*.
- [x] **Invalidação dos códigos legados exercitada com dado real.** O clone tinha
      10 códigos em texto claro entre 58 orçamentos; depois da migration,
      `COUNT(codigo_aprovacao) = 0`.
- [x] **`prisma migrate status` sem drift.** Responde `Database schema is up to date!`.
      O `migrate diff` acusa 191 linhas de divergência **pré-existentes** no projeto
      (chaves estrangeiras declaradas no schema e ausentes no banco, colunas `Json`),
      nenhuma delas atribuível a esta entrega: zero menções a `codigo_aprovacao` e
      nenhuma alteração na tabela `orcamento`. Essa divergência antiga fica
      registrada em §2.8.
- [x] **Rollback fail-closed.** O DDL inverso (drop das cinco colunas) aplica sem
      erro e **não ressuscita segredo**: `COUNT(codigo_aprovacao)` permanece 0 entre
      os 58 orçamentos. No nível da aplicação o rollback também falha fechado —
      com as colunas ausentes a emissão aborta
      (`The column codigo_aprovacao_hash does not exist in the current database`),
      ou seja, nenhum aceite é concedido; não há degradação silenciosa para o
      código em texto claro.
- [x] **Emissão, expiração, revogação, uso único, teto e concorrência contra o banco
      real.** `backend/scripts/validar-codigo-aprovacao-mysql.ts` exercita os
      **métodos reais** do service contra o MySQL, não uma reimplementação das
      consultas. 13/13 verificações passaram. Os dois resultados que o simulador dos
      testes unitários não conseguia produzir:
      - 12 consumos simultâneos do mesmo código → **exatamente 1** vencedor;
      - 12 transições de status simultâneas com o `WHERE` da aprovação interna →
        **exatamente 1** transição.

## 2.8 Dívida pré-existente encontrada na validação (fora do escopo do gate)

Dois achados que **não** são do Gate 0S, mas ficaram documentados porque afetam quem
provisionar um ambiente novo:

1. **A cadeia de migrations não é reproduzível do zero.** Em banco limpo, a migration
   `20251101000100_add_workflow_categories` falha com
   `errno 150 "Foreign key constraint is incorrectly formed"`. Por isso a validação
   acima usou um clone do banco de desenvolvimento, e não um banco criado do zero.
   Enquanto isso não for corrigido, nenhum ambiente novo pode ser provisionado só com
   `prisma migrate deploy`.
2. **191 linhas de drift entre `schema.prisma` e o banco**, em chaves estrangeiras e
   colunas `Json` de tabelas alheias a vendas.

Nenhum dos dois bloqueia o Gate 0S — a migration desta entrega aplica, inspeciona e
reverte corretamente sobre o baseline real —, mas ambos precisam de dono.

### Bug corrigido junto: autor da ação chegava indefinido

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
      *(Dois limitadores encadeados em `main.ts`, no mesmo padrão `express-rate-limit`
      já usado pelas rotas sensíveis do financeiro e do admin — ver §2.5.)*
- [x] Retornar erros públicos genéricos, sem status interno, existência de conta,
      stack trace, ID interno ou detalhe de autorização.
      *(`CODIGO_APROVACAO_ERRO_PUBLICO` e `ACAO_PUBLICA_ERRO_GENERICO` — ver §2.6
      para o alcance exato da indistinguibilidade.)*
- [ ] Obter IP e user-agent da requisição por política de proxy confiável; nunca da
      query string fornecida pelo chamador. *(Feito no caminho comercial: `main.ts`
      define `trust proxy = 1` e o BFF repassa o IP validado (§2.4). Falta a varredura
      dos demais pontos que leem `x-forwarded-for` diretamente — `platform.controller`,
      `lojas.controller`, `financeiro.controller` e `admin-request-context` —, três dos
      quais usam o **primeiro** elemento do cabeçalho, padrão apontado como
      spoofável em `docs/cloudflare-hardening-plano.md` §4.)*

### HS-04 — Tokens, códigos e dados sensíveis

> Os itens marcados abaixo estão implementados e cobertos por teste unitário, mas o
> HS-04 **permanece aberto no gate** até a validação da migration em MySQL real
> descrita em §2.7.

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
      30 dias — mesma validade da proposta —, é consumido uma única vez e trava em 10
      tentativas. A revogação explícita ocorre ao cancelar, ao rejeitar e ao editar
      uma proposta já enviada; a emissão do substituto acontece apenas no novo envio,
      o que amarra o segredo à versão vigente sem deixar código órfão.)*
- [x] Invalidar códigos legados ativos que não atendam ao contrato ou forçar sua
      reemissão segura.
      *(A migration `20260731143000_orcamento_codigo_aprovacao_seguro` zera todos os
      `codigo_aprovacao` em texto claro. Sem backfill: um código de ~41 bits não vira
      segredo válido só por ser hasheado. A reemissão é sob demanda, pelo botão de
      reenvio na página pública ou pelo reenvio da proposta.)*
- [ ] Remover código, token, senha e dados pessoais desnecessários de logs,
      telemetria, erros e auditoria; revisar também logs históricos acessíveis.
      *(Código novo: concluído. `LinksV2Service.acessarLinkPublico` não registra mais
      o token, o `console.log` do código de aprovação foi removido, a listagem
      autenticada não devolve mais `codigo_aprovacao`, e a varredura de
      `orcamentos-v2` fechou os cinco `console.log` remanescentes — dois deles
      despejavam custo de produção, margem e impostos por produto, disparados por
      **rota anônima** — além dos dois `logger.log` que imprimiam o e-mail do cliente.
      O que mantém o item aberto é só a **revisão dos logs históricos já gravados**,
      que depende de acesso ao ambiente de produção e não pode ser feita daqui.)*

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

- [x] Centralizar os caminhos interno e público em um único caso de uso no backend.
      *(`executarAceiteDaProposta`. Os dois canais divergem **antes** dele — o interno
      exige permissão, o público exige posse do código — e **depois** dele, no formato
      da resposta. A parte sensível (transição, queima do código, auditoria, geração
      da OS, cobrança e reversão) existe uma vez só. Rejeição e negociação públicas
      não geram OS nem cobrança, então seguem por `registrarRecusaPublica`, que
      compartilha a mesma disciplina de transição condicional + auditoria na
      transação.)*
- [x] Impedir que repetição, clique duplo ou requisições concorrentes criem mais de
      uma OS, cobrança ou efeito equivalente para o mesmo aceite.
      *(Público: o consumo do código é a chave de idempotência — só uma requisição
      marca `codigo_aprovacao_usado_em`. Interno: **defeito corrigido nesta entrega**.
      A condição de origem era "não cancelado e não rejeitado", que continua casando
      depois que o status vira `aprovado`; duas requisições simultâneas passavam as
      duas e a única defesa era um `findFirst` não atômico. A condição agora exclui
      também `aprovado`, então o segundo `UPDATE` não casa e não há segundo conjunto
      de efeitos. Comprovado em banco real: 12 transições simultâneas → 1.)*
- [x] Usar garantias estruturais já disponíveis (`@unique`) e transação curta para
      estado e efeitos locais. Consulta prévia isolada não é idempotência.
      *(A serialização vem de `UPDATE ... WHERE` condicionais dentro de um
      `$transaction`: um exige "não usado, não revogado, não expirado e abaixo do
      limite"; o outro exige o status de origem. Nenhuma decisão depende de leitura
      anterior. **Ressalva:** `OrdemServico.orcamento_id` é anulável e **não** tem
      `@unique`, então a unicidade da OS é garantida pela condição de transição, não
      pelo banco. O clone de desenvolvimento não tem duplicatas hoje, mas a produção
      não foi verificada; adicionar o índice único exige essa checagem antes, sob pena
      de a migration falhar no deploy. Registrado como pendência em §4.2.)*
- [x] Não silenciar falha parcial. Se um efeito não puder compartilhar transação,
      registrar estado recuperável e processamento idempotente; não afirmar sucesso
      antes da conclusão contratada.
      *(Falha na geração da OS reverte status e consumo do código juntos, grava uma
      trilha `ACEITE_REVERTIDO` e responde erro — o cliente continua com um código
      utilizável em vez de ficar sem saída. A trilha do aceite **não** é apagada: fica
      o par aceite + reversão, para a tentativa não sumir do histórico. Proposta já
      aprovada que ficou sem OS é recuperável pelo caminho interno, que gera só a OS
      faltante. Falha na cobrança segue não revertendo a aprovação, como já era, e é
      registrada para tratamento manual.)*
- [x] Não executar e-mail, webhook ou rede externa dentro de transação de banco.
      *(A transação cobre a queima do código, a transição e a auditoria. OS, cobrança
      e notificação rodam depois do commit, nos dois canais.)*
- [x] Gravar auditoria sanitizada na mesma transação da mutação sensível.
      *(`registrarAuditoriaNaTransacao` recebe o cliente da transação e grava em
      `OrcamentoLog`. Sanitização: `descricao` é texto livre do cliente, truncado em
      500 caracteres; `dados_extras` é montado campo a campo — origem, autor, status
      anterior e novo — e não tem caminho para receber código, hash ou corpo da
      requisição; `ip_origem` e `user_agent` vêm de `req.ip`, resolvido pela política
      `trust proxy`, nunca de query string. Atomicidade comprovada em banco real:
      transação revertida não deixa trilha órfã. `alterarStatus` também entrou na
      mesma disciplina: era a última mutação sensível a chamar `registrarLog`, um
      placeholder que só escrevia no logger com o comentário "futuramente pode ser
      implementada uma tabela de logs" — ou seja, cancelar e rejeitar proposta não
      deixavam trilha nenhuma, apesar de a chamada parecer auditoria. Agora a
      transição, a revogação do código e a trilha compartilham uma transação, e o
      placeholder foi excluído para não ser reaproveitado.)*

O hotfix estabiliza o aceite existente. `pedido_comercial`, snapshot contratual,
evidência B2B completa, gates e novos handoffs continuam nas fases previstas; não
devem ser criados antecipadamente apenas para encerrar este gate.

### HS-06 — Observabilidade sem vazamento

- [x] Registrar negações, rate limit, token inválido/expirado, conflito de
      idempotência e falha de handoff com correlação e campos sanitizados.
      *(`common/security/eventos-seguranca.ts`. Todo evento sai com o prefixo
      `SEC_EVT` e o mesmo conjunto de campos, para que a linha de log vire métrica
      sem parser por caso. Os cinco tipos estão emitidos: `RATE_LIMIT` (nos dois
      limitadores, com o bucket que barrou), `TOKEN_RECUSADO`,
      `CONFLITO_IDEMPOTENCIA`, `FALHA_HANDOFF` e `AUTORIZACAO_NEGADA` — este
      distinguindo "permissão não declarada no handler", que é defeito de
      configuração, de "permissão insuficiente", que é tentativa de acesso.
      `TOKEN_RECUSADO` usa motivo indiferenciado de propósito: separar "expirado" de
      "errado" no log recriaria o oráculo que a resposta pública evita, e o log é
      lido por mais gente do que a resposta.)*
- [ ] Definir métricas agregadas e alertas para aumento anormal de `401`, `403`,
      `404` público, `429`, conflitos e falhas parciais.
      *(**Bloqueado por dependência ausente.** O projeto não tem backend de métricas:
      nenhum Prometheus, Sentry, OpenTelemetry ou equivalente no backend. Escolher e
      implantar um é decisão de infraestrutura, fora do recorte do hotfix. O que ficou
      pronto é o substrato: os eventos acima já saem em formato agregável, então os
      alertas podem ser montados por log assim que houver destino. Alertas mínimos a
      configurar: taxa de `RATE_LIMIT` por bucket, `TOKEN_RECUSADO` por orçamento e
      por origem, `AUTORIZACAO_NEGADA` com motivo `permissao_nao_declarada` — que
      deveria ser sempre zero — e qualquer `FALHA_HANDOFF`.)*
- [x] Proibir alta cardinalidade por token, e-mail, documento, IP bruto ou payload.
      *(A interface `EventoSeguranca` só aceita os campos declarados: não há caminho
      para passar corpo, cabeçalho, token ou e-mail. IP e ID de usuário entram
      pseudonimizados por SHA-256 com sal aleatório **por processo** — sem sal, o
      espaço IPv4 inteiro é força-brutável a partir do log, e o pseudônimo não
      protegeria nada. A contrapartida assumida: a correlação vale dentro da vida do
      processo e se perde no restart. O ID do orçamento entra em claro, por ser
      necessário à correlação e não ser dado pessoal.)*
- [x] Documentar procedimento de rollback que preserve a negação por padrão.
      *(Verificado empiricamente em §2.7: o DDL inverso não ressuscita nenhum segredo
      em texto claro, e a aplicação sobre o schema revertido aborta a emissão em vez
      de degradar para o código fraco. Reverter a migration desativa o aceite público;
      não o reabre.)*

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
      comparação; `orcamentos-v2-aceite-publico.spec.ts`, 15 casos, para código
      inválido, expirado, revogado, teto de tentativas, ausência de código, revogação
      por edição, indistinguibilidade das recusas e resposta sem vazamento do
      segredo.)*
- [ ] Integração com dois tenants cobrindo leitura e mutação por IDs trocados.
- [x] Testes por persona: sem permissão, vendedor, gestor e administrador.
      *(`vendas-permissions.service.spec.ts`, 15 casos: piso por função, perfil ativo
      e inativo, outra loja, usuário inativo e inexistente.)*
- [x] Concorrência/retry comprova no máximo um conjunto de efeitos por aceite.
      *(Duas camadas. Unitária: clique duplo com o mesmo código gera uma única OS e
      devolve a mesma resposta; aprovação interna repetida também. **Banco real**:
      12 consumos simultâneos do mesmo código → 1 vencedor; 12 transições simultâneas
      com o `WHERE` da aprovação interna → 1 transição. Ver §2.7.)*
- [x] Rotas não declaradas públicas retornam autenticação obrigatória.
      *(`rotas-publicas.spec.ts`, 39 casos, e `rotas-publicas.validator.spec.ts`,
      que inicializa o `AppModule` real e falha se houver divergência.)*
- [ ] Erros e logs não contêm token, código, stack, payload sensível ou status
      interno indevido.
      *(Código novo verificado — ver HS-04 e HS-06. Aberto apenas quanto aos logs
      históricos já gravados em produção.)*
- [x] O IP usado por rate limit e auditoria é o do cliente, e não um valor escolhido
      por quem chama.
      *(`rate-limit-acao-publica.spec.ts`, 9 casos com `supertest` sobre uma app
      configurada com o mesmo `trust proxy = 1` do `main.ts` — ver §4.3.)*
- [ ] Teste de carga focado no caminho de autorização demonstra ausência de N+1 e
      regressão aceitável registrada; consultas críticas possuem plano/índice
      revisado quando aplicável.
- [x] Testes do backend afetado, validação Prisma quando houver schema, typecheck,
      build e `git diff --check` aprovados. *(Testes, Prisma e migration em §4.1 e
      §2.7. `npx nest build` compila sem erro. Ressalva: o `prebuild` do `npm run
      build` roda `prisma generate` e falhou com `EPERM` ao renomear o query engine
      — o arquivo estava travado por processo Node em execução na máquina, não é
      defeito do código. O client já estava gerado com os campos novos, o que o
      typecheck e os testes contra o banco real confirmam.)*

### 4.1 Evidências desta entrega

**Backend.** `npx tsc -p tsconfig.build.json --noEmit` sem erros. Testes: **97 casos
em 6 suítes** (`codigo-aprovacao.spec.ts`, `orcamentos-v2-aceite-publico.spec.ts` —
agora 22 casos, com auditoria, aprovação interna e alteração de status —,
`rotas-publicas.spec.ts`,
`rotas-publicas.validator.spec.ts`, `rate-limit-acao-publica.spec.ts` e
`vendas-permissions.service.spec.ts`).

**Banco real.** MariaDB 10.4.32, clone do banco de desenvolvimento
(`comunikapp_gate0s`). `prisma migrate deploy` aplicou; `prisma migrate status`
responde "up to date"; `validar-codigo-aprovacao-mysql.ts` passou 13/13. Detalhes e
ressalvas em §2.7 e §2.8.

Ressalva de ambiente: MariaDB 10.4 não é MySQL 8. A DDL desta migration
(`ADD COLUMN` de `CHAR`, `DATETIME(3)` e `INT NOT NULL DEFAULT`) está no subconjunto
comum aos dois, e as garantias exercitadas — `UPDATE ... WHERE` condicional, contador
por `increment`, rollback de transação — são de InnoDB, não do dialeto. Ainda assim,
uma validação em MySQL 8 antes do deploy é o ideal, e não foi possível aqui.

**Frontend — baseline, não aprovação.** O typecheck do frontend **não passa** e já não
passava antes deste gate. O que está demonstrado é ausência de regressão:

| Medição | Erros de typecheck |
| --- | --- |
| Antes (`5755db44`, arquivo restaurado e `tsc` reexecutado) | 328 |
| Depois do contrato de token do cliente | 325 |

Nenhum erro está nos arquivos alterados por este gate — `orcamento-v2/[id]/page.tsx`,
as duas rotas de proxy, `lib/client-ip.ts` e `next.config.mjs` —, e nenhum arquivo novo
passou a apresentar erro. A maior concentração é `orcamento-v2-form.tsx` (57), intocado
aqui.

Ressalva de método: o `tsc` do frontend inclui os tipos gerados em `.next/types`, que
não são regenerados a cada medição. Por isso a igualdade exata entre execuções não é
confiável e a diferença de três não foi atribuída a nenhum arquivo de código. A
verificação que vale é a qualitativa: nenhum arquivo passou a ter erro.

Este número é o baseline a ser comparado nas próximas entregas. Não deve ser lido como
"typecheck do projeto aprovado": a dívida de tipagem do frontend continua aberta e é
anterior ao Gate 0S.

### 4.2 Pendência estrutural registrada, não resolvida

`OrdemServico.orcamento_id` é anulável e **não** tem índice único. Hoje a unicidade da
OS por orçamento é garantida pela condição de transição do aceite, não pelo banco. O
índice único seria a garantia estrutural que o HS-05 pede, e é viável — `NULL` não
conflita em `UNIQUE` no MySQL, então OS avulsa continua permitida.

O que impede aplicá-lo agora: uma migration com `UNIQUE` **falha no deploy** se houver
duplicata pré-existente. O clone de desenvolvimento não tem nenhuma, mas a produção não
foi verificada. Checagem obrigatória antes de criar a migration:

```sql
SELECT orcamento_id, COUNT(*) AS qtd
FROM ordens_servico
WHERE orcamento_id IS NOT NULL
GROUP BY orcamento_id
HAVING qtd > 1;
```

### 4.3 Fluxo real do IP: navegador → Nginx → Next/BFF → Nest

A cadeia tem três saltos e cada um podia quebrar o isolamento do rate limit. A questão
que decide tudo: **com `trust proxy = 1`, qual elemento de `X-Forwarded-For` o Express
considera o cliente?** Se fosse o primeiro, bastaria prefixar o cabeçalho para ganhar um
contador novo a cada requisição.

Foi respondido por teste, não por leitura de documentação: a configuração do limitador
saiu do `main.ts` para `common/security/rate-limit-acao-publica.ts` justamente para
poder ser exercitada com o mesmo `trust proxy` de produção. `rate-limit-acao-publica.spec.ts`
prova, com `supertest`:

| Cenário | Resultado |
| --- | --- |
| `X-Forwarded-For: 203.0.113.10` | `req.ip` = `203.0.113.10` |
| `X-Forwarded-For: 1.2.3.4, 203.0.113.10` (spoof prefixado) | `req.ip` = `203.0.113.10`; o valor forjado é ignorado |
| IP forjado diferente a cada requisição, mesma origem real | barrado no teto normal — trocar o valor forjado não renova o contador |
| Duas origens reais distintas, mesmo orçamento | contadores independentes |
| Mesma origem, orçamentos distintos | contadores independentes até o teto por IP |
| Varredura de orçamentos por uma origem | contida pelo limitador por IP |
| Endereços distintos dentro de um `/64` IPv6 | colapsados em um contador só |
| Resposta 429 | não cita orçamento nem IP |

**Correção derivada do teste.** O `client-ip.ts` do BFF lia o **primeiro** elemento de
`X-Forwarded-For`, enquanto o Express do outro lado lê o **último**. Hoje isso não
diverge, porque o Nginx sobrescreve o cabeçalho com um valor único
(`proxy_set_header X-Forwarded-For $remote_addr`). Mas a igualdade dependia de uma
diretiva do Nginx: bastaria alguém trocar por `$proxy_add_x_forwarded_for`, que anexa,
para o BFF passar a repassar ao Nest um IP escolhido pelo chamador — e aí o Nest o
trataria como legítimo, já que chegaria como valor único. O BFF agora prefere
`X-Real-IP` (que não tem forma de lista) e, na falta dele, lê o último elemento,
alinhado à semântica do Express.

**Limite conhecido.** Tudo isso pressupõe que o Nest não seja alcançável sem passar
pelo proxy de borda. Com a porta do backend exposta diretamente, `trust proxy = 1`
passaria a confiar no `X-Forwarded-For` de qualquer um. Não é uma propriedade do
código, é do deploy, e continua valendo o contador persistente
`codigo_aprovacao_tentativas` como defesa que não depende de IP nenhum.

## 5. Gate de conclusão

**Situação em 2026-07-31: o Gate 0S NÃO está concluído.**

Fechados nesta entrega: a validação da migration em banco real (§2.7), o HS-05 inteiro
(caso de uso único, atomicidade, idempotência, concorrência e auditoria transacional) e
a maior parte do HS-06.

O que mantém o gate aberto:

- **HS-04**: revisão dos logs históricos já gravados em produção — depende de acesso ao
  ambiente, não pode ser feita daqui.
- **HS-06**: métricas agregadas e alertas — o projeto não tem backend de observabilidade
  e escolher um é decisão de infraestrutura.
- **Evidências §4**: matriz endpoint × tenant × permissão, teste de integração com dois
  tenants e teste de carga do caminho de autorização.

Nenhuma fase funcional de Vendas está liberada.

- [ ] HS-01 a HS-06 concluídos com evidência vinculada no PR.
- [ ] Nenhuma vulnerabilidade P0/P1 do escopo permanece aberta sem contenção que
      negue o comportamento vulnerável.
- [ ] Revisão de segurança independente confirma OWASP, tenant e menor privilégio.
- [ ] Rollback testado e incapaz de reabrir acesso fail-open.
- [ ] RP, plano, OpenAPI e matriz de rastreabilidade refletem o comportamento final.
- [ ] **GATE 0S CONCLUÍDO — FASE 1 LIBERADA.**

