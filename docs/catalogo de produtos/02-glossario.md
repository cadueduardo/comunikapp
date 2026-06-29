# 02 — Glossário

Termos usados neste RP. Manter consistência em UI, API e código.

---

## Catálogo e navegação

| Termo | Definição |
|-------|-----------|
| **Catálogo de produtos** | Módulo/hub no menu (renomear item atual “Produtos”). Agrupa cadastros de prateleira e personalização. |
| **Hub** | Página inicial do módulo com cards de atalho; **sem** dashboard de KPIs. |
| **Modelos de Orçamento** | `/produtos` — templates calculados; **fora** do Catálogo. |

---

## Tipos de produto comercial

| Termo | Definição | Exemplo |
|-------|-----------|---------|
| **Produto finito** | SKU de prateleira/revenda; preço de venda; pode ter estoque próprio. | Caneca 350 ml |
| **Modelo de orçamento** | Produto sob medida com motor de cálculo. | Banner 3×1 m |
| **Serviço de personalização** | Trabalho aplicado sobre produto base (não é SKU separado na prateleira). | Impressão UV na caneca |

---

## Personalização

| Termo | Definição |
|-------|-----------|
| **Personalizável** | Produto finito que **pode** (não obrigatoriamente) ser vendido com customização. |
| **Modo de personalização** | Forma de customizar **nesta venda**: nenhum, estampa, imprint livre, arte sob medida. |
| **Processo de decoração** | Método físico: UV digital, silk, laser, DTF, aplicação de adesivo, etc. Cadastro em **Personalização**. |
| **Imprint livre** | Personalização sem template: processo + texto e/ou arquivo enviado na hora. |
| **Estampa** | Template visual: arte **mestra** fixa + áreas com conteúdo variável. Cadastro em **Estampas**. |
| **Arte mestra** | Arquivo base da estampa (PDF/AI/PNG) sem dados do cliente. |
| **Arte de produção** | Arte mestra + valores dos campos; arquivo fechado para o setor. |
| **Conjunto de campos** | Grupo reutilizável de variáveis (nome, data, frase) com tipo, limite e validação. |
| **Campo variável / slot** | Um dado editável na estampa (ex.: `nome`, máx 50 caracteres). |
| **VDP** | *Variable Data Printing* — mesmo layout, dados diferentes por unidade. |
| **VDP em Lote** | Impressão de dados variáveis onde o mesmo layout de estampa recebe dados distintos por unidade do lote (ex.: 100 canecas, cada uma com um nome diferente). O payload é um array de registros (`Record<string, string>[]`) vinculado à linha do orçamento. |
| **Matriz de Atributos (Grade)** | Variações físicas de um mesmo Produto Finito (ex.: Camiseta P/M/G, Cor Azul/Preta) associadas à mesma linha de personalização. O vendedor distribui a quantidade total entre combinações de atributos (ex.: 20 P, 50 M, 30 G) antes ou junto ao preenchimento VDP. |

---

## Preço

| Termo | Definição |
|-------|-----------|
| **Preço base** | Preço do produto finito sem personalização. |
| **Adicional de estampa** | Valor somado ao escolher uma estampa específica. |
| **Adicional de processo** | Valor do imprint livre (quando não embutido na estampa). |
| **Custo de Setup** | Custo fixo operacional de preparação da máquina/matriz (ex.: gravação de tela de silk, calibração laser) cobrado **uma única vez por item do orçamento**, independente da quantidade. Campo `custo_setup` em `processos_decoracao`. |
| **Quantity Breaks (Faixas de Preço)** | Modelo de precificação regressiva onde o valor unitário da personalização diminui conforme a quantidade total do lote aumenta. Regras flexíveis em JSON (`faixas_preco`) no cadastro do processo. |

---

## Operacional

| Termo | Definição |
|-------|-----------|
| **Fulfillment pick** | Separar do estoque e expedir (sem PCP). |
| **Fulfillment make** | Passar por produção/transformação (PCP). |
| **Fulfillment híbrido** | Reservar base + personalizar + expedir. |
| **Roteamento por item** | Cada linha da OS segue pick, make ou híbrido conforme modo. |

---

## Siglas internas (código — sugestão)

| Código | Significado |
|--------|-------------|
| `MODO_NENHUM` | Sem personalização |
| `MODO_ESTAMPA` | Estampa catalogada |
| `MODO_IMPRINT_LIVRE` | Processo + conteúdo livre |
| `MODO_ARTE_SOB_MEDIDA` | Briefing/arquivo completo (futuro) |

---

## Nomes na interface (PT-BR)

| Conceito técnico | Label sugerido na UI |
|------------------|----------------------|
| Processo de decoração | **Personalização** (card) / “Tipo de processo” (detalhe) |
| Conjunto de campos | **Conjuntos de campos** |
| Schema de variáveis | **Evitar** na UI |
| Estampa | **Estampas** |
| Imprint livre | **Personalização livre** ou **Texto / arte avulsa** |
