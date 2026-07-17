# Design técnico — Fase 1 (Fundação e Backend)

**Versão:** 0.1  
**Data:** 2026-06-26  
**Base:** [01-especificacao-funcional.md](./01-especificacao-funcional.md)  
**Decisões consolidadas:** modelo HORA, alerta (não bloqueio) sem config, `exibir_linha_pdf = false` para `INCLUIDA_NO_PRODUTO`

---

## 1. Decisão arquitetural central: fila sem tabela `ArteFila`

### Por que **não** criar `ArteFila` como entidade persistida

| Abordagem | Prós | Contras |
|-----------|------|---------|
| Tabela `ArteFila` duplicada | Histórico de entrada na fila | **Dupla fonte de verdade** com `ItemOS.status_arte`; risco de drift; sincronização em todo evento |
| **Fila como read model** (recomendado) | Estado único em `ItemOS`; query indexada; alinhado à spec | SLA “tempo na fila” usa `ItemOS.criado_em` ou campo `arte_fila_desde` |

**Conclusão Fase 1:** a “fila” é **`GET /arte-aprovacao/fila`** — consulta `ItemOS` + `OrdemServico` + joins opcionais (`cliente`, `ArteVersao`), filtrada por `loja_id` do JWT.

`ArteVersao` **já existe** — não recriar; apenas reforçar vínculo `servico_id` = `ItemOS.id` (convenção legada mantida).

### Tabela opcional Fase 2 (fora do escopo Fase 1)

`arte_fila_evento` — log de auditoria (assumir, transição de status), **não** usado para montar a fila.

---

## 2. Proposta de migração Prisma (aditiva)

**Arquivo sugerido:** `backend/prisma/migrations/20260626120000_modulo_arte_aprovacao_fase1/migration.sql`

### 2.1 Nova tabela `configuracao_arte_loja`

Relação 1:1 com `loja`.

```sql
CREATE TABLE `configuracao_arte_loja` (
  `id`                          VARCHAR(191) NOT NULL,
  `loja_id`                     VARCHAR(191) NOT NULL,
  `ativo`                       BOOLEAN      NOT NULL DEFAULT true,
  `modelo_precificacao`         VARCHAR(24)  NOT NULL DEFAULT 'HORA',
  `servico_arte_id`             VARCHAR(191) NULL,
  `cobranca_padrao`             VARCHAR(32)  NOT NULL DEFAULT 'INCLUIDA_NO_PRODUTO',
  `horas_padrao_criacao`        DECIMAL(10,2) NOT NULL DEFAULT 1.00,
  `horas_padrao_adaptacao`      DECIMAL(10,2) NOT NULL DEFAULT 0.50,
  `exibir_linha_pdf`            BOOLEAN      NOT NULL DEFAULT false,
  `permitir_edicao_orcamentista` BOOLEAN     NOT NULL DEFAULT true,
  `criado_em`                   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `atualizado_em`               DATETIME(3)  NOT NULL,

  PRIMARY KEY (`id`),
  UNIQUE INDEX `configuracao_arte_loja_loja_id_key` (`loja_id`),
  INDEX `configuracao_arte_loja_servico_arte_id_idx` (`servico_arte_id`),
  CONSTRAINT `configuracao_arte_loja_loja_id_fkey`
    FOREIGN KEY (`loja_id`) REFERENCES `loja`(`id`) ON DELETE CASCADE,
  CONSTRAINT `configuracao_arte_loja_servico_arte_id_fkey`
    FOREIGN KEY (`servico_arte_id`) REFERENCES `servico_manual`(`id`) ON DELETE SET NULL
);
```

**MVP:** apenas campos do modelo `HORA`. Campos de FIXO/M2/COMPLEXIDADE ficam para Fase 2 (JSON `tabela_complexidade`, etc.).

### 2.2 Alteração `servico_manual`

```sql
ALTER TABLE `servico_manual`
  ADD COLUMN `sistema` BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX `servico_manual_loja_id_sistema_idx` ON `servico_manual`(`loja_id`, `sistema`);
```

- Serviço sistêmico: `nome = 'Criação de arte (sistema)'`, `sistema = true`, `setor_id` → setor Arte (quando existir).
- Criado no **seed/onboarding** da config (`ConfiguracaoArteService.ensureServicoSistema`).

### 2.3 Alteração `produto_orcamento` (Prisma: `ProdutoOrcamento`)

