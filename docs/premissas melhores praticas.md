Premissas e Melhores Práticas para Memória do Agente

Arquitetura: Módulos plugáveis, totalmente isolados, multi-tenant (dados separados por loja), podendo ser instalados/ativados sob demanda via marketplace interno.

Banco de Dados: Sempre usar Prisma ORM com schemas separados, migrações modulares versionadas, variáveis de ambiente dedicadas e pool de conexão limitado para cada módulo. IMPORTANTE: Usar SEMPRE `@prisma/client` padrão ao invés de outputs customizados para evitar erros de MODULE_NOT_FOUND em runtime - outputs customizados causam problemas de path no build/dist.

Segurança: Middleware obrigatório para garantir isolamento de tenant, autenticação JWT, validação rigorosa de dados recebidos/enviados, logs completos e rastreáveis de auditoria.

Controle de Estoque: Integração nativa com o cadastro de insumos já existente (evitar duplicação de entidades); armazenamento físico com endereçamento hierárquico (depósito, corredor, prateleira, posição); controle visível de quantidade, lotes, validade e local.

Estrutura de Código: Divisão clara por camadas, arquivos limitados a no máximo 400 linhas (service) ou 200 linhas (controller), organização modular conforme Clean Architecture.

Integração entre Módulos: APIs internas segregadas, comunicação com autenticação via tokens próprios, fallback e timeout configurados, cache para dados pouco mutáveis.

Workflow PCP: Workflows produtivos devem ser configuráveis (sequenciais ou paralelos), checagem de permissões em cada etapa, checkpoints com checklists e logs de cada transição.

Módulo de Orçamentos: Canal de chat integrado para negociação, link seguro e rastreável para cliente, notificações automatizadas (WhatsApp, e-mail) para eventos de aprovação/reprovação.

Documentação & Qualidade: APIs, entidades e endpoints devem ser plenamente documentados (OpenAPI), exemplos de payload em docs, testes automatizados com cobertura mínima de 80%.

Performance: Carregamento rápido de dashboards, queries otimizadas, tratamento robusto de erros (retry, timeouts, fallback), health checks e monitoramento de todas as conexões de banco/API.

Build & Paths: CRÍTICO - Em módulos NestJS com Prisma, sempre usar `@prisma/client` padrão. NUNCA usar output customizado no generator (ex: `output = "../src/generated/client"`). Problemas com paths customizados causam erros MODULE_NOT_FOUND em runtime que são difíceis de debugar. Scripts de build devem ser simples sem necessidade de copiar arquivos generated. Prefer simplicidade over customização nos paths do Prisma.

Escalabilidade: Módulos instaláveis sob demanda (add-on); são autônomos, sem dependências rígidas com outras features do core, permitindo implantação incremental e segura.

Estratégia Anti-Conflitos: Se um módulo causar problemas de import/path, SEMPRE preferir abordagem simplificada: usar PrismaService existente, dados simulados para prototipagem, services simples sem dependências complexas. Evitar reinventar arquiteturas - adaptar à estrutura existente. Quando houver conflito entre "arquitetura ideal" vs "funcionamento real", escolher sempre o funcionamento.

## 🎨 UI/UX e Componentização Compartilhada

- Design System interno com componentes reutilizáveis para garantir consistência visual entre módulos.
- Diretórios sugeridos (frontend):
  - `src/components/ui/` (base: Button, Input, Select, Badge, Dialog/ConfirmDialog, Toast, Tabs, DatePicker)
  - `src/components/layout/` (PageHeader, ActionsBar, Sidebar abstrações)
  - `src/components/crud/` (CrudPage, DataTable, Pagination, SearchBar, ViewSwitch, EmptyState, SkeletonList)
- Padrão de página CRUD (usar como referência o CRUD de Transferências em Estoque):
  - Header padronizado: botão Voltar, título com ícone, ações à direita (Atualizar/Exportar)
  - Barra de ações: busca/filtros; alternância Tabela/Cards (desktop); cards no mobile
  - Confirmações padrão via modal do sistema; toasts apenas para sucesso
  - Paginação consistente, estados vazios e loading com Skeleton
- Adoção progressiva: novos módulos devem usar os componentes padrão; módulos existentes serão migrados em PBI dedicado de “consistência visual”.
- Acessibilidade: labels/aria, foco navegável, contraste adequado.

## 🧪 Testes por Fase (DoD)

- Cada fase de implementação deve incluir testes unitários com cobertura mínima de 80% no escopo alterado.
- Requisitos de DoD por fase:
  - OpenAPI atualizado, lints sem erros, build verde
  - Testes unitários ≥ 80% (controllers/services/guards) e, quando aplicável, testes e2e mínimos
  - Logs/mensagens padronizados, multi-tenant validado, sem regressões em módulos existentes

## 📏 Limites de Tamanho e Guardrails de Manutenção

