# RP — Melhorias de Aproveitamento de Máquina, Chapa e Capacidade Produtiva no Comunikapp

## Contexto

O Comunikapp já possui estrutura funcional de Orçamento, OS, Máquinas, Insumos, Setores Produtivos, PCP Progressivo, Apontamentos, Estoque, Sobras e Aproveitamentos.

A melhoria deve evoluir o sistema para tratar:

1. Ocupação/capacidade de máquina no PCP.
2. Carga produtiva por setor.
3. Simulação de chapa no orçamento e OS, mesmo sem estoque.
4. Registro opcional de sobras/retalhos.
5. Controle completo de sobras quando a empresa utilizar estoque.
6. Produto/template como receita produtiva reutilizável.

A solução deve respeitar empresas pequenas que não usam estoque formal, sem impedir empresas maiores de usar controle completo.

## Regras obrigatórias

* Todo código, arquivos, migrations, seeds, textos, labels e documentação devem estar em **UTF-8**, preservando corretamente todas as acentuações em português.
* Segurança é prioridade absoluta.
* Toda query deve respeitar `loja_id` / `lojaId`.
* Nenhuma leitura ou escrita pode confiar em `lojaId`, `usuarioId`, `operadorId`, `setorId`, `maquinaId`, `estoqueId`, `insumoId`, `orcamentoId` ou `osId` vindo do frontend sem validação no backend.
* Validar permissões por perfil antes de qualquer operação crítica.
* Aplicar whitelist/enums para status, métodos de cálculo, ações e tipos.
* Não expor dados entre lojas.
* Não quebrar o fluxo atual de orçamento, OS e PCP.
* Não remover campos existentes sem migração segura.
* Evitar dados mockados em telas operacionais.
* Criar testes backend para regras críticas.

---

# 1. Conceito de produto

Separar claramente dois conceitos:

## 1.1 Ocupação de máquina

Pertence ao PCP.

Responde:

* Quantas horas a máquina tem disponíveis?
* Quantas horas já estão programadas?
* Quanto ainda está livre?
* Existe sobrecarga?
* Qual máquina está causando gargalo no setor?

Nome de tela/UX preferencial:

* **Ocupação da máquina**
* **Carga produtiva**
* **Capacidade disponível**

Evitar usar “aproveitamento de máquina” como termo principal.

## 1.2 Aproveitamento de chapa/material

Pertence ao orçamento, OS e estoque.

Responde:

* A peça cabe na chapa?
* Quantas chapas são necessárias?
* Qual área será usada?
* Qual sobra estimada?
* Quanto cobrar?
* Deseja ignorar, anotar ou registrar a sobra?

Nome de tela/UX preferencial:

* **Cálculo da chapa**
* **Simulação de chapa**
* **Sobra estimada**
* **Retalho aproveitável**

---

# 2. Níveis de uso para chapa/material

A funcionalidade deve operar em três níveis.

## 2.1 Modo simples — sem estoque

Obrigatório.

A empresa não controla estoque, mas quer calcular chapa.

O sistema deve permitir no orçamento:

* informar material;
* informar formato comercial;
* informar largura/altura da chapa;
* informar largura/altura da peça;
* informar quantidade;
* calcular aproveitamento;
* sugerir cobrança.

Não deve exigir estoque, lote, localização ou baixa.

## 2.2 Modo intermediário — anotação de sobra

Opcional.

Ao finalizar ou revisar a OS, o usuário pode escolher:

* ignorar sobra;
* anotar sobra na OS;
* registrar como retalho.

A anotação não precisa movimentar estoque.

## 2.3 Modo completo — estoque de sobras

Opcional.

Para empresas que usam estoque formal:

* reservar material;
* baixar consumo;
* gerar sobra;
* registrar em `estoque_sobras`;
* registrar aproveitamento em `estoque_aproveitamentos`;
* calcular economia gerada.

---

# 3. Melhorias no cadastro de insumos

Adicionar/validar bloco visual:

## Formato de compra e cálculo

Campos sugeridos:

* `formato_material`: `CHAPA | ROLO | BARRA | UNIDADE | METRO_LINEAR | LIQUIDO | PESO | SERVICO`
* `largura_comercial`
* `altura_comercial`
* `comprimento_comercial`
* `unidade_dimensao`
* `area_comercial`
* `perda_padrao_percent`
* `permite_simulacao_chapa`
* `controla_estoque`
* `permite_registrar_sobra`
* `retalho_min_largura`
* `retalho_min_altura`
* `retalho_min_area`
* `metodo_cobranca_padrao`:
  `AREA_LIQUIDA | AREA_COM_PERDA | CHAPA_INTEIRA | MANUAL`