```sql
ALTER TABLE `ProdutoOrcamento`
  ADD COLUMN `responsabilidade_arte`      VARCHAR(32)  NOT NULL DEFAULT 'NAO_APLICAVEL',
  ADD COLUMN `politica_cobranca_arte`   VARCHAR(32)  NOT NULL DEFAULT 'NAO_APLICAVEL',
  ADD COLUMN `finalidade_anexo`         VARCHAR(32)  NULL,
  ADD COLUMN `complexidade_arte`          VARCHAR(16)  NULL,
  ADD COLUMN `arte_custo_automatico`    BOOLEAN      NOT NULL DEFAULT false,
  ADD COLUMN `arte_referencia_servico_id` VARCHAR(191) NULL,
  ADD COLUMN `arte_horas_calculadas`    DECIMAL(10,2) NULL,
  ADD COLUMN `arte_custo_calculado`     DECIMAL(10,2) NULL;
```

### 2.4 Alteração `itens_os` (Prisma: `ItemOS`)

```sql
ALTER TABLE `itens_os`
  ADD COLUMN `responsabilidade_arte`      VARCHAR(32)  NOT NULL DEFAULT 'NAO_APLICAVEL',
  ADD COLUMN `politica_cobranca_arte`   VARCHAR(32)  NOT NULL DEFAULT 'NAO_APLICAVEL',
  ADD COLUMN `finalidade_anexo`         VARCHAR(32)  NULL,
  ADD COLUMN `complexidade_arte`          VARCHAR(16)  NULL,
  ADD COLUMN `status_arte`              VARCHAR(32)  NOT NULL DEFAULT 'NAO_APLICA',
  ADD COLUMN `designer_atribuido_id`    VARCHAR(191) NULL,
  ADD COLUMN `arte_fila_desde`          DATETIME(3)  NULL,
  ADD COLUMN `arte_assumido_em`         DATETIME(3)  NULL;

CREATE INDEX `itens_os_status_arte_idx` ON `itens_os`(`status_arte`);
CREATE INDEX `itens_os_responsabilidade_arte_idx` ON `itens_os`(`responsabilidade_arte`);
CREATE INDEX `itens_os_designer_atribuido_id_idx` ON `itens_os`(`designer_atribuido_id`);
```

- `arte_fila_desde`: preenchido quando `status_arte = AGUARDANDO_INICIO` (métrica de tempo na fila).
- `designer_atribuido_id` → FK `usuario.id` (SET NULL on delete).

### 2.5 Alteração `item_servico_manual` (Prisma: `ItemServicoManual`)

```sql
ALTER TABLE `ItemServicoManual`
  ADD COLUMN `origem`           VARCHAR(32) NOT NULL DEFAULT 'MANUAL',
  ADD COLUMN `exibir_no_pdf`    BOOLEAN     NOT NULL DEFAULT true;

CREATE INDEX `ItemServicoManual_produto_id_origem_idx`
  ON `ItemServicoManual`(`produto_id`, `origem`);
```

- `origem = 'ARTE_AUTOMATICA'` → linha injetada pelo motor de arte.
- `exibir_no_pdf`: derivado de `politica_cobranca_arte` + `configuracao_arte_loja.exibir_linha_pdf`.

### 2.6 `ArteVersao` — sem alteração de schema na Fase 1

Campos existentes suficientes. Melhorias Fase 2:

- Renomear conceitualmente `servico_id` → `item_os_id` na API (alias no DTO, sem migration).

### 2.7 Índice composto para performance da fila

Consulta típica:

```sql
-- ItemOS i JOIN ordens_servico o ON i.os_id = o.id
-- WHERE o.loja_id = ? AND o.ativo = true
-- AND i.responsabilidade_arte IN ('EMPRESA_CRIA','EMPRESA_ADAPTA')
-- AND i.status_arte IN (...)
```

Índice adicional em `ordens_servico` já cobre `loja_id, ativo`. Monitorar EXPLAIN na Fase 1.

### 2.8 Backfill (migration data)

```sql
-- Produtos/OS existentes: defaults já aplicados pelas colunas DEFAULT
-- Nenhum item entra na fila retroativamente (status_arte = NAO_APLICA)
```

---

## 3. Enums e constantes (TypeScript)

**Arquivo:** `backend/src/modules/arte-aprovacao/constants/arte.enums.ts`

