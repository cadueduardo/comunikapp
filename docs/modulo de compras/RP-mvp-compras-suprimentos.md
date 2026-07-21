# RP — MVP de Compras e Suprimentos

**Status:** requisitos de produto e guardrails técnicos consolidados — implementação não iniciada
**Revisão:** 2026-07-17
**RP significa:** Requisitos de Produto
**Nome na interface:** Compras
**Domínio interno:** Compras e Suprimentos
**Objetivo:** controlar aquisições de materiais, serviços e despesas externas com rastreabilidade do pedido ao pagamento e apropriação à OS
**Referências obrigatórias:**
- `docs/database/boas-praticas-schema-prisma.md`
- `docs/premissas melhores praticas.md`
- `docs/modulo fornecedores/plano-acao-matriz-insumo-fornecedor.md`
- `docs/modulo financeiro/feature-financeiro-previsto-real.md`

**Documentos antigos substituídos por este RP:** `docs/modulo de comprar.md` e `docs/plano-acao-modulo-compras.md`. Eles permanecem apenas como histórico e não devem orientar uma implementação nova.

---

## 1. Visão do produto

Compras não cuida apenas de insumos. O módulo deve adquirir qualquer recurso externo necessário para a operação:

- matéria-prima;
- mercadoria;
- produção terceirizada;
- instalação terceirizada;
- frete;
- manutenção;
- locação;
- serviço profissional;
- despesa emergencial vinculada a uma OS ou centro de custo.

O mesmo núcleo de pedido deve aceitar itens de material e serviço. A diferença ocorre na confirmação:

- material possui recebimento físico e pode entrar no estoque;
- serviço possui aceite da execução e não cria saldo físico;
- despesa simplificada exige comprovação e apropriação, mas pode dispensar logística.

---

## 2. Problemas que o MVP resolve

1. Saber o que precisa ser comprado e para qual finalidade.
2. Consultar fornecedores aptos sem duplicar insumos ou cadastros.
3. Formalizar fornecedor, preço, quantidade e prazo contratados.
4. Trocar fornecedor sem apagar o planejamento ou pedido anterior.
5. Receber material total ou parcialmente.
6. Aceitar serviço total ou parcialmente.
7. Registrar obrigação, parcelas e pagamentos ao fornecedor.
8. Apropriar o custo à OS, item, estoque ou centro de custo.
9. Alimentar o previsto × real da OS.
10. Manter histórico multi-tenant, auditável e sem duplicidade.

---

## 3. Princípios fechados

1. Reutilizar o CRUD `fornecedor`; Compras não cria um segundo cadastro.
2. Reutilizar `Insumo` e `InsumoFornecedor`; Compras não cria um segundo catálogo de material.
3. Um pedido pode conter material, serviço e despesa.
4. `OrdemTerceirizacao` é operacional e pode originar/vincular item de compra de serviço.
5. Preço da matriz é referência; preço do pedido é snapshot negociado.
6. Documento confirmado não é silenciosamente reescrito.
7. Troca de fornecedor cancela saldo anterior e cria revisão/substituição rastreável.
8. Exclusão física de fatos confirmados, recebidos, faturados ou pagos é proibida.
9. Recebimento, aceite, faturamento e pagamento são eventos distintos.
10. Operações parciais são suportadas desde o MVP.
11. Toda despesa precisa de apropriação explícita.
12. O backend é fonte autoritativa para totais e estados.
13. Duplicidade é impedida por constraints, chaves idempotentes e transações.
14. Nenhum módulo analítico grava uma segunda cópia do mesmo pagamento.
15. O módulo nasce modular, mas usa o `PrismaService` e `@prisma/client` padrões do projeto.
16. Material usa conferência pedido × recebimento × conta; serviço usa pedido × aceite × conta.

---

## 4. Personas e permissões

| Papel | Responsabilidade típica |
|---|---|
| Solicitante | Informa necessidade, origem e prazo |
| Comprador | Seleciona fornecedor e emite pedido |
| Aprovador | Aprova, rejeita ou devolve |
| Recebedor | Confere material |
| Aceitante do serviço | Confirma execução |
| Financeiro | Registra conta, pagamento, estorno e conciliação |
| Gestor | Consulta indicadores e autoriza exceções |
| Administrador | Configura permissões, sem bypass silencioso |

