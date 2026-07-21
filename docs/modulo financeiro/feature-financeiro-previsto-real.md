# Plano de Ação — Financeiro Previsto × Real e Pós-Cálculo de OS

**Status:** especificação consolidada; baseline de fornecedor/custo previsto do material implementada e aplicada somente no ambiente local; Compras e realizado permanecem planejados
**Revisão:** 2026-07-18
**Dor validada:** comparar o custo previsto no orçamento com o valor efetivamente pago para concluir cada Ordem de Serviço
**Dependências:** matriz Insumo × Fornecedor, MVP de Compras/Suprimentos, Estoque, Terceirização, Contas a Receber e Ordens de Serviço
**Documento relacionado:** `docs/modulo de compras/RP-mvp-compras-suprimentos.md`

---

## 1. Problema de negócio

Imprevistos operacionais alteram o custo de uma OS depois da aprovação do orçamento. Os casos mais comuns são:

- quebra ou indisponibilidade de máquina;
- atraso, indisponibilidade ou falha de qualidade do fornecedor;
- compra emergencial de material;
- substituição total ou parcial de fornecedor;
- frete adicional;
- terceirização não prevista;
- retrabalho e consumo adicional.

Hoje o cliente compara esses valores manualmente. O Comunikapp deve preservar o plano original, registrar o que aconteceu durante a execução e mostrar claramente o impacto na margem.

Exemplo:

| Dimensão | Previsto | Real |
|---|---:|---:|
| Fornecedor | Fornecedor A | Fornecedor B |
| Custo | R$ 1.000,00 | R$ 1.450,00 |
| Desvio | — | + R$ 450,00 |
| Motivo | — | Atraso do fornecedor original |

---

## 2. Decisões de produto fechadas

1. Para o cliente, **Real** é o valor efetivamente pago e apropriado à OS.
2. O sistema também deve armazenar e exibir os estágios **Previsto**, **Comprometido**, **Incorrido/Faturado** e **Pago**.
3. O orçamento aprovado é a baseline comercial e não pode ser recalculado por preços cadastrais futuros.
4. Fornecedor e preços previstos são snapshots; fornecedor e preços efetivos são fatos posteriores e coexistem com os snapshots.
5. A troca de fornecedor nunca sobrescreve silenciosamente o fornecedor previsto ou um pedido confirmado.
6. Pagamentos reais vêm de Compras/Contas a Pagar. Não serão inferidos de `Insumo.custo_unitario`, `InsumoFornecedor.preco_custo` ou do status operacional da OS.
7. O pós-cálculo é uma projeção analítica sobre fatos operacionais e financeiros; não é uma segunda contabilidade.
8. Receitas previstas e recebidas continuam usando `Cobranca`, `CobrancaParcela` e `CobrancaRecebimento`.
9. Terceirização continua usando `OrdemTerceirizacao` como documento operacional e se vincula ao pedido de compra de serviço.
10. O fechamento operacional da OS e o fechamento financeiro são estados diferentes.
11. Deve ser possível lançar múltiplas compras, recebimentos, aceites, contas e pagamentos para a mesma OS.
12. Toda origem automática precisa de chave idempotente; reprocessamento não pode duplicar baseline, provisão, apropriação ou pagamento.

### 2.1 Baseline do fornecedor previsto no orçamento — implementação local

A primeira parte executável deste plano está implementada na branch `codex/orcamentos-fornecedor-previsto`, sem deploy:

- ao selecionar um insumo, o fornecedor padrão da matriz continua sendo a fonte inicial do custo;
- a linha exibe uma comparação recolhível com no máximo três opções: o padrão e até duas alternativas ativas de menor preço;
- a interface não classifica “custo-benefício”, pois prazo, qualidade e desempenho ainda não possuem dados objetivos;
- a escolha afeta somente aquela linha do orçamento e não altera o padrão global do insumo;
- o backend valida loja, atividade, finalidade e vínculo da matriz e recalcula o preço; valores enviados pelo navegador não são fonte de verdade;
- `ItemInsumo` guarda `fornecedor_previsto_id`, nome, código de referência e preço de compra como fotografia comercial;
- a FK usa `ON DELETE SET NULL`, preservando os demais snapshots quando um cadastro for removido;
- itens históricos não recebem fornecedor inferido retroativamente;
- orçamento aprovado permanece imutável.

