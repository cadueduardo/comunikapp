Visão geral executiva
O módulo de OS entrega o CRUD básico e um workflow cadastrado em JSON, mas ainda não está pronto para suportar a rastreabilidade ponta a ponta (ORC → OS → PCP) exigida pelas premissas de comunicação visual. Os principais gaps concentram-se na numeração padronizada, nas validações pré-produção, na ausência de vínculo real com workflows configuráveis e na falta de automação entre o orçamento aprovado e a criação da OS.

Diagnóstico detalhado do módulo de OS
Numeração e rastreabilidade
A numeração atual gera apenas um inteiro com padding (000001), sem obedecer ao padrão OS-AAAA-NNN previsto para rastreabilidade e sem reutilizar o serviço corporativo de códigos. Isso impede a amarração com notas fiscais e relatórios multi-documento.

O DocumentCodeService já encapsula a lógica de sequência anual multi-tenant, mas hoje atende apenas a orçamentos (tipo ORC). A própria tabela document_sequences aceita tipos genéricos ('ORC', 'OS', 'NF'), reforçando que a extensão é viável sem remodelagem.

Validações e integridade de dados
validarDadosOS permanece vazio, sem checar se o cliente pertence à loja, se o orçamento está aprovado ou se os materiais calculados existem/estão reservados, contrariando os critérios de bloqueio por falta de insumos e checklist obrigatório antes da produção.

A plataforma já possui ValidacaoEstoqueService, capaz de cruzar orçamento, insumos e disponibilidade. Reutilizá-lo na criação de OS permitiria transformar alertas em bloqueios e gerar reservas automáticas para PCP.

O formulário do frontend exige que operadores insiram IDs “na unha” (cliente_id, responsavel_id), elevando o risco de inconsistência e bypass de regras de negócio; a API também não enriquece a resposta com nomes de cliente/responsável.

Integração Orçamento → OS
O fluxo de aprovação atual apenas altera o status do orçamento para aprovado e notifica a loja; nenhuma OS é criada automaticamente apesar do helper criarOSDeOrcamento existir e mapear os campos corretos.

Sem essa automação, perdem-se dados calculados (parametrizações, custos, insumos) e obriga-se o backoffice a redigitar informações críticas.

Workflow e prontidão para PCP
O schema de OrdemServico não possui workflow_id, instâncias de etapa ou indicador da etapa corrente; logo, a OS não sabe qual workflow usar, nem consegue aplicar regras de dependência, paralelismo ou checklists específicos exigidos pelo PCP.

O WorkflowService armazena workflows em JSON por loja, mas não há qualquer vínculo com as OS nem validação real nas transições além de uma matriz fixa de status no serviço de OS.

O roadmap de PCP demanda workflows configuráveis, dependências, apontamentos e bloqueio por materiais, o que só será possível após persistir instâncias das etapas, checklists e responsáveis em nível de OS.

Auditoria e movimentações
O método adicionarMovimentacao recebe o tipo da movimentação, mas não grava essa informação porque o modelo MovimentacaoOS não possui a coluna; isso inviabiliza relatórios “quem fez o quê” e notificações condicionais (ex.: escalonar problemas).

A ausência de dados como workflow_id, etapa_atual e tipo_movimentacao também impede cumprir os critérios de auditoria listados nas premissas do PCP.

API e UX
O endpoint de listagem aceita cliente_id, mas repassa o parâmetro como responsavel para o service, de modo que o filtro por cliente nunca é aplicado. A interface continua vazia até que se ajuste o contrato.

No frontend, como não há enriquecimento de dados e validação prévia, o operador não consegue visualizar disponibilidade de materiais nem workflow vinculado, contrariando a experiência descrita para comunicação visual (componentes padrão, checklists, etc.).