Permissões mínimas:

```text
compras.solicitacao.criar
compras.solicitacao.aprovar
compras.pedido.criar
compras.pedido.aprovar
compras.pedido.enviar
compras.pedido.cancelar
compras.pedido.substituir_fornecedor
compras.recebimento.registrar
compras.servico.aceitar
compras.conta_pagar.criar
compras.pagamento.registrar
compras.pagamento.estornar
compras.auditoria.visualizar
```

O MVP pode permitir que uma pessoa acumule papéis, mas deve registrar qual permissão autorizou cada transição.

---

## 5. Fluxo ponta a ponta

```text
Necessidade
→ Solicitação
→ Aprovação
→ Pedido de compra
→ Envio/contratação
→ Recebimento de material OU aceite de serviço
→ Conta a pagar
→ Pagamento
→ Apropriação
→ Pós-cálculo da OS
```

### 5.1 Origens da necessidade

```text
MANUAL
ORDEM_SERVICO
ITEM_OS
ORDEM_TERCEIRIZACAO
ESTOQUE
MANUTENCAO
ADMINISTRATIVO
```

No MVP:

- manual;
- OS/ItemOS;
- OrdemTerceirizacao;
- falta de estoque acionada manualmente.

Sugestão automática por estoque mínimo fica preparada, mas não entra na primeira entrega.

---

## 6. Escopo funcional do MVP

### RF-01 — Solicitação de compra

- criar rascunho;
- informar origem, prioridade, justificativa e data necessária;
- adicionar itens;
- enviar para aprovação;
- aprovar, rejeitar, devolver ou cancelar;
- converter itens aprovados em um ou mais pedidos;
- impedir conversão acima do saldo solicitado;
- manter histórico.

### RF-02 — Pedido de compra

- número sequencial único por loja;
- fornecedor ativo e apto à finalidade;
- itens `MATERIAL`, `SERVICO` ou `DESPESA`;
- quantidade, unidade, preço, desconto, frete/rateio e total;
- condições e prazo;
- rascunho, aprovação, envio, acompanhamento e cancelamento;
- snapshots de descrição, SKU, fornecedor, preço e unidade;
- PDF/visualização para envio;
- cópia controlada cria novo documento e nova numeração.

### RF-03 — Seleção e troca de fornecedor

- materiais consultam a matriz `InsumoFornecedor`;
- serviços consultam fornecedores `TERCEIRIZADO|AMBOS`;
- permitir fornecedor fora da matriz somente com permissão e justificativa;
- guardar fornecedor previsto, contratado e substituto;
- substituição total ou parcial;
- cancelar apenas o saldo não recebido/aceito/faturado;
- criar pedido substituto vinculado ao anterior;
- nunca mover recebimento, aceite ou pagamento histórico para outro fornecedor;
- exibir impacto de preço antes da confirmação.

### RF-04 — Recebimento de material

- total ou parcial;
- quantidade recebida, aceita, recusada e pendente;
- localização e lote quando aplicável;
- responsável, data e observação;
- entrada de estoque idempotente;
- impedir recebimento acima do saldo, salvo tolerância configurada e permissão;
- cancelamento gera movimento reverso auditável; não apaga entrada.

### RF-05 — Aceite de serviço

- total, parcial, por quantidade, percentual ou valor;
- período de execução;
- evidência/anexo opcional;
- responsável pelo aceite;
- serviço planejado ou adicional dentro de limite autorizado;
- rejeição/devolução para correção;
- indicador de aceite final;
- impedir aceite acima do contratado sem aditivo/revisão.

### RF-06 — Contas a pagar

- uma conta pode nascer de pedido, recebimento, aceite ou lançamento simplificado autorizado;
- fornecedor, documento, emissão, competência, vencimento e valor;
- parcelas;
- vínculo com itens e apropriações;
- estados previsto, aberto, parcial, pago, vencido, cancelado;
- anexos;
- referência externa única por fornecedor/loja quando aplicável;
- divergência entre pedido, recebido/aceito e cobrado deve ser visível.

Conferência mínima:

