# Gate 0S — Matriz endpoint × autenticação × tenant × permissão

**Documento:** anexo do [`09-gate-hotfix-seguranca.md`](./09-gate-hotfix-seguranca.md), §4
**Escopo:** os 7 controllers de Orçamentos V2, 64 endpoints
**Data:** 2026-07-31

Esta matriz existe para responder uma pergunta com evidência em vez de
impressão: **existe algum endpoint de Orçamentos V2 cujo contrato de
autorização seja ambíguo?** A resposta, depois do levantamento, é que existiam
três, todos tratados nesta continuidade e descritos na §4.

---

## 1. Como ler a matriz

**Autenticação.** Não há `@UseGuards(JwtAuthGuard)` em todo handler porque a
autenticação é feita antes, no `JwtGlobalMiddleware`, que decide exclusivamente
pelo catálogo `backend/src/common/security/rotas-publicas.ts`. Rota fora do
catálogo exige token, esteja ou não anotada. Onde `@UseGuards(JwtAuthGuard)`
aparece, é redundância defensiva, não a única barreira.

**Permissão.** Todos os 7 controllers aplicam `VendasPermissionsGuard` na
classe. O guard nega por padrão: endpoint sem `@RequerPermissaoVendas` e sem
`@Public()` responde `403` e emite `AUTORIZACAO_NEGADA motivo=permissao_nao_declarada`.
Não existe caminho em que "autenticado" signifique "autorizado".

**Origem da identidade.** `loja_id` e `usuario_id` vêm sempre de
`extrairIdentidadeAutenticada(req)` ou do decorador `@Identidade()`, ambos
lendo o payload do JWT verificado. Nenhum handler aceita `loja_id` por corpo,
query ou cabeçalho.

**Comportamento esperado.** Salvo indicação em contrário, todos os endpoints
autenticados seguem o mesmo contrato, e por isso ele não se repete linha a
linha:

| Situação | Resposta |
|---|---|
| Sem token | `401` |
| Token válido, permissão ausente | `403`, mensagem genérica |
| Recurso de outra loja | `404` — indistinguível de inexistente |
| Recurso inexistente | `404` |

A indistinguibilidade entre "de outra loja" e "inexistente" é deliberada: um
`403` para recurso alheio confirmaria a existência dele.

**Permissões.** `ver` = `vendas.proposta.ver`, `criar` = `vendas.proposta.criar`,
`editar` = `vendas.proposta.editar`, `enviar` = `vendas.proposta.enviar`,
`aceite` = `vendas.proposta.aceite.registrar`, `excluir` = `vendas.proposta.excluir`.

**Testes.** As referências abreviadas são:

- `xt` → `backend/scripts/validar-cross-tenant-mysql.ts`
- `hs04` → `backend/scripts/validar-codigo-aprovacao-mysql.ts`
- `hs05` → `backend/scripts/validar-aceite-hs05-mysql.ts`
- `aceite.spec` → `backend/src/orcamentos-v2/services/orcamentos-v2-aceite-publico.spec.ts`
- `publicas.spec` → `backend/src/common/security/rotas-publicas.spec.ts` e `rotas-publicas.validator.spec.ts`
- `perm.spec` → `backend/src/vendas/permissions/vendas-permissions.service.spec.ts`

---

## 2. `OrcamentosV2Controller` — `/orcamentos-v2` (33 endpoints)

### 2.1 Superfície pública (3)

Estas três rotas estão no catálogo público e são as únicas de Vendas que
respondem sem token. Não têm tenant por definição — o cliente final não tem
loja — e por isso o controle é de conteúdo e de abuso, não de escopo.

| Método e rota | Operação | Caso de uso | Proteção | Teste |
|---|---|---|---|---|
| `GET :id/publico` | Leitura | `buscarOrcamentoPublico` | Payload sem custo, margem, impostos, observação interna ou código | `xt` |
| `POST :id/publico/acao` | Mutação | `processarAcaoClientePublico` | DTO tipado, código de uso único, rate limit por (orçamento, IP), erro genérico | `aceite.spec`, `hs04`, `hs05`, `xt` |
| `POST :id/reenviar-codigo` | Mutação | `reenviarCodigoAprovacao` | Resposta constante, rate limit por (orçamento, IP) | `hs04` |

