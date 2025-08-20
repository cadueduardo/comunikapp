# 🚀 PLANO DE AÇÃO - MÓDULO CATÁLOGO DE INSUMOS

## 📋 **RESUMO EXECUTIVO**

Este documento define o plano de implementação do **Módulo Catálogo de Insumos** seguindo rigorosamente as **@premissas melhores praticas.md** estabelecidas para o projeto ComunikApp. O módulo será desenvolvido como um sistema totalmente isolado, plugável e multi-tenant, seguindo a arquitetura modular existente.

## 🎯 **OBJETIVOS E ESCOPO**

### **Objetivo Principal**
Implementar um módulo de catálogo de insumos pré-cadastrados que permita:
- Cadastro e gestão de insumos de comunicação visual
- Sistema de crawler para atualização automática de dados
- Integração opcional com o módulo de insumos existente
- Base para futuro marketplace de catálogos

### **Escopo Incluído**
- ✅ Backend completo do módulo
- ✅ API REST documentada com Swagger
- ✅ Sistema de crawler básico
- ✅ Integração com módulo de insumos existente
- ✅ Testes automatizados (80% cobertura)

### **Escopo Excluído**
- ❌ Interface visual/frontend
- ❌ Sistema de autenticação (usa estrutura existente)
- ❌ Marketplace completo (apenas estrutura base)
- ❌ Crawler avançado (implementação básica)

## 🏗️ **ARQUITETURA E ESTRUTURA**

### **Princípios Arquiteturais (Baseados nas Premissas)**
1. **Módulos plugáveis e totalmente isolados**
2. **Multi-tenant por lojaId**
3. **Arquivos limitados a 400 linhas (service) ou 200 linhas (controller)**
4. **Divisão clara por camadas (Clean Architecture)**
5. **APIs internas segregadas com tokens próprios**

### **Estrutura de Diretórios**
```
src/
├── catalogo-insumos/                    # Módulo principal
│   ├── dto/                            # Data Transfer Objects
│   ├── entities/                       # Entidades do módulo
│   ├── services/                       # Lógica de negócio
│   │   ├── catalogo-insumos.service.ts
│   │   ├── crawler.service.ts
│   │   ├── categorias.service.ts
│   │   └── integracao.service.ts
│   ├── controllers/                    # Controllers da API
│   │   ├── catalogo-insumos.controller.ts
│   │   ├── crawler.controller.ts
│   │   └── categorias.controller.ts
│   ├── guards/                         # Guards de segurança
│   ├── middleware/                     # Middleware de isolamento
│   ├── prisma/                         # Service de banco isolado
│   ├── swagger/                        # Configuração Swagger
│   └── catalogo-insumos.module.ts      # Módulo principal
├── common/                             # Utilitários compartilhados
│   ├── interfaces/                     # Interfaces do catálogo
│   └── enums/                          # Enums específicos
└── prisma/                             # Schemas separados
    └── catalogo-insumos/
        ├── schema.prisma               # Schema do módulo
        └── migrations/                 # Migrações modulares
```

## 📊 **FASES DE IMPLEMENTAÇÃO**

### **FASE 1: ESTRUTURA BASE (Semana 1)**
**Objetivo:** Criar estrutura modular isolada seguindo premissas

#### **1.1 Configuração do Módulo**
- [ ] Criar estrutura de diretórios
- [ ] Configurar módulo NestJS isolado
- [ ] Implementar JwtModule próprio (conforme premissas)
- [ ] Configurar variáveis de ambiente dedicadas

#### **1.2 Schema Prisma Separado**
- [ ] Criar `prisma/catalogo-insumos/schema.prisma`
- [ ] Definir entidades: `CatalogoInsumo`, `CategoriaCatalogo`, `CrawlerLog`
- [ ] Configurar migrações modulares
- [ ] Implementar isolamento multi-tenant

#### **1.3 Estrutura Base**
- [ ] Criar DTOs de validação
- [ ] Implementar entidades base
- [ ] Configurar service de conexão isolado
- [ ] Implementar middleware de isolamento de tenant

