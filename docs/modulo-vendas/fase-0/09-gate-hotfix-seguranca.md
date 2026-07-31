# Gate 0S — Hotfix de segurança anterior ao Módulo de Vendas

**Status:** [x] em execução — HS-01 e HS-02 parcialmente entregues (ver §2.0)
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

### Bug corrigido junto: autor da ação chegava indefinido

`JwtGlobalMiddleware` grava `req.user.sub` e `JwtAuthGuard` grava `req.user.id`;
nenhum dos dois grava `user_id`. Como o controller desestruturava `user_id` e
`usuario_id`, todas as trilhas de auditoria de criação, envio, alteração de status,
exclusão e duplicação de orçamento gravavam autor indefinido. A identidade passou a
ser extraída por `extrairIdentidadeAutenticada`, fonte única que aceita as duas formas
e recusa sessão incompleta.

## 2. Escopo obrigatório

### HS-01 — Autorização efetiva em Orçamentos V2

- [ ] Inventariar todos os endpoints e classificá-los por leitura, escrita, ação
      sensível e acesso público intencional.
- [ ] Proteger no backend todas as operações autenticadas com o padrão
      `VendasPermissionsService`/`assertPode()`, usando o catálogo mínimo necessário
      do artefato 03.
- [ ] Derivar `usuario_id`, `loja_id`, função e versão de sessão exclusivamente da
      identidade autenticada; ignorar valores equivalentes enviados pelo cliente.
- [ ] Negar por padrão permissão inexistente, perfil inválido, usuário/loja inativos
      e recurso de outra loja.
- [x] Manter `usuario_funcao` como fonte canônica; não ativar `RolesGuard` global e
      não tratar `@Roles` legado como autorização. *(`@Roles` removido de
      `orcamentos-v2.controller.ts` e `links-v2.controller.ts`; piso por função em
      `vendas-permissoes.ts`.)*
- [ ] Garantir paridade entre controller, jobs e chamadas internas: nenhum caminho
      alternativo pode contornar o service autorizado.

**Entregue até aqui:** `orcamentos-v2.controller.ts` (30 endpoints) e
`links-v2.controller.ts` (7 endpoints) declaram permissão por endpoint e são cobertos
pelo `VendasPermissionsGuard`, que nega por padrão.

**Falta:** `chat-v2`, `calculo-v2`, `impressao-v2`, `produto-detalhes` e
`anexo-geometria`; a versão de sessão ainda não participa da decisão de autorização.

**Desempenho:** carregar permissões em consulta indexada e projeção mínima. Cache
curto só é permitido por `(loja_id, usuario_id, session_version)`, com invalidação em
alteração de usuário, perfil, permissão ou sessão. Revogação nunca pode depender do
TTL para produzir efeito.

### HS-02 — Isolamento multi-tenant e IDOR

- [x] Corrigir `links-v2.service.ts` e toda busca/mutação por ID para incluir
      `loja_id` derivado do contexto autorizado quando o fluxo for autenticado.
      *(`validarOrcamento`, `validarAcessoAoOrcamento` e `buscarLinkDaLoja` escopam
      por loja; os seis métodos autenticados recebem `lojaId` da identidade.)*
- [ ] Revisar relações carregadas por `include`/`select` para impedir retorno
      indireto de cliente, proposta, anexo, acesso ou orçamento de outra loja.
- [x] Não diferenciar publicamente “não existe” de “existe, mas não pertence à
      loja”; usar resposta estável que não permita enumeração. *(Em `links-v2`,
      orçamento de outra loja e usuário inválido retornam o mesmo `404`.)*
- [ ] Testar leitura, alteração, aceite, geração de link e recurso relacionado com
      dois tenants reais de teste. *(Coberto em teste unitário de autorização;
      falta a integração com dois tenants.)*

### HS-03 — Fronteira pública única e mínima

- [ ] Eleger uma única fonte de verdade para rotas públicas e eliminar a divergência
      entre `@Public()` e a allowlist do middleware.
- [ ] Manter públicas somente as rotas indispensáveis ao fluxo vigente, documentadas
      por método e caminho; qualquer rota não listada exige autenticação.
- [ ] Trocar bodies inline/`any` por DTOs tipados, `class-validator`, whitelist e
      rejeição de campos excedentes nas ações públicas.
- [ ] Aplicar limite de tamanho, rate limit por finalidade e defesa contra
      enumeração. IP não pode ser a única chave de contenção.
- [ ] Retornar erros públicos genéricos, sem status interno, existência de conta,
      stack trace, ID interno ou detalhe de autorização.
- [ ] Obter IP e user-agent da requisição por política de proxy confiável; nunca da
      query string fornecida pelo chamador.

### HS-04 — Tokens, códigos e dados sensíveis

- [ ] Remover `Math.random()` de qualquer segredo de aprovação.
- [ ] Gerar segredo com CSPRNG e entropia adequada; persistir somente hash com
      comparação resistente a timing.
- [ ] Vincular o segredo à finalidade e ao orçamento/versão aplicável, com expiração,
      revogação, uso único e limite de tentativas.
- [ ] Invalidar códigos legados ativos que não atendam ao contrato ou forçar sua
      reemissão segura.
- [ ] Remover código, token, senha e dados pessoais desnecessários de logs,
      telemetria, erros e auditoria; revisar também logs históricos acessíveis.
      *(Parcial: `LinksV2Service.acessarLinkPublico` deixou de registrar o token em
      texto claro. Falta a varredura completa dos demais services.)*

Enquanto contato aprovador e versão imutável ainda não existirem, o hotfix não deve
simular essa autoridade. O aceite público legado deve ficar restrito ao contrato
seguro que puder ser comprovado; caso contrário, deve ser temporariamente
desabilitado, mantendo alternativa autenticada e auditável. O aceite B2B completo
continua nas Fases 1, 4, 6 e 8.

### HS-05 — Atomicidade, idempotência e concorrência do aceite existente

- [ ] Centralizar os caminhos interno e público em um único caso de uso no backend.
- [ ] Impedir que repetição, clique duplo ou requisições concorrentes criem mais de
      uma OS, cobrança ou efeito equivalente para o mesmo aceite.
- [ ] Usar garantias estruturais já disponíveis (`@unique`) e transação curta para
      estado e efeitos locais. Consulta prévia isolada não é idempotência.
- [ ] Não silenciar falha parcial. Se um efeito não puder compartilhar transação,
      registrar estado recuperável e processamento idempotente; não afirmar sucesso
      antes da conclusão contratada.
- [ ] Não executar e-mail, webhook ou rede externa dentro de transação de banco.
- [ ] Gravar auditoria sanitizada na mesma transação da mutação sensível.

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
- [ ] Testes unitários de permissão, token, expiração, tentativas e sanitização.
      *(Permissão coberta em `vendas-permissions.service.spec.ts`; token, expiração e
      tentativas dependem do HS-04.)*
- [ ] Integração com dois tenants cobrindo leitura e mutação por IDs trocados.
- [x] Testes por persona: sem permissão, vendedor, gestor e administrador.
      *(`vendas-permissions.service.spec.ts`, 15 casos: piso por função, perfil ativo
      e inativo, outra loja, usuário inativo e inexistente.)*
- [ ] Concorrência/retry comprova no máximo um conjunto de efeitos por aceite.
- [ ] Rotas não declaradas públicas retornam autenticação obrigatória.
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

