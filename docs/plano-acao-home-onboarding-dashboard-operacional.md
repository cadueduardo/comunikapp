# Plano de Ação: Home, Onboarding e Evolução Operacional

> **Status atual (atualizado em 2026-05-25, sessão da tarde 2):** Fases 0, 1, 2, 3, 4 e 5 concluídas. Próximo passo é a Fase 6 (Financeiro mínimo) — campos de condição de pagamento no orçamento, previsão de recebimento, bloco `ResumoFinanceiroSimples` na Home e eventos automáticos pelo avanço do trabalho. O desbloqueio da Fase 6 libera também as colunas `a_receber` / `concluidos` do fluxo (Fase 4) e o 7º alerta operacional (`trabalho_pronto_sem_recebimento`). Detalhes operacionais para o próximo agente em [`docs/HANDOFF-AGENTE-CONTINUACAO.md`](./HANDOFF-AGENTE-CONTINUACAO.md). **Leia o HANDOFF antes de continuar.**

## Critério de sucesso

O plano será considerado bem-sucedido quando uma empresa pequena conseguir entrar no Comunikapp, entender o que precisa configurar primeiro, criar seu primeiro orçamento com menos fricção, acompanhar produção e caixa pela Home, e ainda assim ter acesso aos módulos completos quando precisar de detalhe.

## Correção de nomenclatura

Neste documento, **Orçamentos V2** é o módulo principal de orçamento da plataforma. O termo V2 existe porque substituiu uma proposta anterior, não porque existem dois módulos de orçamento em operação.

Quando o plano mencionar orçamento, ele está falando de **Orçamentos V2**.

## Regra de encoding e idioma

Toda documentação e todo código novo devem ser salvos em **UTF-8**.

Textos visíveis ao usuário, documentação, labels, mensagens e microcopy devem usar português brasileiro com acentuação correta. Evitar acentos por receio de encoding não é uma solução aceitável para o produto. Se aparecer texto com caracteres corrompidos por encoding, o problema deve ser tratado como defeito técnico, não como justificativa para remover acentos.

Regra prática:

```text
Correto: Orçamentos, produção, configuração, usuário, ação.
Incorreto: Orcamentos, producao, configuracao, usuario, acao.
```

## Princípio do produto

A Home não deve ser apenas um dashboard de indicadores. Para empresas pequenas, ela precisa funcionar como uma **mesa de trabalho**: orientar o começo, mostrar pendências, explicar o próximo passo e levar o usuário ao módulo certo.

O sistema continua modular por baixo. A experiência de entrada deve ser unificada por cima.

O HTML do cliente mostrou uma coisa importante: para uma empresa pequena, orçamento, produção, estoque e caixa são percebidos como partes de um mesmo trabalho. O Comunikapp não deve abandonar sua arquitetura modular, mas precisa entregar uma camada simples que conecte esses pontos.

### Visão de produto: dashboard com cards como camada de unificação

A sensação de "tela única" que o HTML do cliente entrega de forma monolítica, no Comunikapp será resolvida pelo **dashboard com cards**. Cada card é uma porta de entrada para um módulo, com a informação essencial visível e ações rápidas no próprio card.

Regras dessa camada:

- O dashboard nunca substitui um módulo. Ele orienta, resume e leva.
- Cada card mostra **estado atual + próxima ação possível**.
- Cada card respeita o perfil do usuário. O que ele não pode ver, não aparece.
- O dashboard é o ponto de partida diário; os módulos continuam fazendo o trabalho pesado.
- Em mobile, os cards são a navegação principal; o menu lateral é secundário.

Isso preserva a arquitetura modular e entrega a percepção de fluxo unificado.

### Princípios adicionais do produto

Estes princípios valem para qualquer evolução proposta neste plano:

1. **Permissão visível**: a Home respeita perfis e permissões. Blocos sensíveis (financeiro, contas a receber, auditoria) só aparecem para perfis autorizados. Mesmo na empresa pequena, em que normalmente o dono opera tudo, o princípio precisa estar implementado desde o início.
2. **Hierarquia de alertas**: todo alerta tem nível explícito — `informativo`, `atenção` ou `crítico`. O tratamento visual e a ordenação devem refletir essa hierarquia. Alertas críticos vêm primeiro, com marcação visual forte.
3. **Fluxo da Home é visualização e atalho, não kanban interativo**: o bloco "Seu fluxo de trabalho" é leitura + ação rápida por card (`abrir`, `liberar`, `registrar recebimento`). Não há drag and drop entre colunas no dashboard, porque cada coluna pertence a um módulo distinto, com regras próprias. Drag and drop continua existindo dentro do PCP, que é homogêneo.
4. **Configuração recomendada**: o sistema deve permitir que uma empresa pequena comece com defaults sensatos e ajuste depois. Não bloquear o primeiro uso por excesso de configuração.
5. **Sempre por loja**: todas as agregações respeitam `loja_id`. Nenhum dado cruza o limite do tenant.

## Diagnóstico atual

O Comunikapp já possui boa parte da base necessária:

- **Orçamentos V2** já cria propostas, calcula custos, trabalha com produtos, materiais, máquinas, funções, impostos, margem, envio e aprovação.
- **OS** já pode nascer a partir do orçamento aprovado.
- **PCP** já possui kanban, fila por setor, início e conclusão de produção.
- **Estoque** já possui dashboard próprio e validações.
- **Cadastro de loja** já existe como onboarding inicial de conta.

O ponto fraco atual está na entrada após login. A rota `/dashboard` existe, mas ainda é um placeholder com mensagem de boas-vindas e sem conteúdo operacional. Também não existe uma camada de onboarding operacional depois que a loja foi criada.

Além disso, o HTML do cliente revelou melhorias de fluxo que precisam entrar no plano:

- Cálculo rápido por imagem colada ou upload.
- Uso de DXF como referência técnica.
- Área e perímetro como dados centrais do orçamento.
- Estimativa automática de tempo de máquina a partir do perímetro.
- Compatibilidade automática entre material e máquina.
- Forma de pagamento mais clara, com entrada e saldo.
- Aprovação conectada à OS e à produção.
- Simulador de precificação científica (markup industrial).
- Dashboard de cards que mostra o trabalho do começo ao fim.
- Visão simples de caixa e valores a receber, com tela de auditoria por cliente.
- Lançamento financeiro automático quando o trabalho avança no fluxo.
- Conversão correta de consumo previsto em m² para chapas físicas e sobras.

Também existem ajustes de usabilidade que impactam diretamente essa percepção de simplicidade:

- No mobile, o menu lateral não deve ficar aberto por padrão.
- No desktop, o menu lateral hoje abre por `hover` (mouse enter/leave), o que cria comportamento estranho em telas híbridas (touchscreen com mouse, como Surface ou iPad em modo landscape).
- Telas de CRUD em mobile devem abrir por padrão em visualização de cards, não em tabela.
- A visualização em tabela pode continuar disponível, mas deve ser uma escolha do usuário em telas pequenas.

## Direção recomendada

O plano é dividido em duas frentes conectadas.

### Frente 1: Home e onboarding operacional

Criar uma Home com dois modos:

1. **Modo implantação**
   - Aparece quando a loja ainda não tem configuração mínima.
   - Mostra checklist de passos iniciais.
   - Ensina o que deve vir antes do primeiro orçamento.
   - Permite pular etapas sem travar o uso.
   - Oferece atalho **Aplicar configuração recomendada**, que cria defaults da loja em um clique.