```text
MATERIAL: Pedido ↔ Recebimento ↔ Conta do fornecedor
SERVIÇO:  Pedido ↔ Aceite      ↔ Conta do fornecedor
```

Diferença de quantidade, preço ou total bloqueia a liberação automática e exige correção ou override com permissão e justificativa. A conferência pode começar assistida no MVP; o modelo não pode colapsar os três eventos em um único status.

### RF-07 — Pagamentos

- pagamento total ou parcial;
- data, valor, método, referência e comprovante;
- apropriação à OS/item/centro/estoque;
- estorno por movimento inverso;
- saldo calculado pelo backend;
- proibir pagamento acima do saldo sem fluxo de adiantamento explícito;
- pagamento idempotente para integrações futuras.

### RF-08 — Apropriação

Destinos:

```text
ORDEM_SERVICO
ITEM_OS
ESTOQUE
CENTRO_CUSTO
ADMINISTRATIVO
```

Regras:

- soma das apropriações deve ser igual ao valor apropriável;
- compra para várias OS exige divisão explícita;
- compra para estoque não é integralmente custo de uma OS;
- serviço terceirizado aponta para `OrdemTerceirizacao` e `ItemOS`;
- o pós-cálculo usa pagamentos válidos apropriados à OS.

### RF-09 — Histórico e auditoria

Registrar:

- criação e edição de rascunho;
- envio, aprovação, rejeição e devolução;
- mudança de preço/prazo;
- envio ao fornecedor;
- troca/cancelamento;
- recebimento/aceite;
- conta a pagar;
- pagamento/estorno;
- anexos;
- usuário, data, IP, user-agent e motivo quando sensível.

Não registrar segredos, tokens ou dados bancários completos no log.

### RF-10 — Consulta e dashboard

- lista paginada;
- busca por número, fornecedor e descrição;
- filtros por status, tipo, origem, OS e período;
- tabela/cards;
- atrasados e pendências;
- previsto, contratado, recebido/aceito, faturado e pago;
- histórico por fornecedor;
- link para OS, item, terceirização e financeiro.

---

## 7. Estados e transições

### 7.1 Solicitação

```text
RASCUNHO → SOLICITADA → APROVADA → CONVERTIDA
                     ↘ REJEITADA
                     ↘ DEVOLVIDA → RASCUNHO
RASCUNHO/SOLICITADA/APROVADA → CANCELADA
```

### 7.2 Pedido

```text
RASCUNHO → EM_APROVACAO → APROVADO → ENVIADO
                     ↘ REJEITADO
ENVIADO → PARCIAL → ATENDIDO → CONCLUIDO
RASCUNHO/EM_APROVACAO/APROVADO/ENVIADO/PARCIAL → CANCELADO
```

`PARCIAL` e `ATENDIDO` são rollups calculados pelas quantidades de material e serviço. O status não substitui os saldos por item.

### 7.3 Recebimento/aceite

```text
RASCUNHO → CONFIRMADO
RASCUNHO → CANCELADO
CONFIRMADO → ESTORNADO
```

### 7.4 Conta a pagar

```text
PREVISTA → ABERTA → PARCIAL_PAGO → PAGA
                 ↘ VENCIDA
PREVISTA/ABERTA/VENCIDA → CANCELADA
```

Transições devem ser centralizadas em serviços de domínio, validadas no backend e cobertas por testes.

---

## 8. Modelo de dados lógico

O schema abaixo é direcional. A implementação deve gerar migrations reais, revisar SQL e validar relações existentes antes de adotar nomes finais.

### 8.1 Entidades

```text
SolicitacaoCompra
SolicitacaoCompraItem
PedidoCompra
PedidoCompraItem
PedidoCompraItemApropriacao
RecebimentoCompra
RecebimentoCompraItem
AceiteServico
AceiteServicoItem
ContaPagar
ContaPagarParcela
PagamentoFornecedor
PagamentoFornecedorApropriacao
CompraHistorico
```

### 8.2 Campos essenciais

#### `SolicitacaoCompra`

- `id`, `loja_id`, `numero`;
- `status`, `prioridade`;
- `origem_tipo`, `origem_id`;
- `solicitante_id`;
- `justificativa`, `data_necessaria`;
- `criado_em`, `atualizado_em`.

Constraints:

