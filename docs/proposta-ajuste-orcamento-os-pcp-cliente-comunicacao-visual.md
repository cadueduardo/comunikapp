# Proposta de Adequacao: Orcamento V2, OS e PCP para Comunicacao Visual

## Objetivo

Este documento compara o prototipo HTML enviado pelo cliente com os modulos atuais do Comunikapp e aponta os ajustes necessarios para aproximar o sistema da expectativa operacional de uma empresa de comunicacao visual.

O ponto central do prototipo nao e a tecnologia usada no HTML. O que ele mostra e uma expectativa de fluxo unico: calcular rapido, anexar referencia visual ou DXF, aprovar, gerar producao, movimentar estoque, acompanhar kanban e enxergar impacto financeiro.

## O que o prototipo do cliente resolve bem

O HTML funciona como um ERP local simplificado para comunicacao visual. Ele combina, na mesma tela, estes conceitos:

- Orcamento tecnico com area, perimetro, material, maquina, quantidade, impostos e margem.
- Alternancia entre modo DXF e modo imagem/manual.
- Colagem de print pelo clipboard para calculo rapido.
- Campos manuais de largura e altura reais em milimetros.
- Calculo de area e perimetro a partir das medidas reais.
- Simulacao de tempo de maquina com base no perimetro.
- Forma de pagamento 50/50 ou pagamento futuro.
- Aprovacao que cria um card no kanban e desconta estoque.
- Painel financeiro com caixa, contas a receber, ponto de equilibrio e simulador de preco.

O prototipo e bom para demonstrar fluxo de negocio, mas nao deve ser copiado literalmente. Ele usa dados locais em memoria, PIN fixo, DXF simulado e nao possui persistencia, seguranca, multiempresa, auditoria ou controle real de estoque.

## Estado atual do Comunikapp

### Orcamentos V2

O modulo atual ja tem uma base superior ao prototipo:

- Cadastro de multiplos produtos no orcamento.
- Materiais, insumos, maquinas, funcoes e servicos manuais.
- Calculo de margem, impostos, comissao, desconto e valor final.
- Preview de custos e valores.
- Envio de orcamento por email.
- Link publico para aprovacao, rejeicao e solicitacao de alteracao.
- Criacao automatica de OS quando o orcamento e aprovado.
- Integracao com validacao de estoque.

O que falta para atender melhor o cliente:

- Um modo de calculo rapido por imagem/print dentro do produto do orcamento.
- Expor perimetro como dado tecnico do produto, nao apenas area.
- Tornar a forma de pagamento estruturada, e nao apenas texto livre.
- Mostrar de forma mais direta: custo direto, tempo de maquina, area, perimetro, margem e entrada/saldo.
- Padronizar os status exibidos no fluxo comercial.
- Dar ao usuario interno uma acao clara de "aprovar e gerar producao" quando o negocio for fechado fora do link publico.

### Ordem de Servico

O modulo de OS ja esta bem encaminhado:

- OS pode nascer a partir do orcamento.
- Existe status inicial conforme origem comercial ou interna.
- Ha validacao de estoque no momento da criacao.
- Existem parametros tecnicos, materiais calculados, responsaveis, prioridade e fluxo de liberacao para PCP.
- O modulo conversa com PCP e validacao de estoque.

Gaps encontrados:

- Na geracao de OS a partir do orcamento, os materiais calculados sao montados como array, mas enviados para `create()` como `JSON.stringify(...)`. O metodo `create()` so persiste `insumos_calculados` quando recebe array. Isso pode fazer a OS nascer sem materiais calculados no campo principal.
- A OS gerada a partir do orcamento nao cria claramente os `ItemOS` correspondentes aos produtos do orcamento. Isso enfraquece PCP, liberacao por item e movimentacao de estoque por produto.
- A movimentacao real de estoque por apontamento ainda esta incompleta. O servico de apontamento possui a estrutura de reserva/baixa, mas a execucao individual ainda esta como TODO.

### PCP

O PCP atual ja tem uma estrutura mais robusta que o kanban do HTML:

- Kanban geral.
- Fila por setor.
- Inicio e conclusao de producao.
- Workflow por setor.
- Sugestao de workflow conforme produto, material, tags, regras e prioridade.
- Apontamentos de producao.