2. **Modo operação**
   - Aparece quando a loja já tem dados suficientes.
   - Mostra fluxo do negócio, pendências e próximas ações em cards.
   - Funciona como entrada diária para empresas pequenas.

### Frente 2: Melhorias do fluxo operacional

Evoluir Orçamentos V2, OS, PCP, Estoque e Financeiro mínimo para sustentar a experiência simples da Home.

Essa frente inclui:

- Geometria rápida por imagem e medidas reais.
- DXF como anexo técnico, depois como leitura automática.
- Estimativa automática de tempo de máquina a partir do perímetro.
- Compatibilidade material × máquina aplicada no cálculo rápido.
- Simulador de precificação científica disponível como apoio.
- OS criada com itens e materiais consistentes.
- PCP conectado aos itens da OS.
- Estoque com reserva e baixa no momento correto, em unidades reais de chapa.
- Financeiro mínimo para entrada, saldo, recebíveis e eventos automáticos pelo avanço do trabalho.
- Tela de auditoria de recebimentos por cliente.
- Navegação mobile sem bloqueio pelo menu lateral.
- Navegação desktop sem dependência do `hover` da sidebar.
- CRUDs com cards como visualização padrão no mobile.

## Estrutura funcional da Home

### Bloco 0: Banner de estado do sistema

Antes de qualquer outro bloco, a Home pode exibir um banner contextual com o estado atual do sistema.

O componente `TrialBanner` atual deve ser ampliado e renomeado para `SystemStateBanner`, capaz de mostrar:

- Trial ativo / expirando.
- Configuração incompleta (ex.: faltam dados da empresa).
- Dados de demonstração carregados.
- Integrações em modo degradado (ex.: envio de e-mail indisponível).
- Outras mensagens críticas de estado.

Regras:

- Não exibir se não houver mensagem real.
- Suportar até dois banners empilhados; mais que isso, agrupar como "ver detalhes".
- Cada mensagem deve ter ação clara (link, botão, ignorar).

### Bloco 1: Comece por aqui

Checklist de implantação com progresso.

Passos recomendados:

1. Confirmar dados da empresa.
2. Cadastrar primeiro cliente.
3. Cadastrar materiais principais.
4. Cadastrar máquinas, processos ou centros de trabalho.
5. Configurar margem, impostos e comissão.
6. Configurar condição de pagamento padrão.
7. Criar primeiro orçamento em Orçamentos V2.
8. Aprovar orçamento e gerar OS.
9. Liberar OS para produção.
10. Registrar recebimento.

Cada passo deve ter:

- Estado: `pendente`, `concluído`, `ignorado` ou `precisa de atenção`.
- Link direto para a tela correta.
- Texto curto de orientação.
- Critério objetivo de conclusão.
- Ação principal.

Exemplo:

```text
Cadastre seus materiais principais
Isso permite calcular custo, margem e consumo no orçamento.
Ação: Cadastrar material
Critério de conclusão: existe pelo menos 1 insumo ativo na loja.
```

#### Atalho de configuração recomendada

No início do checklist, oferecer o botão **Aplicar configuração recomendada**.

Ao clicar, o sistema cria/atualiza, sem sobrescrever dados existentes:

- Margem padrão sugerida.
- Imposto padrão sugerido (alíquota inicial configurável).
- Condição de pagamento padrão (ex.: 50% entrada + 50% na entrega).
- Categorias iniciais de materiais.
- Processos básicos (ex.: corte, acabamento, montagem).

Regras:

- Cada valor aplicado deve ser exibido na confirmação para o usuário aceitar antes de gravar.
- O atalho marca como `concluído` os passos do checklist correspondentes aos campos preenchidos.
- O usuário pode reverter individualmente cada item depois.
- Não substituir nada que o usuário já tenha configurado manualmente.

### Bloco 2: Seu fluxo de trabalho

Visão compacta do fluxo inteiro em colunas com cards.

```text
Orçamentos > Aprovados > Revisão técnica > Produção > Prontos > A receber > Concluídos
```

Cada coluna deve mostrar contagem e cards recentes.

Mapeamento sugerido:

| Coluna | Fonte principal | Regra inicial |
| --- | --- | --- |
| Orçamentos | Orçamentos V2 | rascunho, enviado, em análise ou negociação |
| Aprovados | Orçamentos V2 e OS | orçamento aprovado com ou sem OS criada |
| Revisão técnica | OS | aguardando aprovação técnica |
| Produção | PCP | OS liberada para PCP ou em workflow |
| Prontos | OS e PCP | OS finalizada ou aguardando entrega |
| A receber | Financeiro mínimo | saldo pendente |
| Concluídos | OS e financeiro | entregue e recebido |

Regras de interação:

- O bloco é **visualização + atalho**, não kanban interativo.
- Cards não são arrastáveis entre colunas no dashboard.
- Cada card tem ações rápidas conforme o estágio: `abrir orçamento`, `gerar OS`, `liberar para PCP`, `marcar pronto`, `registrar recebimento`.
- O clique no corpo do card abre o detalhe no módulo correto.
- Mover entre colunas exige ação explícita que dispare a transição de estado documentada.

### Bloco 3: Atenção necessária

Lista de alertas operacionais com hierarquia visual.

Cada alerta possui:

- `nivel`: `informativo`, `atenção` ou `crítico`.
- `titulo` curto.
- `descricao` em uma linha.
- `acao` principal (link ou botão).
- `origem` (módulo de onde o alerta veio).

Alertas iniciais recomendados:

- Orçamento parado há mais de X dias. (`atenção`)
- Orçamento aprovado sem OS. (`atenção`)
- OS aguardando revisão técnica. (`atenção`)
- OS liberada sem workflow. (`crítico`)
- Material abaixo do estoque mínimo. (`atenção`)
- Material insuficiente para OS já liberada. (`crítico`)
- Trabalho pronto sem recebimento registrado há mais de X dias. (`atenção`)

Regras de exibição:

- Ordenar por `crítico` → `atenção` → `informativo`.
- Tratamento visual diferente por nível (cor, ícone, eventual destaque animado **discreto** apenas para `crítico`).
- Se não houver alerta, esconder o bloco em vez de mostrar "tudo certo".

### Bloco 4: Resumo financeiro simples

Esse bloco deve ser simples no início, mesmo antes do módulo financeiro completo. Ele só aparece para perfis com permissão financeira.

Indicadores recomendados para a primeira versão:

- Total orçado no mês.
- Total aprovado no mês.
- Valor em produção.
- Valor pronto para receber.
- Valor recebido, quando houver dado estruturado.

Regras:

- Cada indicador é clicável e leva à listagem ou tela correspondente.
- Quando o financeiro estruturado existir, o bloco evolui para incluir contas a pagar/receber.
- Não inventar projeções: se o dado não existe, esconder o indicador.

## Melhorias em Orçamentos V2

### Objetivo

Dar ao orçamento a mesma velocidade percebida no HTML do cliente, sem perder a estrutura robusta já existente no Comunikapp.

### Entregáveis funcionais