```typescript
export enum ResponsabilidadeArte {
  CLIENTE_FORNECE = 'CLIENTE_FORNECE',
  EMPRESA_CRIA = 'EMPRESA_CRIA',
  EMPRESA_ADAPTA = 'EMPRESA_ADAPTA',
  NAO_APLICAVEL = 'NAO_APLICAVEL',
}

export enum PoliticaCobrancaArte {
  NAO_APLICAVEL = 'NAO_APLICAVEL',
  INCLUIDA_NO_PRODUTO = 'INCLUIDA_NO_PRODUTO',
  COBRADA_A_PARTE = 'COBRADA_A_PARTE',
  SEM_CUSTO = 'SEM_CUSTO',
}

export enum FinalidadeAnexo {
  REFERENCIA_VISUAL = 'REFERENCIA_VISUAL',
  DESENHO_TECNICO = 'DESENHO_TECNICO',
  ARTE_PRODUCAO = 'ARTE_PRODUCAO',
}

export enum StatusArte {
  NAO_APLICA = 'NAO_APLICA',
  AGUARDANDO_INICIO = 'AGUARDANDO_INICIO',
  EM_CRIACAO = 'EM_CRIACAO',
  AGUARDANDO_CLIENTE = 'AGUARDANDO_CLIENTE',
  REVISAO_SOLICITADA = 'REVISAO_SOLICITADA',
  APROVADA = 'APROVADA',
  LIBERADA_PCP = 'LIBERADA_PCP',
  AGUARDANDO_ARQUIVO_CLIENTE = 'AGUARDANDO_ARQUIVO_CLIENTE',
  ARQUIVO_RECEBIDO = 'ARQUIVO_RECEBIDO',
}

export enum ModeloPrecificacaoArte {
  HORA = 'HORA',
  // FIXO, M2, UNIDADE, COMPLEXIDADE — Fase 2
}

export enum OrigemItemServicoManual {
  MANUAL = 'MANUAL',
  ARTE_AUTOMATICA = 'ARTE_AUTOMATICA',
}
```

**Transições permitidas:** `backend/src/modules/arte-aprovacao/constants/arte-transicoes.ts` (mapa + validador puro).

---

## 4. Estrutura de pastas — Backend (Fase 1)

Extensão do módulo existente `backend/src/modules/arte-aprovacao/`:

```
backend/src/modules/arte-aprovacao/
├── arte-aprovacao.module.ts              # registrar novos providers/controllers
├── constants/
│   ├── arte.enums.ts
│   ├── arte-transicoes.ts
│   └── arte-mensagens.ts                 # strings pt-BR para erros/auditoria
├── controllers/
│   ├── arte-versao.controller.ts         # (existente)
│   ├── arte-arquivo.controller.ts        # (existente)
│   ├── ...
│   ├── arte-fila.controller.ts           # NOVO — GET fila, POST assumir
│   └── arte-configuracao.controller.ts     # NOVO — CRUD ConfiguracaoArteLoja
├── dto/
│   ├── create-arte-versao.dto.ts         # (existente)
│   ├── ...
│   ├── fila-arte-query.dto.ts            # NOVO — query params validados
│   ├── fila-arte-item-response.dto.ts    # NOVO
│   ├── assumir-fila-arte.dto.ts            # NOVO
│   ├── atualizar-status-arte.dto.ts        # NOVO
│   ├── upsert-configuracao-arte.dto.ts     # NOVO
│   └── configuracao-arte-response.dto.ts   # NOVO
├── services/
│   ├── arte-versao.service.ts              # (existente) — integrar transações status
│   ├── ...
│   ├── arte-fila.service.ts                # NOVO — listagem + contadores badge
│   ├── arte-fila-transicao.service.ts      # NOVO — $transaction + TOCTOU
│   ├── configuracao-arte.service.ts        # NOVO — config loja + serviço sistema
│   └── arte-orcamento-injecao.service.ts   # NOVO — injeção ItemServicoManual
├── guards/
│   └── arte-loja-context.guard.ts          # NOVO (opcional) — reforço loja_id
└── interfaces/
    └── arte-fila.interface.ts
```

### Integração Orçamentos V2 (fora do módulo arte, mas Fase 1)

```
backend/src/orcamentos-v2/
├── services/
│   └── arte-orcamento.service.ts           # NOVO — orquestra injeção no save/preview
└── dto/
    └── produto-arte.dto.ts                 # NOVO — campos arte no produto (validação)
```