A migration aditiva `20260718165000_add_fornecedor_previsto_item_insumo` foi aplicada somente ao banco local após backup validado. Essa entrega define o lado **Previsto** do material. O fornecedor contratado, substituições, recebimentos, contas e pagamentos continuam pertencendo ao MVP de Compras e formarão os fatos **Comprometido**, **Incorrido/Faturado** e **Pago/Real**.

---

## 3. Glossário financeiro do produto

| Termo | Definição | Fonte |
|---|---|---|
| Previsto | Custo congelado quando o orçamento aprovado gera a OS | Orçamento/OS |
| Comprometido | Valor de pedido de compra aprovado/confirmado | Compras |
| Incorrido | Material recebido ou serviço aceito | Recebimento/Aceite |
| Faturado | Valor cobrado pelo fornecedor e reconhecido em Contas a Pagar | Conta a pagar |
| Pago / Real | Saída efetiva, não estornada, apropriada à OS | Pagamento |
| A pagar | Faturado menos pagamentos válidos | Contas a Pagar |
| Desvio | Real menos Previsto | Pós-cálculo |
| Margem prevista | Receita prevista menos custo previsto | Pós-cálculo |
| Margem realizada | Receita considerada menos custo pago, conforme visão selecionada | Pós-cálculo |
| Fechamento financeiro | Confirmação de que os fatos financeiros da OS foram conciliados | Pós-cálculo |

### 3.1 Duas visões de margem

Para não misturar competência com caixa, a API e a interface devem nomear a visão:

- **visão econômica:** receita faturada menos custo incorrido/faturado;
- **visão de caixa:** receita recebida menos custo pago.

O indicador principal solicitado pelo cliente é o custo **Pago**, mas os demais estágios antecipam desvios antes da saída do caixa.

---

## 4. Fontes de verdade existentes

### 4.1 Já existe e deve ser reutilizado

- `OrdemServico` e `ItemOS`;
- `orcamento`, `ProdutoOrcamento` e itens/custos congelados do orçamento;
- `OrdemTerceirizacao`, já criada na conversão do orçamento em OS com fornecedor, custos e prazo;
- `Cobranca`, `CobrancaParcela`, `CobrancaRecebimento` e `CobrancaLog`;
- estoque, localizações e movimentações;
- cadastro `fornecedor`;
- futura matriz `InsumoFornecedor`.

### 4.2 Não existe e será fornecido pelo MVP de Compras

- solicitação de compra;
- pedido de compra de material ou serviço;
- troca auditável de fornecedor;
- recebimento de material;
- aceite de serviço;
- conta a pagar, parcelas e pagamentos;
- apropriação dos valores à OS e ao item da OS.

### 4.3 O que não deve ser criado

- um segundo model `OrdemTerceirizacao`;
- um `LancamentoFinanceiro` genérico com `tipo` e `status` livres em `String`;
- um campo `custo_real` manual em `OrdemTerceirizacao` como fonte concorrente;
- cálculo do realizado usando o preço atual da matriz;
- cópia de recebimentos de clientes para uma nova tabela;
- lançamentos financeiros duplicados para representar o mesmo pagamento.

---

## 5. Fronteiras entre módulos

| Módulo | Responsabilidade |
|---|---|
| Fornecedores | Cadastro, finalidade e matriz de preços/referências atuais |
| Compras/Suprimentos | Demanda, contratação, troca, recebimento/aceite e obrigação com o fornecedor |
| Estoque | Entrada física, lote/localização e consumo de materiais |
| Terceirização | Execução operacional do item produzido externamente |
| Financeiro | Contas a receber, contas a pagar, pagamentos e conciliação |
| Pós-cálculo | Comparar snapshots previstos com fatos comprometidos, incorridos e pagos |

`InsumoFornecedor.preco_custo` é preço de referência atual. O item do pedido guarda o preço negociado como snapshot. O pagamento apropriado é o fato real.

---

## 6. Baseline prevista da OS

### 6.1 Momento de captura

A baseline nasce de forma idempotente na conversão do orçamento aprovado em OS. Ela não é atualizada quando:

- muda o preço do insumo;
- muda o fornecedor padrão;
- um fornecedor é substituído;
- o pedido é renegociado;
- a matriz recebe uma nova cotação.