1. Criar modo de cálculo rápido por imagem dentro do produto do orçamento.
2. Permitir colar imagem via `Ctrl+V` na área de upload.
3. Permitir upload de imagem como alternativa.
4. Exibir preview da imagem anexada.
5. Solicitar largura e altura reais, com **unidade configurável** (`mm`, `cm`, `m`) e conversão automática.
6. Calcular **área** e **perímetro** automaticamente.
7. Salvar `geometria_origem`: `MANUAL`, `IMAGEM` ou `DXF`.
8. Exibir no preview: área, perímetro, tempo de máquina, custo direto, margem, impostos, preço final e entrada/saldo.
9. Estruturar forma de pagamento com entrada e saldo (campos estruturados, não texto livre).

### Estimativa automática de tempo de máquina

Hoje o usuário precisa estimar manualmente `tempo_horas` em `ItemMaquina`. Para o cálculo rápido, o sistema deve sugerir o tempo a partir da geometria.

Como fazer:

- Adicionar no cadastro de máquina dois campos opcionais:
  - `minutos_por_metro_corte` (para máquinas que cortam por perímetro: router, laser).
  - `minutos_por_m2` (para máquinas que processam por área: impressão).
- Quando o componente de geometria rápida calcular `perimetro` ou `area`, o motor V2 sugere o tempo para cada `ItemMaquina` associado, conforme a unidade da máquina.
- A sugestão é **editável** pelo usuário; gravar `tempo_sugerido` e `tempo_real` separados para fins de auditoria.
- Se a máquina não tiver os campos preenchidos, manter o comportamento atual (usuário informa o tempo).

### Compatibilidade material × máquina

Aproveitar o módulo de **Validações Automáticas** (`RegraValidacao`) já existente em `configuracoes/validacoes-automaticas`.

Como fazer:

- Criar regras nativas de compatibilidade material → máquinas permitidas.
- No componente de geometria rápida, ao escolher material, aplicar as regras existentes:
  - Bloquear máquinas incompatíveis no dropdown.
  - Sugerir a máquina mais adequada.
  - Exibir aviso quando a combinação for fora do padrão.
- Documentar como o usuário cadastra novas regras, para que cada loja personalize.

### Simulador de precificação científica

Componente isolado, acionável a partir da Home e do Orçamentos V2, sem interferir no motor V2.

Entradas:

- `custo_direto_pedido`
- `imposto_da_nota_pct`
- `absorcao_custos_fixos_pct`
- `lucro_pretendido_pct`

Saídas:

- `preco_sugerido`
- `markup_aplicado`

Como fazer:

- Criar componente `SimuladorPrecificacao` reutilizável.
- Disponibilizar como modal/atalho na Home (apenas para perfis financeiros) e como apoio dentro do Orçamentos V2.
- Os valores não são persistidos no orçamento automaticamente; o usuário pode copiar manualmente para a margem do orçamento.
- Defaults vêm das configurações da loja (imposto e margem padrão).

### Observação sobre imagem

A imagem colada não deve ser usada como medida real. Ela é referência visual. As medidas reais devem vir dos campos preenchidos pelo usuário, salvo se no futuro existir uma etapa de calibração por escala.

### Observação sobre DXF

O HTML do cliente simula DXF. O Comunikapp deve tratar DXF em fases:

1. **Fase inicial**: DXF como anexo técnico, com medidas confirmadas manualmente.
2. **Fase intermediária**: leitura de metadados e preview técnico.
3. **Fase avançada**: parser real para área, perímetro, camadas e alertas de geometria.

## Melhorias em OS

### Objetivo

Garantir que a OS gerada a partir de Orçamentos V2 carregue corretamente os produtos, materiais e parâmetros técnicos necessários para produção.

### Entregáveis

1. Corrigir a geração de `insumos_calculados` para não perder materiais ao criar OS. Validar contrato de serialização: gravar como JSON consistente e fazer `JSON.parse` defensivo em todos os consumidores (PCP, estoque, apontamento).
2. Criar `ItemOS` para cada produto do orçamento aprovado.
3. Levar para cada item: largura, altura, unidade, área, perímetro, `geometria_origem` e referência do anexo.
4. Levar anexos de imagem ou DXF para a OS.
5. Transformar validações de estoque em checklist técnico antes de liberar para PCP.
6. Criar ação interna explícita: **Aprovar orçamento e gerar OS** (atalho para o usuário interno, sem precisar abrir o link público do cliente). Registrar auditoria de quem/quando.

### Critérios de aceite

- Uma OS criada por orçamento aprovado mantém vínculo com o orçamento.
- Cada produto relevante do orçamento vira item de OS.
- Materiais calculados aparecem na OS de forma utilizável pelo PCP e pelo estoque.
- A revisão técnica consegue confirmar ou ajustar dados antes da produção.
- A aprovação interna direta é auditada e dispara os mesmos eventos que a aprovação via link público.

## Melhorias em PCP

### Objetivo

Conectar o PCP ao fluxo percebido pela empresa pequena, sem reduzir o PCP a um kanban genérico.

### Entregáveis

1. Fazer cards do PCP abrirem OS ou item de produção.
2. Implementar pausa de produção.
3. Garantir que workflow seja atribuído por item quando houver `ItemOS`.
4. Integrar eventos de produção com estoque (reserva, consumo, sobra).
5. Exibir na Home o estado operacional do trabalho (somente leitura + atalho).

### Crítério de coexistência com a Home

- O kanban **dentro do PCP** continua sendo interativo (drag and drop entre etapas/setores).
- O kanban visual **na Home** é apenas resumo e atalho, sem drag and drop.

### Critérios de aceite

- O usuário entende quais trabalhos estão em produção.
- O card leva ao detalhe correto.
- A conclusão de etapa atualiza o estado operacional.
- O fluxo da Home reflete o estado real do PCP.

## Melhorias em Estoque

### Objetivo

Evitar baixa indevida, transformar consumo previsto em controle operacional e tratar corretamente a realidade física do material (chapas inteiras + sobras), que é essencial para comunicação visual.

### Fluxo recomendado

1. Orçamentos V2 calcula consumo previsto em **m²**.
2. Aprovação gera OS e materiais previstos.
3. Revisão técnica confirma materiais.
4. Liberação para PCP **reserva** estoque.
5. Início ou conclusão de etapa **baixa** consumo real ou parcial.
6. Finalização compara previsto versus realizado.

### Conversão m² → chapa → sobra

A baixa real precisa acontecer em unidades de chapa, não em fração de m². Isso vale para insumos do tipo `chapa` (acrílico, ACM, PVC etc.).

Como fazer:

- No cadastro de insumo do tipo `chapa`, exigir `largura_chapa` e `altura_chapa` (mm).
- Ao calcular consumo, o sistema:
  - Calcula `area_necessaria_m2`.
  - Calcula `chapas_necessarias = ceil(area_necessaria / area_chapa)`.
  - Calcula `sobra_estimada_m2 = (chapas_necessarias × area_chapa) − area_necessaria`.
- A reserva é feita em **chapas inteiras**.
- A baixa final consome o número real de chapas usadas.
- A sobra é registrada em `estoque_sobras`, vinculada à OS de origem, para reaproveitamento futuro.
- O orçamento deve **exibir** ao usuário: "para este pedido, serão consumidas N chapas inteiras, gerando X m² de sobra reutilizável".

### Critérios de aceite

