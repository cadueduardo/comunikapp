# Compilado de Insights e Análise de PCP para o Comunikapp

Este documento reúne e estrutura todos os pontos importantes extraídos da análise dos vídeos sobre Planejamento e Controle de Produção (PCP), focando na aplicação prática desses conceitos para o desenvolvimento do software **Comunikapp** (voltado para o setor de Comunicação Visual).

---

## 1. O Fluxo de Trabalho na Comunicação Visual (Do Pedido à Entrega)
O sucesso do PCP no Comunikapp depende de espelhar as etapas reais e interdependentes de uma gráfica de comunicação visual:

* **Entrada de Pedidos & Orçamentos:** Onde o comercial insere as demandas.
* **Aprovação de Arte/Layout:** O coração do processo. Nenhuma produção deve começar sem o "Ok" formal do cliente no arquivo final.
* **Fase de Impressão:** Etapa altamente automatizada e dependente da capacidade do maquinário (plotters de impressão, routers CNC, máquinas de corte a laser).
* **Fase de Acabamento:** Etapa puramente manual/artesanal (solda de lona, aplicação de ilhós, refile de adesivos, montagem de estruturas).
* **Logística/Instalação:** Transporte ou fixação do material na rua/cliente.
* **Gargalos e Interdependência:** Uma trava ou atraso na fase de aprovação da arte inviabiliza o cumprimento do prazo na impressão, gerando efeito dominó. O sistema precisa recalcular as previsões de entrega dinamicamente quando uma etapa atrasa.

---

## 2. A Filosofia de Desenvolvimento do Módulo de PCP (Análises Dinâmicas)
Antes de construir telas complexas ou focar apenas em teorias conceituais de administração, o software precisa entregar valor prático baseado em três pilares:

* **Lista Base (Entrada Limpa):** Cadastros estruturados e descomplicados de ordens de serviço, insumos e recursos.
* **Cruzamento Automatizado de Dados:** O sistema deve fazer o trabalho pesado de correlacionar o consumo de materiais com as ordens de serviço em aberto de forma transparente para o usuário.
* **Painéis de Simulação (O Grande Diferencial):** O gestor não quer apenas olhar relatórios passados. O Comunikapp deve permitir **simular cenários em tempo real** (ex: *"Se eu priorizar a Ordem de Serviço X hoje, qual o impacto real no prazo de entrega dos outros 15 projetos da fila?"*).
* **Busca por Controle Visual:** O PCP é uma área viva e caótica. O aplicativo precisa oferecer ferramentas dinâmicas de controle visual (gráficos interativos, status em tempo real) para que o gestor sinta que tem o controle total sobre a operação, prevendo gargalos antes que eles causem atrasos.

---

## 3. Arquitetura de Dados e Regras de Negócio (Inspirado em Ferramentas Práticas)
Traduzindo o funcionamento de sistemas comerciais de PCP para a realidade de mídias e conversões da comunicação visual:

### A. Gestão de Estoque por Fração e Metro Quadrado ($m^2$)
* **Desafio Comum:** Gráficas compram matéria-prima em rolos grandes ou metros quadrados (lonas, vinil adesivo, chapas de ACM), mas vendem produtos finais em formatos variados (unidades, placas, fachadas, banners).
* **Regra no Comunikapp:** O sistema deve realizar a conversão automática na ficha técnica do produto. Ao cadastrar um produto "Banner 1x1m", o app armazena internamente que ele consome $1\text{ m}^2$ de lona e $4\text{ metros}$ de bastão de madeira. Ao abrir e produzir a OS, o estoque de insumos brutos sofre baixa proporcional exata automaticamente.

### B. Matriz de Carga Máquina: Capacidade Humana vs. Maquinário
* **Separação de Recursos:** O tempo de produção de uma peça de comunicação visual deve ser dividido percentualmente entre homem e máquina.
    * *Exemplo:* Produzir uma fachada pode demandar 30% do tempo em máquina (impressão/corte CNC) e 70% do tempo humano (serralheria, acabamento, fixação dos LEDs).
* **Gestão de Capacidade no App:** O Comunikapp deve calcular de forma separada a disponibilidade de horas/mês da equipe e horas/mês dos equipamentos, emitindo alertas de sobrecarga específicos (ex: *"Suas impressoras têm capacidade livre, mas sua equipe de acabamento manual atingiu 140% de ocupação para esta semana"*).

### C. Gestão e Apontamento de Perdas (Refugo)
* **Realidade do Setor:** O índice de perda em comunicação visual é alto (erros de perfil de cor, arquivos corrompidos, rasgos no acabamento, problemas na aplicação).
* **Funcionalidade no App:** No momento do encerramento ou avanço de uma etapa no chão de fábrica, o operador deve ter um seletor rápido para registrar perdas de material, categorizando o motivo: `[Erro de Arquivo / Falha da Máquina / Erro Humano]`. Isso alimentará gráficos de eficiência e ajudará a recalcular o custo real de produção.

### D. Alertas Preventivos de Insumos
* **Gatilhos de Estoque:** Definição clara de estoque mínimo para matérias-primas críticas (tinta, ilhós, mídias). O sistema deve cruzar a fila de produção planejada com o estoque físico atual, alertando proativamente: *"Atenção: o vinil adesivo em estoque não é suficiente para cobrir as ordens de serviço agendadas para os próximos 3 dias"*.

### E. Ordem de Produção (OP) Digital e Visual
* **Eliminação do Papel:** Substituição da OP física por uma tela responsiva (para tablets ou smartphones no chão de fábrica).
* **Elementos Essenciais:** A OP digital dentro do Comunikapp deve exibir de forma destacada a **imagem/arte anexada do projeto**, permitindo que o impressor ou acabador valide visualmente o que está produzindo, além de colher a assinatura ou o "Ok" digital do operador em cada etapa concluída.