O que precisa ser ajustado para a expectativa do cliente:

- Criar uma visao operacional mais parecida com o fluxo de comunicacao visual, conectando comercial, OS, PCP e financeiro.
- Fazer o card do kanban abrir a OS ou o item de producao.
- Implementar pausa de producao, que hoje aparece como fluxo previsto.
- Integrar reserva e baixa de estoque aos eventos reais do PCP.
- Deixar claro quais colunas pertencem ao PCP e quais pertencem ao fluxo comercial/financeiro.

### Financeiro

O prototipo da muita importancia ao financeiro: entrada, saldo, caixa, contas a receber, ponto de equilibrio e simulador de preco.

No Comunikapp, a parte financeira ainda deve ser tratada como proxima evolucao. Ja existe base de preco, margem e forma de pagamento no orcamento, mas ainda falta o controle estruturado de recebiveis.

Para este cliente, o minimo necessario e:

- Registrar condicao de pagamento de forma estruturada.
- Gerar previsao de contas a receber quando o orcamento for aprovado.
- Marcar entrada recebida e saldo pendente.
- Relacionar OS concluida com cobranca pendente ou recebida.

## Como funciona a colagem de imagem no HTML

O prototipo cria uma area clicavel chamada `pasteZone` e registra um listener para o evento `paste`.

Fluxo usado:

- O usuario clica na area de upload.
- Pressiona `Ctrl+V`.
- O codigo le `event.clipboardData.items`.
- Procura um item cujo tipo contenha `image`.
- Quando encontra, marca o estado como arquivo carregado e muda o texto da interface.

Importante: o HTML do cliente nao processa a imagem de verdade. Ele nao extrai medida da imagem, nao salva arquivo, nao calcula escala por pixel e nao faz OCR. A imagem serve apenas como referencia visual para um calculo manual rapido.

O calculo real vem dos campos digitados:

```text
area_m2 = largura_mm * altura_mm / 1.000.000
perimetro_mm = (largura_mm * 2) + (altura_mm * 2)
```

Essa ideia e boa e deve ser incorporada ao Comunikapp, mas com persistencia e preview real.

## Proposta para imagem/print no Orcamento V2

Criar um componente de geometria rapida dentro do item/produto do Orcamento V2.

Nome sugerido:

```text
QuickGeometryInput
```

Comportamento:

- Aceitar colagem de imagem via `onPaste`.
- Aceitar upload de imagem como fallback.
- Exibir preview da imagem anexada.
- Pedir largura e altura reais.
- Permitir unidade em mm, cm ou m.
- Calcular area automaticamente.
- Calcular perimetro automaticamente.
- Preencher os campos atuais de largura, altura, unidade e area do produto.
- Persistir a imagem como anexo/referencia do produto ou do orcamento.

Regra importante:

A imagem colada nao deve ser usada como fonte de medida. Pixel nao e milimetro. A imagem deve ser uma referencia visual, e a medida real deve vir do usuario, salvo se futuramente houver calibracao por escala conhecida.

Campos recomendados para evolucao do produto/orcamento:

```text
geometria_origem: MANUAL | IMAGEM | DXF
arquivo_geometria_url
perimetro_produto
geometria_metadados: JSON
```

O campo `area_produto` ja existe no fluxo atual e deve continuar sendo usado.

## Proposta para DXF

O DXF do HTML e uma simulacao. Ele usa valores fixos de area, perimetro e espessura. Portanto, a expectativa do cliente deve ser atendida por fases.

### Fase 1: imagem/manual

Implementar primeiro o fluxo de imagem colada/upload com medidas digitadas. E o caminho mais rapido, mais seguro e ja atende ao uso de "calculo rapido".

### Fase 2: DXF como anexo tecnico

Permitir anexar DXF no produto do orcamento e preencher manualmente ou confirmar area/perimetro. O sistema passa a guardar o arquivo junto do orcamento/OS, mesmo sem interpretar o conteudo automaticamente.

### Fase 3: leitura real de DXF

Implementar parser no backend para extrair:

- Bounding box.
- Comprimento de corte/perimetro.
- Area estimada quando aplicavel.
- Camadas.
- Quantidade de entidades.
- Alertas de geometria aberta ou inconsistente.

Mesmo com parser, o usuario deve revisar e confirmar os valores antes de gerar preco, porque DXF pode conter camadas auxiliares, linhas duplicadas, textos e geometrias que nao representam corte real.

## Ajustes recomendados em Orcamentos V2

1. Adicionar modo "Calculo rapido por imagem" no produto.
2. Adicionar perimetro como resultado tecnico visivel.
3. Permitir origem da geometria: manual, imagem ou DXF.
4. Estruturar forma de pagamento:

```text
condicao_pagamento_tipo
percentual_entrada
valor_entrada
valor_saldo
vencimento_entrada
vencimento_saldo
status_recebimento
```

5. Melhorar o preview do calculo para mostrar:

- Area.
- Perimetro.
- Tempo de maquina.
- Custo de material.
- Custo de maquina.
- Custo direto.
- Impostos.
- Margem.
- Preco sugerido.
- Entrada e saldo.

6. Criar acao interna clara para aprovar orcamento e gerar OS.
7. Revisar status comerciais para nao misturar rascunho, enviado, aprovado, execucao e concluido de forma ambigua.

## Ajustes recomendados em OS

1. Corrigir a criacao de OS a partir do orcamento para enviar `insumos_calculados` como array, nao como string.
2. Criar `ItemOS` para cada produto do orcamento aprovado.
3. Levar para cada item:

- Nome do produto.
- Quantidade.
- Largura, altura, unidade, area e perimetro.
- Origem da geometria.
- Anexo de imagem/DXF.
- Insumos necessarios.
- Maquinas e processos previstos.

4. Usar a OS como ponto de revisao tecnica antes de liberar ao PCP.
5. Transformar validacoes de estoque em checklist acionavel:

- Disponivel.
- Insuficiente.
- Reservado.
- Substituido.
- Aguardando compra.

## Ajustes recomendados em PCP

O cliente enxerga kanban como fluxo operacional completo. O Comunikapp deve separar internamente os conceitos, mas pode entregar uma tela unificada.

Colunas sugeridas para um painel operacional:

```text
Orcado
Aprovado / Gerar OS
Revisao tecnica
Fila de maquina
Acabamento
Pronto
Cobranca pendente
Concluido
```

Mapeamento possivel:

- `Orcado`: orcamentos em rascunho, enviados ou em negociacao.
- `Aprovado / Gerar OS`: orcamentos aprovados e OS criada.
- `Revisao tecnica`: OS aguardando aprovacao tecnica.
- `Fila de maquina`: OS liberada para PCP ou workflow em setor de maquina.
- `Acabamento`: workflow atual em setor de acabamento.
- `Pronto`: OS finalizada ou aguardando entrega.
- `Cobranca pendente`: financeiro com saldo aberto.
- `Concluido`: entrega e recebimento finalizados.

No PCP puro, manter a visao por setores e workflow. Para o cliente, oferecer tambem o painel operacional conectado.

## Home, onboarding e dashboard operacional

Uma diferenca importante entre o prototipo do cliente e o Comunikapp e a sensacao de entrada no sistema.

O HTML funciona quase como uma landing page operacional: o usuario entra, ve o fluxo inteiro e entende rapidamente onde clicar. O Comunikapp e mais robusto porque separa orcamento, OS, PCP, estoque e financeiro em modulos. Essa separacao e correta para escala, auditoria e manutencao, mas pode gerar duvida em empresas pequenas:

```text
Entrei no sistema. O que eu faco primeiro?
```

A recomendacao e usar a Home como uma camada de orientacao e operacao. Ela nao deve substituir os modulos. Ela deve guiar o usuario ate eles.

### Conceito recomendado

Criar uma Home com dois comportamentos:

- Quando a empresa ainda esta configurando o sistema: mostrar onboarding e checklist de implantacao.
- Quando a empresa ja usa o sistema: mostrar dashboard operacional e proximas acoes.

Isso cria o meio termo entre a simplicidade do prototipo e a robustez atual do Comunikapp.

### Onboarding inicial

