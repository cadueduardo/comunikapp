# Services e Controllers para Estrutura Completa

## Visão Geral

Este documento descreve a estrutura completa de services e controllers implementados para suportar todas as funcionalidades de OS Direta/Interna conforme o **PLANO Fase 1 - Item 10**.

## Objetivo

Completar a estrutura de services e controllers para:
- Criação diferenciada de OS Comercial vs Interna
- Aprovações específicas por tipo
- Agendamento de instalações
- Listagens e estatísticas por tipo
- Endpoints REST completos

## Arquitetura

### Componentes Principais

1. **OSService Estendido** (`backend/src/os/services/os.service.ts`)
   - Métodos específicos para OS Comercial
   - Métodos específicos para OS Interna
   - Aprovações diferenciadas
   - Agendamento de instalações
   - Estatísticas por tipo

2. **OSDiretaInternaController** (`backend/src/os/controllers/os-direta-interna.controller.ts`)
   - Endpoints específicos por tipo
   - Aprovações diferenciadas
   - Listagens especializadas
   - Estatísticas e relatórios

3. **Testes Unitários Completos**
   - Service tests (`os-direta-interna.service.spec.ts`)
   - Controller tests (`os-direta-interna.controller.spec.ts`)

## Services Implementados

### OSService - Métodos Específicos

#### Criação Diferenciada

```typescript
// Criar OS Comercial
async criarOSComercial(lojaId: string, dados: CreateOSDto, usuarioId: string): Promise<OrdemServicoData>

// Criar OS Interna
async criarOSInterna(lojaId: string, dados: CreateOSDto, usuarioId: string): Promise<OrdemServicoData>
```

**Características**:
- Geração de código específico por tipo
- Validações condicionais aplicadas
- Campos específicos por tipo
- Auditoria completa

#### Aprovações Diferenciadas

```typescript
// Aprovação técnica (OS Comercial)
async aprovarOSTecnica(osId: string, usuarioId: string, aprovado: boolean, observacoes?: string): Promise<OrdemServicoData>

// Aprovação gerencial (OS Interna)
async aprovarOSGerencial(osId: string, usuarioId: string, aprovado: boolean, observacoes?: string): Promise<OrdemServicoData>
```

**Características**:
- Validação de tipo de OS
- Controle de versão
- Auditoria de modificações
- Logs detalhados

#### Agendamento de Instalação

```typescript
// Agendar instalação (OS Comercial)
async agendarInstalacao(osId: string, dataInstalacao: Date, observacoes?: string, usuarioId?: string): Promise<OrdemServicoData>
```

**Características**:
- Apenas para OS Comercial
- Validação de data
- Observações opcionais
- Auditoria completa

#### Listagens e Estatísticas

```typescript
// Listar por tipo
async listarOSPorTipo(lojaId: string, tipoOS: TipoOS, page: number, limit: number, status?: string): Promise<PaginatedResponse<OrdemServicoData>>

// Estatísticas por tipo
async obterEstatisticasPorTipo(lojaId: string, ano?: number): Promise<{
  comercial: { total: number; porStatus: { [key: string]: number } };
  interna: { total: number; porStatus: { [key: string]: number } };
}>
```

**Características**:
- Paginação completa
- Filtros por status
- Estatísticas detalhadas
- Performance otimizada

## Controllers Implementados

### OSDiretaInternaController

#### Endpoints de Criação

```typescript
POST /os/comercial
POST /os/interna
```

**Características**:
- Validação automática de tipo
- Geração de código específico
- Validações condicionais
- Resposta padronizada

#### Endpoints de Listagem

```typescript
GET /os/comercial
GET /os/interna
GET /os/pendentes/aprovacao-tecnica
GET /os/pendentes/aprovacao-gerencial
GET /os/instalacoes/agendadas
```

**Características**:
- Paginação completa
- Filtros específicos
- Listagens especializadas
- Performance otimizada

#### Endpoints de Aprovação

```typescript
PATCH /os/:id/aprovar-tecnica
PATCH /os/:id/aprovar-gerencial
```

**Características**:
- Validação de tipo
- Controle de acesso
- Auditoria completa
- Resposta padronizada

#### Endpoints de Agendamento

```typescript
PATCH /os/:id/agendar-instalacao
```

**Características**:
- Apenas OS Comercial
- Validação de data
- Observações opcionais
- Auditoria completa

#### Endpoints de Estatísticas

```typescript
GET /os/estatisticas/tipo
```

**Características**:
- Estatísticas por tipo
- Filtro por ano
- Dados agregados
- Performance otimizada

## Endpoints REST Completos

### Criação de OS

