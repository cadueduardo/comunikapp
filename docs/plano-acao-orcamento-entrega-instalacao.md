# Plano de Ação - Orçamento, Entrega e Instalação

Documento codificado em UTF-8.

Este plano inicia o projeto de correção do fluxo comercial do Comunikapp para que entrega e instalação sejam tratadas desde o orçamento, alimentem corretamente o Preview de Cálculo e sejam herdadas pela OS sem recálculo comercial.

## 1. Objetivo

Estruturar entrega e instalação no orçamento de forma simples, configurável e segura, mantendo o Comunikapp adequado para pequenas e médias empresas.

O objetivo não é criar um ERP logístico completo. O objetivo é garantir que:

- entrega/frete seja cobrado e registrado no orçamento;
- instalação seja configurada por produto/serviço;
- custos, preço, margem, comissão e total final reflitam esses itens;
- o Preview de Cálculo mostre essas informações com transparência;
- a OS herde os dados necessários para execução;
- o PCP receba uma demanda mais limpa, sem precisar descobrir dados comerciais faltantes.

## 2. Premissas Confirmadas

- Entrega pertence ao orçamento.
- Instalação pertence ao produto/serviço do orçamento.
- A OS deve herdar entrega e instalação, não recalcular comercialmente.
- Entrega pode usar o endereço cadastrado do cliente por padrão.
- Entrega e instalação devem aparecer no Preview de Cálculo.
- Instalação não deve depender apenas de "Serviços Manuais", porque ela possui dados operacionais próprios.
- Os novos cadastros devem ficar em Centros de Trabalho.
- Antes de codar, deve-se verificar se já existe estrutura equivalente no sistema.
- As alterações devem ser aplicadas de forma apartada e organizada, evitando aumentar arquivos já grandes sem necessidade.

## 3. Premissas Técnicas Obrigatórias

- Codificação de arquivos: UTF-8.
- Backend: validar autenticação, autorização e escopo por `loja_id` em todos os novos endpoints.
- Não confiar em valores calculados pelo frontend. O backend deve recalcular ou validar totais relevantes.
- Preview, persistência backend e grid/listagem de orçamentos devem exibir o mesmo valor final. Qualquer campo novo que impacte preço precisa entrar nos três fluxos: cálculo em tela, payload salvo e retorno da listagem.
- Orçamentos em rascunho precisam reabrir com todos os campos novos preenchidos. Não basta aparecer no preview; os campos devem ser persistidos e reidratados no formulário de edição.
- Não aceitar IDs de outra loja em modalidade de entrega, tipo de instalação ou produto do orçamento.
- Sanitizar e limitar campos textuais: nome, descrição, observações, endereço e instruções.
- Valores monetários devem usar `Decimal` no banco e conversão segura no backend.
- Evitar `any` em novas áreas sempre que viável; quando inevitável, isolar em adaptadores.
- Não duplicar regra de cálculo em componentes grandes. Criar helpers e services dedicados.
- Manter compatibilidade com orçamentos antigos.
- Não remover campos existentes sem fase explícita de migração.

## 4. Leitura Inicial do Estado Atual

Pontos já identificados no sistema:

- O módulo Centros de Trabalho já existe com cards para Setores Produtivos, Máquinas, Funções, Serviços Manuais e Custos Indiretos.
- O orçamento já possui `prazo_entrega`, mas ele é texto livre e não representa entrega/frete comercial.
- O cliente já possui campos de endereço, incluindo CEP, endereço, número, complemento, bairro, cidade e estado.
- `ProdutoOrcamento` já existe e possui relacionamento com materiais, máquinas, funções, serviços manuais e custos indiretos.
- `servico_manual` já existe e possui categorias em JSON.
- A OS já possui campos de instalação em nível de OS: `data_instalacao_agendada` e `observacoes_instalacao`.
- Existem helpers de OS que tentam detectar instalação por categoria `instalacao` em serviços manuais.
- O Preview de Cálculo V2 já calcula produtos, materiais, máquinas, funções, serviços, custos indiretos, margem, impostos, comissão e preço final.
- O Preview e o formulário de orçamento são arquivos grandes; novas melhorias devem ser isoladas em componentes/helpers próprios.

Conclusão: não devemos criar uma solução desconectada. O plano precisa evoluir a estrutura atual, especialmente Centros de Trabalho, ProdutoOrcamento, orçamento e Preview.

## 5. Modelo Funcional Proposto

### 5.1 Entrega

Entrega é uma configuração do orçamento inteiro.

Exemplos:

- Retirada no balcão;
- Entrega própria;
- Motoboy;
- Correios;
- Transportadora;
- Entrega no endereço do cliente;
- Outro.