Cobertura correspondente em `publicas.spec`: o validador de inicialização
recusa subir a aplicação se um handler alcançável pelo catálogo não estiver
declarado `@Public()`, e se um `@Public()` não estiver no catálogo.

### 2.2 Proposta (13)

| Método e rota | Operação | Permissão | Caso de uso | Teste |
|---|---|---|---|---|
| `POST /` | Mutação | criar | `criarOrcamento` | — |
| `GET /` | Leitura | ver | `listarOrcamentos` | `xt` |
| `GET :id` | Leitura | ver | `buscarOrcamento` | `xt` |
| `PUT :id` | Mutação | editar | `atualizarOrcamento` | `xt` |
| `DELETE :id` | Mutação | excluir | `removerOrcamento` — **dupla checagem**: `assertPode` também no service | `xt` |
| `PUT :id/status` | Mutação | editar | `alterarStatus` — **dupla checagem** | `xt`, `aceite.spec`, `hs05` |
| `POST :id/calcular` | Mutação | editar | `buscarOrcamento` + `calcularOrcamentoCompleto` | — |
| `GET :id/validar-estoque` | Leitura | ver | `buscarOrcamento` + `validarEstoqueOrcamento` | — |
| `POST :id/enviar` | Mutação | enviar | `enviarOrcamento` | `xt` |
| `POST :id/fechar-pedido` | Mutação | aceite | `fecharPedidoInterno` — **dupla checagem** | `xt`, `aceite.spec`, `hs05` |
| `POST :id/duplicar` | Mutação | criar | `duplicarOrcamento` | — |
| `GET :id/exportar/:formato` | — | ver | **Fechado** — ver §4.2 | — |
| `GET motor/estatisticas` | Leitura | ver | `obterEstatisticasMotor(lojaId)` | — |

A "dupla checagem" existe porque essas três mutações são as de maior impacto
(exclusão, transição de estado e aceite). O guard cobre o limite HTTP; o
`assertPode` no service cobre chamada interna que não passe pelo controller.

### 2.3 Chat legado (6)

| Método e rota | Operação | Permissão | Caso de uso | Teste |
|---|---|---|---|---|
| `GET :id/mensagens` | Leitura | ver | `buscarMensagensChatLegado` | `xt` |
| `POST :id/mensagens` | Mutação | editar | `enviarMensagemChatLegado` | `xt` |
| `POST chat/:id/mensagens/:mensagemId/visualizar` | Mutação | ver | `marcarMensagemVisualizada` | `xt` |
| `GET :id/mensagens/publico` | Leitura | ver | `buscarMensagensPublicasLegado` | `xt` |
| `POST :id/mensagens/publico` | Mutação | editar | `enviarMensagemPublicaLegadoComAnexo` | `xt` |
| `POST :id/publico/mensagens/:mensagemId/visualizar` | Mutação | ver | `marcarMensagemVisualizadaPublica` | `xt` |

Os três últimos têm `publico` no caminho e **declaravam** `@Public()` antes do
Gate 0S, mas o middleware nunca os liberou — respondiam `401` na prática. A
divergência foi resolvida no sentido restritivo: continuam autenticados e a
declaração passou a dizer a verdade. Abri-los exigiria DTO, rate limit e
vínculo com token, que é escopo das fases funcionais.

### 2.4 Notificações (6)

Todos escopados por `lojaId`, sem `usuario_id` no filtro — a notificação é da
loja, não do usuário.

| Método e rota | Operação | Permissão | Caso de uso |
|---|---|---|---|
| `GET notificacoes` | Leitura | ver | `buscarNotificacoes(lojaId, …)` |
| `GET notificacoes/nao-visualizadas` | Leitura | ver | `buscarNaoVisualizadas(lojaId)` |
| `GET notificacoes/nao-visualizadas/count` | Leitura | ver | `contarNaoVisualizadas(lojaId)` |
| `PATCH notificacoes/:id/visualizar` | Mutação | ver | `marcarComoVisualizada(id, lojaId)` |
| `PATCH notificacoes/visualizar-todas` | Mutação | ver | `marcarTodasComoVisualizadas(lojaId)` |
| `DELETE notificacoes/:id` | Mutação | ver | `deletarNotificacao(id, lojaId)` |

Ressalva de contrato, não de segurança: as três mutações exigem apenas `ver`.
É coerente com o fato de marcar como lida não alterar a proposta, mas deveria
ser ratificado na Fase 2 junto com o catálogo definitivo.

