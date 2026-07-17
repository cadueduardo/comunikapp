# Plano de Ação — Matriz Insumo × Fornecedor (`InsumoFornecedor`)

**Status:** Fase 0 concluída; código da Fase 1 preparado e validado localmente — **migration ainda não aplicada em nenhum banco**
**Revisão:** 2026-07-17 — plano original + integridade referencial, estoque, JSON operacional, DTOs, deploy e contrato com Compras/Financeiro
**Origem:** `docs/modulo fornecedores/feature-fornecedores-insumos.md` + decisões de produto e validação contra o código atual
**Objetivo:** permitir N fornecedores por insumo físico único, com preço/SKU por fornecedor e um fornecedor padrão sincronizado com o motor de cálculo existente.

---

## 1. Resumo executivo

| Antes | Depois |
|-------|--------|
| 1 `Insumo` = 1 `fornecedorId` (unique `loja+nome+fornecedor`) | 1 `Insumo` físico = N linhas em `InsumoFornecedor` |
| Preço somente em `Insumo.custo_unitario` | Preço por fornecedor + espelho do padrão em `custo_unitario` |
| Duplicar “Lona 440” para dois fornecedores | Um insumo; múltiplas cotações na matriz |

**Fora deste plano:** escolher fornecedor alternativo na linha de material do orçamento; histórico de preço por vínculo; XML/fiscal por SKU; DRE/pós-cálculo.

**Já existe e não deve ser refeito:** `TipoFornecedor` (`INSUMO`, `TERCEIRIZADO`, `AMBOS`), CRUD `/fornecedores`, filtro por finalidade e terceirização no orçamento/OS/PCP.

---

## 2. Decisões fechadas

Estas decisões não devem ser reabertas durante a implementação sem alinhamento de produto/engenharia.

1. `Insumo.fornecedorId` e `Insumo.custo_unitario` permanecem obrigatórios como espelhos da linha `padrao: true`.
2. O unique de `Insumo` passa de `[loja_id, nome, fornecedorId]` para `[loja_id, nome]` somente após o merge aplicado e validado.
3. Cada insumo deve ter pelo menos um vínculo e exatamente um `padrao: true`.
4. Todo fornecedor associado deve pertencer à mesma loja, estar ativo e ter tipo `INSUMO` ou `AMBOS`.
5. O endpoint da matriz é a única fonte de alteração de custo e fornecedor padrão após a criação do insumo.
6. O create continua exigindo `fornecedorId` e `custo_unitario` e cria a primeira linha padrão na mesma transação.
7. A importação e a duplicação reutilizam o create e também devem criar a linha padrão.
8. A edição geral exibe custo e fornecedor padrão como somente leitura; a matriz possui salvamento independente.
9. É bloqueado inativar, excluir ou mudar para `TERCEIRIZADO` qualquer fornecedor que possua qualquer vínculo em `InsumoFornecedor`.
10. O sobrevivente de duplicatas é escolhido, nesta ordem: ativo; maior estoque físico; mais antigo; menor ID.
11. O merge de `estoque_itens` é feito por localização física e preserva seus registros filhos.
12. JSONs operacionais ativos têm somente o ID do insumo substituído; snapshots encerrados permanecem imutáveis.
13. A entrega inclui schema, migrations separadas, dry-run, merge/backfill, API, UI, testes e smoke de não regressão.
14. Toda linha de `InsumoFornecedor` possui `loja_id`, preenchido pelo contexto autenticado e igual ao `loja_id` do insumo e do fornecedor.

---

## 3. Modelo de dados alvo

### 3.1 Novo model `InsumoFornecedor`

```prisma
model InsumoFornecedor {
  loja_id       String
  insumo_id     String
  fornecedor_id String
  preco_custo   Decimal  @db.Decimal(10, 2)
  codigo_ref    String?
  padrao        Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  loja       loja       @relation(fields: [loja_id], references: [id], onDelete: Cascade)
  insumo     Insumo     @relation(fields: [insumo_id], references: [id], onDelete: Cascade)
  fornecedor fornecedor @relation(fields: [fornecedor_id], references: [id], onDelete: Cascade)

  @@id([insumo_id, fornecedor_id])
  @@index([fornecedor_id])
  @@index([loja_id, insumo_id])
  @@index([loja_id, fornecedor_id])
  @@map("insumo_fornecedores")
}
```