### Integração OS

```
backend/src/os/services/
└── os-arte-propagacao.service.ts           # NOVO — montarItensOS: status_arte inicial
```

---

## 5. Endpoints Fase 1 (Backend)

| Método | Rota | Serviço | Descrição |
|--------|------|---------|-----------|
| `GET` | `/arte-aprovacao/fila` | `ArteFilaService` | Lista itens na fila (paginada) |
| `GET` | `/arte-aprovacao/fila/contagem` | `ArteFilaService` | Badge menu lateral |
| `POST` | `/arte-aprovacao/fila/:itemOsId/assumir` | `ArteFilaTransicaoService` | Atribui designer (transação) |
| `PATCH` | `/arte-aprovacao/fila/:itemOsId/status` | `ArteFilaTransicaoService` | Transição validada |
| `GET` | `/arte-aprovacao/configuracao` | `ConfiguracaoArteService` | Config da loja (JWT) |
| `PUT` | `/arte-aprovacao/configuracao` | `ConfiguracaoArteService` | Upsert config + serviço sistema |
| `GET` | `/arte-aprovacao/configuracao/status` | `ConfiguracaoArteService` | `{ configurado: boolean, alerta?: string }` |

Endpoints de versões/arquivos **permanecem** em `/arte-aprovacao/versoes/...`.

---

## 6. Segurança (OWASP) — padrões obrigatórios

### 6.1 IDOR / multi-tenant

Todo acesso Prisma segue o padrão:

```typescript
// Exemplo — fila
await prisma.itemOS.findMany({
  where: {
    responsabilidade_arte: { in: RESPONSABILIDADES_FILA_INTERNA },
    status_arte: { in: statusFiltro },
    os: {
      loja_id: usuario.loja_id,  // SEMPRE do JWT/contexto
      ativo: true,
    },
  },
});
```

- **Nunca** usar `loja_id` do body sem validar igual ao token.
- `assumir` / `status`: buscar item com `where: { id: itemOsId, os: { loja_id } }` — se vazio → `404` (não `403`, evita enumeração).

### 6.2 DTOs (`class-validator`)

Exemplo `AssumirFilaArteDto` — body vazio ou opcional `observacao` com `@MaxLength(500)`.

`FilaArteQueryDto`:

```typescript
@IsOptional() @IsEnum(StatusArte, { each: true }) status?: StatusArte[];
@IsOptional() @IsUUID() designer_id?: string;
@IsOptional() @IsIn(['me']) modo?: 'me';
@IsOptional() @Type(() => Number) @Min(1) page?: number;
@IsOptional() @Type(() => Number) @Min(1) @Max(100) limit?: number;
```

`UpsertConfiguracaoArteDto`:

```typescript
@IsBoolean() ativo: boolean;
@IsEnum(ModeloPrecificacaoArte) modelo_precificacao: ModeloPrecificacaoArte;
@IsNumber() @Min(0) horas_padrao_criacao: number;
@IsNumber() @Min(0) horas_padrao_adaptacao: number;
@IsOptional() @IsNumber() @Min(0) custo_hora_servico?: number; // atualiza servico_manual sistema
```

### 6.3 Transações atômicas (anti-TOCTOU)

`ArteFilaTransicaoService.assumir(itemOsId, usuarioId, lojaId)`:

```typescript
return prisma.$transaction(async (tx) => {
  const item = await tx.itemOS.findFirst({
    where: { id: itemOsId, os: { loja_id: lojaId, ativo: true } },
    select: { id: true, status_arte: true, designer_atribuido_id: true },
  });
  if (!item) throw new NotFoundException('Item da OS não encontrado');
  if (item.designer_atribuido_id && item.designer_atribuido_id !== usuarioId) {
    throw new ConflictException('Este item já foi assumido por outro designer');
  }
  if (!TRANSICOES_ASSUMIR.includes(item.status_arte)) {
    throw new ConflictException('Status atual não permite assumir este item');
  }
  return tx.itemOS.update({
    where: { id: itemOsId },
    data: {
      designer_atribuido_id: usuarioId,
      arte_assumido_em: new Date(),
      status_arte: item.status_arte === StatusArte.AGUARDANDO_INICIO
        ? StatusArte.EM_CRIACAO
        : item.status_arte,
    },
  });
});
```

Mesmo padrão em `ArteVersaoService.create` quando primeira versão → atualizar `status_arte` na mesma transação.

---