### 2.5 Chapa, sobra e insumos (5)

| Método e rota | Operação | Permissão | Caso de uso |
|---|---|---|---|
| `POST :id/itens/:itemId/simular-chapa` | Leitura | editar | `simularChapaItem(…, lojaId)` |
| `PUT :id/itens/:itemId/calculo-chapa` | Mutação | editar | `salvarCalculoChapaItem(…, lojaId, usuarioId)` |
| `GET origem-sobra/busca` | Leitura | ver | `buscarOrcamentos(lojaId, …)` |
| `GET :id/candidatos-sobra` | Leitura | ver | `listarCandidatosSobra(lojaId, id)` |
| `GET insumos/autocomplete` | Leitura | ver | `buscarInsumos(…, lojaId)` |

---

## 3. Demais controllers (31 endpoints)

### 3.1 `LinksV2Controller` — `/orcamentos-v2/links` (7)

| Método e rota | Operação | Permissão | Caso de uso | Teste |
|---|---|---|---|---|
| `POST :orcamentoId` | Mutação | enviar | `criarLinkPublico` | `xt` |
| `GET :orcamentoId` | Leitura | ver | `listarLinksPublicos` | `xt` |
| `PUT :linkId` | Mutação | enviar | `atualizarLinkPublico` | — |
| `DELETE :linkId` | Mutação | enviar | `removerLinkPublico` | — |
| `GET :orcamentoId/estatisticas` | Leitura | ver | `buscarEstatisticasLinks` | — |
| `GET :linkId/acessos` | Leitura | ver | `buscarHistoricoAcessos` | — |
| `GET publico/:token` | Mutação | ver | `acessarLinkPublico` — **corrigido** (§4.1 tenant, §4.5 IP/UA) | `xt` |

`GET publico/:token` é classificado como mutação porque incrementa o contador
de visualizações e grava registro de acesso.

### 3.2 `ChatV2Controller` — `/orcamentos-v2/chat` (6)

| Método e rota | Operação | Permissão | Caso de uso | Teste |
|---|---|---|---|---|
| `POST :orcamentoId/mensagens` | Mutação | editar | `enviarMensagem` | `xt` |
| `GET :orcamentoId/mensagens` | Leitura | ver | `buscarMensagens` | `xt` |
| `PUT :orcamentoId/mensagens/marcar-lidas` | Mutação | ver | `marcarMensagensComoLidas` | `xt` |
| `POST :orcamentoId/arquivos` | Mutação | editar | `enviarArquivo` | — |
| `GET :orcamentoId/estatisticas` | Leitura | ver | `buscarEstatisticasChat` | `xt` |
| `GET :orcamentoId/negociacao/historico` | Leitura | ver | `buscarHistoricoNegociacao` | — |

### 3.3 `CalculoV2Controller` — `/orcamentos-v2/calculo` (7)

| Método e rota | Operação | Permissão | Caso de uso |
|---|---|---|---|
| `POST :id/calcular` | Mutação | editar | `buscarOrcamento(id, lojaId)` + motor |
| `POST :orcamentoId/produtos/:produtoId/calcular` | Mutação | editar | `buscarOrcamento` e depois procura o produto **dentro** do orçamento carregado |
| `POST :id/validar` | Leitura | ver | `buscarOrcamento` + `validarOrcamento` |
| `GET configuracoes-loja` | Leitura | ver | `obterConfiguracoesLoja(lojaId)` |
| `POST calcular-lote` | Mutação | editar | Recarrega **cada** id do corpo com `buscarOrcamento(id, lojaId)` |
| `GET motor/estatisticas` | Leitura | ver | `obterEstatisticasMotor(lojaId)` |
| `POST :id/simular` | — | editar | **Fechado** — ver §4.2 |

Dois pontos merecem destaque porque são o padrão que evita IDOR neste
controller. Em `produtos/:produtoId/calcular`, o produto não é buscado por id
próprio: o orçamento é carregado na loja e o produto é procurado na lista dele,
então um `produtoId` de outra loja simplesmente não aparece. Em `calcular-lote`,
o corpo traz apenas identificadores e cada um é relido do banco na loja
autenticada — antes o objeto enviado pelo cliente ia direto para o motor sem
nunca ser lido do banco.

### 3.4 `ImpressaoV2Controller` — `/orcamentos-v2/impressao` (6)