```text
unique(loja_id, numero)
index(loja_id, status)
index(loja_id, origem_tipo, origem_id)
index(solicitante_id)
```

#### `SolicitacaoCompraItem`

- `id`, `loja_id`, `solicitacao_id`;
- `tipo`;
- `insumo_id?`, `descricao`;
- `quantidade`, `unidade`;
- `item_os_id?`, `ordem_terceirizacao_id?`;
- `criado_em`.

Não usar unique por descrição. Duplicidade semântica deve ser evitada pela interface e validada por origem/insumo quando a regra for inequívoca.

#### `PedidoCompra`

- `id`, `loja_id`, `numero`;
- `fornecedor_id`;
- `status`;
- `pedido_substituido_id?`;
- `motivo_substituicao?`;
- `moeda` inicialmente `BRL`;
- `subtotal`, `desconto`, `frete`, `total`;
- `data_emissao`, `data_prevista`;
- `condicao_pagamento`, `observacoes`;
- `aprovado_por?`, `aprovado_em?`;
- `enviado_em?`, `cancelado_em?`, `cancelado_por?`, `motivo_cancelamento?`;
- `versao`;
- timestamps.

Constraints:

```text
unique(loja_id, numero)
index(loja_id, status)
index(loja_id, fornecedor_id)
index(pedido_substituido_id)
```

#### `PedidoCompraItem`

- `id`, `loja_id`, `pedido_id`;
- `solicitacao_item_id?`;
- `tipo`;
- `insumo_id?`;
- `ordem_terceirizacao_id?`;
- `descricao_snapshot`, `codigo_ref_snapshot?`;
- `quantidade`, `unidade_snapshot`;
- `preco_unitario`, `desconto`, `frete_rateado`, `total`;
- saldos derivados de recebimentos/aceites;
- timestamps.

Material exige `insumo_id`; serviço pode apontar para terceirização; despesa pode ser descritiva. Validação é de domínio, não apenas de nullable.

#### `PedidoCompraItemApropriacao`

- `id`, `loja_id`, `pedido_item_id`;
- `destino_tipo`;
- `os_id?`, `item_os_id?`, `centro_custo?`;
- `percentual?`, `valor_previsto`;
- timestamps.

Usar checks no serviço e, quando seguro no MySQL alvo, constraints para impedir destino incoerente.

#### `RecebimentoCompra` e item

- cabeçalho: loja, pedido, número, status, data, usuário, observação;
- item: pedido item, estoque item/localização/lote, quantidades recebida/aceita/recusada;
- chave idempotente/referência externa quando originado por integração;
- índices em todas as FKs.

#### `AceiteServico` e item

- cabeçalho: loja, pedido, status, período, responsável, aceite final;
- item: pedido item, quantidade/percentual/valor aceito, observação;
- vínculo obrigatório com item do tipo serviço;
- histórico de rejeição, confirmação e estorno.

#### `ContaPagar`, parcelas e pagamentos

- `ContaPagar`: loja, fornecedor, pedido, documento, emissão, competência, total, status;
- `ContaPagarParcela`: loja, conta, número, previsto, pago, vencimento, status;
- `PagamentoFornecedor`: loja, conta/parcela, valor, data, método, referência, usuário, estorno;
- `PagamentoFornecedorApropriacao`: loja, pagamento, apropriação de compra, valor.

Constraints anti-duplicidade:

```text
unique(loja_id, fornecedor_id, tipo_documento, numero_documento)
unique(loja_id, idempotency_key) quando preenchida
unique(conta_pagar_id, numero_parcela)
```

Documento sem número exige uma chave controlada pelo servidor; não usar `null` repetido como proteção.

#### `CompraHistorico`

- `id`, `loja_id`;
- `entidade_tipo`, `entidade_id`;
- `acao`;
- `status_anterior?`, `status_novo?`;
- `dados` como `Json` nativo, sem segredos;
- usuário, IP, user-agent e timestamp.

### 8.3 Regras Prisma obrigatórias