- Aprovar orçamento não baixa estoque definitivamente.
- Liberar para PCP pode reservar material em chapas inteiras.
- Produção pode consumir material no momento correto.
- Sobras geradas são registradas e ficam disponíveis em `estoque_sobras`.
- A Home mostra alerta quando há material insuficiente.

## Financeiro mínimo

### Objetivo

Atender a expectativa de empresas pequenas que precisam enxergar entrada, saldo e valores a receber sem esperar um financeiro completo.

### Entregáveis

1. Estruturar condição de pagamento no orçamento.
2. Calcular entrada e saldo.
3. Criar previsão de recebimento quando orçamento for aprovado.
4. Permitir marcar entrada recebida.
5. Permitir marcar saldo recebido.
6. Exibir valores a receber na Home.
7. Disparar **eventos financeiros automáticos** conforme o avanço do trabalho (ver abaixo).
8. Criar **tela de auditoria de recebimentos por cliente** (ver abaixo).

### Eventos financeiros automáticos pelo avanço do trabalho

Para fechar o ciclo percebido pelo cliente (mover o card avança o financeiro):

- **Orçamento aprovado** → cria `previsao_recebimento_entrada` e `previsao_recebimento_saldo`, conforme `condicao_pagamento`.
- **OS gerada e liberada para produção** → marca a previsão de entrada como `vencida` se configurado como pré-pago.
- **OS concluída / produto pronto** → marca o saldo como `cobrável` e gera alerta na Home se ficar parado.
- **Pagamento confirmado pelo usuário** → registra a entrada efetiva no caixa.

Regras:

- Os eventos automáticos **nunca movimentam caixa sem confirmação manual** do usuário responsável.
- Cada evento gera registro de auditoria (quem disparou, quando, qual transição).
- Eventos podem ser desativados por loja se o cliente preferir controle 100% manual.

### Tela de auditoria de recebimentos

Tela operacional separada da Home, acessível por perfis com permissão financeira.

Colunas mínimas:

- Cliente / Projeto.
- Número do orçamento e da OS.
- Valor do contrato.
- Condição de pagamento (ex.: 50% + 50%).
- Valor recebido inicial.
- Saldo faltante retido.
- Status da cobrança (`em prospecção`, `parcial pago`, `liquidado`, `vencido`).
- Ações: `registrar pagamento parcial`, `liquidar saldo`, `enviar lembrete`, `gerar nota`, `forçar recebimento total`.

Regras:

- Ações sensíveis (forçar recebimento, alterar valor) exigem confirmação e registram log.
- Filtros por cliente, status, período e responsável.
- Suporta exportação CSV.

### Critérios de aceite

- Orçamento aprovado gera informação financeira mínima.
- A Home mostra valores pendentes.
- Trabalho pronto com saldo aberto aparece como atenção necessária.
- A tela de auditoria permite acompanhar a cobrança caso a caso.
- Eventos automáticos podem ser auditados pelo log.

## Ajustes mobile e navegação global

### Objetivo

Garantir que a experiência mobile não pareça uma adaptação da tela desktop, e que a sidebar do desktop também funcione bem em telas híbridas (touch + mouse).

### Menu lateral no mobile

Comportamento obrigatório:

- Iniciar **fechado por padrão**.
- Abrir apenas por ação explícita no botão de menu.
- Fechar ao clicar em um item de navegação.
- Fechar ao tocar fora do menu.
- Impedir que o menu cubra a tela permanentemente após troca de rota.

Critérios de aceite:

- Ao abrir `/dashboard` em viewport mobile, o conteúdo principal fica visível.
- O menu não aparece aberto por padrão em telas pequenas.
- O usuário consegue abrir e fechar o menu facilmente.
- Ao selecionar uma rota no menu, o menu fecha.
- A navegação não bloqueia cliques no conteúdo principal quando o menu está fechado.

### Menu lateral no desktop

Hoje a `DesktopSidebar` em `frontend/src/components/ui/sidebar.tsx` abre por `onMouseEnter` e fecha por `onMouseLeave`. Isso causa flicker e comportamento estranho em telas híbridas (Surface, iPad com mouse, monitor touch).

Como fazer:

- Substituir o gatilho `hover` por **clique explícito** em um botão de "fixar/desfixar" sidebar (ou em um botão de menu).
- Manter a animação de largura (60px ↔ 300px) só na transição manual.
- No estado colapsado (60px), exibir `Tooltip` com o nome do item ao passar o mouse, em vez de expandir o menu inteiro.
- Persistir a preferência (aberto/colapsado) em `localStorage` por usuário.

### Padronização do roteamento

Hoje o `SidebarLink` interno de `sidebar.tsx` usa `<a href>` que força full-page reload. O `SidebarLink` customizado em `layout.tsx` usa `next/link`. Isso precisa ser unificado.

Como fazer:

- Substituir todos os `<a href>` de navegação interna por `Link` do `next/link`.
- Remover duplicação de `SidebarLink` (manter apenas a versão com `Link`).
- Garantir prefetch onde apropriado.

### Visualização padrão dos CRUDs no mobile

Nos módulos com listagem, o padrão mobile deve ser card. Tabela deve continuar disponível para desktop e, quando fizer sentido, como alternância manual no mobile.

Regra de produto:

```text
Desktop: tabela como padrão quando houver muitos campos comparáveis.
Mobile: cards como padrão para leitura, toque e ações rápidas.
```

Essa regra deve valer para CRUDs como:

- Clientes.
- Insumos.
- Produtos.
- Orçamentos V2.
- OS.
- Estoque.
- Máquinas.
- Fornecedores.
- Serviços manuais.

### Padrão de card mobile

Cada card deve mostrar apenas o essencial, com ações acessíveis.

Estrutura recomendada:

```text
Título principal
Subtítulo ou identificador
Status
Valor ou métrica principal
Dados secundários em até 3 linhas
Ações rápidas
```

Exemplo para Orçamentos V2:

```text
Orçamento #1024
Cliente: João Comunicação Visual
Status: Enviado
Valor: R$ 2.850,00
Criado em: 23/05/2026
[Abrir] [Enviar] [Mais ações]
```

Exemplo para OS:

```text
OS #88
Cliente: João Comunicação Visual
Status: Revisão técnica
Prazo: 27/05/2026
Produção: aguardando liberação
[Abrir] [Liberar] [Mais ações]
```

### Alternância entre tabela e cards

Quando a tela tiver as duas visualizações, o sistema deve respeitar esta prioridade:

1. Em mobile, abrir em cards por padrão.
2. Em desktop, abrir em tabela por padrão quando a tabela for útil.
3. Se o usuário trocar manualmente a visualização, salvar preferência por módulo (em `localStorage`).
4. A preferência salva não deve quebrar a regra mínima de usabilidade. Se a tabela ficar ilegível no mobile, cards devem continuar sendo a opção recomendada.

### Critérios de aceite

- CRUDs principais abrem em cards no mobile.
- Cards não estouram largura da tela.
- Ações principais são tocáveis com conforto.
- Tabela desktop não é removida.
- Não há perda de funcionalidade entre tabela e cards.
- Preferência de visualização pode ser preservada por módulo.
- Sidebar desktop não depende mais de `hover` para abrir/fechar.

## Arquitetura técnica sugerida

### Backend

Criar um módulo dedicado para a Home operacional.

Nome sugerido:

```text
home-operacional
```

Endpoints iniciais:

```text
GET   /home-operacional/resumo
GET   /home-operacional/onboarding
PATCH /home-operacional/onboarding/:stepId
POST  /home-operacional/onboarding/aplicar-configuracao-recomendada
GET   /home-operacional/fluxo
GET   /home-operacional/alertas
GET   /home-operacional/banner-estado
```

Responsabilidades:

- Agregar dados de Orçamentos V2, OS, PCP, Estoque e Financeiro mínimo.
- Calcular progresso de onboarding operacional.
- Aplicar a configuração recomendada quando solicitada.
- Retornar cards de fluxo de trabalho.
- Retornar alertas acionáveis classificados por nível.
- Retornar mensagens de estado para o banner.
- Respeitar `loja_id` em todas as consultas.
- Respeitar perfil/permissão para filtrar blocos sensíveis (financeiro, auditoria).

Essa regra não deve ficar espalhada dentro de Orçamentos V2, OS ou PCP. A Home cruza vários domínios e precisa de um serviço agregador próprio.

### Performance e cache

A Home cruza vários módulos. Em lojas com muitos registros, fazer agregações ingênuas em cada request degrada.

Como fazer:

- Implementar consultas agregadas no banco (`COUNT`, `SUM`, `GROUP BY`) em vez de carregar coleções inteiras para o Node agrupar.
- Aplicar **cache curto** (60 segundos) por `loja_id` no endpoint `/home-operacional/resumo`.
- Invalidar cache quando ocorrer evento relevante: aprovação de orçamento, criação/conclusão de OS, movimentação de estoque, recebimento.
- Suportar `?refresh=1` para forçar bypass manual do cache.
- Medir tempo de resposta e expor métrica simples (log estruturado por enquanto).

### Persistência

#### Onboarding operacional

Criar uma tabela própria.

```text
onboarding_operacional
id
loja_id
step_id
status
ignorado_em
concluido_em
atualizado_em
criado_em
```

Vantagens:

- Permite auditoria simples.
- Permite marcar etapas ignoradas.
- Evita sobrecarregar a tabela `loja`.
- Permite evoluir para onboarding por usuário no futuro.

Recomendação: iniciar por onboarding por loja. Para empresa pequena, o progresso de implantação pertence mais ao negócio do que a uma pessoa específica.

#### Anexos de imagem e DXF

Decisão obrigatória da Fase 0. Opções:

1. Reaproveitar `ArteArquivo` (do módulo Arte & Aprovação) com discriminador de origem.
2. Criar tabela nova `OrcamentoAnexo` / `ProdutoAnexo`.
3. Usar storage externo (S3 / MinIO) com URL gravada no campo `arquivo_geometria_url`.

Recomendação inicial: **opção 3 com referência em campo do `ProdutoOrcamento`**, registrando metadados (tamanho, mime, hash) em tabela auxiliar simples. Reaproveitar `ArteArquivo` corre risco de acoplar fluxos diferentes.

#### Campos de geometria em `ProdutoOrcamento`

Acrescentar:

```text
geometria_origem        : enum MANUAL | IMAGEM | DXF
perimetro_produto       : decimal(10,2)
arquivo_geometria_url   : string
geometria_metadados     : json (largura, altura, unidade original, escala, observações)
```

Manter `area_produto` já existente.

### Frontend

Substituir o placeholder atual de:

```text
frontend/src/app/(main)/dashboard/page.tsx
```

por uma tela composta por componentes.

Componentes sugeridos:

```text
frontend/src/components/dashboard-operacional/SystemStateBanner.tsx
frontend/src/components/dashboard-operacional/OnboardingChecklist.tsx
frontend/src/components/dashboard-operacional/AplicarConfiguracaoRecomendada.tsx
frontend/src/components/dashboard-operacional/FluxoTrabalho.tsx
frontend/src/components/dashboard-operacional/CardTrabalho.tsx
frontend/src/components/dashboard-operacional/AlertasOperacionais.tsx
frontend/src/components/dashboard-operacional/ResumoFinanceiroSimples.tsx
frontend/src/components/dashboard-operacional/SimuladorPrecificacao.tsx
```

Hooks sugeridos:

```text
frontend/src/hooks/useDashboardOperacional.ts
frontend/src/hooks/useOnboardingOperacional.ts
frontend/src/hooks/useSystemState.ts
frontend/src/hooks/usePermissaoFinanceira.ts
```

Rotas de API no Next, se mantido o padrão atual de proxy:

```text
frontend/src/app/api/home-operacional/resumo/route.ts
frontend/src/app/api/home-operacional/onboarding/route.ts
frontend/src/app/api/home-operacional/onboarding/aplicar-configuracao-recomendada/route.ts
frontend/src/app/api/home-operacional/fluxo/route.ts
frontend/src/app/api/home-operacional/alertas/route.ts
frontend/src/app/api/home-operacional/banner-estado/route.ts
```

## Plano de implementação

### Fase 0: decisões, contratos, status e encoding

> **[CONCLUÍDA em commit `66de457`]** — Todos os 10 documentos de decisão estão em `docs/fase-0-home-operacional/`. Ver índice em `docs/fase-0-home-operacional/README.md`.

Objetivo: preparar base sem mexer ainda na experiência final. Esta fase é obrigatória; nenhuma fase posterior deve começar sem suas decisões registradas.

Entregáveis:

1. **Definir e documentar status oficiais**:
   - Status comerciais de Orçamentos V2 (nome interno, label, transições permitidas, eventos disparados).
   - Status operacionais de OS (idem).
   - Status de cobrança no financeiro mínimo (idem).
2. **Definir contratos JSON** dos endpoints da Home (request/response com exemplos).
3. **Definir lista final de etapas** do onboarding operacional, com `step_id` estável.
4. **Definir campos de geometria** em `ProdutoOrcamento`.
5. **Decidir persistência de anexos** (imagem e DXF). Documentar a escolha.
6. **Decidir conversão m² → chapa → sobra**: regras finais, campos obrigatórios em `Insumo` tipo chapa, comportamento de reserva e baixa.
7. **Decidir como a Home respeita perfil/permissão**: lista de blocos com permissão obrigatória.
8. **Decidir o comportamento do bloco "Fluxo de trabalho" da Home**: confirmar formalmente que será visualização + atalho, sem drag and drop.
9. **Decidir defaults da configuração recomendada**: margem, imposto, condição de pagamento, processos básicos.
10. **Definir `SystemStateBanner`**: lista de mensagens possíveis na primeira versão.
11. **Garantir UTF-8** em arquivos novos e textos com acentuação correta.

Critérios de aceite:

- Decisões documentadas em arquivos específicos dentro de `docs/`.
- Contratos com exemplo JSON validável.
- Status oficiais aprovados antes de qualquer implementação posterior.
- Nenhum arquivo novo com texto quebrado por encoding.

### Fase 1: onboarding operacional mínimo

> **[CONCLUÍDA em commits `71c4acf` (backend), `8537eba` (frontend), `dcb9f98` (fix de visibilidade do checklist)]** — Módulo `backend/src/home-operacional/`, componentes `frontend/src/components/home-operacional/` e `/dashboard` integrados. Tabela `onboarding_operacional` criada (migration `20260524110000_add_home_operacional`).

Objetivo: orientar a primeira entrada da empresa no sistema.

Entregáveis:

1. Criar módulo `home-operacional` no backend.
2. Criar tabela `onboarding_operacional` via migration.
3. Criar endpoint `GET /home-operacional/onboarding`.
4. Criar endpoint `PATCH /home-operacional/onboarding/:stepId`.
5. Criar endpoint `POST /home-operacional/onboarding/aplicar-configuracao-recomendada`.
6. Criar componente `OnboardingChecklist`.
7. Criar componente `AplicarConfiguracaoRecomendada`.
8. Criar componente `SystemStateBanner` (substituindo/ampliando `TrialBanner`).
9. Exibir progresso na Home.
10. Adicionar links diretos para Clientes, Insumos, Máquinas, Configurações e Orçamentos V2.

Critérios de aceite:

- Loja sem dados vê checklist de implantação.
- Etapas concluídas aparecem automaticamente quando existem dados (verificação por query, não por marcação manual).
- Usuário consegue pular uma etapa.
- O botão "Aplicar configuração recomendada" funciona com confirmação prévia e marca passos como concluídos.
- Botões levam para as telas corretas.
- Banner aparece apenas quando há mensagem real de estado.

### Fase 2: cálculo rápido em Orçamentos V2

> **[CONCLUÍDA em 2026-05-25]** — Sub-fases 2.A a 2.F integradas. Backend (`5417de4`): geometria avançada em `ProdutoOrcamento`, `velocidade_ml_h` em `maquina`, módulo `estimativa-tempo`. Frontend standalone (`169d909`): `QuickGeometryInput`, `SimuladorPrecificacao`, página `/orcamentos-v2/simulador`. Sub-fase 2.F integrada no formulário grande de orçamento V2: geometria rápida no `ProdutoSection`, unidade de geometria separada (`unidade_geometria`, persistida via migration `20260524160000_add_unidade_geometria`), cálculo de material por área/perímetro no `MaterialSection`, botão "Estimar tempo" explícito no `MaquinaSection` e `SimuladorPrecificacao` como modal acionado por botão "Simular preço".
>
> **Diferenças entre o plano original e o implementado:**
> - O plano sugeria `minutos_por_metro_corte` no cadastro de máquina; implementei como `velocidade_ml_h` (m/h) para manter consistência com o `velocidade_m2_h` que já existia. O motor calcula da mesma forma.
> - Entregáveis 2 (`onPaste` de imagem), 3 (upload de imagem) e 4 (preview de imagem) ficaram para a Fase 7 (DXF real / anexos). Geometria atual é só `MANUAL`.
> - Entregáveis 7 (persistir imagem), 11 (aplicar regras no dropdown automaticamente) também na Fase 7 / Sub-fase 2.F.
> - Decisão tardia (2026-05-24): `unidade_geometria` é campo **separado** de `unidade_medida_produto`, persistido no banco como `VARCHAR(4)` nullable. Registros antigos ficam NULL e o frontend interpreta como `mm` (default histórico do projeto), exibindo aviso discreto. Sem backfill no banco.

Objetivo: trazer para o orçamento a dinâmica de imagem/manual que funcionou no HTML, ampliada com tempo de máquina e compatibilidade automáticos.

Entregáveis:

1. Criar componente `QuickGeometryInput` (geometria rápida).
2. Aceitar imagem colada via clipboard (`onPaste`).
3. Aceitar upload de imagem.
4. Exibir preview da imagem.
5. Campos de largura/altura com **unidade configurável** (`mm`, `cm`, `m`) e conversão automática.
6. Calcular área e perímetro automaticamente.
7. Persistir imagem (conforme decisão da Fase 0) e referência técnica.
8. Atualizar preview de custos com área e perímetro.
9. Adicionar campos `minutos_por_metro_corte` e `minutos_por_m2` no cadastro de máquina.
10. Implementar estimativa automática de tempo de máquina a partir da geometria, com edição manual permitida.
11. Aplicar regras existentes de **compatibilidade material × máquina** ao escolher material no fluxo rápido.
12. Criar componente `SimuladorPrecificacao` reutilizável (modal + atalho na Home).

Critérios de aceite:

- Usuário cola um print e vê preview.
- Usuário informa medidas reais com unidade.
- Sistema calcula área e perímetro.
- Orçamento usa os dados calculados sem depender de pixels da imagem.
- Tempo de máquina é sugerido automaticamente quando há `perimetro` ou `area` e campos da máquina preenchidos; senão, preenchimento manual.
- Máquinas incompatíveis com o material ficam bloqueadas ou alertadas no dropdown.
- Simulador de precificação roda independente do motor V2 e exibe `preço sugerido` e `markup`.

### Fase 3: correção OS gerada por orçamento

> **[CONCLUÍDA em 2026-05-25]** — Backend já cria `ItemOS` por produto do orçamento aprovado, com largura/altura/área/perímetro/unidade/origem da geometria e referência do anexo (migration `20260525120000_add_geometria_item_os`). `insumos_calculados` foi padronizado para gravar/ler JSON consistente. Validado via script ponta a ponta (orçamento real com 2 produtos gerou OS-2026-006 com 2 `ItemOS`).
>
> **Decisão de produto (2026-05-25):** a ação interna **Aprovar orçamento e gerar OS** **não é** um endpoint separado; ela reaproveita o `fecharPedidoInterno` existente. O que mudou:
> - Labels da UI passaram de "Fechar pedido" para "Aprovar e gerar OS".
> - Evento de auditoria interno renomeado de `PEDIDO_FECHADO_INTERNAMENTE` para `APROVADO_INTERNAMENTE_E_OS_GERADA`.
> - O fluxo passa a disparar as mesmas notificações que a aprovação via link público (`notificarAcaoCliente('APROVAR')`).
>
> Bugs de fechamento de pedido (que apareciam como 500 opaco) foram corrigidos: `data_prazo` (texto livre virou DateTime) em `021ec1d`, `prioridade` fora do enum em `1e7e422`, e proxy `/api/os` com URL relativa em `44433ce`.

Objetivo: garantir que Orçamentos V2, OS e PCP trabalhem com o mesmo dado técnico.

Entregáveis:

1. Corrigir serialização/desserialização de `insumos_calculados` (gravar como JSON e fazer `JSON.parse` defensivo em todos os consumidores). **[Feito]**
2. Criar `ItemOS` por produto do orçamento aprovado. **[Feito]**
3. Levar anexos e geometria para OS. **[Feito]** (largura, altura, area, perimetro, unidade_medida, unidade_geometria, geometria_origem, arquivo_geometria_url, arquivo_geometria_metadados).
4. Garantir que PCP leia itens e materiais corretamente. **[Concluído em 2026-05-25:** `impressao-os.service.ts` migrado para ler de `os.itens` (produtos e insumos). Máquinas e serviços manuais continuam vindo do orçamento como dívida técnica documentada (`ItemOS` ainda não persiste esses domínios) — não bloqueia Fase 4. Detalhes na seção 4.6 do HANDOFF.**]**
5. Criar ação interna **Aprovar orçamento e gerar OS** (atalho para usuário interno). **[Feito como renomeação + notificação alinhada à aprovação pública, conforme decisão de 2026-05-25.]**

Critérios de aceite:

- Orçamento aprovado gera OS completa. **[OK]**
- OS possui itens. **[OK]**
- Materiais aparecem para revisão técnica. **[OK]**
- PCP consegue operar por item. **[OK na impressão; validação completa ao exercitar Fase 4.]**
- Aprovação interna direta funciona com auditoria de quem/quando e dispara os mesmos eventos da aprovação via link público. **[OK]**

### Fase 4: fluxo operacional resumido na Home

> **[CONCLUÍDA em 2026-05-25]** — endpoint `GET /home-operacional/fluxo` em produção, `HomeCacheService` com TTL 60s e método `invalidar(lojaId)` exportado para os módulos downstream, e os componentes `FluxoTrabalho` + `CardTrabalho` integrados em `frontend/src/app/(main)/dashboard/page.tsx`. As 5 colunas dependentes apenas de Orçamentos V2 / OS estão ativas; `a_receber` e `concluidos` retornam `status: 'aguardando_modulo'` (decisão de UX de 2026-05-25). Validação em runtime: 26 ms para a primeira chamada, 0 ms na segunda (cache hit), invalidar + recomputar funcionando.

Objetivo: permitir que a empresa pequena acompanhe o trabalho sem entrar primeiro em cada módulo.

Entregáveis:

1. Criar endpoint `GET /home-operacional/fluxo` com agregações no banco. **[OK]**
2. Implementar cache de 60s por `loja_id` com invalidação por evento. **[OK — TTL 60s implementado em `HomeCacheService`. Invalidação por evento ainda não conectada; o método público está pronto para os outros módulos chamarem quando uma mudança de estado for detectada. Por enquanto vale a expiração natural por TTL + `?refresh=1` manual.]**
3. Agregar Orçamentos V2, OS e PCP em colunas operacionais conforme mapeamento da seção "Bloco 2". **[OK para as 5 colunas funcionais. `a_receber` e `concluidos` ficam em `aguardando_modulo` até Fase 6.]**
4. Criar componente `FluxoTrabalho`. **[OK]**
5. Criar componente `CardTrabalho` com ações rápidas por estágio. **[OK]**
6. Permitir clique no card para abrir orçamento, OS ou PCP. **[OK]**

Critérios de aceite:

- Cards reais aparecem nas colunas corretas. **[OK em validação ponta a ponta com dados reais.]**
- Clique no card abre o detalhe certo. **[OK]**
- Ações rápidas funcionam sem sair do dashboard quando possível. **[OK — ações `endpoint` chamam direto via `apiRequest` e fazem `recarregar({ forcar: true })`.]**
- Não há drag and drop entre colunas. **[OK por design.]**
- O endpoint responde em tempo aceitável mesmo em lojas com muitos registros. **[A medir em lojas reais; cache de 60s atenua picos.]**

### Fase 5: alertas operacionais [CONCLUÍDA]

Objetivo: mostrar pendências e evitar que o usuário precise procurar problemas.

Entregáveis:

1. Criar endpoint `GET /home-operacional/alertas` retornando alertas classificados por `nivel`. **[CONCLUÍDO]**
2. Implementar alertas iniciais (lista da seção "Bloco 3"). **[6 de 7 alertas implementados; o 7º (`trabalho_pronto_sem_recebimento`) depende da Fase 6]**
3. Criar componente `AlertasOperacionais` com hierarquia visual por nível. **[CONCLUÍDO]**

Critérios de aceite:

- Alertas aparecem com dados reais. **[OK — 6 detectores agregados]**
- Cada alerta tem ação clara. **[OK — sempre um link "Abrir <recurso>" no card]**
- Alertas sem dados não ocupam espaço inútil. **[Divergência aprovada: o bloco permanece visível com mensagem "Tudo em ordem" em vez de sumir, para o usuário saber que o sistema está monitorando]**
- Alertas críticos vêm primeiro e têm tratamento visual diferenciado. **[OK — ordenação e temas distintos por nível]**

Detalhes operacionais em `docs/HANDOFF-AGENTE-CONTINUACAO.md` seção 4.9.

### Fase 6: financeiro mínimo

Objetivo: dar visão de caixa sem depender ainda de um financeiro completo, e fechar o ciclo de eventos automáticos pelo avanço do trabalho.

Entregáveis:

1. Estruturar condição de pagamento no orçamento (campos: `condicao_pagamento_tipo`, `percentual_entrada`, `valor_entrada`, `valor_saldo`, `vencimento_entrada`, `vencimento_saldo`, `status_recebimento`). **[OK — 6.A]**
2. Gerar previsão de recebimento na aprovação. **[OK — 6.B (criação automática via `CobrancasService.criarCobrancaParaOrcamento`)]**
3. Exibir entrada e saldo no orçamento, OS e Home. **[Parcial — Home tem `ResumoFinanceiroSimples`; valores no orçamento/OS ainda usam exibição existente.]**
4. Criar bloco `ResumoFinanceiroSimples` (apenas para perfis com permissão financeira). **[OK — 6.C]**
5. Implementar eventos financeiros automáticos descritos na seção "Eventos financeiros automáticos pelo avanço do trabalho". **[Pendente — 6.E]**
6. Criar tela de **Auditoria de Recebimentos** com as colunas e ações descritas na seção correspondente. **[OK — 6.D (`/financeiro/recebimentos` com filtros, ações e export CSV)]**
7. Registrar auditoria de toda transição financeira. **[OK — logs `CobrancaLog` cobrindo criação, recebimento, forçado, cancelamento e vencimento]**

Critérios de aceite:

- Usuário entende quanto está orçado, aprovado e pendente.
- Trabalho pronto com saldo aberto aparece na Home como atenção necessária.
- A tela de auditoria permite acompanhar a cobrança caso a caso.
- Eventos automáticos nunca movimentam caixa sem confirmação manual.
- O bloco financeiro da Home não aparece para perfis sem permissão.

### Fase 7: DXF real

Objetivo: evoluir do anexo técnico para leitura real de arquivos DXF.

Entregáveis:

1. Aceitar DXF como anexo técnico no orçamento e na OS.
2. Exibir dados informados manualmente para confirmação.
3. Estudar e escolher parser backend para área, perímetro e camadas.
4. Criar tela de revisão antes de aplicar valores no preço.

Critérios de aceite:

- DXF pode ser anexado ao orçamento e à OS.
- Usuário confirma medidas antes de precificar.
- Parser real não aplica valores sem revisão.

### Fase 8: ajustes mobile e navegação global

Objetivo: corrigir problemas de navegação em mobile, eliminar o gatilho `hover` da sidebar desktop e padronizar visualização de CRUDs.

Entregáveis:

1. Ajustar sidebar para iniciar fechada no mobile.
2. Fechar sidebar ao clicar em rota no mobile.
3. Fechar sidebar ao tocar fora no mobile.
4. Substituir gatilho `hover` da `DesktopSidebar` por **clique explícito** (botão fixar/desfixar).
5. Adicionar `Tooltip` por item no estado colapsado da sidebar desktop.
6. Persistir preferência aberto/colapsado em `localStorage` por usuário.
7. Substituir `<a href>` por `Link` do `next/link` em toda a navegação interna da sidebar.
8. Definir utilitário ou hook para detectar viewport mobile (já existe `use-media-query`, reutilizar).
9. Padronizar cards como visualização inicial dos CRUDs em mobile.
10. Manter tabela como padrão desktop quando fizer sentido.
11. Criar padrão reutilizável para alternância cards/tabela, com persistência de preferência por módulo.

