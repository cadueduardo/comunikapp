# 08 — Defaults da Configuração Recomendada

**Status do documento:** proposto

## Objetivo

Definir os valores que o atalho **Aplicar configuração recomendada** vai gravar quando o usuário clicar. Esses valores são pensados para uma microempresa de comunicação visual brasileira começando do zero.

## Princípios

- Nunca sobrescrever valor já preenchido pelo usuário, salvo se ele marcar `sobrescrever_existentes = true`.
- Cada valor aplicado é exibido ao usuário antes de gravar (modal de confirmação).
- O usuário pode reverter individualmente cada item depois.
- A ação é idempotente.

## Valores defaults sugeridos

### Loja (modelo `loja`)

| campo | valor sugerido | observação |
| --- | --- | --- |
| `margem_lucro_padrao` | `45.0` | em percentual; baseado em prática comum do setor |
| `tipo_margem_lucro` | `"markup"` | mais simples para usuário pequeno entender |
| `impostos_padrao` | `6.0` | Simples Nacional faixa inicial |
| `custos_indiretos_mensais` | (não preencher) | exige levantamento real; deixar pendente |
| `custo_maodeobra_hora` | (não preencher) | depende da realidade da loja |
| `custo_maquinaria_hora` | (não preencher) | depende da máquina |
| `horas_produtivas_mensais` | `352` | já é o default do schema |

### Condição de pagamento padrão

Campo novo a criar em `loja`:

```prisma
model loja {
  // ...
  condicao_pagamento_padrao_tipo        String?  @db.VarChar(32)   // 'ENTRADA_SALDO' | 'A_VISTA' | 'FATURADO_30'
  condicao_pagamento_padrao_entrada_pct Decimal? @db.Decimal(5, 2) // ex.: 50.00
  condicao_pagamento_padrao_descricao   String?  @db.VarChar(255)  // ex.: "50% na assinatura, 50% na entrega"
}
```

Defaults sugeridos:

| campo | valor sugerido |
| --- | --- |
| `condicao_pagamento_padrao_tipo` | `"ENTRADA_SALDO"` |
| `condicao_pagamento_padrao_entrada_pct` | `50.0` |
| `condicao_pagamento_padrao_descricao` | `"50% na assinatura do pedido, 50% na entrega"` |

### Categorias de insumos

Criar categorias iniciais via `Categoria`:

```text
Acrílico
ACM
PVC Expandido
Lona
Adesivo Vinílico
Tinta
Acabamento
Outros
```

- Skip se a loja já tem qualquer categoria.

### Tipos de material

Criar tipos via `tipomaterial`:

```text
Chapa Rígida   (logica_consumo: area)
Lona           (logica_consumo: area)
Vinil/Adesivo  (logica_consumo: area)
Unitário       (logica_consumo: unitario)
```

- Skip se a loja já tem qualquer tipo de material.

### Setores produtivos

Criar setores via `SetorProdutivo`:

```text
Corte           (cor: #3B82F6)
Impressão       (cor: #10B981)
Acabamento      (cor: #F59E0B)
Montagem        (cor: #8B5CF6)
Entrega/Instalação (cor: #6B7280)
```

- Skip se a loja já tem qualquer setor.

### Workflow padrão de OS

Criar `WorkflowOS` chamado "Workflow Padrão" com etapas:

```text
1. Revisão técnica
2. Corte/Impressão
3. Acabamento
4. Montagem
5. Inspeção final
6. Entrega
```

- Skip se já existir qualquer workflow.

### Regras de validação iniciais

Criar `RegraValidacao` ativas:

| nome | categoria | tipo | condição | mensagem |
| --- | --- | --- | --- | --- |
| Material sem estoque mínimo | `estoque` | `ALERTA` | `insumo.estoque_minimo IS NULL` | "Cadastre estoque mínimo para receber alertas" |
| Orçamento sem cliente | `orcamento` | `BLOQUEIO` | `orcamento.cliente_id IS NULL` | "Selecione um cliente para aprovar" |
| OS sem responsável | `os` | `ALERTA` | `os.responsavel_id IS NULL` | "Atribua um responsável" |

## Estrutura do payload de resposta

Após aplicar, o endpoint retorna **exatamente o que foi gravado**:

```json
{
  "aplicado": {
    "loja": {
      "margem_lucro_padrao": 45.0,
      "tipo_margem_lucro": "markup",
      "impostos_padrao": 6.0,
      "condicao_pagamento_padrao_tipo": "ENTRADA_SALDO",
      "condicao_pagamento_padrao_entrada_pct": 50.0,
      "condicao_pagamento_padrao_descricao": "50% na assinatura..."
    },
    "categorias_criadas": ["Acrílico", "ACM", "PVC Expandido", "..."],
    "tipos_material_criados": ["Chapa Rígida", "Lona", "Vinil/Adesivo", "Unitário"],
    "setores_criados": ["Corte", "Impressão", "Acabamento", "Montagem", "Entrega/Instalação"],
    "workflow_criado": "Workflow Padrão",
    "regras_validacao_criadas": 3
  },
  "ignorado": {
    "loja": ["margem_lucro_padrao", "impostos_padrao"],
    "categorias": "já existem categorias na loja",
    "workflow": "já existe ao menos um workflow"
  },
  "etapas_marcadas_concluidas": ["margem_imposto", "condicao_pagamento"]
}
```

## Comportamento de sobrescrita

| `sobrescrever_existentes` | regra |
| --- | --- |
| `false` (padrão) | nunca toca em valor existente |
| `true` | sobrescreve **apenas** campos da `loja`; nunca cria duplicatas em categorias/tipos/setores/workflows |

## Pontos de confirmação

1. Margem padrão `45%` é o valor que o cliente quer apresentar como sugestão? (Comum no setor, mas pode variar.)
2. Imposto padrão `6%` (Simples Nacional inicial) é apropriado? Pode pedir input do usuário antes (mostrar dropdown com regimes).
3. Os nomes de categorias, tipos, setores e workflow precisam ser revisados pelo cliente?
4. Aceitar que `custos_indiretos_mensais`, `custo_maodeobra_hora`, `custo_maquinaria_hora` ficam pendentes (não defaultam)?