**Entregáveis:**
- ✅ Módulo base funcionando
- ✅ Schema Prisma isolado
- ✅ Estrutura de pastas organizada
- ✅ Configuração de ambiente

### **FASE 2: CRUD E CATEGORIAS (Semana 2)**
**Objetivo:** Implementar funcionalidades básicas de gestão

#### **2.1 CRUD de Insumos**
- [ ] Implementar `CatalogoInsumosService` (≤400 linhas)
- [ ] Criar `CatalogoInsumosController` (≤200 linhas)
- [ ] Implementar operações CRUD completas
- [ ] Adicionar validações e tratamento de erros

#### **2.2 Sistema de Categorias**
- [ ] Implementar `CategoriasService`
- [ ] Criar hierarquia de categorias
- [ ] Implementar relacionamentos entre insumos e categorias
- [ ] Adicionar validações de negócio

#### **2.3 Swagger e Documentação**
- [ ] Configurar Swagger seguindo padrão existente
- [ ] Documentar todos os endpoints
- [ ] Criar exemplos de payload
- [ ] Implementar schemas OpenAPI

**Entregáveis:**
- ✅ CRUD completo funcionando
- ✅ Sistema de categorias implementado
- ✅ Documentação Swagger ativa
- ✅ Testes unitários básicos

### **FASE 3: SISTEMA DE CRAWLER (Semana 3)**
**Objetivo:** Implementar sistema de coleta automática de dados

#### **3.1 Crawler Base**
- [ ] Implementar `CrawlerService` (≤400 linhas)
- [ ] Criar sistema de coleta de dados
- [ ] Implementar tratamento de erros e retry
- [ ] Adicionar logs estruturados

#### **3.2 Agendamento e Monitoramento**
- [ ] Implementar agendamento de tarefas
- [ ] Criar sistema de health checks
- [ ] Implementar monitoramento de execução
- [ ] Adicionar métricas de performance

#### **3.3 Integração com Fontes**
- [ ] Configurar fontes de dados configuráveis
- [ ] Implementar parsers para diferentes formatos
- [ ] Adicionar validação de dados coletados
- [ ] Implementar sistema de cache

**Entregáveis:**
- ✅ Crawler funcionando
- ✅ Agendamento automático
- ✅ Monitoramento ativo
- ✅ Testes de integração

### **FASE 4: INTEGRAÇÃO E OTIMIZAÇÃO (Semana 4)**
**Objetivo:** Integrar com sistema existente e otimizar performance

#### **4.1 Integração com Módulo de Insumos**
- [ ] Implementar `IntegracaoService`
- [ ] Criar endpoints de busca no catálogo
- [ ] Implementar sincronização de dados
- [ ] Adicionar histórico de integrações

#### **4.2 Otimizações de Performance**
- [ ] Implementar sistema de cache
- [ ] Otimizar queries do banco
- [ ] Adicionar paginação eficiente
- [ ] Implementar rate limiting

#### **4.3 Testes e Validação**
- [ ] Completar testes unitários (80% cobertura)
- [ ] Implementar testes de integração
- [ ] Validar performance e escalabilidade
- [ ] Testar isolamento multi-tenant

**Entregáveis:**
- ✅ Integração funcionando
- ✅ Performance otimizada
- ✅ Testes completos
- ✅ Módulo pronto para produção

## 🔧 **IMPLEMENTAÇÃO TÉCNICA**

### **Configuração de Ambiente**
```env
# Módulo Catálogo de Insumos
CATALOGO_INSUMOS_ENABLED=true
CATALOGO_INSUMOS_DATABASE_URL="mysql://user:pass@host:3306/database"
CATALOGO_INSUMOS_INTERNAL_API_TOKEN="catalogo-internal-token-2025"
CATALOGO_INSUMOS_ALLOWED_ROLES="ADMINISTRADOR,FINANCEIRO,ESTOQUE"

# Performance e Cache
CATALOGO_INSUMOS_DB_CONNECTION_LIMIT=10
CATALOGO_INSUMOS_CACHE_DURATION=900
CATALOGO_INSUMOS_DEFAULT_LIMIT=20
CATALOGO_INSUMOS_MAX_LIMIT=100

# Crawler
CATALOGO_INSUMOS_CRAWLER_ENABLED=true
CATALOGO_INSUMOS_CRAWLER_INTERVAL=3600000
CATALOGO_INSUMOS_CRAWLER_TIMEOUT=30000
```