### 3.2 Relações inversas e unique final

```prisma
model Insumo {
  // campos atuais permanecem
  fornecedorId            String
  custo_unitario          Decimal             @db.Decimal(10, 2)
  fornecedores_associados InsumoFornecedor[]

  // somente na Fase 3
  @@unique([loja_id, nome])
}

model fornecedor {
  // relação legada permanece
  insumos             Insumo[]
  insumos_associados  InsumoFornecedor[]
}

model loja {
  insumos_fornecedores InsumoFornecedor[]
}
```

O banco é MySQL. SQL de backfill deve usar `INSERT ... ON DUPLICATE KEY UPDATE` ou operações Prisma equivalentes, não `ON CONFLICT`.

### 3.3 Invariante pai × matriz

Para cada `Insumo`:

```text
exatamente 1 InsumoFornecedor.padrao = true
InsumoFornecedor.loja_id = Insumo.loja_id = fornecedor.loja_id
Insumo.fornecedorId   = padrão.fornecedor_id
Insumo.custo_unitario = padrão.preco_custo
```

Essa cardinalidade não será garantida apenas pelo schema MySQL; todas as rotas de escrita, o backfill e as validações pós-merge devem preservá-la.

---

## 4. Inventário de dependências do merge

### 4.1 Referências diretas a `Insumo.id`

| Tabela/model | Coluna | Tratamento |
|--------------|--------|------------|
| `HistoricoPrecoInsumo` | `insumo_id` | Reapontar antes de excluir o secundário |
| `ItemTemplateProduto` | `insumo_id` | Reapontar |
| `itemorcamento` | `insumo_id` | Reapontar; preços históricos da linha permanecem |
| `ItemInsumo` | `insumo_id` | Reapontar; não deduplicar sem conflito real de constraint |
| `estoque` | `insumo_id` | Reapontar |
| `estoque_itens` | `insumoId` | Consolidar por `(localizacaoId, lojaId)` conforme seção 6.2 |
| `estoque_sobras` | `insumo_id` | Reapontar quando preenchido |
| `estoque_aproveitamentos` | `insumo_id` | Reapontar quando preenchido |

### 4.2 Filhos de `estoque_itens`

Quando duas linhas de estoque colidirem na mesma localização e uma delas for removida, reapontar antes:

| Tabela | Coluna |
|--------|--------|
| `estoque_movimentacoes` | `estoqueId` |
| `estoque_lotes` | `estoqueId` |
| `estoque_transferencias` | `estoqueId` |
| `estoque_sobras` | `estoque_id` |

Essas dependências não podem ser inferidas apenas das relations Prisma, pois parte do módulo de estoque trabalha com tabelas legadas e SQL direto.

### 4.3 Referências serializadas

O inventário deve localizar o ID secundário dentro de:

- `ItemOS.insumos_necessarios`;
- `OrdemServico.insumos_calculados`;
- qualquer outra coluna JSON/LongText encontrada no ambiente durante o dry-run.

Política fechada:

- `ItemOS.insumos_necessarios`: substituir IDs quando `status_liberacao_pcp` for `PENDENTE`, `BLOQUEADO_AGUARDANDO_SINAL`, `LIBERADO` ou `EM_PRODUCAO`;
- itens `CONCLUIDO`: manter como snapshot;
- `OrdemServico.insumos_calculados`: substituir somente quando `ativo = true` e `status` não for `FINALIZADA` nem `CANCELADA`;
- OS inativa, `FINALIZADA` ou `CANCELADA`: manter como snapshot;
- alterar somente o campo de ID (`insumo_id`/equivalente), preservando quantidade, unidade, preço, nome e demais dados históricos;
- JSON inválido deve ser registrado no relatório e interromper o `--apply` para a loja afetada, sem falha silenciosa.

---

## 5. Estratégia de migrations e deploy do schema