Uma OS aditiva possui sua própria baseline e mantém vínculo com a OS principal.

### 6.2 Categorias mínimas

```text
MATERIAL
TERCEIRIZACAO
MAO_DE_OBRA
MAQUINA
FRETE
INSTALACAO
CUSTO_INDIRETO
OUTRO
```

### 6.3 Modelo lógico sugerido

O schema definitivo deve ser validado na fase técnica, mas a projeção precisa representar:

```prisma
model CustoPrevistoOS {
  id                    String   @id @default(cuid())
  loja_id               String
  os_id                 String
  item_os_id            String?
  categoria             CategoriaCustoOS
  origem_tipo           String   @db.VarChar(40)
  origem_id              String
  fornecedor_previsto_id String?
  descricao_snapshot    String   @db.VarChar(255)
  quantidade_prevista   Decimal? @db.Decimal(14, 4)
  custo_unitario        Decimal? @db.Decimal(14, 4)
  valor_previsto        Decimal  @db.Decimal(14, 2)
  criado_em             DateTime @default(now())

  @@unique([loja_id, os_id, origem_tipo, origem_id, categoria])
  @@index([loja_id, os_id])
  @@index([item_os_id])
  @@index([fornecedor_previsto_id])
  @@map("custos_previstos_os")
}
```

Regras:

- todas as relações devem ter `onDelete` definido conscientemente;
- dados financeiros/históricos não usam cascade destrutivo;
- toda FK deve possuir índice;
- toda busca por recurso filtra `id` e `loja_id`;
- a unique de origem impede duplicação no reprocessamento.

---

## 7. Composição do realizado

### 7.1 Compra direta para uma OS

O valor pago pode ser apropriado diretamente à OS/item:

```text
Pedido → Conta a pagar → Pagamento → Apropriação à OS
```

### 7.2 Compra para várias OS

O item ou pagamento deve possuir apropriações explícitas. O sistema não pode atribuir o total a uma única OS nem distribuir silenciosamente.

### 7.3 Compra para estoque

O pagamento da compra aumenta a posição financeira/estoque, mas não deve virar integralmente custo de uma OS. O custo da OS surge no consumo, conforme método de valorização definido:

- custo médio ponderado;
- custo do lote;
- ou outro método formalmente escolhido.

Até essa escolha ser implementada, a interface deve identificar material como **estimado** e não chamá-lo de custo real.

### 7.4 Serviço terceirizado

```text
OrdemTerceirizacao
→ PedidoCompraItem(SERVICO)
→ AceiteServico
→ ContaPagar
→ Pagamento
→ Apropriação à OS/ItemOS
```

### 7.5 Despesa emergencial

Deve usar um fluxo abreviado de compra/despesa, ainda com fornecedor/beneficiário, comprovante, motivo, conta a pagar/pagamento e apropriação. Não haverá escrita direta e sem origem na tabela analítica do pós-cálculo.

---

## 8. Fechamento financeiro da OS

### 8.1 Estados

```text
PENDENTE
EM_CONCILIACAO
FECHADO
REABERTO
```

### 8.2 Modelo lógico sugerido

```prisma
model FechamentoFinanceiroOS {
  id              String   @id @default(cuid())
  loja_id         String
  os_id           String
  status          StatusFechamentoFinanceiroOS @default(PENDENTE)
  fechado_em      DateTime?
  fechado_por     String?
  reaberto_em     DateTime?
  reaberto_por    String?
  motivo_reabertura String? @db.Text
  versao          Int      @default(1)
  criado_em       DateTime @default(now())
  atualizado_em   DateTime @updatedAt

  @@unique([loja_id, os_id])
  @@index([fechado_por])
  @@index([reaberto_por])
  @@map("fechamentos_financeiros_os")
}
```

### 8.3 Condições de fechamento

- OS pertence à loja autenticada;
- nenhuma conta vinculada vencida ou em aberto, salvo override autorizado e justificado;
- recebimentos/aceites e pagamentos estão conciliados;
- apropriações somam os valores esperados;
- divergências possuem justificativa;
- usuário possui permissão de fechamento;
- fechamento gera log imutável.

Reabertura exige permissão específica, motivo obrigatório e nova versão. O histórico anterior não é apagado.

---

## 9. API de pós-cálculo

### 9.1 Endpoints alvo