No orçamento, o usuário seleciona a modalidade, define endereço quando necessário e informa o valor.

Entrega deve ser tratada como linha comercial própria:

- aumenta o total do orçamento;
- pode ter custo estimado interno;
- pode ter preço cobrado do cliente;
- pode aparecer no Preview;
- deve ser herdada pela OS.

### 5.2 Instalação

Instalação é configuração do produto/serviço.

Um orçamento pode ter vários produtos e apenas alguns exigirem instalação.

Exemplo:

- Banner: sem instalação;
- Placa ACM: com instalação;
- Adesivo de vitrine: com aplicação;
- Cartão de visita: sem instalação.

Cada produto pode ter:

- instalação necessária;
- tipo de instalação;
- local de instalação;
- uso do endereço de entrega/cliente;
- preço cobrado;
- custo estimado;
- deslocamento;
- quantidade de pessoas;
- tempo estimado;
- observações operacionais.

## 6. Cadastros em Centros de Trabalho

### 6.1 Modalidades de Entrega

Novo CRUD em Centros de Trabalho.

Campos sugeridos:

- `id`;
- `loja_id`;
- `nome`;
- `descricao`;
- `ativo`;
- `exige_endereco`;
- `exige_valor`;
- `valor_padrao`;
- `custo_padrao`;
- `prazo_padrao_dias`;
- `permite_retirada`;
- `observacoes_padrao`;
- `criado_em`;
- `atualizado_em`.

Regras:

- `nome` único por loja.
- Apenas registros da loja autenticada podem ser listados, usados, editados ou excluídos.
- Exclusão deve ser bloqueada se houver orçamento usando a modalidade; preferir inativação.
- Seeds/defaults opcionais por loja: Retirada no balcão, Entrega própria, Motoboy, Transportadora, Correios, Outro.

### 6.2 Tipos de Instalação

Novo CRUD em Centros de Trabalho.

Campos sugeridos:

- `id`;
- `loja_id`;
- `nome`;
- `descricao`;
- `ativo`;
- `preco_padrao`;
- `custo_mao_obra_padrao`;
- `custo_deslocamento_padrao`;
- `tempo_estimado_min`;
- `quantidade_pessoas_padrao`;
- `exige_endereco`;
- `exige_agendamento`;
- `observacoes_padrao`;
- `criado_em`;
- `atualizado_em`.

Regras:

- `nome` único por loja.
- Apenas registros da loja autenticada podem ser usados.
- Exclusão deve ser bloqueada se houver produto de orçamento usando o tipo; preferir inativação.
- Seeds/defaults opcionais por loja: Aplicação simples, Instalação de placa, Adesivação de vitrine, Adesivação de veículo, Instalação em fachada, Instalação em altura, Instalação elétrica, Outro.

## 7. Modelagem de Orçamento

### 7.1 Campos no Orçamento

Adicionar campos estruturados de entrega no nível do orçamento.

Campos sugeridos:

- `entrega_modalidade_id`;
- `entrega_tipo`: enum/string controlada, se necessário para compatibilidade;
- `entrega_usar_endereco_cliente`;
- `entrega_endereco_snapshot`;
- `entrega_cep`;
- `entrega_logradouro`;
- `entrega_numero`;
- `entrega_complemento`;
- `entrega_bairro`;
- `entrega_cidade`;
- `entrega_estado`;
- `entrega_prazo_dias`;
- `entrega_valor_cobrado`;
- `entrega_custo_estimado`;
- `entrega_observacoes`.

Observação importante: salvar snapshot do endereço no orçamento evita que alterações futuras no cadastro do cliente mudem o histórico comercial de um orçamento já enviado/aprovado.

### 7.2 Campos no Produto do Orçamento

Adicionar estrutura de instalação no produto.

Campos sugeridos:

- `instalacao_necessaria`;
- `instalacao_tipo_id`;
- `instalacao_usar_endereco_entrega`;
- `instalacao_endereco_snapshot`;
- `instalacao_cep`;
- `instalacao_logradouro`;
- `instalacao_numero`;
- `instalacao_complemento`;
- `instalacao_bairro`;
- `instalacao_cidade`;
- `instalacao_estado`;
- `instalacao_preco_cobrado`;
- `instalacao_custo_mao_obra`;
- `instalacao_custo_deslocamento`;
- `instalacao_tempo_estimado_min`;
- `instalacao_quantidade_pessoas`;
- `instalacao_observacoes`.

### 7.3 Compatibilidade com Serviços Manuais

Não remover o uso atual de Serviços Manuais.

Regra proposta:

- Serviços Manuais continuam para acabamento, montagem, embalagem, aplicação genérica e outros processos produtivos.
- Instalação passa a ter estrutura própria.
- Serviços Manuais com categoria `instalacao` devem continuar funcionando em orçamentos antigos.
- Para novos orçamentos, a UI deve orientar o usuário a usar o bloco de instalação do produto.
- Em fase futura, criar migração assistida ou leitura compatível: se produto antigo tiver serviço manual com categoria `instalacao`, a OS pode marcar instalação como necessária até que o orçamento seja revisado.

## 8. Preview de Cálculo

O Preview precisa mostrar entrega e instalação sem virar um componente ainda maior.

### 8.1 Organização Técnica

Criar helpers apartados, por exemplo:

- `frontend/src/components/ui/shared/utils/preview-entrega.helpers.ts`;
- `frontend/src/components/ui/shared/utils/preview-instalacao.helpers.ts`;
- `frontend/src/components/ui/shared/sections/PreviewEntregaResumo.tsx`;
- `frontend/src/components/ui/shared/sections/PreviewInstalacaoResumo.tsx`.

O `PreviewCalculoV2.tsx` deve apenas compor os novos blocos e receber totais já calculados.

### 8.2 Exibição Sugerida

No resumo geral:

- Subtotal produtos;
- Instalações;
- Entrega;
- Comissão;
- Total final.

Por produto:

- preço de produção;
- instalação, quando houver;
- subtotal do produto.

Exemplo:

```text
Produto: Placa ACM
Produção: R$ 900,00
Instalação: R$ 350,00
Subtotal: R$ 1.250,00
```

No total:

```text
Subtotal dos produtos: R$ 1.250,00
Entrega própria: R$ 80,00
Total final: R$ 1.330,00
```

### 8.3 Regras de Cálculo

Entrega:

- `preco_final += entrega_valor_cobrado`;
- `custo_total += entrega_custo_estimado`;
- margem consolidada deve considerar custo estimado e preço cobrado.

Instalação:

- entra no produto correspondente;
- `preco_total_produto += instalacao_preco_cobrado`;
- `custo_total_produto += instalacao_custo_mao_obra + instalacao_custo_deslocamento`;
- margem do produto deve considerar a instalação.

Ponto de decisão técnico:

- Validar se impostos e comissão incidem sobre entrega/instalação.
- Premissa inicial recomendada: instalação entra como serviço vendido e sofre impostos/comissão; entrega pode ter incidência configurável em fase futura, mas no primeiro ciclo pode entrar no total comercial de forma explícita.

## 9. UI do Orçamento

### 9.1 Entrega no Nível do Orçamento

Criar componente isolado:

- `EntregaOrcamentoSection.tsx`.

Local sugerido:

- dentro de Configurações Comerciais;
- ou imediatamente após Cliente, caso a experiência fique mais natural.

Campos:

- modalidade;
- usar endereço do cliente;
- endereço alternativo;
- valor cobrado;
- custo estimado;
- prazo previsto;
- observações.

UX:

- quando modalidade for Retirada no balcão, esconder endereço e permitir valor zero;
- quando modalidade exigir endereço, validar endereço mínimo;
- ao selecionar cliente, preencher endereço automaticamente quando `usar endereço do cliente` estiver ativo;
- permitir sobrescrever endereço sem alterar cadastro do cliente.

### 9.2 Instalação no Produto

Criar componente isolado:

- `InstalacaoProdutoSection.tsx`.

Local sugerido:

- dentro de cada item de produto, próximo dos Serviços/Acabamentos;
- manter fechado por padrão quando `instalacao_necessaria = false`.

Campos:

- instalação necessária;
- tipo de instalação;
- usar endereço da entrega;
- endereço específico;
- preço cobrado;
- custo mão de obra;
- custo deslocamento;
- tempo estimado;
- quantidade de pessoas;
- observações.

UX:

- ao selecionar tipo de instalação, preencher valores padrão;
- permitir edição manual dos valores;
- mostrar pequeno resumo de margem da instalação;
- não forçar instalação em todos os produtos.

## 10. Backend e APIs

### 10.1 Novos Endpoints

Modalidades de entrega:

- `GET /centros-de-trabalho/modalidades-entrega`;
- `POST /centros-de-trabalho/modalidades-entrega`;
- `GET /centros-de-trabalho/modalidades-entrega/:id`;
- `PATCH /centros-de-trabalho/modalidades-entrega/:id`;
- `DELETE /centros-de-trabalho/modalidades-entrega/:id` ou inativação.

Tipos de instalação:

- `GET /centros-de-trabalho/tipos-instalacao`;
- `POST /centros-de-trabalho/tipos-instalacao`;
- `GET /centros-de-trabalho/tipos-instalacao/:id`;
- `PATCH /centros-de-trabalho/tipos-instalacao/:id`;
- `DELETE /centros-de-trabalho/tipos-instalacao/:id` ou inativação.

### 10.2 Segurança

Obrigatório:

- usar guards existentes de autenticação;
- obter `loja_id` do usuário autenticado, nunca do body;
- filtrar sempre por `loja_id`;
- validar ownership dos IDs enviados;
- bloquear payloads excessivos;
- limitar tamanho de strings;
- usar DTOs com `class-validator`;
- tratar erros sem vazar stacktrace ou dados internos;
- registrar logs operacionais sem dados sensíveis desnecessários.

### 10.3 Orçamentos V2

Atualizar DTOs, interfaces, transformação e repositórios:

- `criar-orcamento.dto.ts`;
- `atualizar-orcamento.dto.ts`;
- `orcamento.interface.ts`;
- `transformacao-v2.service.ts`;
- `orcamentos-v2.repository.ts`;
- `produtos-v2.repository.ts`;
- services de cálculo/persistência relacionados.

Regra:

- backend deve persistir entrega no orçamento;
- backend deve persistir instalação por produto;
- backend deve recalcular totais ou validar totais calculados.

## 11. Integração com OS

A primeira etapa é estruturar orçamento. A integração com OS fica preparada, mas deve ser executada depois.

Quando orçamento virar OS:

- entrega deve ser copiada para a OS como dados operacionais;
- produtos com instalação devem gerar pendências/blocos de instalação na OS;
- dados financeiros não devem ser recalculados na OS;
- OS deve mostrar instalação e entrega como execução, não como precificação.

Compatibilidade:

- OS atual que detecta instalação por serviço manual categoria `instalacao` deve continuar funcionando até migração.

## 12. Ordem de Implementação

### Fase 0 - Auditoria Antes de Codar

Objetivo: confirmar tudo que já existe e evitar duplicação.

Checklist:

- revisar schema Prisma completo para entrega/instalação existentes;
- revisar módulos Centros de Trabalho, Serviços Manuais e Configurações;
- revisar DTOs e interfaces de Orçamentos V2;
- revisar criação/edição de orçamento;
- revisar Preview de Cálculo V2 e helpers;
- revisar listagem/grid de orçamentos para confirmar origem do valor exibido;
- revisar payload de salvar orçamento e payload de edição para garantir round-trip dos novos campos;
- revisar transformação de orçamento para OS;
- revisar impressão de OS e OS detail;
- mapear testes existentes.

Saída:

- confirmação de entidades reaproveitadas;
- lista de arquivos a tocar;
- lista de arquivos a evitar;
- riscos de compatibilidade.
- checklist de consistência preview -> salvar -> grid -> reabrir rascunho.

### Fase 1 - Modelagem de Dados

Objetivo: adicionar estrutura mínima e compatível.

Entregáveis:

- modelos Prisma para modalidade de entrega e tipo de instalação;
- campos de entrega no orçamento;
- campos de instalação no produto do orçamento;
- índices por `loja_id`;
- uniques por `loja_id + nome`;
- migração segura.

Critérios:

- não quebrar orçamentos antigos;
- novos campos opcionais;
- rollback possível por migração reversível manualmente.

### Fase 2 - Backend dos CRUDs em Centros de Trabalho

Objetivo: criar os cadastros configuráveis.

Entregáveis:

- services;
- controllers;
- DTOs;
- validações;
- testes unitários;
- OpenAPI atualizado, se o projeto estiver mantendo documentação ativa.

Critérios:

- multi-tenant validado;
- duplicidade tratada;
- exclusão segura;
- campos monetários tratados como Decimal.

### Fase 3 - Frontend dos CRUDs em Centros de Trabalho

Objetivo: expor configurações ao usuário.

Entregáveis:

- card "Modalidades de Entrega";
- card "Tipos de Instalação";
- listagem;
- criação;
- edição;
- inativação/exclusão segura;
- busca/filtro simples.

Critérios:

- seguir padrão visual dos CRUDs existentes;
- evitar cards dentro de cards;
- formulários simples;
- mensagens claras.

### Fase 4 - Orçamento: Entrega

Objetivo: adicionar entrega ao orçamento sem mexer de forma pesada nos arquivos grandes.

Entregáveis:

- `EntregaOrcamentoSection.tsx`;
- schema do formulário atualizado;
- default pelo cliente/endereço;
- payload de criação/edição atualizado;
- persistência backend;
- leitura em edição.

Critérios:

- orçamento sem entrega continua válido;
- retirada no balcão funciona com valor zero;
- entrega com endereço exige dados mínimos;
- endereço do cliente é snapshot, não referência dinâmica.