Regras:

* Não obrigar estoque para permitir simulação de chapa.
* Se `formato_material = CHAPA`, largura e altura comercial devem ser usadas no cálculo.
* Se `controla_estoque = false`, o sistema ainda deve calcular aproveitamento no orçamento.
* Se `permite_registrar_sobra = true`, permitir geração de sobra na OS.

UX:

Criar bloco simples:

**Formato do material**

* Tipo do material
* Medida comercial
* Perda padrão
* Como cobrar no orçamento
* Permitir cálculo de chapa?
* Controlar estoque?

---

# 4. Melhorias no cadastro de máquinas

Adicionar/validar bloco:

## Planejamento / PCP

Campos sugeridos:

* `usar_no_pcp`: boolean
* `horas_disponiveis_dia`: decimal
* `dias_produtivos`: json ou configuração simples
* `permite_agendamento_simultaneo`: boolean
* `tempo_minimo_entre_servicos_min`: integer
* `considerar_eficiencia_na_capacidade`: boolean

Regras:

* Manter campos atuais de custo/hora, velocidade, eficiência e setup para orçamento.
* Usar novos campos para PCP/capacidade.
* Se `horas_disponiveis_dia` estiver vazio, usar fallback do setor ou padrão de 8h.
* Capacidade efetiva pode ser:
  `horas_disponiveis_dia * eficiencia_percent / 100`

UX:

Separar tela em blocos:

1. Identificação
2. Cálculo de orçamento
3. Planejamento / PCP
4. Observações

---

# 5. Melhorias no orçamento

Adicionar bloco por item/material:

## Cálculo da chapa

Entrada:

* material/insumo;
* formato comercial;
* largura da chapa;
* altura da chapa;
* largura da peça;
* altura da peça;
* quantidade;
* perda padrão;
* método de cobrança.

Saída calculada:

* peça cabe na chapa: sim/não;
* área da chapa;
* área líquida das peças;
* área com perda;
* quantidade de chapas necessárias;
* área considerada para custo;
* sobra estimada;
* percentual de aproveitamento;
* percentual de sobra;
* custo do material;
* sugestão de cobrança.

Métodos de cobrança:

* `AREA_LIQUIDA`: cobra apenas área usada.
* `AREA_COM_PERDA`: cobra área usada + perda padrão.
* `CHAPA_INTEIRA`: cobra uma ou mais chapas inteiras.
* `MANUAL`: usuário define área/valor.

Mensagem amigável:

* “Este serviço usa 20% da chapa. Você pode cobrar a chapa inteira ou considerar a sobra para uso futuro.”
* “A peça não cabe na chapa selecionada.”
* “Existe sobra estimada relevante.”

Regras:

* Não exigir estoque.
* Salvar no orçamento os dados congelados da simulação.
* O cálculo deve continuar funcionando mesmo se o insumo não controlar estoque.
* Preservar cálculo atual de máquina, função, serviço e margem.

---

# 6. Melhorias na OS

A OS deve congelar os dados aprovados no orçamento.

Adicionar/usar em item da OS:

* materiais previstos;
* máquinas previstas;
* horas previstas por máquina;
* setor previsto;
* cálculo de chapa previsto;
* método de cobrança usado;
* sobra estimada;
* aproveitamento previsto.

## Aba Materiais

Implementar três estados:

### 6.1 Sem estoque

Mostrar:

* material previsto;
* área considerada;
* aproveitamento previsto;
* sobra estimada;
* controle de estoque: não utilizado.

Ações:

* ignorar sobra;
* anotar sobra na OS.

### 6.2 Intermediário

Ações:

* anotar sobra;
* registrar como retalho.

### 6.3 Com estoque

Ações:

* reservar material;
* baixar material;
* registrar sobra;
* aproveitar retalho.

## Ao concluir produção

Quando houver sobra estimada, perguntar:

“O que deseja fazer com a sobra?”

Opções:

1. Ignorar sobra.
2. Anotar sobra na OS.
3. Registrar como retalho para usar depois.

Se registrar como retalho:

* criar registro em `estoque_sobras`;
* validar `loja_id`;
* validar estoque/insumo quando aplicável;
* não permitir registrar sobra em estoque de outra loja.

---

# 7. Melhorias em estoque_sobras

A tabela já existe. Evoluir sem quebrar compatibilidade.

Adicionar campos, se ainda não existirem:

* `insumo_id`
* `largura`
* `altura`
* `espessura`
* `unidade_dimensao`
* `area_disponivel`
* `area_original`
* `os_origem_id`
* `item_os_origem_id`
* `status`: manter/expandir `DISPONIVEL | PARCIALMENTE_APROVEITADA | APROVEITADA | DESCARTADA`
* `localizacao_id`, se aplicável
* `observacao_interna`