### **Estrutura de Banco de Dados**
```sql
-- Tabela principal de insumos do catálogo
CREATE TABLE catalogo_insumos (
  id VARCHAR(255) PRIMARY KEY,
  codigo_catalogo VARCHAR(100) UNIQUE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  descricao_tecnica TEXT,
  categoria_id VARCHAR(255),
  marca VARCHAR(100),
  especificacoes JSON,
  preco_medio_mercado DECIMAL(10,2),
  fornecedores JSON,
  disponibilidade BOOLEAN DEFAULT true,
  fonte_coleta VARCHAR(500),
  data_coleta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ativo BOOLEAN DEFAULT true,
  loja_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_loja_id (loja_id),
  INDEX idx_categoria_id (categoria_id),
  INDEX idx_codigo_catalogo (codigo_catalogo),
  INDEX idx_nome (nome)
);

-- Tabela de categorias do catálogo
CREATE TABLE categorias_catalogo (
  id VARCHAR(255) PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  categoria_pai_id VARCHAR(255),
  nivel_hierarquia INT DEFAULT 1,
  ativo BOOLEAN DEFAULT true,
  loja_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_loja_id (loja_id),
  INDEX idx_categoria_pai_id (categoria_pai_id)
);

-- Tabela de logs do crawler
CREATE TABLE crawler_logs (
  id VARCHAR(255) PRIMARY KEY,
  tipo_execucao VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  fonte_dados VARCHAR(255),
  insumos_processados INT DEFAULT 0,
  insumos_atualizados INT DEFAULT 0,
  erros JSON,
  duracao_ms INT,
  loja_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_loja_id (loja_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);
```

### **Padrões de Implementação**

#### **Services (≤400 linhas)**
```typescript
@Injectable()
export class CatalogoInsumosService {
  constructor(
    private readonly prisma: CatalogoInsumosPrismaService,
    private readonly logger: Logger,
    private readonly configService: ConfigService,
  ) {}

  // Métodos principais com responsabilidades bem definidas
  async createInsumo(dto: CreateCatalogoInsumoDto, lojaId: string): Promise<CatalogoInsumo> {
    // Implementação com validações e logs
  }

  async buscarInsumos(filtros: BuscarInsumosDto, lojaId: string): Promise<PaginatedResult<CatalogoInsumo>> {
    // Implementação com paginação e filtros
  }
}
```

#### **Controllers (≤200 linhas)**
```typescript
@Controller('api/catalogo-insumos')
@UseGuards(JwtAuthGuard)
@ApiTags('Catálogo de Insumos')
export class CatalogoInsumosController {
  constructor(private readonly catalogoInsumosService: CatalogoInsumosService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo insumo no catálogo' })
  @ApiResponse({ status: 201, description: 'Insumo criado com sucesso' })
  async create(@Body() dto: CreateCatalogoInsumoDto, @GetLoja() loja: Loja) {
    return this.catalogoInsumosService.createInsumo(dto, loja.id);
  }
}
```

## 🧪 **ESTRATÉGIA DE TESTES**

### **Testes Unitários (80% cobertura)**
- **Services**: Testar lógica de negócio isoladamente
- **Controllers**: Testar validação de entrada e respostas
- **DTOs**: Testar validações e transformações
- **Guards**: Testar lógica de autorização

### **Testes de Integração**
- **Banco de dados**: Testar operações CRUD reais
- **APIs**: Testar endpoints completos
- **Multi-tenancy**: Validar isolamento de dados
- **Performance**: Testar limites de tempo e memória

### **Testes de Segurança**
- **Autenticação**: Validar JWT e permissões
- **Isolamento**: Verificar separação de dados entre lojas
- **Validação**: Testar entrada de dados maliciosos
- **Rate limiting**: Validar proteção contra abuso

## 📊 **MÉTRICAS E MONITORAMENTO**