- somente `backend/prisma/schema.prisma`;
- `@prisma/client` padrão, sem generator customizado;
- `loja_id` em toda entidade pertencente à loja;
- `@@index` em toda FK, isolado ou iniciando índice composto;
- `Json` nativo para estrutura;
- `Decimal` para dinheiro/quantidade;
- `@default(cuid())`, sem IDs manuais;
- `onDelete` explícito;
- `Restrict`/`SetNull` ou soft delete para documentos históricos/financeiros;
- nenhuma migration aplicada é editada;
- timestamp real gerado pelo Prisma;
- nunca usar `db push` em staging/produção;
- migration aditiva primeiro; restrições após backfill validado;
- SQL revisado e backup antes de alteração destrutiva.

---

## 9. API e padrão CRUD

### 9.1 Estrutura backend

```text
backend/src/compras/
  compras.module.ts
  controllers/
  services/
  dto/
  enums/
  mappers/
  policies/
  utils/
```

Limites:

- importar `PrismaModule` e `AuthModule` existentes, como o módulo de fornecedores;
- reutilizar `JwtAuthGuard`; não criar configuração JWT paralela nem fallback de segredo hardcoded;
- controller ≤ 200 linhas;
- service ≤ 400 linhas;
- separar solicitação, pedido, recebimento, aceite, conta e pagamento;
- não criar service monolítico;
- lógica de transição compartilhada fica em serviço/policy, não duplicada.

### 9.2 Padrão obrigatório baseado em Fornecedores

- `@Controller()` com `@UseGuards(JwtAuthGuard)`;
- loja obtida por `@GetLoja()`/decorator autenticado;
- DTOs concretos com `class-validator`;
- create normaliza dados no backend;
- busca unitária com `findFirst({ where: { id, loja_id } })`;
- listagem sempre filtrada por `loja_id`;
- conflito de unique traduzido para `409`;
- update somente em estados editáveis;
- delete físico apenas para rascunho sem filhos, se permitido;
- demais casos usam cancelamento/inativação;
- mensagens de domínio claras;
- OpenAPI atualizado.

Não copiar fragilidades antigas: uma mutação não pode validar por loja e depois executar `update({ where: { id } })` fora de proteção quando houver risco de corrida. Preferir unique composto, `updateMany` tenant-scoped com verificação de contagem ou transação com revalidação.

### 9.3 Endpoints MVP

```text
POST   /compras/solicitacoes
GET    /compras/solicitacoes
GET    /compras/solicitacoes/:id
PATCH  /compras/solicitacoes/:id
POST   /compras/solicitacoes/:id/enviar
POST   /compras/solicitacoes/:id/aprovar
POST   /compras/solicitacoes/:id/rejeitar

POST   /compras/pedidos
GET    /compras/pedidos
GET    /compras/pedidos/:id
PATCH  /compras/pedidos/:id
POST   /compras/pedidos/:id/aprovar
POST   /compras/pedidos/:id/enviar
POST   /compras/pedidos/:id/cancelar
POST   /compras/pedidos/:id/substituir-fornecedor

POST   /compras/pedidos/:id/recebimentos
POST   /compras/pedidos/:id/aceites-servico
GET    /compras/pedidos/:id/historico

POST   /financeiro/contas-pagar
GET    /financeiro/contas-pagar
GET    /financeiro/contas-pagar/:id
POST   /financeiro/contas-pagar/:id/pagamentos
POST   /financeiro/pagamentos/:id/estornar
```

Ações de estado usam endpoints de comando, não `PATCH status` genérico.

### 9.4 Concorrência e idempotência

- header/chave de idempotência em criação sensível;
- banco garante unicidade;
- transações curtas;
- optimistic locking por `versao` em pedido;
- atualização de saldo com condição atômica;
- repetição do mesmo comando retorna resultado anterior ou conflito determinístico;
- nenhuma confiança em debounce/botão desabilitado como proteção de banco.

---

## 10. Frontend e componentes globais

### 10.1 Rotas

```text
/compras
/compras/solicitacoes
/compras/solicitacoes/nova
/compras/solicitacoes/editar/[id]
/compras/pedidos
/compras/pedidos/novo
/compras/pedidos/editar/[id]
/compras/recebimentos
/financeiro/contas-pagar
```

### 10.2 Padrão visual obrigatório

Seguir o CRUD de fornecedores, usando sua versão endurecida:

- `PageHeader`;
- `CrudPage`;
- `DataTable` global;
- tabela/cards alternáveis no desktop;
- cards no mobile;
- busca, filtros, paginação;
- `Skeleton` no loading;
- estado vazio orientado à ação;
- `ConfirmDialog` para ações destrutivas/sensíveis;
- toast com mensagem real do backend;
- `ApiClient`/helpers centralizados;
- React Hook Form + Zod;
- `form.reset()` para edição e arrays dinâmicos inicialmente vazios.

### 10.3 Proibição de duplicação de componentes

Antes de criar componente:

1. procurar em `frontend/src/components/ui`;
2. procurar em `frontend/src/components/crud`;
3. procurar em `frontend/src/components/layout`;
4. estender o componente global quando a necessidade for genérica;
5. criar componente local somente quando o comportamento for específico de Compras.

Não criar `ComprasButton`, `ComprasDialog`, `ComprasTable`, `ComprasInput` ou equivalentes que apenas embrulhem componentes existentes sem regra de domínio.

### 10.4 Light/dark e estilos

É proibido:

- `style={{ ... }}`;
- atributo HTML `style`;
- CSS inline;
- cores hex, RGB/HSL fixas no JSX;
- classes como `bg-white` para superfícies principais;
- lógica duplicada de tema dentro da página.

Usar:

- tokens `bg-background`, `text-foreground`, `bg-card`, `text-card-foreground`;
- `muted`, `accent`, `border`, `destructive` e tokens semânticos globais;
- `cn()` para variantes;
- componentes do design system;
- classes Tailwind responsivas;
- teste visual em light, dark e system.

Status não pode depender apenas de cor; usar `Badge`, texto e ícone.

### 10.5 Acessibilidade

- labels associados;
- `aria-label` em botões de ícone;
- foco visível;
- ordem de tabulação;
- dialogs com título/descrição;
- erros associados ao campo;
- contraste WCAG;
- tabela utilizável com teclado;
- mensagens anunciáveis quando aplicável.

---

## 11. Segurança — OWASP Top 10

### A01 — Broken Access Control

- toda rota autenticada;
- permissão por comando;
- `loja_id` vindo do JWT/contexto;
- toda query e mutação tenant-scoped;
- testes tentando acessar IDs de outra loja;
- storage de anexos separado por tenant e autorização no download.

### A02 — Cryptographic Failures

- TLS;
- nenhum segredo no repositório/log;
- referências bancárias minimizadas;
- storage privado;
- URLs de comprovantes temporárias.

### A03 — Injection

- DTO com whitelist/forbid non-whitelisted;
- Prisma parametrizado;
- raw SQL somente quando inevitável e parametrizado;
- busca e ordenação por allowlist;
- neutralização de fórmula em CSV/Excel.

### A04 — Insecure Design

- máquina de estados;
- segregação de funções configurável;
- limites de aprovação;
- idempotência;
- snapshots;
- transações;
- proibição de alterar fato confirmado.

### A05 — Security Misconfiguration

- CORS e headers seguros;
- Swagger protegido conforme ambiente;
- mensagens sem stack/SQL em produção;
- limites de body/upload;
- tipos MIME permitidos.

### A06 — Vulnerable Components

- lockfile versionado;
- auditoria de dependências;
- nenhuma biblioteca nova se componente existente resolver;
- atualização e teste controlados.

### A07 — Authentication Failures

- `JwtAuthGuard`;
- tokens expirados/revogados tratados;
- rate limit em aprovação, pagamento e exportação;
- reautenticação futura para ações de alto valor.

### A08 — Data Integrity Failures

- webhooks assinados no futuro;
- histórico imutável;
- optimistic locking;
- hashes/metadados de anexos quando aplicável;
- nenhuma confiança em totais enviados pelo frontend.

### A09 — Logging Failures

- auditoria de toda transição sensível;
- correlation ID;
- alertas de falhas repetidas;
- sem token, senha ou dado bancário integral.

### A10 — SSRF

- não baixar URL fornecida livremente;
- integrações com allowlist, timeout e limite de resposta;
- anexos enviados diretamente para storage autorizado.

---

## 12. Estratégia anti-duplicidade

“Deduplicar depois” não é estratégia aceita. A implementação deve impedir a duplicidade.

