# Handoff para continuidade multiagente — Módulo de Vendas

**Data:** 2026-08-05

**Branch:** `feat/modulo-vendas`

**HEAD revisado:** `fdc96eecc07b924721bc8e7dc0756c3048ebcf4e`

**Último commit:** `fdc96eec refactor(vendas): centralizar transicoes comerciais da fase 6`

**Situação:** Fase 6 em execução. Fase 5 possui implementação e provas de banco,
mas a jornada manual documentada ainda não foi executada. Gate 0S está congelado
e não deve ser reaberto durante o desenvolvimento local.

## 1. Ordem obrigatória de leitura

Antes de qualquer alteração, o coordenador e cada agente executor devem ler:

1. `AGENTS.md`;
2. `docs/modulo-vendas/RP-modulo-vendas.md`;
3. `docs/modulo-vendas/PLANO-ACAO-MODULO-VENDAS.md`, especialmente §10;
4. `docs/modulo-vendas/fase-0/03-nomenclatura-e-matriz-rbac.md`;
5. `docs/modulo-vendas/fase-0/04-maquina-de-estados-comercial.md`;
6. `docs/modulo-vendas/fase-1/contratos-diferidos.md`;
7. `docs/modulo-vendas/fase-6/README.md`;
8. `docs/modulo-vendas/fase-6/evidencia-entrega-6-1.md`;
9. `docs/modulo-vendas/fase-6/evidencia-entrega-6-2.md`;
10. `docs/database/boas-praticas-schema-prisma.md` antes de qualquer mudança de
    schema ou migration.

Não confiar apenas nos checkboxes do plano: alguns itens antigos descrevem o
estado anterior da aplicação. Confirmar sempre no código, testes e banco.

## 2. Estado que não pode ser perdido ou refeito

### 2.1 Contrato comercial concluído nesta fase

- A fonte das 23 transições DV-14 é
  `backend/src/orcamentos-v2/domain/status-comercial.ts`.
- `TransicaoComercialService` é o único writer permitido de
  `status_comercial`.
- Toda mudança comercial deve usar CAS por `id + loja_id + status_comercial`.
- `status`, `status_comercial` e `status_aprovacao` são derivados no mesmo
  writer.
- Mutação, `OrcamentoLog` e `HistoricoOrcamento` devem compartilhar a mesma
  transação.
- Aceite público e interno exigem versão enviada e proposta não expirada.
- Depois que uma OS existe, nunca reativar token/código nem compensar o aceite
  como se o handoff não tivesse ocorrido.
- `pedido_confirmado` não pode ser editado como proposta; usar aditivo ou fluxo
  de cancelamento.
- Alteração material de proposta `aceita` segue DV-02: exige permissão antes de
  qualquer mutação, invalida o aceite e usa `aceita -> perdida`.
- Atualização parcial de proposta deve ser mesclada ao estado anterior antes do
  hash material DV-02/DV-15.

Não recriar `backend/src/orcamentos-v2/repositories/orcamentos-v2.repository.ts`.
Ele não possuía consumidores e foi removido porque mantinha um segundo writer
sem CAS, autorização canônica ou auditoria atômica.

### 2.2 Segurança já fechada e congelada

- Não alterar o Gate 0S, seus scripts, migrations HS-04/HS-05, kill-switch ou
  release imutável.
- Não promover, migrar, reenviar códigos, consultar ou alterar produção.
- Token público permanece fora de URL, resposta HTTP, log, storage e cookie.
- Não aceitar `loja_id`, role, permissão ou identidade enviados pelo cliente.
- Ação pública fora do estado permitido devolve erro genérico estável, sem
  revelar o estado interno.

### 2.3 Estado local alheio

Há alterações locais que não pertencem a Vendas em `AGENTS.md`, Arte, rotas de
Arte, Cloudflare, OS e no proxy de reenvio. Preservar e não incluir em commits de
Vendas. Antes de cada commit, conferir `git diff --cached --name-status`.

## 3. Pendências reais, em ordem de execução

### Incremento 6.3 — expiração canônica

Objetivo: processar propostas vencidas sem criar outro writer.

Requisitos:

1. Criar serviço/job pequeno e separado; não ampliar o monólito
   `orcamentos-v2.service.ts`.
2. Selecionar lote limitado e indexado de `enviada` e `em_negociacao` com
   `expira_em <= agora`.
