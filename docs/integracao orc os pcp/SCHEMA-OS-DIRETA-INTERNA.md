# Schema Prisma - Estrutura Completa para OS Direta/Interna

## Visão Geral

Este documento descreve as extensões do schema Prisma para suportar OS Direta (comercial) e OS Interna conforme o **PLANO Fase 1 - Item 7**.

## Objetivo

Estender o modelo `OrdemServico` para suportar:
- OS Comercial (Direta) - com cliente e valores
- OS Interna - com departamento e centro de custo
- Campos de controle e auditoria
- Validações específicas por tipo

## Estrutura do Schema

### Campos Adicionados ao Modelo OrdemServico

#### Campos de Diferenciação
```prisma
tipo_os                  String   @default("COMERCIAL") // COMERCIAL, INTERNA
origem_os                String?  // ORCAMENTO, DIRETA, INTERNA
prioridade               String   @default("NORMAL") // URGENTE, ALTA, NORMAL, BAIXA
```

#### Campos Específicos para OS Interna
```prisma
departamento_solicitante String?  // Departamento que solicitou a OS interna
centro_custo             String?  // Centro de custo para OS interna
projeto_interno          String?  // Projeto interno relacionado
aprovacao_gerencial      String?  @default("PENDENTE") // PENDENTE, APROVADA, REJEITADA
aprovacao_gerencial_por  String?  // usuario_id do aprovador gerencial
aprovacao_gerencial_em   DateTime? // data da aprovação gerencial
aprovacao_gerencial_obs  String?  @db.Text // observações da aprovação gerencial
```

#### Campos Específicos para OS Comercial
```prisma
valor_orcado             Decimal? @db.Decimal(12, 2) // Valor do orçamento aprovado
valor_realizado          Decimal? @db.Decimal(12, 2) // Valor real gasto na produção
margem_lucro_real        Decimal? @db.Decimal(5, 2) // Margem de lucro real obtida
data_entrega_cliente     DateTime? // Data real de entrega ao cliente
satisfacao_cliente       Int?     // Nota de satisfação do cliente (1-5)
observacoes_cliente      String?  @db.Text // Observações do cliente sobre o serviço
```

#### Campos de Controle e Auditoria
```prisma
criado_por               String?  // usuario_id que criou a OS
modificado_por           String?  // usuario_id que fez a última modificação
motivo_modificacao       String?  @db.Text // Motivo da última modificação
versao                   Int      @default(1) // Controle de versão da OS
```

### Índices Adicionados

```prisma
@@index([tipo_os])
@@index([origem_os])
@@index([prioridade])
@@index([departamento_solicitante])
@@index([centro_custo])
@@index([aprovacao_gerencial])
@@index([aprovacao_gerencial_por])
@@index([data_entrega_cliente])
@@index([criado_por])
@@index([modificado_por])
@@index([versao])
```

## Tipos e Enums

### Enums TypeScript

```typescript
export enum TipoOS {
  COMERCIAL = 'COMERCIAL',
  INTERNA = 'INTERNA'
}

export enum OrigemOS {
  ORCAMENTO = 'ORCAMENTO',
  DIRETA = 'DIRETA',
  INTERNA = 'INTERNA'
}

export enum PrioridadeOS {
  URGENTE = 'URGENTE',
  ALTA = 'ALTA',
  NORMAL = 'NORMAL',
  BAIXA = 'BAIXA'
}

export enum StatusAprovacao {
  PENDENTE = 'PENDENTE',
  APROVADA = 'APROVADA',
  REJEITADA = 'REJEITADA'
}
```

## Interfaces TypeScript

### OrdemServicoCompleta
```typescript
interface OrdemServicoCompleta {
  // Campos básicos existentes
  id: string;
  numero: string;
  loja_id: string;
  cliente_id: string;
  orcamento_id?: string;
  // ... outros campos básicos
  
  // Novos campos para diferenciação
  tipo_os: TipoOS;
  origem_os?: OrigemOS;
  prioridade: PrioridadeOS;
  
  // Campos específicos por tipo
  campos_interna?: CamposOSInterna;
  campos_comercial?: CamposOSComercial;
  
  // Campos de controle
  controle: CamposControleOS;
}
```

### DTOs de Criação

#### CreateOSDiretaDto
```typescript
interface CreateOSDiretaDto {
  loja_id: string;
  cliente_id: string;
  orcamento_id?: string;
  nome_servico: string;
  descricao?: string;
  quantidade: number;
  parametros_tecnicos?: string;
  prioridade?: PrioridadeOS;
  observacoes?: string;
  responsavel_id?: string;
  
  // Campos específicos comerciais
  valor_orcado?: number;
  data_entrega_cliente?: Date;
  
  // Campos de controle
  criado_por?: string;
}
```

#### CreateOSInternaDto
```typescript
interface CreateOSInternaDto {
  loja_id: string;
  departamento_solicitante: string;
  centro_custo: string;
  projeto_interno?: string;
  nome_servico: string;
  descricao?: string;
  quantidade: number;
  parametros_tecnicos?: string;
  prioridade?: PrioridadeOS;
  observacoes?: string;
  responsavel_id?: string;
  
  // Campos de controle
  criado_por?: string;
}
```

## Validações