### Registros

- unique de número por loja;
- unique de documento do fornecedor;
- unique de referência externa;
- unique de chave idempotente;
- saldo de solicitação não pode ser convertido duas vezes;
- recebimento não pode repetir a mesma origem;
- pagamento não pode repetir a mesma transação;
- conflito retorna `409`.

### Código e interface

- componentes globais antes de componentes locais;
- uma policy de transição por agregado;
- um mapper por contrato;
- helpers compartilhados para dinheiro, datas e status;
- nenhuma cópia do CRUD de fornecedores;
- nenhuma segunda tabela de fornecedor/insumo;
- nenhuma route handler Next quando `ApiClient` e rewrite existentes atendem.

### Dados ambíguos

- não unir registros por nome aproximado;
- não deduplicar fornecedor, pedido, conta ou pagamento por heurística;
- importações usam dry-run, linha de origem, chave determinística e relatório;
- ambiguidade interrompe a operação e exige decisão humana.

---

## 13. Testes obrigatórios

### 13.1 Backend

- criação e normalização;
- isolamento entre lojas;
- permissões;
- todas as transições válidas e inválidas;
- fornecedor inativo/incompatível;
- troca total e parcial;
- recebimento/aceite parcial;
- excesso bloqueado;
- conta e pagamento parcial;
- estorno;
- apropriação com soma incorreta;
- idempotência;
- concorrência/optimistic lock;
- rollback transacional;
- unique traduzido para conflito de domínio.

### 13.2 Frontend

- formulário create/edit;
- arrays dinâmicos;
- mensagens de validação;
- loading, vazio e erro;
- tabela/cards/mobile;
- dialogs;
- duplo clique/submit;
- light/dark/system;
- teclado e acessibilidade;
- permissões ocultam ações, sem substituir proteção do backend.

### 13.3 Integração/e2e

```text
Solicitação → Pedido → Recebimento → Conta → Pagamento → Pós-cálculo
Solicitação → Pedido de serviço → Aceite → Conta → Pagamento
Pedido fornecedor A → cancelamento parcial → pedido fornecedor B
```

DoD:

- cobertura mínima de 80% no escopo;
- lint e builds verdes;
- OpenAPI atualizado;
- `prisma validate`;
- SQL revisado;
- smoke em staging;
- nenhuma regressão em fornecedor, orçamento, OS, PCP, estoque e financeiro existente.

---

## 14. Fases de entrega

### Fase 0 — Descoberta e contratos

Detalhamento: `docs/modulo de compras/fase-0-descoberta-contratos.md` (2026-07-21).

- [x] Inventariar permissões, numeração, estoque e anexos existentes.
- [ ] Validar o RP com cenários reais.
- [x] Fechar método de valorização de estoque (**D1 = custo médio ponderado**).
- [x] Definir política de aprovação inicial (**D2 = permissão + autoaprovação se já pode aprovar**).
- [x] Mapear dados legados; nenhuma escrita.

### Fase 1 — Fundação aditiva

- [x] Enums e tabelas de solicitação/pedido/histórico.
- [x] Migrations aditivas (`20260721081827_create_compras_mvp_fase1`).
- [x] API de rascunho/listagem/detalhe (+ enviar/aprovar/rejeitar básicos).
- [x] Permissões (`compras.*` via `perfil_permissao`; ADMINISTRADOR bypass; D2 autoaprovação no enviar).
- [x] UI CRUD mínima (`/compras`, solicitações e pedidos).

### Fase 2 — Aprovação e fornecedor

- [x] Máquina de estados (policy central + endpoints de transição).
- [x] Integração com matriz (`InsumoFornecedor` + justificativa fora da matriz).
- [x] Pedido visualização/impressão (`/compras/pedidos/:id/visualizar`).
- [x] Troca auditável de fornecedor (`substituir-fornecedor`).

### Fase 3 — Recebimento e aceite

- [x] Recebimento material parcial.
- [x] Entrada idempotente no estoque (custo médio D1).
- [x] Aceite de serviço parcial/final.
- [x] Estornos auditáveis (CONFIRMADO → ESTORNADO).
- [x] UI mínima (novo recebimento / novo aceite a partir do pedido).