As migrations Prisma usam diretórios com timestamp de 14 dígitos e arquivo interno `migration.sql`, seguindo o padrão atual do repositório.

| Fase | Exemplo de diretório | Conteúdo |
|------|----------------------|----------|
| 1 | `20260716HHMMSS_create_insumo_fornecedores` | Tabela, PK, FKs, índices e relations; mantém unique antigo |
| 2 | script standalone versionado | Merge e backfill; não é executado automaticamente pelo Prisma |
| 3 | `20260716HHMMSS_update_insumo_unique` | Remove unique antigo e cria `[loja_id, nome]` |

Regras obrigatórias:

- a migration da Fase 3 não deve ser liberada como migration pendente antes de a Fase 2 ter sido aplicada e validada no ambiente;
- `prisma migrate deploy` não executa o script Node entre duas migrations;
- a Fase 1 é aditiva e deve ser compatível com o código antigo;
- usar janela controlada/maintenance para evitar criação concorrente de insumos entre o merge final e a aplicação do unique;
- nunca usar `db push` como substituto dessa sequência em staging ou produção.

---

## 6. Fases de implementação

### Fase 0 — Dry-run e inventário, somente leitura

**Objetivo:** medir e revisar o impacto antes de qualquer escrita.

#### Preparação

- [x] Partir de branch limpa baseada no ponto estável acordado, usando o padrão do repositório para o nome da branch.
- [x] Criar script standalone versionado em `backend/scripts/migrate-insumo-fornecedor-matriz.js`.
- [x] `--dry-run` é o comportamento padrão; nenhuma query de escrita ocorre nesse modo.
- [x] Aceitar `--loja-id=<id>` para limitar o escopo.

#### Relatório obrigatório

Por loja, registrar:

- grupos que colidirão segundo a collation real do MySQL para `[loja_id, nome]`;
- IDs, `ativo`, `criado_em`, fornecedor, custo e estoque total de cada candidato;
- sobrevivente escolhido e justificativa de cada critério;
- todas as FKs diretas que seriam reapontadas;
- plano por `estoque_itens.localizacaoId`: update simples ou consolidação;
- contagem e IDs de movimentações, lotes, transferências e sobras afetados;
- ocorrências nos JSONs de `ItemOS` e `OrdemServico`, classificadas em mutáveis e snapshots;
- JSONs inválidos ou shapes desconhecidos;
- conflitos de fornecedor/preço na futura matriz;
- total estimado de inserts, updates e deletes no `--apply`.

Salvar relatório em JSON e resumo legível, por exemplo:

```text
backend/scripts/reports/insumo-fornecedor-dry-run-YYYYMMDD-HHMMSS.json
backend/scripts/reports/insumo-fornecedor-dry-run-YYYYMMDD-HHMMSS.md
```

#### Regra determinística do sobrevivente

Ordenar candidatos por:

1. `ativo = true` antes de `false`;
2. maior soma de `estoque_itens.quantidadeAtual` em todas as localizações;
3. `Insumo.criado_em` ASC;
4. `Insumo.id` ASC alfanumérico.

O campo legado `Insumo.estoque_atual` não participa da eleição.

#### Critério de saída

- [x] Dry-run executado no ambiente autorizado.
- [x] Relatórios arquivados e revisados.
- [x] Grupos homônimos semanticamente diferentes renomeados antes do merge — não aplicável: nenhum grupo colidente encontrado.
- [x] Nenhuma escrita realizada.
- [ ] Aprovação explícita para seguir à Fase 1.

---

#### Registro de execução da Fase 0 — 2026-07-17

- Branch: `codex/fornecedores-matriz-fase0`.
- Commit do script corrigido: `f196926e`.
- Ambiente analisado: produção, por consultas exclusivamente `SELECT`.
- Lojas analisadas: 4.
- Insumos encontrados: 33.
- Grupos colidentes segundo a collation real do MySQL: 0.
- Insumos secundários: 0.
- JSONs inválidos: 0.
- Shapes JSON desconhecidos: 0.
- Estimativa para a futura Fase 2: 33 inserts de backfill, 0 updates e 0 deletes.
- Relatórios finais protegidos:
  - `/srv/apps/comunikapp/shared/reports/insumo-fornecedor/insumo-fornecedor-dry-run-20260717-193617.json`;
  - `/srv/apps/comunikapp/shared/reports/insumo-fornecedor/insumo-fornecedor-dry-run-20260717-193617.md`.