#### POST /os/comercial
Cria OS Comercial com validações específicas.

**Body:**
```json
{
  "tipo_os": "COMERCIAL",
  "cliente_id": "cliente-001",
  "nome_servico": "Banner Teste",
  "quantidade": 10,
  "valor_orcado": 1000,
  "prioridade": "NORMAL"
}
```

**Response:**
```json
{
  "id": "os-001",
  "numero": "OS-2025-001",
  "tipo_os": "COMERCIAL",
  "status": "FILA",
  "data_abertura": "2025-10-01T10:00:00.000Z",
  "versao": 1
}
```

#### POST /os/interna
Cria OS Interna com validações específicas.

**Body:**
```json
{
  "tipo_os": "INTERNA",
  "departamento_solicitante": "TI",
  "centro_custo": "CC-001",
  "nome_servico": "Banner Interno",
  "quantidade": 5,
  "prioridade": "NORMAL"
}
```

**Response:**
```json
{
  "id": "os-002",
  "numero": "OSI-2025-001",
  "tipo_os": "INTERNA",
  "status": "FILA",
  "aprovacao_gerencial": "PENDENTE",
  "data_abertura": "2025-10-01T10:00:00.000Z",
  "versao": 1
}
```

### Listagem de OS

#### GET /os/comercial
Lista OS Comerciais com paginação e filtros.

**Query Parameters:**
- `page`: Página (padrão: 1)
- `limit`: Limite por página (padrão: 10)
- `status`: Filtro por status (opcional)