- Services devem ter ≤ 400 linhas; Controllers ≤ 200 linhas.
- Funções utilitárias, mapeamentos e trechos SQL comuns devem ficar em `utils/` (evitar duplicação em services).
- Preferir “facade” temporário ao refatorar serviços grandes, delegando para serviços menores sem quebrar contratos.
- Adotar regra de lint `max-lines` e revisar em PRs.

## 🔐 NOVAS PREMISSAS SOBRE AUTENTICAÇÃO JWT

### **Princípio Fundamental: NÃO MODIFICAR MÓDULOS FUNCIONAIS**
- **NUNCA alterar** módulos que já estão funcionando
- **NUNCA modificar** frontend ou backend dos módulos existentes
- **Apenas corrigir** permissões de acesso e problemas JWT específicos
- **Manter compatibilidade** total com código existente

### **Estratégia de Autenticação JWT**
- **Configuração JWT por módulo**: Cada módulo deve ter sua própria configuração JWT
- **Evitar configuração global**: Configuração global pode causar conflitos e falhas de inicialização
- **Middleware/Interceptors**: Usar apenas quando absolutamente necessário e testado
- **Fallback para configuração local**: Se configuração global falhar, sempre voltar para configuração local

### **Desenvolvimento de Módulos Futuros**
- **JwtModule obrigatório**: Todo novo módulo deve incluir JwtModule próprio
- **Configuração independente**: Cada módulo deve ser autônomo em autenticação
- **Padrão de configuração**:
  ```typescript
  JwtModule.register({
    secret: process.env.JWT_SECRET || 'your-secret-key',
    signOptions: { expiresIn: '24h' },
  })
  ```
- **Teste de inicialização**: Sempre testar se o módulo inicializa antes de prosseguir

### **Lições Aprendidas sobre Modificações**
- **Modificações mínimas**: Fazer apenas o necessário para resolver o problema
- **Reversão rápida**: Se algo falhar, reverter imediatamente para estado funcional
- **Teste incremental**: Testar cada pequena modificação antes de prosseguir
- **Documentação de mudanças**: Registrar todas as modificações para rollback

### **Arquitetura de Autenticação Recomendada**
- **Módulos existentes**: Manter configuração JWT atual (não modificar)
- **Novos módulos**: Incluir JwtModule próprio obrigatoriamente
- **Configuração centralizada**: Usar variáveis de ambiente para JWT_SECRET
- **Validação de token**: Manter JwtAuthGuard em todos os endpoints protegidos

## 🔧 NOVAS PREMISSAS SOBRE FORMULÁRIOS E REACT HOOK FORM

### **Princípio Fundamental: DefaultValues vs Form Reset**
- **NUNCA usar defaultValues vazios** que possam sobrescrever dados reais
- **DefaultValues vazios sobrescrevem form.reset()**: Se defaultValues têm IDs vazios, eles sobrescrevem os valores do reset
- **Arrays vazios são preferíveis**: `maquinas: []` é melhor que `maquinas: [{ maquina_id: '', ... }]`
- **Ordem de aplicação**: React Hook Form aplica primeiro defaultValues, depois form.reset()

### **Estratégia de Preenchimento de Formulários**
- **form.reset(defaultValues)**: Método padrão e mais confiável para preencher formulários
- **form.setValue() individual**: Usar apenas para campos específicos, não para arrays completos
- **Estrutura completa**: Sempre definir a estrutura completa dos arrays antes de valores individuais
- **Timing de verificação**: Usar setTimeout para verificar se os valores foram aplicados corretamente

### **Debug de Formulários**
- **Logs sistemáticos**: Sempre adicionar logs para verificar dados antes e depois de form.reset()
- **Verificação de caminhos**: Testar caminhos específicos como `form.getValues('itens_produto.0.maquinas.0.maquina_id')`
- **Estrutura de dados**: Verificar se os dados estão sendo passados corretamente para o formulário
- **Fallback para form.trigger()**: Usar form.trigger() para forçar re-renderização quando necessário

### **Padrões de Formulário Recomendados**
- **DefaultValues mínimos**: Usar apenas campos obrigatórios, deixar arrays vazios
- **Estrutura de dados consistente**: Garantir que dados de entrada tenham a mesma estrutura esperada pelo formulário
- **Validação de schema**: Sempre usar zodResolver para validação de tipos
- **Tratamento de arrays**: Para arrays dinâmicos, sempre verificar se estão vazios antes de iterar

### **Lições Aprendidas sobre React Hook Form**
- **Problema mais simples**: Às vezes o problema mais simples é o mais difícil de encontrar
- **Debug sistemático**: Sempre verificar a ordem de aplicação dos valores
- **Paciência no debug**: Problemas de formulário podem ter causas não óbvias
- **Teste incremental**: Testar cada pequena modificação antes de prosseguir

Essas premissas devem ser definidas explicitamente na memória do agente, orientando o desenvolvimento e ajudando a evitar inconsistências, bugs de integração, problemas de estruturação e aumento da complexidade ao evoluir o sistema.

Veja um resumo visual para facilitar o entendimento dos principais pontos-base que precisam estar na memória do seu agente:

veja a imagem aqui em docs/731cd8f7.png