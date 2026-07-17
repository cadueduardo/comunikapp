# 06 — Conversão m² → Chapa → Sobra

**Status do documento:** proposto

## Objetivo

Definir como o sistema converte o consumo previsto em metros quadrados (vindo do orçamento) para unidades reais de chapa (vindo do estoque) e como registra a sobra gerada.

Comunicação visual trabalha em chapas físicas (ex.: 1220 × 2440 mm). Calcular consumo em fração de m² não basta: o estoque baixa em chapas inteiras e gera sobras reaproveitáveis.

## Estado atual

- `Insumo` tem campos `largura` e `altura`, mas **não há indicação clara** de que esses campos representem o tamanho da chapa física versus o tamanho da peça consumida.
- `LogicaConsumoInsumo` é um enum existente (`area`, etc.) que controla como o motor calcula consumo. Aproveitar.
- `tipomaterial` tem `logica_consumo` (`tipomaterial_logica_consumo`).
- `estoque_sobras` já existe com `codigo_sobra`, `dimensoes`, `area`, `quantidade`, `status`, `origem`, `orcamento_origem`.
- `estoque_aproveitamentos` registra reuso de sobra em orçamento futuro.

## Decisão: campos novos em `Insumo`

Para insumos do tipo `chapa` (controlado por `tipomaterial.logica_consumo` ou pelo novo campo explícito), exigir:

```prisma
model Insumo {
  // ... existentes ...

  // === Novos campos para chapas (Fase 0/Fase 6 estoque) ===
  largura_chapa_mm     Decimal? @db.Decimal(10, 2)
  altura_chapa_mm      Decimal? @db.Decimal(10, 2)
  espessura_mm         Decimal? @db.Decimal(10, 2)
  permite_aproveitar_sobra Boolean @default(true)
  sobra_minima_reaproveitavel_m2 Decimal? @db.Decimal(10, 3) @default(0.10)
}
```

### Justificativa

- `largura_chapa_mm` e `altura_chapa_mm` separam o tamanho **físico da chapa comprada** dos campos `largura`/`altura` legados (que historicamente foram usados de forma ambígua).
- `espessura_mm` é informativo, útil para alerta de incompatibilidade técnica.
- `permite_aproveitar_sobra` permite materiais que não geram sobra reutilizável (ex.: adesivo em rolo já manuseado, fitas).
- `sobra_minima_reaproveitavel_m2` (default 0.10 m²) define o piso para registrar sobra. Pedaços menores são descartados automaticamente.

## Regra de conversão (Fase 6, mas decidida agora)

### Entrada

- `area_necessaria_m2`: vindo do produto do orçamento (já calculado pelo motor).
- `largura_chapa_mm`, `altura_chapa_mm`: do insumo.
- `permite_aproveitar_sobra`, `sobra_minima_reaproveitavel_m2`: do insumo.

### Cálculo

```text
area_chapa_m2 = (largura_chapa_mm * altura_chapa_mm) / 1.000.000

# Quantas chapas inteiras precisamos
chapas_necessarias = ceil(area_necessaria_m2 / area_chapa_m2)

# Sobra teórica
sobra_total_m2 = (chapas_necessarias * area_chapa_m2) - area_necessaria_m2

# Quanto registrar como sobra reaproveitável
if permite_aproveitar_sobra AND sobra_total_m2 >= sobra_minima_reaproveitavel_m2:
    sobra_registrada_m2 = sobra_total_m2
else:
    sobra_registrada_m2 = 0
```

### Exemplo numérico

Insumo: Acrílico 4mm, chapa 1220 × 2440 mm.

- `area_chapa_m2 = 2,9768 m²`
- Pedido: `area_necessaria_m2 = 1,3 m²`
- `chapas_necessarias = ceil(1,3 / 2,9768) = 1`
- `sobra_total_m2 = 1 * 2,9768 - 1,3 = 1,6768 m²`
- `sobra_registrada_m2 = 1,6768 m²` (acima do mínimo de 0,10)

Outro caso: pedido `area_necessaria_m2 = 4,2 m²`.