- Permissões dos relatórios: `600`, proprietário `comunikapp`.
- Checkout de produção permaneceu em `main`, commit `ac455608`, sem arquivos modificados.

**Decisão resultante:** não há merge de duplicatas a preparar no estado atual da base. A Fase 2 ainda deve manter suas proteções para outros ambientes e para dados criados entre o dry-run e a janela de corte, mas, se a base permanecer nesse estado, sua atuação será somente o backfill das 33 linhas padrão.

---

### Fase 1 — Estrutura aditiva

**Objetivo:** criar `insumo_fornecedores` sem alterar a unicidade atual.

- [x] Adicionar `InsumoFornecedor`, `@@map` e relações inversas.
- [x] Incluir `loja_id`, relação com `loja` e índices compostos tenant-first.
- [x] Manter `@@unique([loja_id, nome, fornecedorId])` em `Insumo`.
- [x] Gerar migration SQL revisável com timestamp real de 14 dígitos.
- [x] Executar `prisma validate` e `prisma generate`.
- [ ] Aplicar em staging e confirmar tabela, PK, FKs e índices.
- [ ] Confirmar que a versão antiga do app continua funcionando.

**Saída:** tabela vazia disponível; nenhuma alteração de dados e nenhum unique novo.

---

#### Registro de preparação da Fase 1 — 2026-07-17

- Branch: `codex/fornecedores-matriz-fase1`.
- Model `InsumoFornecedor` adicionado com `loja_id` obrigatório, PK composta e relações inversas.
- Unique legado `@@unique([loja_id, nome, fornecedorId])` preservado.
- Migration aditiva: `20260717201405_create_insumo_fornecedores`.
- A migration cria somente `insumo_fornecedores`; não contém DML, `DROP`, alteração de `insumos` ou mudança de constraint existente.
- SQL comparado com a saída de referência de `prisma migrate diff`.
- `prisma validate`: aprovado.
- `prisma generate`: aprovado.
- Build NestJS: aprovado.
- Testes da matriz/dry-run/schema: 10 aprovados.
- Nenhuma conexão de migration, aplicação em banco ou alteração de produção realizada.

**Próximo gate:** aplicar primeiro em staging ou ambiente descartável, validar estrutura e compatibilidade do aplicativo antigo. Produção permanece bloqueada até essa evidência e nova autorização.

---

### Fase 2 — Merge aplicado e backfill

**Objetivo:** eliminar duplicatas, preencher a matriz e validar invariantes antes da constraint final.

#### 2.1 Transação e escopo

- executar por loja ou por grupo em transações delimitadas;
- adquirir proteção contra escrita concorrente durante a janela de corte;
- abortar a loja/grupo ao encontrar JSON inválido, referência inesperada ou conflito não previsto;
- `--apply` deve exigir confirmação explícita e backup/snapshot comprovado;
- toda operação deve ser idempotente ou detectar que já foi aplicada.

#### 2.2 Merge de `estoque_itens` por localização

Para cada item de estoque do insumo secundário:

**Sem item do sobrevivente na mesma `(localizacaoId, lojaId)`**

- atualizar somente `estoque_itens.insumoId` para o sobrevivente;
- preservar o ID físico do item;
- preservar movimentações, lotes, transferências e sobras sem reapontamento.

**Com item do sobrevivente na mesma `(localizacaoId, lojaId)`**

1. Capturar IDs e saldos anteriores no log.
2. Somar no item sobrevivente:
   - `quantidadeAtual`;
   - `quantidadeReservada`.