```text
GET  /financeiro/os/:osId/pos-calculo
POST /financeiro/os/:osId/fechamento
POST /financeiro/os/:osId/reabertura
GET  /financeiro/os/:osId/historico
```

Todos devem:

- usar `JwtAuthGuard`;
- obter a loja do contexto autenticado (`@CurrentLojaId()`/`@GetLoja()`), nunca de header confiado pelo cliente;
- validar DTOs com `class-validator`;
- filtrar OS por `id + loja_id`;
- aplicar permissões por ação;
- documentar respostas no OpenAPI.

### 9.2 Resposta mínima

```json
{
  "os_id": "os_123",
  "status_fechamento": "EM_CONCILIACAO",
  "receita": {
    "prevista": 5000,
    "faturada": 5000,
    "recebida": 3500
  },
  "custos": {
    "previsto": 2300,
    "comprometido": 2750,
    "incorrido": 2600,
    "faturado": 2600,
    "pago": 1800,
    "a_pagar": 800
  },
  "desvio_pago": -500,
  "desvio_comprometido": 450,
  "margem_prevista": 2700,
  "margem_caixa": 1700,
  "categorias": [],
  "trocas_fornecedor": [],
  "pendencias": []
}
```

Os valores retornados devem informar moeda, critério temporal e visão utilizada. Arredondamento ocorre somente nas bordas; cálculos internos usam `Decimal`.

---

## 10. Interface

### 10.1 Aba “Financeiro / Pós-cálculo” na OS

Blocos:

1. resumo de receita;
2. previsto × comprometido × incorrido × pago;
3. margem prevista, econômica e de caixa;
4. tabela por categoria;
5. trocas de fornecedor;
6. pagamentos e saldos;
7. pendências para fechamento;
8. histórico de fechamento/reabertura.

### 10.2 Regras visuais

- usar componentes globais em `frontend/src/components/ui`, `components/crud` e `components/layout`;
- seguir o padrão CRUD de fornecedores: `PageHeader`, tabela/cards responsivos, estados de loading/vazio, `ConfirmDialog`, toasts e cliente HTTP centralizado;
- usar `Card`, `Table`/`DataTable`, `Badge`, `Tabs`, `Button`, `Skeleton`, `Alert`, `Tooltip` e componentes de formulário existentes;
- nunca usar `style={{ ... }}`, atributo `style` ou cores hex/RGB no módulo;
- usar tokens semânticos: `background`, `foreground`, `muted`, `destructive`, `success`/equivalente do design system;
- validar light, dark e tema do sistema;
- não depender apenas de vermelho/verde: mostrar ícone, texto e sinal do desvio;
- garantir navegação por teclado, foco visível, labels e `aria-*`;
- cards no mobile e tabela/cards alternáveis no desktop.

---

## 11. Segurança — OWASP Top 10

| Risco | Controle obrigatório |
|---|---|
| A01 Broken Access Control | JWT, permissão por ação, `id + loja_id` em toda consulta e testes de IDOR |
| A02 Cryptographic Failures | HTTPS, segredos apenas em ambiente, comprovantes em storage privado com URL temporária |
| A03 Injection | DTO estrito, Prisma parametrizado e raw SQL somente revisado/parametrizado |
| A04 Insecure Design | máquina de estados, idempotência, segregação de funções e invariantes transacionais |
| A05 Security Misconfiguration | CORS/headers/limites de upload configurados, erros sem stack em produção |
| A06 Vulnerable Components | lockfile, auditoria de dependências e atualização controlada |
| A07 Authentication Failures | `JwtAuthGuard`, expiração, rate limit em ações sensíveis e reautenticação quando aplicável |
| A08 Data Integrity Failures | histórico imutável, snapshots, validação de webhook e proibição de update destrutivo |
| A09 Logging Failures | logs de criação, aprovação, troca, pagamento, fechamento e reabertura sem segredos |
| A10 SSRF | não buscar URLs arbitrárias; storage e integrações usam allowlist e timeout |

Exportações devem neutralizar fórmulas em CSV/Excel. Anexos precisam de allowlist de MIME/extensão, limite de tamanho, nome gerado pelo servidor e verificação antimalware quando disponível.

---

## 12. Anti-duplicidade e idempotência

Duplicidade deve ser impedida na origem, não corrigida por rotina posterior.