## 7. Precificação automática (MVP — modelo HORA)

### 7.1 `ConfiguracaoArteService`

1. `getOrCreate(lojaId)` — retorna config ou defaults.
2. `ensureServicoSistema(lojaId)` — cria `servico_manual` com `sistema=true` se ausente.
3. `isConfigurado(lojaId)` — `servico_arte_id` presente **e** `custo_hora > 0`.

### 7.2 `ArteOrcamentoInjecaoService`

Entrada: produto com `responsabilidade_arte`, `politica_cobranca_arte`, `complexidade_arte` (futuro).

```
SE responsabilidade IN (EMPRESA_CRIA, EMPRESA_ADAPTA):
  config = getOrCreate(lojaId)
  horas = EMPRESA_ADAPTA ? horas_padrao_adaptacao : horas_padrao_criacao

  SE NOT isConfigurado(lojaId):
    → injeta linha ARTE_AUTOMATICA com horas=0, custo_total=0
    → retorna alerta: "Custo de arte será R$ 0,00 até configuração pelo administrador"
  SENÃO:
    custo_hora = servico_manual.custo_hora
    custo_total = horas × custo_hora
    SE politica = SEM_CUSTO → preço cliente 0 (custo interno mantido ou zerado — decisão: manter CMV interno)

  REMOVE linhas anteriores origem=ARTE_AUTOMATICA do produto
  CREATE ItemServicoManual origem=ARTE_AUTOMATICA
  exibir_no_pdf = (politica === COBRADA_A_PARTE) OU (config.exibir_linha_pdf AND politica !== INCLUIDA)
```

**Regra PDF (decisão consolidada):** `INCLUIDA_NO_PRODUTO` → `exibir_no_pdf = false` sempre.

### 7.3 Chamada no Orçamento V2

- `OrcamentosV2Service` / preview: antes do motor, chamar `ArteOrcamentoInjecaoService.syncProduto(produto, lojaId)`.
- Resposta do preview inclui `alertas_arte: string[]` para o banner frontend.

---

## 8. Propagação OS → fila

`OsArtePropagacaoService` em `montarItensOSDoOrcamento`:

| responsabilidade_arte | status_arte inicial | arte_fila_desde |
|-----------------------|---------------------|-----------------|
| `EMPRESA_CRIA` / `EMPRESA_ADAPTA` | `AGUARDANDO_INICIO` | `now()` |
| `CLIENTE_FORNECE` | `AGUARDANDO_ARQUIVO_CLIENTE` | `null` |
| demais | `NAO_APLICA` | `null` |

---

## 9. Contagem badge menu

`GET /arte-aprovacao/fila/contagem`:

```typescript
count({
  where: {
    responsabilidade_arte: { in: ['EMPRESA_CRIA', 'EMPRESA_ADAPTA'] },
    status_arte: { in: ['AGUARDANDO_INICIO', 'EM_CRIACAO', 'REVISAO_SOLICITADA'] },
    os: { loja_id, ativo: true },
  },
});
```

Frontend: novo módulo `arte` em `use-sidebar-contadores.ts` (Fase 1 frontend).

---

## 10. Ordem de implementação (checklist Fase 1 Backend)

1. [ ] Migration Prisma + `prisma generate`
2. [ ] `constants/` + enums
3. [ ] `ConfiguracaoArteService` + controller + DTOs
4. [ ] `ArteOrcamentoInjecaoService` + hook orçamento preview/save
5. [ ] `OsArtePropagacaoService` + `montarItensOSDoOrcamento`
6. [ ] `ArteFilaService` + `ArteFilaTransicaoService` + controller
7. [ ] Integrar transações em `ArteVersaoService.create` (status → EM_CRIACAO)
8. [ ] Testes unitários: transições, injeção com/sem config, IDOR (loja errada → 404)
9. [ ] Atualizar `aprovacao-tecnica.service.ts` (critério arte revisado — Leitura B)

---

## 11. O que fica fora da Fase 1 Backend

- Frontend `/arte`, menu, workspace
- Kanban colunas
- `arte_fila_evento` (auditoria)
- Modelos FIXO / M2 / COMPLEXIDADE
- PDF renderer (flag `exibir_no_pdf` — implementar quando tocar impressão)

---

## Changelog

| Data | Versão | Alteração |
|------|--------|-----------|
| 2026-06-26 | 0.1 | Proposta inicial Fase 1 backend |
