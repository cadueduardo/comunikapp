# Lógica de Cálculo de Custos e Formação de Preço

Este documento detalha como o motor de cálculo do sistema irá processar os custos de uma empresa para formar o preço de venda de um produto ou serviço, como um banner.

O princípio fundamental é transformar todos os custos da empresa (fixos e variáveis) em uma unidade comum: o **custo por hora**.

## 1. Categorias de Custos

Os custos são divididos em duas categorias principais para o cálculo.

### Custos Diretos
São os custos diretamente atribuíveis a um trabalho específico.
- **Material:** O custo de matéria-prima (lona, tinta, madeira, etc.) consumida no trabalho. O sistema calculará com base na quantidade usada (m², unidade, etc.) e no preço cadastrado no módulo de Insumos.
- **Mão de Obra Direta:** Refere-se ao tempo dos colaboradores que trabalharam diretamente na produção. O sistema utiliza o **custo por hora** de cada colaborador, que é calculado a partir do seu salário e encargos.

### Custos Indiretos (Custos Fixos / Overhead)
São os custos necessários para manter a empresa funcionando, mas que não se aplicam diretamente a um único produto. Incluem:
- Aluguel
- Água, luz, internet
- Salários de equipes administrativas, de vendas, etc.
- Marketing
- Outras despesas operacionais

## 2. O Rateio dos Custos Indiretos

Para que um banner "pague sua parte" do aluguel, o sistema transforma o total de custos indiretos em um **custo por hora de produção**.

**Passo 1: Somar todos os custos indiretos mensais.**
O administrador da loja irá inserir todos os seus custos fixos mensais no módulo de Configurações.
- *Exemplo:* Aluguel (R$2.000) + Contas (R$800) + Salário Admin (R$3.000) = **R$5.800/mês**.

**Passo 2: Calcular o total de horas produtivas da empresa.**
O administrador informa o número de colaboradores que trabalham na produção e a média de horas que eles trabalham por mês.
- *Exemplo:* 2 colaboradores * 176 horas/mês = **352 horas produtivas/mês**.

**Passo 3: Calcular o Custo Indireto por Hora.**
O sistema divide o total de custos indiretos pelas horas produtivas.
- *Exemplo:* `R$ 5.800 / 352 horas = R$ 16,48 por hora`.

Este valor (`R$ 16,48`) é o "custo da empresa" que será alocado a cada hora de trabalho registrada em um orçamento.

## 3. Exemplo Prático: Cálculo do Preço de um Banner

Vamos supor que um banner leva **30 minutos** de produção.

1.  **Custo de Material (Direto):** R$ 30,00 (lona, tinta, etc.)
2.  **Custo de Mão de Obra Direta:** 0.5 horas * R$ 20,00/hora = R$ 10,00
3.  **Custo Indireto Alocado (Rateio):** 0.5 horas * R$ 16,48/hora = R$ 8,24

**Custo Total de Produção:**
`R$ 30,00 (material) + R$ 10,00 (mão de obra) + R$ 8,24 (custos indiretos) = R$ 48,24`

## 4. Aplicação de Margem e Impostos

Sobre o custo de produção, o sistema aplica as margens e impostos definidos pelo administrador.

- **Margem de Lucro (ex: 100%):**
  `Preço de Venda = R$ 48,24 * (1 + 100/100) = R$ 96,48`
- **Impostos (ex: 10%):**
  `Preço Final = R$ 96,48 * (1 + 10/100) = R$ 106,13`

Com essa abordagem, o sistema garante que todos os custos, visíveis e invisíveis, sejam considerados na formação do preço, garantindo a lucratividade da empresa. 