Critérios de aceite:

- Menu lateral não tampa a tela no mobile.
- Sidebar desktop não abre por engano ao passar o mouse perto.
- Navegação interna não dispara full page reload.
- CRUDs principais abrem em cards no mobile.
- Usuário consegue alternar visualização quando a tela permitir.
- Layout mobile não exige rolagem horizontal para operar listagens.

### Fase 9: polimento de navegação e estados vazios

Objetivo: transformar a Home em experiência de produto, não apenas tela técnica.

Entregáveis:

- Estados vazios orientativos nos módulos principais.
- Microcopy curta nos passos de onboarding.
- Ações rápidas nos cards.
- Responsividade mobile.
- Loading states e erros recuperáveis.

Critérios de aceite:

- Novo usuário entende o próximo passo sem treinamento.
- Usuário recorrente vê pendências e fluxo operacional no primeiro carregamento.
- A tela funciona bem em desktop e mobile.

### Fase 10: roadmap de evolução (não bloqueante)

Itens que não entram nas primeiras fases mas devem ficar registrados como evolução natural, para o cliente entender que o sistema **vai além** do V12 dele e não fica abaixo.

- **Ponto de Equilíbrio (Break-Even)** com barra de progresso visual (faturamento real x faturamento mínimo necessário para cobrir custos fixos).
- **Monitoramento de gargalos** com indicador visual de filas longas em determinados setores produtivos.
- **Lançamento de despesas FIXO vs VARIÁVEL** no fluxo de caixa, conectado ao cálculo de resultado.
- **Provisão de impostos** com alíquota configurável e visualização separada do caixa real.
- **Livro de caixa** completo com lançamento avulso e exportação.
- **Calibração por escala em imagens** para extração assistida de medidas.
- **Parser DXF real** com camadas e alertas de geometria.
- **Onboarding por usuário** (além do onboarding por loja).
- **Notificações push e e-mail** para alertas críticos da Home.

## Modo de trabalho do agente

O gabarito do PDF deve ser usado como disciplina operacional do agente que executar esse plano.

### Regras de execução

1. Antes de implementar, declarar o critério de sucesso da fase.
2. Quando houver ambiguidade de produto, perguntar antes de codar.
3. Quando a demanda for recorrente, criar componente, hook, contrato ou checklist reutilizável.
4. Discordar de implementações que pareçam simples agora, mas que criem acoplamento ruim entre módulos.
5. Separar princípio de aplicação: primeiro definir a regra da Home, depois aplicar em Orçamentos V2, OS, PCP ou Estoque.
6. Verificar cada entrega contra critérios de aceite antes de finalizar.
7. Sinalizar incerteza quando o dado depender de módulo ainda incompleto, especialmente financeiro.
8. Evitar textos longos na interface; documentação fica nos arquivos Markdown, interface fica acionável.
9. Manter todos os arquivos novos em UTF-8 com acentuação correta em pt-BR.
10. Não encerrar uma fase sem informar o que foi implementado, o que foi testado e o que ficou pendente.
11. Não implementar drag and drop no bloco de fluxo da Home (regra explícita do produto).
12. Não exibir blocos sensíveis (financeiro, auditoria) para perfis sem permissão.

### Prompt base para o agente

```text
Você é o agente responsável pela Home operacional e pela evolução do fluxo operacional do Comunikapp.

Objetivo: transformar o dashboard atual em uma central de orientação e operação para pequenas empresas, preservando a arquitetura modular existente, e aplicar as melhorias de fluxo identificadas no HTML do cliente.

Antes de implementar qualquer fase, declare o critério de sucesso. Em seguida, leia os arquivos atuais relacionados a dashboard, Orçamentos V2, OS, PCP, Estoque, autenticação e configurações da loja. Não assuma nomes de campos ou endpoints sem verificar o código.

Trabalhe por fases pequenas. Para cada fase, entregue backend, frontend, critérios de aceite e verificação. Se uma decisão afetar arquitetura, status de negócio, financeiro, persistência, DXF ou movimentação de estoque, pare e registre a decisão antes de codar.

Mantenha todos os arquivos novos em UTF-8. Textos visíveis ao usuário e documentação devem usar português brasileiro com acentuação correta. Ao alterar textos existentes, corrija caracteres quebrados apenas nos trechos tocados, sem refatoração ampla fora do escopo.

Priorize uma experiência simples para empresa pequena: próximo passo claro, links diretos, pendências visíveis, fluxo de trabalho unificado e cálculo rápido de orçamento. Não remova a robustez dos módulos existentes.

Respeite os princípios do produto: dashboard de cards como camada de unidade, hierarquia de alertas, fluxo da Home como visualização + atalho, permissão visível, configuração recomendada e sempre por loja.
```

## Dependências importantes

Antes de executar as fases mais avançadas, alguns pontos precisam ser resolvidos. Todos estes pontos passaram a ser **entregáveis obrigatórios da Fase 0**:

- Corrigir a geração de OS a partir de Orçamentos V2 para preservar materiais e itens (validar contrato JSON).
- Definir status comerciais oficiais de Orçamentos V2.
- Definir status operacionais oficiais da OS.
- Definir status de cobrança no financeiro mínimo.
- Decidir se o financeiro mínimo será criado antes ou depois do resumo financeiro da Home (recomendação: criar a estrutura na Fase 6, exibir resumo simples já na Fase 4 com dados existentes).
- Definir se onboarding operacional será por loja ou por usuário (recomendação inicial: por loja).
- Definir onde anexos de imagem e DXF serão persistidos (recomendação inicial: storage externo + referência em `ProdutoOrcamento`).
- Definir como área e perímetro serão armazenados nos produtos do orçamento.
- Definir regras de conversão m² → chapa → sobra e campos obrigatórios em `Insumo` do tipo chapa.
- Definir a lista de blocos da Home sensíveis a perfil/permissão.
- Definir os valores defaults da configuração recomendada (margem, imposto, condição de pagamento, processos básicos).
- Definir o catálogo inicial de mensagens do `SystemStateBanner`.

## Ordem recomendada

1. Fase 0: decisões, contratos, status, encoding.
2. Fase 1: onboarding operacional mínimo + banner de estado + configuração recomendada.
3. Fase 2: cálculo rápido em Orçamentos V2 (geometria, unidades, tempo de máquina, compatibilidade, simulador).
4. Fase 3: correção OS gerada por orçamento + aprovação interna direta.
5. Fase 4: fluxo operacional resumido na Home (cards + cache + permissão).
6. Fase 5: alertas operacionais com hierarquia.
7. Fase 6: financeiro mínimo + eventos automáticos + tela de auditoria de recebimentos.
8. Fase 7: DXF real.
9. Fase 8: ajustes mobile, sidebar desktop (sem hover), padronização `next/link` e CRUDs em cards.
10. Fase 9: polimento de experiência.
11. Fase 10: roadmap (ponto de equilíbrio, gargalos, despesas FIXO/VARIÁVEL, provisão de impostos, livro de caixa, calibração por escala, DXF avançado, onboarding por usuário, notificações).

Essa ordem entrega valor cedo sem depender de todo o financeiro ou de um PCP perfeito. A Home com onboarding já reduz a perda de orientação do usuário, enquanto as fases seguintes melhoram o fluxo operacional inspirado no HTML do cliente.