### Fase 5 - Orçamento: Instalação por Produto

Objetivo: adicionar instalação em cada produto.

Entregáveis:

- `InstalacaoProdutoSection.tsx`;
- schema de item de produto atualizado;
- payload por produto atualizado;
- persistência backend;
- leitura em edição;
- defaults puxados do tipo de instalação.

Critérios:

- produto sem instalação continua simples;
- produto com instalação reflete preço e custo;
- múltiplos produtos podem ter instalações diferentes;
- serviços manuais antigos continuam funcionando.

### Fase 6 - Preview de Cálculo

Objetivo: refletir entrega e instalação no cálculo visual.

Entregáveis:

- helper de entrega;
- helper de instalação;
- blocos de resumo;
- atualização mínima no `PreviewCalculoV2.tsx`;
- testes das funções de cálculo.

Critérios:

- preview mostra subtotal de produtos;
- preview mostra instalações;
- preview mostra entrega;
- total final bate com backend;
- valor exibido no grid/listagem de orçamentos bate com o preview antes de salvar;
- orçamento em rascunho reabre com entrega e instalação preenchidas;
- não aumentar significativamente a complexidade do componente principal.

### Fase 7 - Backend de Cálculo e Consistência

Objetivo: garantir que o cálculo persistido seja coerente com o preview.

Entregáveis:

- cálculo backend de entrega/instalação;
- validação dos IDs de modalidade/tipo;
- atualização do detalhamento de cálculo;
- testes de cenários.

Critérios:

- preview e backend batem;
- orçamento salvo e reaberto mantém os valores;
- grid/listagem usa os valores persistidos corretos;
- testes cobrem o ciclo criar -> listar -> editar rascunho -> recalcular;
- margem consolidada considera custos e preços adicionais;
- comissão/impostos seguem regra definida.

## 12.1 Checklist Obrigatório de Persistência e Reidratação

Sempre que um campo novo impactar cálculo ou operação do orçamento, validar:

- campo existe no schema/form frontend;
- campo entra no payload de criação;
- campo entra no payload de atualização;
- backend DTO aceita o campo;
- repository persiste o campo;
- retorno de `findOne`/edição inclui o campo;
- retorno de `findAll`/grid inclui o total correto;
- preview usa a mesma regra ou helper equivalente ao backend;
- rascunho salvo reabre com o campo preenchido;
- orçamento salvo sem o campo continua compatível.

### Fase 8 - Preparação da OS

Objetivo: preparar a próxima etapa sem misturar escopos.

Entregáveis:

- documentação do mapeamento orçamento -> OS;
- campos que a OS deverá exibir;
- estratégia de compatibilidade com serviço manual categoria `instalacao`.

Critérios:

- nenhuma mudança ampla na OS nesta fase;
- somente ajustes necessários para não perder dados ao aprovar orçamento, se aplicável.

## 13. Arquivos Prováveis de Impacto

Backend:

- `backend/prisma/schema.prisma`;
- `backend/src/orcamentos-v2/dto/criar-orcamento.dto.ts`;
- `backend/src/orcamentos-v2/dto/atualizar-orcamento.dto.ts`;
- `backend/src/orcamentos-v2/interfaces/orcamento.interface.ts`;
- `backend/src/orcamentos-v2/repositories/orcamentos-v2.repository.ts`;
- `backend/src/orcamentos-v2/repositories/produtos-v2.repository.ts`;
- `backend/src/orcamentos-v2/services/transformacao-v2.service.ts`;
- novos arquivos em `backend/src/configuracoes/controllers/centros-de-trabalho`;
- novos arquivos em `backend/src/configuracoes/services/centros-de-trabalho`;
- novos DTOs em `backend/src/configuracoes/dto/centros-de-trabalho`.

Frontend:

- `frontend/src/app/(main)/centros-de-trabalho/page.tsx`;
- novas rotas em `frontend/src/app/(main)/centros-de-trabalho/modalidades-entrega`;
- novas rotas em `frontend/src/app/(main)/centros-de-trabalho/tipos-instalacao`;
- `frontend/src/components/ui/orcamento/schemas/orcamento.schema.ts`;
- `frontend/src/components/ui/orcamento/OrcamentoForm.tsx`;
- `frontend/src/components/ui/orcamento/components/ConfiguracoesSection.tsx`;
- `frontend/src/components/ui/orcamento/components/ProdutoSection.tsx` ou componente equivalente;
- novos componentes `EntregaOrcamentoSection.tsx` e `InstalacaoProdutoSection.tsx`;
- `frontend/src/components/ui/shared/sections/PreviewCalculoV2.tsx`;
- novos helpers em `frontend/src/components/ui/shared/utils`.