Manter `dimensoes` para exibição legada.

Regras:

* `quantidade_aproveitada` nunca pode ser maior que `quantidade`/área disponível.
* Ao aproveitar parcialmente, manter status `PARCIALMENTE_APROVEITADA`.
* Ao consumir tudo, status `APROVEITADA`.
* Ao descartar, exigir motivo.
* Todas as operações devem gerar histórico em `estoque_aproveitamentos`.

---

# 8. Melhorias em estoque_aproveitamentos

A tabela já existe e deve ser usada como histórico.

Adicionar/validar campos, se necessário:

* `os_destino_id`
* `item_os_destino_id`
* `insumo_id`
* `area_aproveitada`
* `economia_gerada`
* `usuario_id`
* `loja_id`

Regras:

* Validar que sobra pertence à mesma loja.
* Validar que destino pertence à mesma loja.
* Registrar usuário autenticado.
* Não aceitar economia negativa.
* Não permitir aproveitamento maior que disponível.

---

# 9. Melhorias no PCP Completo

A tela atual por setores deve passar a mostrar carga produtiva, não apenas quantidade de cards.

## Home PCP Completo — Produção por setores

Adicionar por setor:

* horas previstas;
* horas disponíveis;
* ocupação percentual;
* status de carga.

Exemplo:

* `Carga: 6,4h / 8h`
* `Ocupação: 80%`

Classificação:

* 0–70%: baixa/normal;
* 70–90%: atenção;
* 90–100%: cheia;
* acima de 100%: sobrecarregada.

Regras:

* Somar `tempo_estimado` dos itens pendentes/em andamento/pausados do setor.
* Respeitar filtros existentes.
* Não contar itens concluídos.
* Não contar itens cancelados/rejeitados.

## Detalhe/Supervisão do setor

Adicionar:

* carga total do setor;
* capacidade disponível;
* ocupação;
* lista de máquinas do setor;
* carga por máquina;
* itens sem máquina definida.

Card da fila deve mostrar:

* OS;
* produto;
* cliente;
* prazo;
* workflow;
* setor atual;
* máquina prevista, quando houver;
* tempo previsto;
* operador, quando houver.

Ação “Iniciar”:

* deve registrar apontamento;
* deve vincular operador autenticado ou selecionado com permissão;
* deve permitir informar máquina, se ainda não definida;
* deve validar loja, setor, item e permissão.

---

# 10. Carga por máquina

Criar endpoint agregado para PCP:

`GET /pcp/capacidade/maquinas`

Filtros:

* data;
* setor;
* máquina;
* operador;
* prioridade;
* prazo.

Retorno por máquina:

* `maquina_id`
* `nome`
* `setor`
* `horas_disponiveis`
* `horas_programadas`
* `horas_livres`
* `ocupacao_percent`
* `status_carga`
* `itens_programados`

Cálculo:

* `horas_programadas = soma dos tempos previstos vinculados à máquina`
* `horas_livres = horas_disponiveis - horas_programadas`
* `ocupacao_percent = horas_programadas / horas_disponiveis * 100`

Fallback:

* Se item não tiver máquina, agrupar como “Sem máquina definida”.
* Se máquina não tiver horas disponíveis, usar fallback do setor ou 8h.

Segurança:

* Filtrar tudo por loja autenticada.
* Validar acesso do usuário.

---

# 11. Produto / Template

O cadastro de produto não deve virar orçamento duplicado.

Tratar como:

## Modelo de Produto / Receita Produtiva

Guardar:

* descrição padrão;
* unidade comercial;
* materiais sugeridos;
* máquinas sugeridas;
* funções sugeridas;
* serviços manuais;
* fórmula de cálculo;
* workflow sugerido;
* setor inicial;
* checklist padrão;
* margem padrão opcional.

Não guardar:

* cliente;
* prazo;
* condição comercial real;
* aprovação;
* impostos específicos da venda;
* status de OS.

UX:

Renomear visualmente “Produtos” para uma das opções:

* **Modelos de Produto**
* **Templates de Produto**
* **Receitas de Produto**

Preferência: **Modelos de Produto**.

Fluxo:

`Modelo de Produto -> Orçamento -> OS -> PCP`

---

# 12. Endpoints sugeridos

## Insumos

* `GET /insumos/:id/calculo-chapa`
* `POST /insumos/:id/simular-chapa`

## Orçamento

* `POST /orcamentos/:id/itens/:itemId/simular-chapa`
* `PUT /orcamentos/:id/itens/:itemId/calculo-chapa`