### **Health Checks**
```typescript
@Get('health')
@ApiOperation({ summary: 'Status de saúde do módulo' })
async getHealth(): Promise<HealthStatus> {
  return {
    status: 'ok',
    module: 'catalogo-insumos',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: await this.checkDatabaseConnection(),
    crawler: await this.checkCrawlerStatus(),
  };
}
```

### **Logs Estruturados**
```typescript
// Logs de auditoria para operações críticas
this.logger.log({
  message: 'Insumo criado no catálogo',
  operation: 'CREATE_INSUMO',
  insumoId: insumo.id,
  lojaId: lojaId,
  userId: request.user.id,
  timestamp: new Date().toISOString(),
});
```

### **Métricas de Performance**
- Tempo de resposta por endpoint
- Taxa de sucesso/erro
- Uso de memória e CPU
- Conexões ativas no banco
- Status do crawler

## 🔐 **SEGURANÇA E COMPLIANCE**

### **Isolamento Multi-tenant**
- **Middleware obrigatório** para isolamento de dados
- **Validação de lojaId** em todas as operações
- **Queries com filtro automático** por loja
- **Logs de auditoria** para todas as operações

### **Autenticação e Autorização**
- **JWT obrigatório** para todos os endpoints
- **Validação de roles** conforme configuração
- **Rate limiting** configurável por endpoint
- **Timeout de sessão** configurável

### **Validação de Dados**
- **DTOs com validação rigorosa** usando class-validator
- **Sanitização de entrada** para prevenir injeção
- **Validação de tipos** e formatos
- **Tratamento de erros** sem exposição de dados sensíveis

## 📋 **CRITÉRIOS DE ACEITAÇÃO POR FASE**

### **Fase 1 - Estrutura Base**
- ✅ Módulo inicializa sem erros
- ✅ Schema Prisma gera sem conflitos
- ✅ Configuração de ambiente funcionando
- ✅ Estrutura de pastas organizada

### **Fase 2 - CRUD e Categorias**
- ✅ Endpoints CRUD respondem corretamente
- ✅ Validações funcionam para dados inválidos
- ✅ Swagger documenta todos os endpoints
- ✅ Testes unitários passando (60% cobertura)

### **Fase 3 - Crawler**
- ✅ Crawler executa sem erros
- ✅ Dados são atualizados no banco
- ✅ Agendamento funciona conforme configurado
- ✅ Logs e monitoramento ativos

### **Fase 4 - Integração e Otimização**
- ✅ Integração com módulo de insumos funcionando
- ✅ Performance dentro dos limites estabelecidos
- ✅ Testes completos passando (80% cobertura)
- ✅ Documentação completa e atualizada

## 🚀 **CRONOGRAMA DETALHADO**

| Semana | Fase | Atividades | Entregáveis |
|--------|------|------------|-------------|
| **1** | Estrutura Base | Setup do módulo, schema Prisma, configurações | Módulo base funcionando |
| **2** | CRUD e Categorias | Implementação de funcionalidades básicas | CRUD completo + Swagger |
| **3** | Crawler | Sistema de coleta automática de dados | Crawler funcionando |
| **4** | Integração e Otimização | Integração com sistema existente | Módulo pronto para produção |

## 📝 **DOCUMENTAÇÃO E ENTREGÁVEIS**

### **Documentação Técnica**
- [ ] README do módulo
- [ ] Documentação da API (Swagger)
- [ ] Guia de configuração
- [ ] Documentação de deploy

### **Arquivos de Configuração**
- [ ] Schema Prisma isolado
- [ ] Variáveis de ambiente
- [ ] Configurações de Swagger
- [ ] Scripts de migração

### **Testes e Validação**
- [ ] Suites de teste completas
- [ ] Dados de teste
- [ ] Scripts de validação
- [ ] Relatórios de cobertura

---

**📝 Documento criado por:** Equipe de Desenvolvimento  
**📅 Data:** Janeiro 2025  
**🔄 Versão:** 1.0  
**📋 Status:** Aprovado para execução  
**🔗 Baseado em:** @premissas melhores praticas.md