Backlog recomendado para evolução do módulo de OS
Prioridade	Entrega	Descrição resumida
Imediato (bloqueadores de rastreabilidade)	Numeração padronizada	Estender DocumentCodeService para tipos OS/NF e substituir gerarNumeroOS por chamadas ao serviço, atualizando seeds/tests e exibindo OS-AAAA-NNN no frontend.
Validações de criação	Implementar validarDadosOS reutilizando ValidacaoEstoqueService, verificando status do orçamento e pertencimento do cliente/responsável, devolvendo alertas de estoque ao frontend.
Integração com aprovação	Ao aprovar orçamentos, invocar criarOSDeOrcamento (ou publicar evento) para gerar a OS já com insumos, workflow padrão e número definitivo, mantendo logs e notificações consistentes.
Curto prazo (preparação PCP)	Modelo de workflow na OS	Adicionar workflow_id, etapa_atual, dados_workflow e instâncias de checklist no Prisma; criar service para instanciar workflows na criação da OS; ajustar avancarEtapa para consultar WorkflowService.
Movimentações auditáveis	Incluir coluna tipo em MovimentacaoOS, registrar IP/user-agent, e expor histórico completo na API para atender aos critérios de auditoria do PCP.
Correções de API/UI	Ajustar filtro por cliente, enriquecer respostas com nomes e disponibilidade, substituir inputs de ID por selects com busca e badges de estoque/workflow no frontend.
Médio prazo (automação operacional)	Reservas e notificações	Integrar com estoque para reserva/baixa automática conforme etapas e gerar notificações parametrizáveis por etapa/responsável, conforme premissas do mercado.
APIs de reporting	Criar endpoints para rastrear ORC→OS, dashboards de SLA, exportações e futuras integrações com NF, seguindo a estratégia de numeração centralizada.
Roadmap proposto para o módulo de PCP
Pré-requisitos (depender do OS)
OS criada automaticamente após aprovação, com workflow vinculado e checklist instanciado.

Estrutura de dados contendo workflow_id, etapa atual, apontamentos e materiais reservados.

Logs de movimentação com tipo e metadados para auditoria.

Fase 1 – Fundamentos de workflow (MVP PCP)
Modelagem: criar tabelas workflow_instancias, etapa_instancia, checklist_instancia, apontamento e relacioná-las às OS.

API: endpoints para consultar workflow ativo, etapas pendentes, checklist, dependências e alterar responsável/prazo.

UI: painel Kanban simples (fila→produção→acabamento) com badges de atraso e materiais, seguindo o design system comum.

Permissões: validar por função/setor quem pode iniciar, pausar ou concluir cada etapa.

Fase 2 – Execução e apontamentos operacionais
Apontamento: permitir início/pausa/conclusão/refugo via desktop/mobile, exigindo checklist obrigatório antes do encerramento da etapa.

Integração estoque/compras: reservar materiais ao iniciar etapa crítica, baixar consumo na conclusão e emitir alertas de falta/compra automática.

Comunicação: disparar notificações configuráveis por etapa, atraso ou conclusão, com escalonamento para gestores.

Fase 3 – Paralelismo, otimização e analytics
Dependências e etapas paralelas: implementar grafo de dependências, validações de deadlock e visualização Gantt com múltiplas trilhas paralelas.

Analytics: relatórios de lead time, eficiência por etapa, consumo real vs planejado, integrando logs de movimentação com dados de estoque e custos.

Marketplace/escala: empacotar módulo PCP como add-on isolável (migrando configs para marketplace interno e respeitando multi-tenant).

Governança e QA transversal
Documentar endpoints via OpenAPI, garantir cobertura de testes ≥80% em services/controllers alterados e monitorar tempos de consulta em dashboards, conforme premissas gerais.

Riscos e considerações
Dados legados: a adoção do padrão OS-AAAA-NNN requer script de migração das OS já criadas, aproveitando document_sequences para evitar colisões.

Encadeamento eventos: integrar aprovação→OS→PCP preferencialmente via eventos de domínio ou filas para evitar acoplamento direto entre módulos.

Experiência do operador: sem autocomplete/listas oficiais, o time de produção continuará copiando IDs, reduzindo confiabilidade; priorize UX junto ao backend.