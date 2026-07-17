# 04 — Campos de Geometria em `ProdutoOrcamento`

**Status do documento:** proposto

## Objetivo

Padronizar como largura, altura, área, perímetro, unidade e origem da geometria são armazenados no Orçamento V2, de forma que:

- O motor de cálculo possa usar o perímetro para estimar tempo de máquina.
- A OS e o PCP recebam os mesmos dados sem ambiguidade.
- A imagem ou DXF anexado seja identificável e auditável.

## Estado atual

Em `backend/prisma/schema.prisma`, `ProdutoOrcamento` já tem:

```text
largura          Decimal(10,2)
altura           Decimal(10,2)
profundidade     Decimal(10,2)
area_produto     Decimal(10,2)
unidade_medida   String?
quantidade       Decimal(10,3)
```

**Falta:**

- `perimetro_produto`
- `geometria_origem`
- `arquivo_geometria_url`
- `arquivo_geometria_metadados`

## Decisão: campos novos a criar

```prisma
model ProdutoOrcamento {
  // ... campos existentes mantidos ...

  // === Novos campos (Fase 2) ===
  perimetro_produto            Decimal? @db.Decimal(10, 2)
  geometria_origem             String?  @db.VarChar(16) // 'MANUAL' | 'IMAGEM' | 'DXF'
  arquivo_geometria_url        String?  @db.VarChar(512)
  arquivo_geometria_metadados  String?  @db.LongText   // JSON
}
```

### Justificativa

- `perimetro_produto` separado de `area_produto` permite cálculo de tempo de máquina em router/laser sem reprocessar geometria.
- `geometria_origem` é `VARCHAR(16)` por compatibilidade com MySQL (Prisma enum nativo gera tabela auxiliar; preferimos string controlada por código).
- `arquivo_geometria_url` aceita URL local (storage interno) ou externa (S3/MinIO no futuro).
- `arquivo_geometria_metadados` em JSON permite evoluir sem migração.

## Schema do JSON `arquivo_geometria_metadados`

```json
{
  "nome_arquivo": "projeto_logo.png",
  "tamanho_bytes": 245678,
  "mime_type": "image/png",
  "hash_sha256": "ab12...",
  "largura_original_mm": 1000,
  "altura_original_mm": 1000,
  "unidade_original_informada": "mm",
  "extraido_automaticamente": false,
  "observacoes": "Print colado pelo cliente via WhatsApp"
}
```

Para DXF (Fase 7), o JSON ganha campos adicionais:

```json
{
  "perimetro_extraido_mm": 3450,
  "area_extraida_m2": 0.55,
  "camadas_detectadas": ["CORTE", "GRAVACAO"],
  "entidades_total": 142,
  "alertas": ["Camada GRAVACAO ignorada para cálculo de perímetro"]
}
```

## Origem da geometria — valores válidos

| valor | quando usar |
| --- | --- |
| `MANUAL` | Usuário digitou largura/altura sem anexar nada |
| `IMAGEM` | Usuário colou/anexou imagem de referência (medidas digitadas) |
| `DXF` | Usuário anexou DXF (medidas confirmadas/extraídas) |

## Regra de cálculo (Fase 2)

Quando o usuário preenche `largura` e `altura` (com unidade configurável):

```text
area_m2       = (largura_mm * altura_mm) / 1.000.000
perimetro_mm  = 2 * (largura_mm + altura_mm)
```

Armazenar:

```text
area_produto        = area_m2
perimetro_produto   = perimetro_mm
unidade_medida      = unidade escolhida pelo usuário
```

Se o produto for 3D (`profundidade > 0`), o cálculo de perímetro não se aplica de forma genérica. Nesse caso:

- `perimetro_produto = NULL`
- A estimativa de tempo de máquina cai no modo `m²/h` se a máquina aceitar.

## Unidades aceitas

- `mm`, `cm`, `m`.
- A conversão interna é sempre feita para milímetros antes do cálculo.
- A unidade informada pelo usuário é salva em `arquivo_geometria_metadados.unidade_original_informada` para rastreabilidade.

## Validações

- `largura > 0` e `altura > 0` quando `geometria_origem ≠ NULL`.
- `area_produto >= 0` (calculada, nunca negativa).
- `perimetro_produto >= 0` quando preenchido.
- `geometria_origem ∈ {MANUAL, IMAGEM, DXF}` ou `NULL`.

## Migração

A migration deve ser **aditiva**:

- Adicionar colunas `NULL` (sem default forçado).
- Backfill opcional: produtos antigos podem ter `geometria_origem = 'MANUAL'` se `largura` e `altura` já estavam preenchidos. Decidir na Fase 2.

## Propagação para OS

Na geração de `ItemOS` a partir do `ProdutoOrcamento` (Fase 3):

- Copiar `largura`, `altura`, `area_produto`, `perimetro_produto`, `unidade_medida`, `geometria_origem`, `arquivo_geometria_url` para o `ItemOS` correspondente.
- Esses campos precisam ser adicionados também em `ItemOS` (hoje só tem `parametros_tecnicos` como JSON).

### Campos novos em `ItemOS`

```prisma
model ItemOS {
  // ... mantidos ...

  largura                      Decimal? @db.Decimal(10, 2)
  altura                       Decimal? @db.Decimal(10, 2)
  area                         Decimal? @db.Decimal(10, 2)
  perimetro                    Decimal? @db.Decimal(10, 2)
  unidade_medida               String?  @db.VarChar(16)
  geometria_origem             String?  @db.VarChar(16)
  arquivo_geometria_url        String?  @db.VarChar(512)
}
```

## Pontos de confirmação

1. Aceitar `arquivo_geometria_url` como string simples na primeira versão (sem tabela própria de anexos)? Decisão alinhada com `05-persistencia-anexos.md`.
2. Backfill de produtos antigos em `geometria_origem = 'MANUAL'`: aplicar ou deixar `NULL`? Recomendação: deixar `NULL` para não inventar dado.
3. Manter `parametros_tecnicos` (JSON livre) em `ItemOS` mesmo após criar os campos estruturados, para retrocompatibilidade?