## OS

* `GET /os/:id/materiais`
* `POST /os/:id/itens/:itemId/anotar-sobra`
* `POST /os/:id/itens/:itemId/registrar-sobra`
* `POST /os/:id/itens/:itemId/baixar-material`

## PCP

* `GET /pcp/capacidade/setores`
* `GET /pcp/capacidade/maquinas`
* `GET /pcp/setores/:setorId/carga`

## Estoque

* `GET /estoque/sobras`
* `POST /estoque/sobras`
* `POST /estoque/sobras/:id/aproveitar`
* `POST /estoque/sobras/:id/descartar`

---

# 13. DTOs e validações

Criar DTOs com validação forte.

Exemplo para simulação de chapa:

* `insumoId`
* `larguraPeca`
* `alturaPeca`
* `quantidade`
* `larguraChapa`
* `alturaChapa`
* `perdaPercent`
* `metodoCobranca`

Validações:

* valores numéricos positivos;
* quantidade > 0;
* largura/altura > 0;
* método permitido por enum;
* insumo pertence à loja;
* orçamento/OS pertence à loja.

---

# 14. Fórmulas mínimas

## Área da chapa

`area_chapa = largura_chapa * altura_chapa`

Normalizar unidade para m².

## Área das peças

`area_pecas = largura_peca * altura_peca * quantidade`

## Área com perda

`area_com_perda = area_pecas * (1 + perda_percent / 100)`

## Chapas necessárias

Cálculo mínimo:

`chapas_necessarias = CEIL(area_com_perda / area_chapa)`

Observação:

Nesta fase não implementar nesting geométrico avançado. O cálculo é estimativo por área, com validação simples se uma peça individual cabe na chapa.

## Aproveitamento

`aproveitamento_percent = area_pecas / (chapas_necessarias * area_chapa) * 100`

## Sobra estimada

`sobra_area = (chapas_necessarias * area_chapa) - area_pecas`

## Custo considerado

* Área líquida: `area_pecas * custo_m2`
* Área com perda: `area_com_perda * custo_m2`
* Chapa inteira: `chapas_necessarias * area_chapa * custo_m2`
* Manual: valor informado pelo usuário

---

# 15. UX obrigatória

Evitar linguagem técnica excessiva.

Usar:

* “Cálculo da chapa”
* “A peça cabe na chapa?”
* “Sobra estimada”
* “Como cobrar este material?”
* “Registrar como retalho”
* “Ocupação da máquina”
* “Carga do setor”

Evitar como termo principal:

* nesting;
* OEE;
* tablespace;
* apontamento obrigatório;
* aproveitamento de máquina.

---

# 16. Testes obrigatórios

## Backend

Testar:

* simulação de chapa sem estoque;
* simulação com chapa inteira;
* simulação com área + perda;
* peça maior que chapa;
* loja A não acessa insumo da loja B;
* loja A não registra sobra em OS da loja B;
* aproveitamento parcial de sobra;
* aproveitamento maior que disponível deve falhar;
* carga por setor soma apenas itens válidos;
* carga por máquina respeita loja e setor;
* operador sem permissão não inicia etapa de outro operador.

## Frontend mínimo

Testar utilitários de cálculo:

* área;
* chapas necessárias;
* aproveitamento;
* sobra;
* status de ocupação.

---

# 17. Critérios de aceite

A entrega será aceita quando:

1. Empresa sem estoque conseguir simular chapa no orçamento.
2. Orçamento mostrar área usada, sobra estimada, aproveitamento e método de cobrança.
3. OS carregar os dados congelados do cálculo da chapa.
4. OS permitir ignorar, anotar ou registrar sobra.
5. Empresa com estoque conseguir registrar sobra em `estoque_sobras`.
6. Aproveitamento de sobra gerar histórico em `estoque_aproveitamentos`.
7. PCP Completo mostrar carga por setor em horas.
8. Supervisão de setor mostrar tempo previsto por item.
9. PCP conseguir mostrar ocupação por máquina.
10. Todas as queries respeitarem loja autenticada.
11. Operações críticas validarem permissão.
12. Não existir dado mockado em tela operacional.
13. Textos em português aparecerem corretamente com acentuação UTF-8.
14. Build backend e frontend passarem.
15. Testes críticos passarem.

---

# 18. Ordem sugerida de implementação

## Fase 1 — Base sem estoque

* Criar utilitário de cálculo de chapa.
* Adicionar campos mínimos em insumos.
* Implementar simulação no orçamento.
* Salvar cálculo congelado.

## Fase 2 — OS e sobra simples