3. Manter `estoqueMinimo` e `estoqueMaximo` do item sobrevivente.
4. Manter metadados cadastrais do sobrevivente (`codigo`, `nome`, `unidadeMedida`, `precoUnitario` etc.).
5. Reapontar `estoque_movimentacoes`, `estoque_lotes`, `estoque_transferencias` e `estoque_sobras.estoque_id`.
6. Criar uma movimentação `AJUSTE` no item sobrevivente com observação iniciada por `SISTEMA_FUSAO_ESTOQUE`, contendo IDs envolvidos e salto de saldo.
7. Remover a linha secundária somente após validar que não restou filho apontando para ela.

Os movimentos históricos reapontados preservam seus valores originais de `quantidadeAnterior` e `quantidadePosterior`; portanto, a sequência anterior pode não formar uma progressão contínua após a fusão. Essa quebra semântica deve constar no relatório e na movimentação de ajuste — os registros históricos não devem ser reescritos.

Após consolidar todas as localizações, atualizar `Insumo.estoque_atual` do sobrevivente com a soma de `quantidadeAtual`, caso o campo continue sendo consumido pelo sistema.

#### 2.3 Merge das demais referências

- criar candidatos de matriz para os fornecedores dos secundários;
- fornecedor original do sobrevivente permanece padrão;
- para mesmo fornecedor repetido, preservar o preço do padrão; se nenhum for padrão, manter o menor preço e registrar o conflito;
- reapontar todas as referências da seção 4.1;
- atualizar JSONs mutáveis conforme seção 4.3;
- não deduplicar itens de orçamento/template apenas por passarem a compartilhar `insumo_id`; deduplicar somente se uma constraint real exigir e com regra de quantidade documentada;
- excluir o `Insumo` secundário apenas depois de confirmar zero referências operacionais residuais.

#### 2.4 Backfill geral

Para todo insumo restante, garantir uma linha correspondente ao espelho atual:

```text
insumo_id     = Insumo.id
loja_id       = Insumo.loja_id
fornecedor_id = Insumo.fornecedorId
preco_custo   = Insumo.custo_unitario
codigo_ref    = null
padrao        = true
```

Se já existirem linhas extras do merge, zerar `padrao` nas demais antes de marcar o fornecedor atual. Usar operação compatível com MySQL e PK composta.

#### 2.5 Auditoria persistida

O relatório do `--apply` deve registrar, no mínimo:

- `secundario → sobrevivente`;
- IDs de itens de estoque preservados e removidos;
- saldos antes/depois por localização;
- filhos reapontados;
- IDs de movimentações `SISTEMA_FUSAO_ESTOQUE`;
- JSONs alterados e snapshots ignorados;
- conflitos de preço/fornecedor;
- contagens antes/depois e erros.

#### 2.6 Validação pós-merge

- [ ] Zero grupos duplicados segundo a collation/constraint alvo.
- [ ] Todo insumo tem ao menos uma linha na matriz.
- [ ] Todo insumo tem exatamente um padrão.
- [ ] Pai e padrão têm o mesmo fornecedor e custo.
- [ ] Nenhuma matriz contém fornecedor de outra loja, inativo ou `TERCEIRIZADO`.
- [ ] Nenhuma FK ou referência operacional aponta para Insumo secundário excluído.
- [ ] Nenhuma tabela filha aponta para `estoque_itens` removido.
- [ ] Unique de `estoque_itens` permanece válido.
- [ ] Totais de `quantidadeAtual` e `quantidadeReservada` antes/depois são iguais por loja/insumo consolidado.
- [ ] JSONs ativos não contêm IDs secundários; snapshots permanecem inalterados.
- [ ] Relatório e backup estão arquivados.

**Saída:** staging validado; somente então autorizar a Fase 3.

---

### Fase 3 — Constraint final

- [ ] Confirmar novamente zero duplicatas.
- [ ] Remover `@@unique([loja_id, nome, fornecedorId])`.
- [ ] Adicionar `@@unique([loja_id, nome])`.
- [ ] Manter `fornecedorId` obrigatório.
- [ ] Gerar a migration somente após a Fase 2 aprovada no ambiente.
- [ ] Aplicar em staging e executar smoke antes de produção.

**Saída:** dois insumos com o mesmo nome na mesma loja não podem ser criados; múltiplos fornecedores existem somente pela matriz.