3. `expira_em` é armazenado em UTC. Timezone comercial serve para calcular e
   apresentar datas; não comparar strings locais no banco.
4. Cada item deve usar `TransicaoComercialService` e a transição DV-14 para
   `expirada`.
5. Concorrência multi-instância deve ser resolvida pelo CAS do writer. Dois jobs
   podem ler o mesmo item, mas somente um grava histórico/auditoria.
6. Processar em lotes, com limite configurado e sem carregar o pipeline inteiro.
7. Uma falha individual não pode abortar silenciosamente os demais itens; emitir
   log sanitizado e métrica/evento local compatível com a decisão DV-17.
8. Não disparar e-mail sem evento, destinatário e deduplicação definidos. Se
   houver lembrete, usar o outbox DV-08 já existente.
9. Reabertura de expirada deve exigir `vendas.proposta.reabrir`, auditoria e
   revalidação de preço/prazo conforme DV-07. Se a revalidação ainda não tiver
   contrato executável, não liberar a reabertura silenciosamente.

Testes bloqueantes:

- ignora proposta sem `expira_em`;
- ignora proposta futura;
- expira `enviada` e `em_negociacao` vencidas;
- duas execuções concorrentes geram uma única transição;
- isolamento entre duas lojas;
- lote limitado e paginação sem loop infinito;
- falha em uma proposta não duplica nem corrompe as demais;
- aceite simultâneo versus expiração possui um único vencedor;
- prova MySQL 8 do CAS e do índice usado pela consulta.

### Incremento 6.4 — versão enviada, aceita e diff

Antes de codar, auditar o que já existe em `VersaoOrcamento`,
`versao_vigente_id`, `versao_enviada_id`, `versao_aceita_id`, snapshot e
`hash_material`. Não criar segunda tabela.

Requisitos:

1. Congelar snapshot completo e imutável no envio.
2. Garantir que edição posterior crie nova versão sem alterar snapshot anterior.
3. O aceite deve apontar exatamente para a versão enviada vigente.
4. Diff legível deve cobrir preço, escopo/produtos, quantidades, prazo, entrega,
   instalação e condição de pagamento.
5. Preview e documento enviado devem consumir a mesma versão congelada.
6. Não devolver custos, margem ou campos internos no contrato público.
7. Toda consulta de versão deve filtrar o orçamento/loja autenticada; não confiar
   somente no ID da versão.
8. Se o schema atual for suficiente, não criar migration. Migration só é válida
   quando um campo tiver uso na mesma entrega e após prova MySQL 8.

Testes bloqueantes:

- snapshot anterior permanece byte a byte imutável;
- atualização parcial produz snapshot completo;
- hashes estáveis para conteúdo equivalente;
- aceite de versão antiga ou de outro orçamento/tenant é negado;
- diff não expõe custo/margem e representa todos os campos materiais;
- documento/preview correspondem à versão enviada, não ao orçamento mutável.

### Incremento 6.5 — negociação e contrato de chat

`MensagemChat` já foi eleita como contrato canônico na Fase 1. As escritas do
módulo legado retornam 410 e os GETs legados foram preservados por compatibilidade.
O checkbox antigo da Fase 6 deve ser atualizado com evidência, não redecidido.

Requisitos:

1. Auditar consumidores frontend/BFF/backend antes de remover qualquer leitura
   legada.
2. Primeira mensagem válida do cliente pode promover `enviada -> em_negociacao`
   somente pelo writer canônico.
3. Mensagem, mudança comercial e contador de não lidas precisam de contrato
   idempotente e seguro contra concorrência.
4. Listagens e contagens devem ser agregadas, sem N+1.
5. Anexos: allowlist real de MIME/extensão, tamanho máximo, nome sanitizado,
   storage privado, autorização por tenant e download autenticado/temporário.
6. Não registrar corpo de mensagem, token, e-mail, IP bruto ou URL assinada em
   logs.
7. Preservar histórico legado; não executar drop nem migração destrutiva.

Testes bloqueantes:

- mensagem cross-tenant negada;
- primeira mensagem promove uma vez; mensagens seguintes não duplicam timeline;
- leitura/não lidas concorrentes são consistentes;
- paginação estável;
- anexo inválido, grande ou de outro tenant é negado;
- nenhum endpoint legado volta a aceitar escrita.

### Incremento 6.6 — auditoria de `LinkPublico`