Todos são `POST`, exigem `ver` e recebem `identidade.lojaId` como segundo
argumento do service. São os endpoints de maior sensibilidade de conteúdo:
produzem documentos com preço, custo e dados do cliente.

| Método e rota | Caso de uso | Teste |
|---|---|---|
| `POST :orcamentoId/pdf` | `gerarPDF` | `xt` |
| `POST :orcamentoId/relatorio-executivo` | `gerarRelatorioExecutivo` | — |
| `POST :orcamentoId/relatorio-custos` | `gerarRelatorioCustos` | `xt` |
| `POST :orcamentoId/proposta-comercial` | `gerarPropostaComercial` | `xt` |
| `POST :orcamentoId/etiquetas` | `gerarEtiquetas` | — |
| `POST :orcamentoId/analise-precos` | `gerarRelatorioAnalisePrecos` | — |

### 3.5 `ProdutoDetalhesController` — `/orcamentos-v2/produto` (1)

| Método e rota | Operação | Permissão | Caso de uso | Teste |
|---|---|---|---|---|
| `GET :produtoId/detalhes` | Leitura | ver | `produtoOrcamento.findFirst({ id, orcamento: { loja_id } })` | `xt` |

O escopo está no `where` da consulta, não em verificação posterior. O `catch`
registra apenas a classe do erro: a mensagem de uma exceção do Prisma carrega
trecho da consulta e valores dos parâmetros.

### 3.6 `AnexoGeometriaController` — `/orcamentos-v2/anexos-geometria` (4)

| Método e rota | Operação | Permissão | Caso de uso |
|---|---|---|---|
| `POST /` | Mutação | editar | `salvar({ lojaId, usuarioId })` |
| `GET :token/dxf-extraido` | Leitura | ver | `lerDxfExtraido({ token, lojaId })` |
| `GET :token` | Leitura | ver | `ler({ token, lojaId })` |
| `DELETE :token` | Mutação | editar | `remover({ token, lojaId })` |

O anexo é resolvido por token **mais** loja. Token sozinho seria enumerável por
UUID e o arquivo é servido sem passar por orçamento.

---

## 4. Achados e o que foi feito com eles

### 4.1 `GET links/publico/:token` resolvia o link só pelo token — corrigido

`LinksV2Service.acessarLinkPublico` buscava `linkPublico.findFirst({ token, ativo: true })`
sem confrontar a loja autenticada. Como a rota exige JWT, o efeito era: um
usuário autenticado da loja A que conhecesse um token da loja B conseguia
consumir uma visualização do link alheio, gravar um registro de acesso e
receber de volta os metadados do link, incluindo o próprio token.

O impacto é limitado porque o payload traz `orcamento: null` — nenhum dado da
proposta era devolvido. Ainda assim é mutação cross-tenant e viola a regra do
`AGENTS.md` de que toda consulta a recurso de loja inclui o `loja_id` derivado
da identidade autenticada.

**Correção:** `acessarLinkPublico` passou a exigir `lojaId` e a filtrar por
`orcamento: { loja_id: lojaId }`, e o erro virou `NotFoundException` em vez de
`Error` cru. Três verificações novas em `xt` cobrem o caso: acesso cruzado
negado, contador não incrementado e acesso do próprio dono preservado.

### 4.2 Dois endpoints sem contrato — fechados

O gate manda tratar endpoint sem contrato inequívoco como falha e negar por
padrão. Dois se enquadravam:

**`POST orcamentos-v2/calculo/:id/simular`** devolvia `200` com números fixos
(`valor_original: 1000`, `valor_simulado: 1100`) e sequer resolvia o orçamento
na loja autenticada. Um endpoint que responde com valor inventado é pior que um
que não existe, porque o consumidor não tem como distinguir.

**`GET orcamentos-v2/:id/exportar/:formato`** devolvia `200` com a frase
"Exportação em PDF será implementada" e lançava `Error` cru — logo, `500` — para
formato desconhecido. A exportação real existe em `/orcamentos-v2/impressao`.

Ambos passaram a responder `501` com mensagem estável. Nenhum consumidor no
frontend chamava qualquer um dos dois.

### 4.3 Logs de depuração com custo e margem — removidos

Descoberto durante a execução de `xt`: mesmo depois da limpeza de `console.log`
registrada no HS-06, sobravam `logger.log` de depuração que despejavam valores
financeiros a cada requisição:

| Onde | O que saía |
|---|---|
| `TransformacaoV2Service.transformarParaInterface` | `custo_total`, `margem_lucro`, `impostos`, `preco_final` — em **toda** transformação, ou seja, em toda leitura de proposta |
| `OrcamentosV2Service.listarOrcamentos` | Estrutura completa do registro, incluindo a lista de todas as colunas |
| `OrcamentosV2Service.atualizarOrcamento` | Custos recebidos, custos a salvar e resultado do update |
| `criarOrcamento` e `atualizarCustosCalculados` | `custo_total` e `preco_final` interpolados na mensagem |

Todos removidos. Os que sobreviveram registram apenas identificador e contagem.

### 4.4 Confirmações negativas

| Verificação | Resultado |
|---|---|
| Alguma rota autenticada depende apenas de `@Roles`? | Não. `@Roles` foi removido dos controllers de Orçamentos V2; a autorização é `@RequerPermissaoVendas` + `VendasPermissionsGuard`. |
| Alguma operação cai em "autenticado pode tudo"? | Não. Provado em `xt`: vendedor ativo da própria loja recebe `proposta.ver` e é negado em `proposta.excluir`. |
| Alguma rota pública surgiu por divergência entre decorator e middleware? | Não. O catálogo é fonte única e o `RotasPublicasValidator` recusa a inicialização em caso de divergência, nos dois sentidos. |
| Esconder controle no frontend conta como autorização? | Não. Nenhum dos 64 endpoints depende disso; todos passam pelo guard. |
| Jobs ou chamadas internas contornam os services autorizados? | Não nas três mutações críticas, que repetem `assertPode` dentro do service. Os demais dependem do guard — aceitável enquanto não houver job chamando esses services, o que hoje não existe em Orçamentos V2. |

---

### 4.5 IP e user-agent vinham da query em `links/publico/:token` — corrigido

O handler aceitava `@Query('ip')` e `@Query('user_agent')` e os passava ao
service. Isso contraria o HS-03: o chamador forjava a origem do registro de
acesso. Passou a usar `extrairContextoDaRequisicao(req)`, a mesma fonte do
aceite público e do rate limit.

### 4.6 `ChatV2Service.buscarUsuarioSistema` criava conta com senha em claro — corrigido

Método interno, sem endpoint HTTP hoje. Ainda assim era caminho alternativo
perigoso: na ausência do e-mail `sistema@comunikapp.com`, criava um usuário
com senha `sistema123` na primeira loja que `loja.findFirst()` encontrasse —
conta compartilhada entre tenants e credencial previsível. Removido o create;
se o usuário de serviço não existir, as mensagens usam autor virtual
(`usuario_id` é anulável). `enviarMensagemSistema` e `enviarNotificacao`
passaram a exigir `lojaId` e a validar o orçamento nele, para que um futuro
chamador interno não escreva no chat de outra loja.

---

## 5. O que a matriz não cobre

- **Cobertura de teste por endpoint é parcial.** 24 dos 64 têm teste
  automatizado direto. Os demais compartilham o mesmo padrão de escopo
  (`buscarOrcamento(id, lojaId)` ou `where` com `loja_id`), mas padrão
  compartilhado é argumento, não evidência.
- **A permissão exigida por notificação** (`ver` para mutação) precisa de
  ratificação na Fase 2.
- **`vendas.proposta.excluir`** foi acrescentado pelo Gate 0S e ainda não
  consta da matriz do artefato 03; também depende de ratificação.
- **Vários `@Body()` ainda usam `any` ou objeto inline** sem DTO
  `class-validator` (criar/atualizar orçamento, chat legado, cálculo em lote).
  O HS-03 exigiu DTO tipado nas ações **públicas**, que já o têm
  (`AcaoClientePublicoDto`). Endurecer o restante dos bodies autenticados é
  dívida de tipagem, não abertura de fronteira — fica para a Fase 2, salvo
  se algum body `any` for usado para injetar `loja_id` (hoje nenhum lê
  `loja_id` do corpo).
- **Consultas públicas sem `loja_id` no `where`** (`buscarOrcamentoPublico`,
  `processarAcaoClientePublico`, `reenviarCodigoAprovacao`) são intencionais:
  o cliente final não tem loja. O controle aí é de conteúdo e de abuso, não
  de tenant.