---

### Fase 4 — Backend NestJS

#### 4.1 DTO envelope

Arquivo sugerido: `backend/src/insumos/dto/vincular-fornecedores.dto.ts`.

```ts
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';

export class VincularFornecedorItemDto {
  @IsString()
  @IsNotEmpty()
  fornecedor_id: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  preco_custo: number;

  @IsOptional()
  @IsString()
  codigo_ref?: string;

  @IsBoolean()
  padrao: boolean;
}

export class VincularFornecedoresEnvelopeDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => VincularFornecedorItemDto)
  fornecedores: VincularFornecedorItemDto[];
}
```

#### 4.2 Endpoint da matriz

```text
PATCH /insumos/:id/fornecedores
```

- obter loja por `@GetLoja()`/JWT, conforme o controller atual;
- não confiar em `x-loja-id` enviado pelo cliente;
- body: `VincularFornecedoresEnvelopeDto`.

Em uma única `$transaction`:

1. Confirmar insumo da loja.
2. Exigir ao menos uma linha.
3. Exigir exatamente um padrão.
4. Rejeitar fornecedor duplicado no payload.
5. Buscar todos os fornecedores e confirmar mesma loja, `ativo = true` e tipo `INSUMO|AMBOS`.
6. Substituir os vínculos do insumo preenchendo `loja_id` exclusivamente pelo contexto autenticado.
7. Atualizar `Insumo.custo_unitario` e `Insumo.fornecedorId` pelo padrão.
8. Opcionalmente registrar `HistoricoPrecoInsumo` quando o custo padrão mudar.
9. Retornar matriz ordenada, com Decimals convertidos para número conforme o padrão atual da API.

#### 4.3 Escrita única no CRUD de insumos

| Fluxo | Regra |
|-------|-------|
| Create | Exige fornecedor/custo e cria insumo + uma linha padrão na mesma transação |
| Update geral | DTO omite `fornecedorId` e `custo_unitario`; com `forbidNonWhitelisted`, tentativa externa retorna `400` |
| GET um | Inclui `fornecedores_associados.fornecedor` e converte preços |
| GET lista | Pode manter resposta enxuta; incluir matriz somente se a UI precisar |
| Importação | Reutiliza create e cria matriz padrão |
| Duplicação | Reutiliza create; nova cópia começa com o padrão atual |

Para o update, usar `OmitType`/DTO dedicado em vez de herdar esses campos de `PartialType(CreateInsumoDto)`.

#### 4.4 Guard de fornecedor

Em `fornecedores.service.ts`:

- `update`: bloquear `ativo: false` ou mudança para `TERCEIRIZADO` se existir qualquer `InsumoFornecedor`;
- `remove`: bloquear exclusão se existir qualquer vínculo na matriz;
- manter os guards existentes de terceirização/OS/orçamento;
- executar checagem e mutação em transação quando houver alteração sensível;
- mensagem deve listar a quantidade ou alguns insumos afetados e orientar a desassociação pela matriz.

#### 4.5 Testes backend mínimos

- [ ] zero ou dois padrões → `400`;
- [ ] payload vazio → `400`;
- [ ] fornecedor duplicado → `400`;
- [ ] fornecedor de outra loja → `400`;
- [ ] fornecedor inativo → `400`;
- [ ] fornecedor `TERCEIRIZADO` → `400`;
- [ ] replace sincroniza pai e matriz;
- [ ] falha no replace faz rollback integral;
- [ ] create/import/duplicar criam exatamente uma linha padrão;
- [ ] update geral rejeita custo/fornecedor;
- [ ] update/remove de fornecedor associado são bloqueados;
- [ ] GET retorna associações esperadas.

---

### Fase 5 — Frontend

#### 5.1 Edição do insumo

Na tela `insumos/editar/[id]`:

- mostrar “Fornecedor padrão” e “Custo padrão” como somente leitura;
- retirar esses campos do payload do update geral;
- adicionar card “Matriz de Fornecedores e Custos” com:
  - select filtrado por finalidade `INSUMO`;
  - preço de custo;
  - código de referência/SKU;
  - radio padrão;
  - adicionar/remover linha;
  - botão próprio “Salvar matriz” com loading independente;
