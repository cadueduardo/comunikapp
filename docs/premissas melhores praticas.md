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

Essas premissas devem ser definidas explicitamente na memória do agente, orientando o desenvolvimento e ajudando a evitar inconsistências, bugs de integração, problemas de estruturação e aumento da complexidade ao evoluir o sistema.

Veja um resumo visual para facilitar o entendimento dos principais pontos-base que precisam estar na memória do seu agente:

veja a imagem aqui em docs/731cd8f7.png