- `chapas_necessarias = ceil(4,2 / 2,9768) = 2`
- `sobra_total_m2 = 2 * 2,9768 - 4,2 = 1,7536 m²`
- `sobra_registrada_m2 = 1,7536 m²`

## Exibição ao usuário no orçamento (Fase 2)

No preview do orçamento, exibir explicitamente:

```text
Material: Acrílico 4mm
Consumo previsto: 1,3 m²
Chapas necessárias: 1 chapa (1220 × 2440 mm)
Sobra estimada reaproveitável: 1,68 m²
```

Isso evita a reclamação "o sistema reservou 2 chapas se eu só uso 1,3 m²".

## Fluxo de reserva e baixa (Fase 6)

### 1. Aprovação do orçamento

- Não baixa estoque.
- Apenas grava `consumo_previsto_m2` e `chapas_previstas` no `ItemInsumo` ou em tabela auxiliar.

### 2. Liberação para PCP (`status_liberacao_pcp: PENDENTE → LIBERADO`)

- Cria **reserva** em `estoque_itens.quantidadeReservada` (em chapas inteiras).
- Registra `estoque_movimentacoes` com `tipo = RESERVA`.

### 3. Início de produção

- Mantém reserva.

### 4. Conclusão da etapa de corte

- Baixa o material: `estoque_itens.quantidadeAtual -= chapas_consumidas`.
- Libera reserva: `estoque_itens.quantidadeReservada -= chapas_consumidas`.
- Registra `estoque_movimentacoes` com `tipo = SAIDA`.
- Se houver `sobra_registrada_m2 > 0`, cria registro em `estoque_sobras` com:

```text
codigo_sobra        = gerado (ex.: SOBRA-2026-0001)
estoque_id          = insumo origem
descricao           = "Sobra de OS #88 - Acrílico 4mm"
dimensoes           = "calculada (irregular)"
area                = sobra_registrada_m2
quantidade          = 1
unidade_medida      = "m2"
material            = nome do insumo
status              = DISPONIVEL
origem              = "PRODUCAO"
data_geracao        = now
orcamento_origem    = orcamento_id
```

### 5. Cancelamento da OS

- Libera reserva: `estoque_itens.quantidadeReservada -= chapas_reservadas`.
- Registra `estoque_movimentacoes` com `tipo = LIBERACAO_RESERVA`.

## Validação na criação da OS

Antes de liberar a OS para PCP:

- Verificar se `estoque_itens.quantidadeAtual - estoque_itens.quantidadeReservada >= chapas_necessarias`.
- Se não houver disponibilidade, **bloquear liberação** e gerar alerta crítico na Home (`Material insuficiente para OS #X`).
- Sugerir aproveitamento de `estoque_sobras` compatíveis se houver.

## Conversão para insumos NÃO chapa

Para insumos com `logica_consumo` diferente de chapa (ex.: tinta, adesivo, parafuso):

- A regra clássica de `area * fator` ou `quantidade direta` continua valendo.
- Os campos `largura_chapa_mm` e `altura_chapa_mm` ficam `NULL`.
- Não há geração de sobra.

## Migração

- Migration aditiva: adicionar colunas `NULL` em `Insumo`.
- Backfill manual ou via tela: a equipe da loja precisa preencher os tamanhos das chapas dos insumos existentes.
- Alerta no `SystemStateBanner`: "Você tem N insumos do tipo chapa sem tamanho cadastrado".

## Pontos de confirmação

1. Tamanho mínimo de sobra reaproveitável padrão: 0,10 m² está bom?
2. Para gerar a sobra na conclusão da etapa de corte, é aceitável a regra de **diferença teórica** (chapa inteira − consumo) na primeira versão? O ideal seria o operador apontar a sobra real, mas isso vem na Fase 7+ (aproveitamento manual já existe via `estoque_aproveitamentos`).
3. Bloquear liberação para PCP quando estoque insuficiente: sempre bloqueia ou permite override do gestor com log?
4. Tamanho default de chapa para sugestão (1220 × 2440 mm)?