- impedir zero linhas, fornecedores repetidos e quantidade de padrões diferente de um;
- não permitir remover a última linha;
- atualizar os campos informativos após salvar/trocar o padrão;
- exibir mensagens reais do backend em toast.

#### 5.2 Cliente HTTP

Adicionar helper ao `insumosApi`, por exemplo:

```ts
vincularFornecedores: (id, data, token) =>
  ApiClient.patch(`/insumos/${id}/fornecedores`, data, token)
```

O frontend atual usa `ApiClient` com base `/api`/rewrite. Não criar route handler Next dedicado sem necessidade comprovada.

#### 5.3 Cadastro novo

O create mantém o seletor de fornecedor e custo inicial. A matriz completa pode ser gerenciada depois da criação, na edição, sem duplicar duas fontes de verdade no mesmo submit.

---

### Fase 6 — Não regressão

| Fluxo | Verificação |
|-------|-------------|
| Orçamento V2 | Preview usa `Insumo.custo_unitario` do padrão |
| Templates | Materiais apontam para sobrevivente e mantêm quantidades |
| OS ativa | JSONs operacionais usam o sobrevivente |
| OS encerrada | Snapshot permanece inalterado |
| PCP | Baixa de material resolve o insumo correto |
| Estoque | Saldos/reservas totais preservados e filhos não órfãos |
| Lotes/transferências/sobras | Consultas continuam retornando histórico |
| Importação | Cria matriz com um padrão |
| Duplicação | Cria nova matriz inicial correta |
| Fornecedores | Filtros e CRUD continuam funcionando com guards |
| Terceirização | Fluxos `TERCEIRIZACAO` permanecem independentes |

Executar, quando autorizado:

- testes Jest filtrados de insumos, fornecedores, estoque e OS;
- testes do script com fixtures sem banco real;
- `prisma validate` e revisão do SQL gerado;
- builds backend/frontend;
- smoke manual em staging.

---

## 7. Ordem segura de produção

```text
1. Criar/usar branch limpa e aprovar código
2. Executar Fase 0 dry-run somente leitura em produção
3. Revisar relatório e resolver homônimos que não devem ser unidos
4. Gerar backup/snapshot verificável
5. Aplicar migration aditiva da Fase 1
6. Iniciar janela controlada de escrita de insumos/estoque
7. Aplicar script Fase 2 com --apply
8. Executar todas as validações da seção 2.6 da Fase 2
9. Aplicar migration restritiva da Fase 3
10. Subir backend que dual-write/create e expõe o endpoint da matriz
11. Liberar frontend da matriz
12. Encerrar janela controlada e executar smoke
13. Monitorar erros, invariantes pai×matriz e estoque
```

Para reduzir indisponibilidade, o backend compatível pode ser preparado antes, mas não deve receber tráfego que escreva a matriz antes de `insumo_fornecedores` existir.

**Rollback:** antes da Fase 3, interromper e restaurar o backup se o merge falhar. Depois da fusão aplicada, não tentar “desfazer” por script improvisado; restaurar snapshot conforme o runbook. A migration do unique só entra após todas as validações.

---

## 8. Riscos e mitigações

| Risco | Mitigação |
|-------|-----------|
| Homônimos representam materiais diferentes | Dry-run, revisão humana e rename antes do merge |
| Colisão de estoque por localização | Algoritmo específico por `(localizacaoId, lojaId)` |
| Filhos de estoque órfãos | Inventário e reapontamento antes do delete |
| Linha do tempo de movimentos deixa de ser contínua | Preservar movimentos + `AJUSTE` auditável + relatório |
| JSON ativo aponta para ID excluído | Classificação por status, parse estrito e validação pós-merge |
| Snapshot financeiro é alterado | Não modificar OS/item encerrado; trocar apenas ID em ativos |
| Pai e matriz divergem | Escrita centralizada e mesma transação |
| Fornecedor associado fica inválido | Guard absoluto em update/remove |
| `migrate deploy` aplica unique cedo demais | Só liberar migration da Fase 3 após merge aprovado |
| Duas requisições do frontend deixam estado parcial | Salvamento independente da matriz |
| Escrita concorrente durante corte | Janela controlada/maintenance e validação final |