* Mostrar cálculo na OS.
* Permitir ignorar/anotar sobra.
* Permitir registrar sobra opcionalmente.

## Fase 3 — PCP capacidade

* Adicionar horas disponíveis em máquina.
* Criar carga por setor.
* Criar carga por máquina.
* Atualizar Home PCP Completo.
* Atualizar Supervisão de Setor.

## Fase 4 — Estoque completo

* Evoluir `estoque_sobras`.
* Evoluir `estoque_aproveitamentos`.
* Criar tela de sobras/retalhos.
* Permitir aproveitar sobra em orçamento/OS.

## Fase 5 — Refinamento

* Sugestão automática de retalhos compatíveis.
* Dashboard de economia gerada.
* Relatório de ocupação por máquina.
* Comparativo previsto x realizado.

## Fase 6 — Registro inteligente de sobras por orçamento

Executar depois da conclusão do RP principal.

* Transformar "Orçamento de origem" no primeiro passo do fluxo de nova sobra.
* Criar busca de orçamento por número, cliente e descrição.
* Ao selecionar um orçamento, carregar produtos e materiais usados.
* Mostrar materiais candidatos a sobra em linhas separadas, um por insumo/material do orçamento.
* Preencher automaticamente unidade, unidade de dimensão, dimensões comerciais, material, cor/acabamento, cálculo de chapa e sobra estimada quando essas informações já existirem.
* Permitir registrar, ignorar ou ajustar cada material individualmente.
* Manter materiais separados por padrão quando o orçamento tiver vários materiais, preservando rastreabilidade por produto/material de origem.
* Avaliar agrupamento opcional de materiais iguais apenas como refinamento posterior.

---

# 20. Status de implementação (atualizado em 2026-05-31)

Documento operacional: `backend/docs/status-rp-aproveitamento-maquina-chapa-capacidade.md`.

## RP — entrega completa (Fases 1 a 6)

| Fase | Escopo | Backend | Frontend |
|------|--------|---------|----------|
| 1 | Cálculo de chapa sem estoque | Utilitário, campos em insumos, APIs de simulação no orçamento | Card em insumos; painel por material no orçamento |
| 2 | OS e sobra simples | Endpoints materiais/sobra; congelamento orçamento → OS | Aba Materiais da OS com ignorar/anotar/registrar retalho |
| 3 | PCP capacidade | Carga por setor/máquina; máquinas no PCP | Home PCP, Meu Setor, cadastro máquina (Planejamento/PCP) |
| 4 | Estoque de sobras | Aproveitar/descartar com histórico | Lista, detalhe e ações de sobras/retalhos |
| 5 | Refinamento | Sugestões por insumo, métricas de economia, relatórios PCP | Retalhos no orçamento, dashboard sobras, `/pcp/relatorios` |
| 6 | Origem por orçamento | `origem-sobra/busca`, `candidatos-sobra` | Fluxo Nova sobra com busca de orçamento |

## Complementos do §9 (PCP)

- Cards da fila com tempo previsto e máquina prevista.
- **Iniciar/Retomar** com diálogo de máquina quando o item não tem máquina prevista (`maquinaId` no POST de início).
- Máquina vinculada em `ItemOS.parametros_tecnicos` ao iniciar.

## Pré-requisitos operacionais (uso em produção)

1. **Máquina:** cadastrar com setor correto, **Usar no PCP** ativo e horas/dia.
2. **Orçamento:** produto com máquinas e materiais; simular/gravar chapa nos materiais elegíveis.
3. **OS nova:** herda máquinas e cálculo de chapa do orçamento automaticamente.

## Fase 6 — Registro inteligente de sobras por orçamento (concluída)

- Busca de orçamento como primeiro passo em **Estoque → Nova sobra**.
- API `origem-sobra/busca` e `candidatos-sobra`.
- Um card por material do orçamento com dados pré-preenchidos; ações Registrar / Ignorar.

## Fase 5 — Refinamento (concluída)

- Retalhos compatíveis sugeridos no orçamento (`insumoId` + área mínima da peça).
- Dashboard de economia em Estoque → Sobras (disponíveis, m², economia 30 dias).
- Relatórios PCP: ocupação por máquina e previsto × realizado (`/pcp/relatorios`).

---

# 19. Observação final para o agente

Implementar de forma incremental e segura. Não tentar criar nesting avançado nesta entrega. A prioridade é funcionar bem para comunicação visual:

* cálculo simples de chapa;
* decisão clara de cobrança;
* sobra estimada;
* registro opcional de retalho;
* carga por setor;
* ocupação por máquina;
* segurança multi-tenant;
* UTF-8 correto em todo o projeto.