Começar como auditoria somente leitura. Existem campos duplicados entre gerações
e histórico de IP/user-agent vindo de query string. Não ampliar esse contrato sem
decisão registrada.

Entregável inicial:

- inventário de rotas e consumidores reais;
- finalidade de cada campo duplicado;
- comprovação de quais links ainda são necessários;
- ameaça de enumeração, replay, vazamento em URL/Referer/log e cross-tenant;
- proposta: consolidar, manter read-only ou descontinuar;
- migration apenas depois da decisão, nunca para “organizar” preventivamente.

### Incremento 6.7 — frontend do pipeline

Só iniciar após contratos 6.3–6.5 estáveis.

Requisitos UX:

- desktop abre em Tabela/Grid e permite alternar para Cards;
- mobile usa Cards e oculta o toggle;
- seguir integralmente o template de `frontend/src/app/(main)/fornecedores/`;
- filtros por status, responsável, cliente, validade, próxima ação e não lidas;
- URL deve preservar filtros/paginação seguros, nunca tokens;
- estados de loading, vazio, erro, sem permissão e falha parcial;
- ações idênticas e com a mesma autorização em tabela e cards;
- nenhuma permissão pode depender apenas de ocultação na UI;
- sem dados mockados, CSS inline ou cores incompatíveis com dark/light.

## 4. Divisão recomendada para o Antigravity multiagente

Usar agentes em worktrees/branches independentes. Não permitir dois agentes
editando o mesmo arquivo simultaneamente. O coordenador integra um incremento por
vez e executa a regressão após cada cherry-pick.

### Agente coordenador/integrador

Responsável por:

- confirmar HEAD e working tree antes de distribuir tarefas;
- manter o plano e as evidências;
- ser o único a editar `orcamentos-v2.module.ts`,
  `PLANO-ACAO-MODULO-VENDAS.md` e arquivos compartilhados do monólito;
- revisar diffs dos agentes, integrar commits e resolver conflitos;
- executar testes finais e impedir declaração prematura de conclusão.

### Agente A — expiração/backend

Escopo exclusivo:

- novo service/job de expiração e seus testes;
- nenhuma UI;
- não editar diretamente o writer central, salvo finding comprovado enviado ao
  coordenador;
- entregar commit próprio e evidência MySQL 8.

### Agente B — versões e diff

Escopo exclusivo:

- domínio `versao-orcamento`, DTOs de leitura, service dedicado e testes;
- primeiro auditar e reutilizar schema existente;
- não editar expiração, chat ou frontend do pipeline;
- mudanças necessárias no monólito devem ser descritas ao coordenador como patch
  pequeno, não aplicadas em paralelo.

### Agente C — chat e links

Primeira rodada somente leitura:

- inventário de `MensagemChat`, legado, anexos e `LinkPublico`;
- mapa endpoint → consumidor → tabela → risco → teste;
- nenhuma migration ou remoção na rodada de auditoria;
- depois da aprovação do coordenador, implementar chat em commit separado.

### Agente D — frontend/UX

Só depois da integração dos contratos backend:

- pipeline, versão/diff e negociação;
- template CRUD obrigatório de Fornecedores;
- testes de navegação, responsividade, teclado e permissões;
- não criar BFF que replique regra de autorização do backend.

Se houver menos agentes, manter a ordem A → B → C → D. Paralelizar auditorias e
testes é seguro; paralelizar alterações no monólito, módulo Nest, Prisma ou plano
não é.

## 5. Processo obrigatório de code review interno

Como não haverá uma segunda revisão externa, cada entrega deve passar por dois
papéis diferentes:

1. **Executor:** implementa e apresenta diff, invariantes e testes.
2. **Revisor adversarial:** não altera inicialmente; procura IDOR, autorização
   ausente, corrida, duplicidade, vazamento, N+1, migration destrutiva, mock que
   aceita `TypeError` como negação e divergência entre docs e código.
3. **Coordenador:** só integra depois de todos os findings P0/P1 resolvidos ou
   explicitamente bloqueados com justificativa verificável.

Checklist mínimo do revisor:

- toda busca/mutação por ID contém `loja_id` derivado do JWT;
- todo `@Body()` possui DTO e `class-validator`;
- backend revalida permissão e estado; UI não é fronteira de segurança;
- mutação sensível e auditoria estão na mesma transação;
- efeitos externos estão fora da transação e têm idempotência/dedup;
- concorrência é provada por CAS/unique real, não por `findFirst` prévio;
- respostas e logs não contêm token, código, e-mail, custo, margem ou payload;
- testes falham se a dependência de autorização estiver `undefined`;
- mocks aplicam `id`, `loja_id` e estado no `where`;
- migrations são aditivas, com FK/index/onDelete e prova MySQL 8;
- nenhum arquivo local alheio entrou no commit.

## 6. Definition of Done de cada incremento

Não aceitar “código pronto” sem:

1. checkbox correspondente atualizado no mesmo commit;
2. evidência reproduzível em `docs/modulo-vendas/fase-6/`;
3. testes unitários positivos, negativos, cross-tenant e concorrentes;
4. `prisma validate` quando houver Prisma;
5. migration aplicada em scratch MySQL 8 e `migrate diff` sem drift novo, quando
   houver migration;
6. `nest build` e testes frontend proporcionais ao escopo;
7. `git diff --check`;
8. inspeção de `git diff --cached --name-status`;
9. commit pequeno, isolado e com SHA registrado;
10. relatório explícito de itens ainda abertos.

Não marcar **FASE 6 CONCLUÍDA** enquanto todos os itens do gate §10 do plano não
tiverem evidência. Não usar testes unitários como substituto de MySQL 8, E2E ou
validação visual quando esses forem requisitos do gate.

## 7. Validações já verdes no HEAD de partida

- máquina DV-14 + writer central: 36 testes;
- aceite público/interno + versão DV-02/DV-15: 36 testes;
- `nest build`: aprovado;
- busca de writers: somente `TransicaoComercialService` grava
  `status_comercial`;
- `git diff --check`: limpo nos arquivos do incremento 6.2.

Esses testes devem continuar verdes após cada integração.

## 8. Prompt pronto para o coordenador Antigravity

```text
Continue o Módulo de Vendas a partir da branch feat/modulo-vendas e do commit
fdc96eecc07b924721bc8e7dc0756c3048ebcf4e.

Leia integralmente AGENTS.md e
docs/modulo-vendas/fase-6/HANDOFF-ANTIGRAVITY.md antes de distribuir tarefas.
Depois leia as referências obrigatórias listadas no §1 do handoff.

Use coordenação multiagente com worktrees/branches independentes e propriedade
exclusiva de arquivos. O coordenador é o único que integra e edita arquivos
compartilhados. Exija revisão adversarial por outro agente antes de cada
integração. Não permita dois agentes alterando orcamentos-v2.service.ts,
orcamentos-v2.module.ts, schema.prisma ou o plano ao mesmo tempo.

Execute os incrementos na ordem 6.3 Expiração, 6.4 Versões/diff, 6.5 Chat,
6.6 auditoria de LinkPublico e 6.7 Pipeline frontend. Não avance ao incremento
seguinte com finding P0/P1 aberto.

Preserve TransicaoComercialService como writer único. Não recrie o repository
removido, não crie segundo Orçamento/Cliente/chat e não contorne RBAC, CAS,
multi-tenancy ou auditoria. Preserve as mudanças locais alheias e nunca inclua
AGENTS.md, Arte, Cloudflare ou OS em commits de Vendas sem escopo explícito.

Não toque produção, deploy, Gate 0S, códigos públicos ou logs históricos. O Gate
0S permanece congelado e bloqueia publicação, não desenvolvimento local.

Para cada incremento: implemente, faça revisão adversarial, corrija findings,
execute testes proporcionais, gere evidência reproduzível, atualize somente os
checkboxes realmente comprovados e crie commit isolado. Relate SHA, arquivos,
testes, riscos e pendências. Nunca declare FASE 6 CONCLUÍDA sem cumprir todo o
gate documental, MySQL 8, E2E e UX aplicável.

Comece pelo incremento 6.3, seguindo literalmente os requisitos e testes do §3
do handoff. Antes de escrever código, apresente a auditoria curta do schema,
índices, scheduler existente e pontos de integração que pretende reutilizar.
```

## 9. Estado de gates

- **Fase 5:** funcionalmente implementada; jornada manual ainda pendente.
- **Fase 6:** em execução; não concluída.
- **Gate 0S:** tecnicamente congelado; promoção e validação em produção pendentes.
- **Publicação de Vendas:** bloqueada até fechamento do Gate 0S e dos gates das
  fases aplicáveis.
