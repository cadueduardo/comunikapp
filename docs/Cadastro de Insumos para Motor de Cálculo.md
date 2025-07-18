<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" class="logo" width="120"/>

# PBI – Cadastro de Insumos para Motor de Cálculo

**Papel:** Product Owner (P.O) / Analista de Sistemas
**Módulo:** Cadastro de Insumos
**Objetivo:** Garantir o registro completo, validado e integrado dos insumos, necessário para cálculos precisos no orçamento.

## Descrição do PBI

Como usuário responsável pelo financeiro, compras ou técnico da loja, desejo cadastrar insumos detalhadamente, ligados ao motor de cálculo, permitindo a configuração de custos, rendimentos e unidades de conversão, para compor orçamentos precisos e transparentes.

## Critérios de Aceite

- Deve permitir o cadastro, edição, exclusão e visualização dos insumos.
- Deve contemplar todos os campos críticos para cálculo, estoque e orçamentos.
- Deve validar dados essencialmente para integridade, precisão e uso em outros módulos.
- Importação facilitada via arquivo (CSV/Excel) suportada.
- Integração automática com o motor de cálculo e módulo de estoque.
- Histórico de alterações disponível.


## Estrutura dos Campos

| Campo | Tipo de Componente | Obrigatório | Validação | Descrição |
| :-- | :-- | :--: | :-- | :-- |
| Nome do Insumo | Input text | Sim | Mín. 3 caracteres, único por fornecedor | Nome identificador claro |
| Categoria | Dropdown/select | Sim | Seleção de categoria existente | Ex: lona, tinta, cordão |
| Fornecedor | Dropdown/autocomplete | Sim | Deve existir no cadastro | Nome do fornecedor |
| Unidade de compra | Dropdown/select | Sim | Seleção de unidade existente | Ex: bobina, rolo, caixa |
| Quantidade/Dimensão | Numérico/múltiplos | Sim | Valor positivo, maior que zero | Ex: metros, m², litragens, dimensões |
| Custo Total da Unidade | Input numérico (R\$) | Sim | Valor positivo, maior que zero | Valor pago pela unidade de compra |
| Unidade de uso | Dropdown/select | Sim | Seleção de unidade existente | Unidade de consumo no produto (ex: m², ml, un.) |
| Fator de conversão | Input numérico | Sim | Valor positivo, maior que zero | Fator entre unidade de compra e uso (ex: bobina→m²) |
| Estoque mínimo | Input numérico | Não | >= 0 | Alerta para reposição automática |
| Cód. interno | Input text/numérico | Não | Alfanumérico, único | Código para controles internos |
| Descrição técnica | Textarea | Não | Máx. 255 caracteres | Especificações, gramatura, cor, etc. |
| Observações | Textarea | Não | Livre | Informações adicionais |
| Histórico de preços | Botão/Modal/Listagem | Automático | — | Visualização automática das alterações de custo |
| Ativo/Inativo | Checkbox/switch | Sim | — | Indica se está disponível para uso |

## Tipos de Componentes UI

- Input text: Campo simples para texto curto.
- Dropdown/select: Menu suspenso de opções fixas.
- Autocomplete: Sugere opções dinamicamente conforme digitação.
- Numérico: Aceita somente números (com casas decimais onde relevante).
- Checkbox/switch: Marca/desmarca ativo ou inativo.
- Textarea: Campo de texto expandido para múltiplas linhas.
- Botão/Modal: Aciona visualização ou ações específicas.
- Tabela: Listagem dos insumos cadastrados, com filtros e busca.


## Validações

- **Obrigatoriedade**: Campos críticos não podem ser deixados em branco.
- **Valores positivos**: Quantidades, custos e conversões sempre maiores que zero.
- **Unicidade**: Nome e código não podem se repetir para o mesmo fornecedor/categoria.
- **Conversão coerente**: O fator de conversão precisa garantir correspondência realista entre unidade de compra e uso.
- **Limite de caracteres**: Respeitar limites para evitar erros de banco de dados.
- **Referências cruzadas**: Não permitir exclusão de insumo vinculado a orçamento/estoque ativos.
- **Formatação monetária e numérica**: Separação decimal, casas decimais e símbolo monetário conforme idioma.


## Integrações

- **Importação**: Formato CSV/Excel com mapeamento de campos.
- **Motor de cálculo**: Insumos e seus custos/rendimentos disponíveis em tempo real para montar o orçamento do produto.
- **Estoque**: Atualização automática do saldo ao registrar entradas/saídas.
- **Alertas**: Informar rapidamente sobre necessidade de reposição quando estoque < mínimo.


## Observações

- Deve ser responsivo, acessível e amigável para uso em desktop e mobile.
- Logs e histórico devem registrar todas as alterações críticas (incluindo autor, data/hora e motivo/justificativas).
- Permitir edição em lote (multi-insumos) em ações de importação/correção.

Essa especificação garante robustez, precisão e flexibilidade, alinhando a gestão de insumos ao motor de cálculo e ao contexto operacional do negócio.