## 14. Riscos

- Preview e backend divergirem.
- Instalação duplicar custo quando também existir como Serviço Manual.
- Entrega ser tratada como prazo textual e frete ao mesmo tempo, gerando confusão.
- Alterações em arquivos grandes causarem regressões.
- Endereço do cliente mudar após aprovação e alterar interpretação histórica do orçamento.
- Falhas multi-tenant permitirem uso de modalidade/tipo de outra loja.
- Excluir cadastro usado em orçamento antigo quebrar reabertura.

Mitigações:

- campos novos opcionais;
- snapshots de endereço;
- helpers isolados;
- testes de cálculo;
- validação de ownership por `loja_id`;
- inativação em vez de exclusão física quando houver vínculo;
- fase de compatibilidade com serviços manuais categoria `instalacao`.

## 15. Critérios de Aceite do Projeto de Orçamento

- Usuário consegue cadastrar modalidades de entrega em Centros de Trabalho.
- Usuário consegue cadastrar tipos de instalação em Centros de Trabalho.
- Orçamento novo permite selecionar entrega no nível do orçamento.
- Orçamento novo permite configurar instalação por produto.
- Endereço do cliente pode ser usado como padrão de entrega.
- Preview de Cálculo exibe entrega e instalação separadamente.
- Total final considera entrega e instalação.
- Backend persiste os dados e reabre o orçamento corretamente.
- Backend valida multi-tenant e bloqueia IDs externos.
- Orçamentos antigos continuam abrindo.
- Serviços Manuais continuam funcionando.
- Não há dados mockados ou inventados no cálculo.

## 16. Decisões Pendentes Antes da Codificação

- Definir se impostos incidem sobre entrega no primeiro ciclo.
- Definir se comissão incide sobre entrega no primeiro ciclo.
- Definir se entrega terá custo estimado obrigatório ou opcional.
- Definir se tipos de instalação terão preço padrão obrigatório ou opcional.
- Definir nomenclatura final dos menus:
  - "Modalidades de Entrega" ou "Tipos de Entrega";
  - "Tipos de Instalação" ou "Serviços de Instalação".

Recomendação inicial:

- impostos incidem sobre instalação;
- comissão incide sobre instalação;
- entrega entra no total comercial, mas custo/preço ficam destacados;
- custo estimado de entrega opcional;
- preço/custo padrão de instalação opcionais;
- menu: "Modalidades de Entrega" e "Tipos de Instalação".

## 17. Progresso de Implementação

### 2026-06-02

- [x] Plano atualizado com checklist obrigatório de consistência: preview -> salvar -> grid -> reabrir rascunho.
- [x] Auditoria inicial confirmou que o formulário em uso é `frontend/src/components/ui/orcamentos-v2/orcamento-v2-form.tsx`.
- [x] Auditoria inicial confirmou que o grid/listagem exibe `preco_final`; portanto campos novos que impactam valor precisam atualizar `preco_final` e `valor_total` no backend.
- [x] Auditoria inicial confirmou que o cliente já possui endereço cadastrado e que `prazo_entrega` atual não representa frete/entrega estruturada.
- [x] Auditoria inicial confirmou que a OS ainda detecta instalação antiga por serviço manual com categoria `instalacao`; manter compatibilidade.
- [x] Prisma atualizado com modelos opcionais `ModalidadeEntrega` e `TipoInstalacao`.
- [x] Prisma atualizado com campos opcionais de entrega em `orcamento`.
- [x] Prisma atualizado com campos opcionais de instalação em `ProdutoOrcamento`.
- [x] Backend iniciado com DTOs, services e controllers para:
  - `GET/POST/PUT/DELETE /centros-de-trabalho/modalidades-entrega`;
  - `GET/POST/PUT/DELETE /centros-de-trabalho/tipos-instalacao`.