### OSDiretaInternaValidator

O validador implementa regras específicas para cada tipo de OS:

#### Validações Gerais
- Tipo de OS válido
- Origem da OS válida
- Prioridade válida
- Status de aprovação válido

#### Validações para OS Interna
- `departamento_solicitante` obrigatório
- `centro_custo` obrigatório e formato válido (ex: CC-001, DEP-2024-001)
- Aprovação gerencial obrigatória

#### Validações para OS Comercial
- `cliente_id` obrigatório
- `satisfacao_cliente` entre 1 e 5
- Valores monetários não negativos
- `margem_lucro_real` entre 0 e 100%

#### Validações de Controle
- `versao` inteiro maior que 0
- `motivo_modificacao` mínimo 10 caracteres
- Permissões de modificação
- Transições de status válidas

## Migração do Banco

### Arquivo de Migração
`backend/prisma/migrations/20250101000003_add_os_direta_interna_fields/migration.sql`

### Comandos de Migração
```bash
# Aplicar migração
npx prisma migrate deploy

# Verificar status
npx prisma migrate status

# Reset (apenas desenvolvimento)
npx prisma migrate reset
```

### Rollback
```sql
-- Remover índices
DROP INDEX `OrdemServico_tipo_os_idx` ON `ordens_servico`;
DROP INDEX `OrdemServico_origem_os_idx` ON `ordens_servico`;
-- ... outros índices

-- Remover colunas
ALTER TABLE `ordens_servico` 
  DROP COLUMN `tipo_os`,
  DROP COLUMN `origem_os`,
  -- ... outras colunas
```

## Casos de Uso

### OS Comercial (Direta)
1. **Criação**: Cliente obrigatório, pode ter orçamento
2. **Aprovação**: Aprovação técnica obrigatória
3. **Controle**: Valores orçados e realizados
4. **Finalização**: Satisfação do cliente

### OS Interna
1. **Criação**: Departamento e centro de custo obrigatórios
2. **Aprovação**: Aprovação gerencial obrigatória
3. **Controle**: Projeto interno e centro de custo
4. **Finalização**: Controle de custos internos

### Fluxo de Aprovação

#### OS Comercial
```
FILA -> APROVACAO_TECNICA -> EM_PRODUCAO -> FINALIZADA
```

#### OS Interna
```
FILA -> APROVACAO_GERENCIAL -> EM_PRODUCAO -> FINALIZADA
```

## Relatórios e Consultas

### Consultas por Tipo
```sql
-- OS Comerciais
SELECT * FROM ordens_servico WHERE tipo_os = 'COMERCIAL';

-- OS Internas por departamento
SELECT * FROM ordens_servico 
WHERE tipo_os = 'INTERNA' 
AND departamento_solicitante = 'TI';
```

### Estatísticas
```sql
-- Performance por departamento
SELECT 
  departamento_solicitante,
  COUNT(*) as total_os,
  SUM(CASE WHEN aprovacao_gerencial = 'APROVADA' THEN 1 ELSE 0 END) as aprovadas
FROM ordens_servico 
WHERE tipo_os = 'INTERNA'
GROUP BY departamento_solicitante;
```

## Testes

### Testes Unitários
- `os-direta-interna.validator.spec.ts` - Validações
- Cobertura de todos os cenários de validação
- Testes de permissões e transições

### Testes de Integração
- Criação de OS por tipo
- Aprovações específicas
- Consultas e relatórios

## Conformidade com PLANO

### ✅ Requisitos Atendidos
- [x] Campos para OS Direta e Interna
- [x] Validações específicas por tipo
- [x] Controle de aprovações diferenciado
- [x] Campos de auditoria e controle
- [x] Índices para performance
- [x] Interfaces TypeScript completas
- [x] Testes unitários
- [x] Documentação detalhada

### 📋 Entregáveis
1. **Schema Prisma** - Campos adicionais no modelo OrdemServico
2. **Migração** - Script SQL para aplicar mudanças
3. **Interfaces** - Tipagem TypeScript completa
4. **Validador** - Regras de validação específicas
5. **Testes** - Cobertura completa de funcionalidades
6. **Documentação** - Este documento

### 🎯 Objetivos Alcançados
- Estrutura completa para OS Direta e Interna
- Validações robustas por tipo
- Controle de aprovações diferenciado
- Auditoria completa de modificações
- Performance otimizada com índices
- Código bem testado e documentado

## Próximos Passos

### Melhorias Futuras
1. **Relatórios Avançados**: Dashboard por tipo de OS
2. **Workflow**: Estados mais granulares
3. **Notificações**: Alertas por tipo de aprovação
4. **Integração**: APIs específicas por tipo

### Monitoramento
1. **Performance**: Queries com novos índices
2. **Validações**: Logs de erros de validação
3. **Aprovações**: Tempo médio por tipo
4. **Uso**: Estatísticas de criação por tipo

## Conclusão

O schema foi estendido com sucesso para suportar OS Direta e Interna, mantendo compatibilidade com dados existentes e fornecendo validações robustas. A implementação segue as melhores práticas de desenvolvimento com testes completos e documentação detalhada.

A estrutura permite flexibilidade para futuras extensões enquanto mantém a integridade dos dados e performance otimizada através de índices estratégicos.