---

## 9. Critérios de aceite (DoD)

- [ ] `insumo_fornecedores` existe com PK composta, FKs, índices e `@@map` correto.
- [ ] Toda linha da matriz possui `loja_id` coerente com insumo e fornecedor.
- [ ] Relações inversas existem em `Insumo` e `fornecedor`.
- [ ] Unique `[loja_id, nome]` está ativa sem duplicatas.
- [ ] Todo insumo possui pelo menos um vínculo e exatamente um padrão.
- [ ] Pai está sincronizado com a linha padrão.
- [ ] Todos os fornecedores associados são válidos para a loja/finalidade.
- [ ] Dry-run e merge aplicado possuem relatórios arquivados.
- [ ] Nenhuma referência direta, de estoque ou JSON operacional aponta para ID removido.
- [ ] Totais de estoque e reserva foram preservados.
- [ ] Endpoint da matriz valida envelope, loja, tipo, ativo, duplicidade e padrão.
- [ ] Create, importação e duplicação criam a matriz inicial.
- [ ] Update geral não aceita custo/fornecedor.
- [ ] Guards impedem invalidar fornecedor associado.
- [ ] UI usa campos informativos somente leitura e salvamento independente.
- [ ] Testes e smoke de orçamento, OS, PCP, estoque e fornecedores estão verdes.

---

## 10. Escopo explicitamente fora desta entrega

- seleção de fornecedor alternativo na linha de orçamento;
- histórico de preço específico por `InsumoFornecedor`;
- integração XML/fiscal por `codigo_ref`;
- alteração do comportamento OUTSOURCE/BOM;
- timestamps cosméticos no model `fornecedor`;
- reconstrução retroativa dos saldos progressivos de movimentações fusionadas.

---

## 11. Contrato de integração com Compras e Previsto × Real

O plano da matriz permanece fechado e não recebe tabelas ou responsabilidades financeiras. As evoluções de Compras e do pós-cálculo acrescentam apenas estas fronteiras obrigatórias:

1. `InsumoFornecedor.preco_custo` é uma cotação cadastral atual, nunca um pagamento ou custo realizado.
2. O fornecedor padrão alimenta novos cálculos, mas alterações futuras não recalculam orçamento, OS, pedido ou pagamento histórico.
3. Um futuro `PedidoCompraItem` de material pode referenciar `loja_id + insumo_id + fornecedor_id`, mas deve guardar fornecedor, descrição, código de referência, unidade e preço negociado como snapshots.
4. O fornecedor previsto no orçamento e o fornecedor efetivamente contratado/pago devem coexistir.
5. Troca de fornecedor ocorre em Compras, por cancelamento de saldo e pedido substituto auditável; não por sobrescrita da matriz.
6. Compra para estoque e compra direta para OS são destinos diferentes. A matriz não decide apropriação financeira.
7. O merge desta entrega preserva preços dos itens de orçamento e snapshots de OS encerradas, como já definido.
8. Nenhum vínculo da matriz será “deduplicado” por heurística. A PK composta impede repetição exata; conflitos ambíguos interrompem o processo e são relatados.

Documentos consumidores:

- `docs/modulo de compras/RP-mvp-compras-suprimentos.md`;
- `docs/modulo financeiro/feature-financeiro-previsto-real.md`.

Essas regras não alteram schema, migrations, fases ou critérios de aceite deste plano.

---

## 12. Próximo passo autorizado somente após confirmação

1. Criar uma branch limpa a partir do ponto estável acordado.
2. Implementar exclusivamente a Fase 0 e seus testes.
3. Executar o dry-run no ambiente autorizado e apresentar os relatórios.
4. Aguardar aprovação explícita antes da Fase 1 ou de qualquer escrita.

Este documento não autoriza por si só branch, migration, `--apply`, deploy ou alteração no banco.
