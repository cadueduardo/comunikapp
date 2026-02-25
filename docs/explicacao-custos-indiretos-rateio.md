# Explicação: Cálculo e Rateio dos Custos Indiretos

Este documento explica como o sistema calcula os custos indiretos e faz o rateio entre os diferentes itens cadastrados (aluguel, energia, internet, etc.).

---

## 1. O que são Custos Indiretos?

Custos indiretos são despesas fixas mensais da empresa que **não podem ser atribuídas diretamente** a um único produto ou serviço. Exemplos:

- Aluguel do galpão/escritório
- Energia elétrica
- Água
- Internet
- Salários de equipe administrativa
- Seguros, licenças de software, etc.

Para que cada orçamento "pague sua parte" dessas despesas, o sistema faz um **rateio proporcional ao tempo de produção**.

---

## 2. A Fórmula Geral

O rateio usa **horas de produção** como base:

```
Custo Indireto do Orçamento = (Total Custos Indiretos Mensais ÷ Horas Produtivas do Mês) × Horas de Produção do Orçamento
```

Ou, de forma simplificada:

```
Custo Indireto = Custo por Hora × Horas de Produção
```

Onde:
- **Custo por Hora** = quanto a empresa gasta em custos indiretos a cada hora de trabalho
- **Horas de Produção** = soma das horas de máquinas, funções e serviços manuais do orçamento

---

## 3. Exemplo Numérico Completo

### Passo 1: Cadastro dos Custos Indiretos (valores mensais)

| Item           | Valor Mensal |
|----------------|--------------|
| Aluguel        | R$ 3.500,00  |
| Energia        | R$ 2.500,00  |
| Internet       | R$ 500,00    |
| Água           | R$ 1.500,00  |
| **Total**      | **R$ 8.000,00** |

### Passo 2: Horas Produtivas do Mês

A loja informa quantas horas por mês a equipe trabalha em produção.

- Exemplo: 2 colaboradores × 176 horas/mês = **352 horas produtivas/mês**

### Passo 3: Custo Indireto por Hora

```
Custo por Hora = R$ 8.000,00 ÷ 352 horas = R$ 22,73 por hora
```

Ou seja: a cada hora de produção, o orçamento deve "absorver" R$ 22,73 de custos indiretos.

### Passo 4: Horas de Produção do Orçamento

O sistema soma as horas utilizadas no orçamento:

- Máquina de impressão: 2 horas
- Corte/vinco: 0,5 hora
- Acabamento manual: 1 hora  
- **Total: 3,5 horas**

### Passo 5: Custo Indireto Total do Orçamento

```
Custo Indireto = R$ 22,73/hora × 3,5 horas = R$ 79,55
```

---

## 4. Como é Feito o Rateio Entre os Itens?

Cada item cadastrado (Aluguel, Energia, etc.) participa do total **proporcionalmente ao seu valor mensal**.

### Fórmula do rateio por item

Para cada custo indireto cadastrado:

```
Valor Rateado do Item = (Valor Mensal do Item ÷ Total Mensal) × Custo Indireto Total do Orçamento
```

Ou, de forma equivalente:

```
Valor Rateado do Item = (Valor Mensal do Item ÷ Horas Produtivas do Mês) × Horas de Produção do Orçamento
```

### Exemplo com os mesmos dados

| Item    | Valor Mensal | % do Total | Horas Orçamento | Valor Rateado      |
|---------|--------------|------------|-----------------|--------------------|
| Aluguel | R$ 3.500,00  | 43,75%     | 3,5 h           | R$ 34,80           |
| Energia | R$ 2.500,00  | 31,25%     | 3,5 h           | R$ 24,86           |
| Internet| R$ 500,00    | 6,25%      | 3,5 h           | R$ 4,97            |
| Água    | R$ 1.500,00  | 18,75%     | 3,5 h           | R$ 14,92           |
| **Total** | R$ 8.000,00 | 100%       | —               | **R$ 79,55**       |

**Cálculo do Aluguel (exemplo):**
- Percentual: R$ 3.500 ÷ R$ 8.000 = 43,75%
- Valor rateado: 43,75% × R$ 79,55 = **R$ 34,80**

Ou pela fórmula direta:
- (R$ 3.500 ÷ 352 horas) × 3,5 horas = R$ 9,94/h × 3,5 h = **R$ 34,80**

---

## 5. Resumo em 3 Pontos

1. **Total mensal** = soma de todos os custos indiretos cadastrados.
2. **Custo por hora** = total mensal ÷ horas produtivas do mês (ex.: 352).
3. **Custo do orçamento** = custo por hora × horas de produção do orçamento.

Cada item (aluguel, energia, etc.) entra no total na proporção do seu valor mensal em relação ao total mensal.

---

## 6. Observações Importantes

- **Sem custos cadastrados:** Se não houver nenhum custo indireto cadastrado, o sistema **não aplica** custos indiretos (valor = R$ 0,00).
- **Horas produtivas:** O valor padrão é 352 horas/mês, mas pode ser configurado por loja (ex.: 2 × 176 h).
- **Horas do orçamento:** São somadas as horas de máquinas, funções e serviços manuais de todos os produtos do orçamento.