O onboarding deve responder qual e a ordem natural para comecar a usar o sistema.

Fluxo sugerido:

```text
1. Configure os dados da empresa
2. Cadastre seus materiais principais
3. Cadastre maquinas, processos ou centros de trabalho
4. Configure margem, impostos e comissao
5. Configure formas de pagamento
6. Crie o primeiro cliente
7. Crie o primeiro orcamento
8. Aprove o orcamento e gere a OS
9. Acompanhe a producao
10. Registre o recebimento
```

Cada etapa deve ter:

- Status: pendente, concluida ou ignorada.
- Botao de acao direta.
- Texto curto explicando por que aquilo importa.
- Opcao de pular e configurar depois.
- Indicacao de impacto no sistema.

Exemplo:

```text
Cadastre seus materiais principais
Isso permite calcular custo e margem no orcamento.
[Cadastrar material] [Pular por enquanto]
```

### Configuracao rapida

Para empresas pequenas, o sistema nao deve bloquear o primeiro uso exigindo configuracao completa.

Deve existir um caminho de configuracao rapida:

```text
Usar configuracao recomendada
```

Esse caminho pode criar ou sugerir parametros iniciais, como:

- Margem padrao.
- Imposto padrao.
- Condicao de pagamento padrao.
- Processos basicos.
- Categorias iniciais de materiais.

Depois, a empresa ajusta os dados com mais calma.

### Onboarding contextual por modulo

Alem do onboarding inicial, cada modulo deve ter estados vazios orientativos.

Na tela de Orcamentos:

```text
Antes de criar um orcamento, recomendamos ter pelo menos:
- 1 cliente cadastrado
- 1 material ou insumo cadastrado
- margem padrao configurada
```

Na tela de OS:

```text
A OS normalmente nasce quando um orcamento e aprovado.
Voce tambem pode criar uma OS interna manualmente.
```

Na tela de PCP:

```text
Para aparecer producao aqui, uma OS precisa estar liberada para PCP.
```

Na tela de Financeiro:

```text
As contas a receber aparecem quando um orcamento aprovado possui condicao de pagamento estruturada.
```

Esses textos devem ser curtos e acionaveis. O objetivo nao e documentar o sistema inteiro dentro da tela, e sim remover duvida no momento certo.

### Dashboard operacional

Depois que o onboarding inicial estiver avancado, a Home deve se transformar em uma central de operacao diaria.

Blocos recomendados:

```text
Comece por aqui
Seu fluxo de trabalho
Atencao necessaria
Resumo financeiro
```

Exemplo de Home para empresa pequena:

```text
Comece por aqui
[✓] Dados da empresa
[✓] Primeiro material
[ ] Maquina/processo
[ ] Margem padrao
[ ] Primeiro orcamento

Seu fluxo de trabalho
Orcamentos: 5
Aprovados: 2
Em producao: 3
Prontos: 1
A receber: R$ 4.200

Atencao necessaria
- Orcamento parado ha 5 dias
- OS aguardando revisao tecnica
- Material abaixo do estoque minimo
- Cliente com saldo pendente
```

### Fluxo unico para empresa pequena

Empresas pequenas geralmente nao pensam primeiro em modulos. Elas pensam no trabalho em andamento.

A Home pode mostrar um fluxo unico:

```text
Orcamentos > Aprovados > Revisao tecnica > Producao > Prontos > A receber > Concluidos
```

Cada card representa um trabalho. Ao clicar, o sistema abre o local correto:

- Orcamento, quando ainda esta em negociacao.
- OS, quando ja foi aprovado.
- Item de PCP, quando esta em producao.
- Financeiro, quando existe saldo a receber.

Assim, o usuario navega pelo fluxo do negocio, mas o sistema continua usando os modulos corretos por baixo.

### Acoes rapidas na Home

Os cards da Home devem permitir acoes simples, conforme o status:

- Criar orcamento.
- Aprovar orcamento.
- Gerar OS.
- Liberar para producao.
- Iniciar producao.
- Marcar como pronto.
- Registrar recebimento.
- Ver materiais.
- Anexar imagem ou DXF.

Isso reduz a sensacao de que o usuario precisa "saber onde ir" antes de executar o trabalho.