- [x] Services dos novos cadastros filtram por `loja_id`, validam duplicidade por loja e inativam registros em uso em vez de remover histórico.
- [x] `backend/src/configuracoes/configuracoes.module.ts` atualizado para registrar controllers/services.
- [x] `npx prisma format --schema prisma/schema.prisma` executado com sucesso.
- [x] Migração Prisma criada em `backend/prisma/migrations/20260602173424_orcamento_entrega_instalacao/migration.sql`.
- [x] Migração revisada para não carregar drops/alterações fora do escopo de entrega/instalação.
- [x] `npx prisma validate --schema prisma/schema.prisma` executado com sucesso.
- [x] `frontend/src/lib/api-client.ts` atualizado com clientes para modalidades de entrega e tipos de instalação.
- [x] Home de Centros de Trabalho atualizada com cards para os novos cadastros.
- [x] Backend de Orçamentos V2 atualizado para validar `entrega_modalidade_id` e `instalacao_tipo_id` por `loja_id` antes de criar/atualizar.
- [x] Transformação de Orçamentos V2 atualizada para persistir e reidratar campos estruturados de entrega e instalação.
- [x] Interfaces de Orçamentos V2 atualizadas com os novos campos opcionais.
- [x] `npx tsc --noEmit --pretty false` executado: orçamento/entrega/instalação não geraram erro novo; permanece erro pré-existente em `src/pcp/services/pcp-dashboard.service.spec.ts` por mock sem `tem_workflow`.
- [x] `npx prisma generate --schema prisma/schema.prisma` executado com sucesso após parar o servidor que bloqueava `query_engine-windows.dll.node`.
- [x] `npx prisma migrate deploy --schema prisma/schema.prisma` executado com sucesso no banco local `comunikapp`.
- [x] Schema do formulário de orçamento atualizado com campos opcionais de entrega e instalação.
- [x] Formulário V2 atualizado para:
  - criar defaults dos campos novos;
  - reidratar entrega ao abrir orçamento em edição;
  - reidratar instalação por produto ao abrir orçamento em edição;
  - enviar entrega e instalação no payload de criação/atualização;
  - somar entrega e instalação no `preco_final` e no `custo_total` persistidos.
- [x] `ConfiguracoesSection` recebeu UI inicial para entrega.
- [x] `ProdutoSection` recebeu UI inicial para instalação por produto.
- [x] Criadas páginas básicas em Centros de Trabalho:
  - `frontend/src/app/(main)/centros-de-trabalho/modalidades-entrega/page.tsx`;
  - `frontend/src/app/(main)/centros-de-trabalho/tipos-instalacao/page.tsx`.
- [x] CRUDs de Modalidades de Entrega e Tipos de Instalação alinhados ao padrão de Máquinas:
  - listagem com `CrudPage`;
  - tabela no desktop e cards no mobile;
  - busca;
  - ações de editar/excluir;
  - rotas dedicadas `/novo` e `/editar/[id]`;
  - formulário com seta de voltar, título, card e botões no mesmo padrão visual.
- [x] Lint direcionado executado com sucesso nos novos/alterados menores:
  - páginas de modalidades de entrega e tipos de instalação;
  - `ConfiguracoesSection`;
  - `ProdutoSection`;
  - schema do formulário.
- [x] TypeScript direcionado do frontend não retornou erros envolvendo os arquivos alterados de orçamento/entrega/instalação.
- [x] `PreviewCalculoV2.tsx` saneado: byte nulo removido e arquivo mantido em UTF-8.
- [x] Preview de cálculo ajustado conforme decisão de produto:
  - instalação aparece dentro do respectivo produto;
  - entrega/endereço aparece abaixo dos produtos e antes de custos indiretos;
  - o card agregado "Entrega e instalação" acima do preview foi removido.
- [x] Textos visíveis dos novos campos revisados com acentuação em UTF-8.
- [x] Lint direcionado reexecutado com sucesso após ajuste do preview.
- [x] TypeScript direcionado reexecutado sem erros nos arquivos alterados de orçamento/entrega/instalação.
- [x] Teste direto de persistência executado com Prisma Client:
  - criou modalidade de entrega temporária;
  - criou tipo de instalação temporário;
  - criou orçamento rascunho temporário com produto, entrega e instalação;
  - releu `entrega_modalidade_id`, valores de entrega, campos de instalação, `preco_final` e `valor_total`;
  - confirmou que os valores gravados foram reidratados corretamente;
  - removeu todos os registros temporários ao final.

### 2026-06-03

- [x] Cards de Centros de Trabalho revisados para manter textos visíveis com acentuação correta em UTF-8.
- [x] Tipos de Instalação evoluídos com `regra_cobranca`, mantendo compatibilidade por padrão `FIXO`.
- [x] Regras de cobrança inicialmente suportadas:
  - `FIXO`: cobra o valor padrão uma vez;
  - `POR_M2`: cobra pelo m² total do produto (`area_produto * quantidade_produto`);
  - `POR_ML`: cobra pelo metro linear total a partir do perímetro;
  - `POR_UNIDADE`: cobra pela quantidade do produto;
  - `POR_HORA`: cobra pelas horas estimadas de instalação;
  - `MANUAL`: não recalcula automaticamente, permitindo ajuste livre no produto.