### Fase 4 — Contas a pagar

- [x] Conta, parcelas e pagamentos.
- [x] Apropriações.
- [x] Estorno.
- [x] Permissões financeiras.
- [x] UI mínima (`/financeiro/contas-pagar` + gerar a partir do pedido).
- [x] Smoke E2E: `backend/scripts/compras-e2e-fluxo-completo.mjs`.

### Fase 5 — Pós-cálculo

- [x] GET `/financeiro/os/:osId/pos-calculo` (read-only, previsto × real).
- [x] UI mínima em `/financeiro/pos-calculo`.
- [x] Agregação por categoria (MATERIAL/SERVICO/DESPESA) e alertas de desvio (total e por categoria).
- [ ] Fechamento financeiro.

### Fase 6 — Produção

- [ ] Auditoria OWASP.
- [ ] Testes de carga das listagens.
- [ ] Backup e staging.
- [ ] Rollout por feature flag/permissão.
- [ ] Smoke e monitoramento.

Cada fase deve ser implantável de forma aditiva e compatível com a versão anterior.

---

## 15. Critérios de aceite do MVP

- [ ] Material e serviço coexistem no mesmo núcleo de pedido.
- [ ] Nenhum CRUD de fornecedor/insumo foi duplicado.
- [ ] Fornecedor previsto e efetivo são preservados.
- [ ] Troca total/parcial mantém histórico e saldo.
- [ ] Recebimento e aceite parcial funcionam.
- [ ] Estoque recebe apenas material confirmado.
- [ ] Serviço exige aceite antes da conclusão.
- [ ] Conta a pagar é distinta de pagamento.
- [ ] Pagamento parcial e estorno preservam histórico.
- [ ] Apropriações fecham exatamente o valor aplicável.
- [ ] Pós-cálculo recebe o valor pago por OS.
- [ ] Toda tabela multi-tenant possui `loja_id`.
- [ ] Toda FK possui índice.
- [ ] Toda operação por ID valida a loja.
- [ ] Nenhuma duplicidade é possível nos identificadores de negócio.
- [ ] Nenhuma deduplicação heurística é executada.
- [ ] Componentes globais foram reutilizados.
- [ ] Não existe estilo inline.
- [ ] Light/dark/mobile/acessibilidade estão validados.
- [ ] OWASP Top 10 possui testes/controles correspondentes.
- [ ] OpenAPI, testes, lint, builds e staging estão aprovados.

---

## 16. Fora do MVP

- cotação eletrônica/RFQ completa;
- portal do fornecedor;
- contratos e pedidos recorrentes;
- estoque mínimo automático;
- MRP;
- XML/NF-e e escrituração fiscal;
- conciliação bancária;
- múltiplas moedas;
- adiantamento complexo;
- devolução fiscal;
- avaliação avançada de fornecedor;
- workflow configurável por múltiplas alçadas;
- integrações externas de marketplace.

O schema e os contratos devem permitir evolução, mas nenhuma tabela “para uso futuro” será criada sem fluxo implementado na mesma entrega.

---

## 17. Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Transformar MVP em ERP completo | Escopo por fases e fora do MVP explícito |
| Duplicar fornecedor/insumo | Reutilizar módulos existentes e FKs |
| Apagar histórico na troca | Pedido substituto e cancelamento de saldo |
| Duplicar entrada/pagamento | Idempotência, unique e transação |
| Custo errado por OS | Apropriação explícita e validação de soma |
| Compra para estoque atribuída a OS | Separar estoque de compra direta |
| IDOR multi-tenant | `id + loja_id`, permissões e testes |
| UI quebrar dark mode | tokens semânticos e zero estilo inline |
| Service monolítico | limites de linhas e serviços por agregado |
| Migration difícil | fases aditivas, SQL revisado, staging e backup |

---

## 18. Condição para implementação

Este RP não autoriza migrations, banco, branch ou deploy. Antes da Fase 1:

1. aprovar os cenários e decisões pendentes;
2. validar o schema proposto contra o `schema.prisma` atual;
3. produzir plano de migrations aditivas;
4. definir permissões iniciais;
5. aprovar a política de valorização de estoque;
6. executar apenas dry-run quando houver tratamento de dados existentes.