### Referencia de experiencia

A dinamica desejada se aproxima de onboardings como o do Storybook: checklist progressivo, passos claros, links diretos para acao e estados vazios educativos.

O que aproveitar desse tipo de experiencia:

- Checklist de progresso.
- Proximas acoes sempre visiveis.
- Links diretos para telas relevantes.
- Explicacoes curtas.
- Estados vazios que orientam.
- Exemplos ou configuracoes recomendadas.

O que evitar:

- Linguagem tecnica demais.
- Excesso de texto na interface.
- Bloquear o usuario ate que tudo esteja configurado.
- Transformar a Home em apenas uma tela de graficos.

Para o Comunikapp, a Home deve ser menos "BI" e mais "mesa de trabalho".

### Recomendacao de produto

A Home deve ser tratada como uma camada de experiencia para empresas pequenas e medias:

- Simplifica entrada e navegacao.
- Mostra o que fazer primeiro.
- Mostra o que esta parado.
- Mostra onde ha dinheiro a receber.
- Leva o usuario ao modulo certo sem exigir que ele entenda a arquitetura interna.

Essa abordagem preserva a robustez do sistema e entrega a facilidade que o cliente percebeu no HTML.

## Ajustes recomendados em estoque

O prototipo desconta estoque imediatamente quando aprova engenharia. No sistema real, isso deve ser mais controlado.

Fluxo recomendado:

1. Orcamento calcula consumo previsto.
2. Aprovacao gera OS e previsao de materiais.
3. Revisao tecnica confirma materiais.
4. Liberacao para PCP reserva estoque.
5. Inicio/conclusao de etapa baixa consumo real ou parcial.
6. Finalizacao compara previsto versus realizado.

Isso evita baixa indevida quando o orcamento foi aprovado, mas ainda sera revisado, alterado ou cancelado.

## Roadmap sugerido

### Fase 0: corrigir integracao critica

- Corrigir `insumos_calculados` na OS gerada por orcamento.
- Criar `ItemOS` por produto do orcamento.
- Garantir que PCP e estoque leiam os materiais dos itens.

### Fase 1: calculo rapido no Orcamento V2

- Implementar colagem/upload de imagem.
- Exibir preview.
- Calcular area e perimetro por medidas reais.
- Persistir imagem como anexo tecnico.
- Mostrar custos tecnicos no preview.

### Fase 2: painel operacional

- Criar painel unificado comercial + OS + PCP.
- Fazer cards abrirem orcamento, OS ou item de producao.
- Implementar pausa de producao.
- Integrar eventos de PCP com estoque.

### Fase 3: financeiro minimo

- Estruturar condicao de pagamento.
- Gerar contas a receber na aprovacao.
- Controlar entrada, saldo e vencimentos.
- Exibir cobranca pendente no painel operacional.

### Fase 4: DXF real

- Aceitar DXF como anexo tecnico.
- Criar tela de revisao de geometria.
- Implementar parser no backend.
- Confirmar area/perimetro antes de precificar.

## Riscos e cuidados

- Nao usar PIN fixo ou autorizacao local como no HTML.
- Nao descontar estoque definitivamente no momento errado.
- Nao tratar pixels da imagem como medida real.
- Nao confiar automaticamente em DXF sem revisao.
- Preservar historico de orcamento aprovado para evitar mudancas silenciosas depois da aprovacao.
- Manter isolamento por loja/tenant em anexos, estoque, OS e financeiro.

## Conclusao

O Comunikapp ja possui a arquitetura principal para atender esse cliente. A maior diferenca esta na experiencia: o prototipo junta calculo, referencia visual, aprovacao, producao, estoque e financeiro em um fluxo simples.

A recomendacao e nao substituir o Orcamento V2, OS e PCP atuais. O melhor caminho e evoluir esses modulos com:

- Entrada rapida por imagem/manual.
- Perimetro e geometria tecnica no produto.
- OS gerada com itens e materiais consistentes.
- PCP conectado a itens, estoque e apontamentos.
- Painel operacional unificado para o cliente acompanhar tudo.
- Financeiro minimo conectado a aprovacao e entrega.