- [x] `ProdutoOrcamento` recebeu snapshot de `instalacao_regra_cobranca` e `instalacao_valor_unitario` para evitar divergência entre preview, salvamento e reabertura do rascunho.
- [x] Formulário de Tipos de Instalação recebeu campo "Regra de cobrança" no mesmo CRUD já criado em Centros de Trabalho.
- [x] Campo "Regra de cobrança" recebeu `InfoTooltip`, reaproveitando o padrão usado em Máquinas, explicando que as regras por medida seguem as medidas e quantidades do produto no orçamento.
- [x] Demais campos do cadastro de Tipo de Instalação receberam `InfoTooltip`, deixando claro quais valores são padrões/sugestões e que podem ser ajustados no orçamento.
- [x] Rótulo do preço padrão no Tipo de Instalação passou a acompanhar a regra selecionada, deixando claro quando o valor é por m² instalado, metro linear, unidade ou hora/equipe.
- [x] Layout do formulário de Tipo de Instalação reorganizado para remover lacuna visual abaixo de "Regra de cobrança".
- [x] Listagem de Tipos de Instalação passou a exibir a regra em tabela desktop e cards mobile.
- [x] `ProdutoSection` passou a aplicar o cálculo de instalação automaticamente ao selecionar o tipo:
  - preço cobrado = valor padrão do tipo * base da regra;
  - custo de mão de obra = custo padrão do tipo * base da regra;
  - deslocamento permanece fixo por instalação;
  - tempo estimado e quantidade de pessoas usam os padrões do tipo quando o produto ainda não possui valor.
- [x] Recálculo automático de instalação evita sobrescrever campos quando o valor calculado não mudou, reduzindo risco de renderizações repetidas no formulário.
- [x] Preview de Cálculo passou a mostrar a regra e o valor unitário da instalação dentro do respectivo produto.
- [x] Orçamento passou a sinalizar no produto quando o tipo de instalação selecionado exige agendamento.
- [x] Bloco de instalação no produto do orçamento corrigido para permitir preenchimento completo de endereço próprio: CEP, endereço, número, complemento, bairro, cidade e UF.
- [x] Inputs/textarea do bloco de instalação passaram a receber `value ?? ''`, evitando campos travados quando o formulário ainda não possui valor inicial.
- [x] Recálculo automático da instalação corrigido para não sobrescrever campos financeiros/operacionais que estejam em foco ou já tenham sido editados manualmente no orçamento.
- [x] Painel de aproveitamento de material no orçamento corrigido para não chamar chapa de bobina/rolo; os rótulos agora acompanham o formato comercial do insumo.
- [x] A ação "Aplicar configuração recomendada" da Home passou a criar modalidades de entrega e tipos de instalação padrão por loja, sem valores comerciais definidos.
- [x] A criação recomendada de entrega/instalação é idempotente: cria apenas os nomes ausentes, sem duplicar registros já cadastrados.
- [x] Onboarding da Home recebeu etapa opcional "Configurar entrega e instalação", concluída automaticamente quando houver ao menos uma modalidade de entrega ativa e um tipo de instalação ativo.
- [x] Criado endpoint dedicado `POST /home-operacional/onboarding/aplicar-entrega-instalacao` para aplicar somente os padrões de entrega e instalação, sem mexer nos demais defaults da configuração recomendada.
- [x] Dashboard passou a exibir modal de novidade para lojas que ainda não possuem entrega/instalação configuradas, com botão para criar os padrões recomendados.
- [x] Backend de Orçamentos V2 atualizado para persistir e reidratar `instalacao_regra_cobranca` e `instalacao_valor_unitario`.
- [x] Migração criada em `backend/prisma/migrations/20260603120000_instalacao_regra_cobranca/migration.sql`.
- [x] `npx prisma validate --schema prisma/schema.prisma` executado com sucesso.
- [x] `npx prisma migrate deploy --schema prisma/schema.prisma` executado com sucesso no banco local `comunikapp`.
- [x] Lint direcionado do frontend executado com sucesso nos arquivos alterados pela regra de cobrança.
- [x] TypeScript direcionado do frontend não retornou erros envolvendo os arquivos alterados pela regra de cobrança; o projeto ainda pode falhar globalmente por erros fora deste recorte.
- [ ] `npx prisma generate --schema prisma/schema.prisma` ainda está bloqueado por `EPERM` no Windows ao renomear `query_engine-windows.dll.node`; é necessário liberar o processo que mantém o Prisma Client carregado e rodar novamente.

Próximo passo imediato:

- Liberar o lock do Prisma Client e executar `npx prisma generate --schema prisma/schema.prisma`.
- Testar o mesmo round-trip pela UI/API autenticada quando o fluxo visual estiver disponível.
- Evoluir entrega e instalação para helpers/componentes dedicados quando a tela de orçamento for fatiada em arquivos menores.