**Response:**
```json
{
  "data": [
    {
      "id": "os-001",
      "numero": "OS-2025-001",
      "tipo_os": "COMERCIAL",
      "status": "FILA",
      "cliente": { "nome_fantasia": "Cliente Teste" }
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

#### GET /os/interna
Lista OS Internas com paginação e filtros.

**Query Parameters:**
- `page`: Página (padrão: 1)
- `limit`: Limite por página (padrão: 10)
- `status`: Filtro por status (opcional)

**Response:**
```json
{
  "data": [
    {
      "id": "os-002",
      "numero": "OSI-2025-001",
      "tipo_os": "INTERNA",
      "status": "FILA",
      "departamento_solicitante": "TI",
      "centro_custo": "CC-001"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

### Aprovações

#### PATCH /os/:id/aprovar-tecnica
Aprova ou rejeita OS técnica (OS Comercial).

**Body:**
```json
{
  "aprovado": true,
  "observacoes": "Aprovado com ressalvas"
}
```

**Response:**
```json
{
  "id": "os-001",
  "numero": "OS-2025-001",
  "aprovacao_tecnica_status": "APROVADA",
  "aprovacao_tecnica_por": "user-001",
  "aprovacao_tecnica_em": "2025-10-01T10:00:00.000Z",
  "aprovacao_tecnica_obs": "Aprovado com ressalvas",
  "versao": 2
}
```

#### PATCH /os/:id/aprovar-gerencial
Aprova ou rejeita OS gerencial (OS Interna).

**Body:**
```json
{
  "aprovado": true,
  "observacoes": "Aprovado"
}
```

**Response:**
```json
{
  "id": "os-002",
  "numero": "OSI-2025-001",
  "aprovacao_gerencial": "APROVADA",
  "aprovacao_gerencial_por": "user-001",
  "aprovacao_gerencial_em": "2025-10-01T10:00:00.000Z",
  "aprovacao_gerencial_obs": "Aprovado",
  "versao": 2
}
```

### Agendamento

#### PATCH /os/:id/agendar-instalacao
Agenda instalação (OS Comercial).

**Body:**
```json
{
  "dataInstalacao": "2025-10-15T10:00:00.000Z",
  "observacoes": "Instalação agendada"
}
```

**Response:**
```json
{
  "id": "os-001",
  "numero": "OS-2025-001",
  "data_instalacao_agendada": "2025-10-15T10:00:00.000Z",
  "observacoes_instalacao": "Instalação agendada",
  "versao": 2
}
```

### Listagens Especializadas

#### GET /os/pendentes/aprovacao-tecnica
Lista OS Comerciais pendentes de aprovação técnica.

**Query Parameters:**
- `page`: Página (padrão: 1)
- `limit`: Limite por página (padrão: 10)

**Response:**
```json
{
  "data": [
    {
      "id": "os-001",
      "numero": "OS-2025-001",
      "tipo_os": "COMERCIAL",
      "status": "FILA",
      "aprovacao_tecnica_status": "PENDENTE"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

#### GET /os/pendentes/aprovacao-gerencial
Lista OS Internas pendentes de aprovação gerencial.

**Query Parameters:**
- `page`: Página (padrão: 1)
- `limit`: Limite por página (padrão: 10)

**Response:**
```json
{
  "data": [
    {
      "id": "os-002",
      "numero": "OSI-2025-001",
      "tipo_os": "INTERNA",
      "status": "FILA",
      "aprovacao_gerencial": "PENDENTE"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

#### GET /os/instalacoes/agendadas
Lista instalações agendadas (OS Comerciais).

**Query Parameters:**
- `page`: Página (padrão: 1)
- `limit`: Limite por página (padrão: 10)
- `dataInicio`: Data início do período (opcional)
- `dataFim`: Data fim do período (opcional)

**Response:**
```json
{
  "data": [
    {
      "id": "os-001",
      "numero": "OS-2025-001",
      "tipo_os": "COMERCIAL",
      "data_instalacao_agendada": "2025-10-15T10:00:00.000Z",
      "observacoes_instalacao": "Instalação agendada"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

### Estatísticas

#### GET /os/estatisticas/tipo
Obtém estatísticas por tipo de OS.

**Query Parameters:**
- `ano`: Ano de referência (opcional, padrão: ano atual)

**Response:**
```json
{
  "sucesso": true,
  "lojaId": "loja-001",
  "ano": 2025,
  "estatisticas": {
    "comercial": {
      "total": 10,
      "porStatus": {
        "FILA": 5,
        "PRODUCAO": 3,
        "FINALIZADA": 2
      }
    },
    "interna": {
      "total": 5,
      "porStatus": {
        "FILA": 2,
        "PRODUCAO": 2,
        "FINALIZADA": 1
      }
    }
  }
}
```

## Validações e Segurança

### Validações de Tipo
- OS Comercial: Cliente obrigatório, aprovação técnica
- OS Interna: Departamento e centro de custo obrigatórios, aprovação gerencial

### Controle de Acesso
- Guards de permissão aplicados
- Validação de usuário autenticado
- Isolamento por loja

### Auditoria
- Controle de versão
- Log de modificações
- Rastreamento de usuário

## Testes

### Cobertura de Testes

#### Service Tests
- Criação de OS Comercial e Interna
- Aprovações diferenciadas
- Agendamento de instalação
- Listagens por tipo
- Estatísticas

#### Controller Tests
- Endpoints de criação
- Endpoints de listagem
- Endpoints de aprovação
- Endpoints de agendamento
- Endpoints de estatísticas

### Cenários Testados
- Criação com validações
- Aprovações com validações
- Agendamento com validações
- Listagens com paginação
- Estatísticas com filtros
- Tratamento de erros

## Performance

### Otimizações
- Queries otimizadas com índices
- Paginação eficiente
- Cache de estatísticas
- Validações em memória

### Monitoramento
- Logs de performance
- Métricas de uso
- Alertas de erro
- Dashboard de estatísticas

## Conformidade com PLANO

### ✅ Requisitos Atendidos

- [x] Services específicos por tipo
- [x] Controllers diferenciados
- [x] Endpoints REST completos
- [x] Aprovações diferenciadas
- [x] Agendamento de instalações
- [x] Listagens especializadas
- [x] Estatísticas por tipo
- [x] Testes unitários completos
- [x] Documentação detalhada

### 📋 Entregáveis

1. **OSService Estendido** - Métodos específicos implementados
2. **OSDiretaInternaController** - Endpoints REST completos
3. **Testes Unitários** - Cobertura completa de funcionalidades
4. **Documentação** - Este documento

### 🎯 Objetivos Alcançados

- Estrutura completa de services e controllers
- Funcionalidades diferenciadas por tipo
- APIs REST completas e bem documentadas
- Código bem testado e documentado

## Próximos Passos

### Melhorias Futuras

1. **Cache Avançado**: Cache de listagens e estatísticas
2. **Notificações**: Alertas de aprovação pendente
3. **Relatórios**: Dashboards avançados
4. **Integração**: APIs para sistemas externos

### Monitoramento

1. **Performance**: Tempo de resposta dos endpoints
2. **Uso**: Estatísticas de utilização
3. **Erros**: Logs de erro e exceções
4. **Auditoria**: Rastreamento de modificações

## Conclusão

A estrutura completa de services e controllers foi implementada com sucesso, fornecendo funcionalidades diferenciadas para OS Comercial e Interna. A implementação inclui endpoints REST completos, validações robustas, testes abrangentes e documentação detalhada.

A solução permite diferenciação clara entre tipos de OS, com fluxos específicos para cada contexto, garantindo que as funcionalidades sejam apropriadas para cada tipo de ordem de serviço.