- unique de baseline por origem;
- unique de fechamento por OS/loja;
- chave idempotente em comandos automáticos;
- número de documento único por loja;
- referência externa única quando existir;
- transação para criação de documento, itens e histórico;
- conflito retorna `409`, sem criar cópia;
- botões ficam desabilitados durante submit, mas a garantia final é do backend/banco;
- nenhum `deleteMany + createMany` em fatos financeiros;
- nenhuma “deduplicação por similaridade” de pagamentos, fornecedores ou documentos;
- scripts de backfill operam em dry-run, produzem relatório e abortam em ambiguidade.

---

## 13. Fases de implementação

### Fase 0 — Contratos e dados

- [ ] Fechar o RP de Compras/Suprimentos.
- [ ] Inventariar snapshots atuais de orçamento, OS e terceirização.
- [ ] Definir método de valorização do estoque.
- [ ] Definir permissões e matriz de responsabilidades.
- [ ] Aprovar fórmulas e exemplos com o cliente.

### Fase 1 — Baseline prevista

- [ ] Criar projeção idempotente de custos previstos.
- [ ] Integrar conversão orçamento → OS.
- [ ] Preservar OS históricas sem reconstrução silenciosa.
- [ ] Testar OS normal, direta e aditiva.

### Fase 2 — Compras e contas a pagar

- [ ] Consumir pedidos, recebimentos, aceites, contas e pagamentos.
- [ ] Implementar apropriação explícita à OS.
- [ ] Registrar substituição total e parcial de fornecedor.

### Fase 3 — API analítica

- [x] GET `/financeiro/os/:osId/pos-calculo` — agregação read-only por OS (receita, custos, margens; arrays vazios para categorias/trocas).
- [ ] Agregação por item, categoria e fornecedor.
- [ ] Pendências e alertas de desvio (detalhados).
- [ ] Fechamento/reabertura com auditoria.

### Fase 4 — Interface

- [ ] Aba na OS.
- [ ] Indicadores e tabela responsiva.
- [ ] Histórico e justificativas.
- [ ] Testes light/dark, acessibilidade e responsividade.

### Fase 5 — Validação e produção

- [ ] Testes unitários, integração e e2e.
- [ ] Testes de isolamento entre lojas.
- [ ] Testes de idempotência e concorrência.
- [ ] `prisma validate`, revisão SQL e migrations aditivas.
- [ ] Backup, staging, smoke e rollout monitorado.

---

## 14. Critérios de aceite

- [ ] O previsto permanece igual após mudar preço ou fornecedor cadastral.
- [ ] A troca preserva fornecedor previsto, contratado e efetivo.
- [ ] Pagamentos parciais aparecem corretamente.
- [ ] Um pagamento estornado deixa de compor o real sem apagar o histórico.
- [ ] Compra compartilhada não é integralmente atribuída a uma OS.
- [ ] Custo de estoque não é chamado de real sem método de valorização.
- [ ] Reprocessamento não cria duplicatas.
- [ ] Usuário de outra loja não lê nem altera dados.
- [ ] Fechamento e reabertura exigem permissão e deixam log.
- [ ] A tela explica o desvio por categoria e fornecedor.
- [ ] Light, dark, mobile e navegação por teclado estão validados.
- [ ] Nenhum componente novo duplica componente global equivalente.
- [ ] Nenhum estilo inline foi introduzido.
- [ ] OpenAPI, lint, testes e builds estão verdes.
- [ ] Cobertura do escopo alterado é de pelo menos 80%.

---

## 15. Fora do escopo inicial

- contabilidade geral e plano de contas completo;
- escrituração fiscal;
- leitura automática de XML/NF-e;
- conciliação bancária automática;
- rateios contábeis avançados;
- múltiplas moedas;
- contratos complexos e portal do fornecedor;
- reconstrução automática de pós-cálculo de OS histórica sem baseline confiável.

---

## 16. Condição para início

Este documento define o destino funcional, mas não autoriza implementação. A ordem recomendada é:

```text
1. Matriz Insumo × Fornecedor
2. MVP Compras/Suprimentos
3. Contas a Pagar e apropriações
4. Baseline e API de pós-cálculo
5. Interface e fechamento financeiro
```

Qualquer migration deve seguir `docs/database/boas-praticas-schema-prisma.md`, ser aditiva quando possível, ter SQL revisado e passar por staging antes de produção.
