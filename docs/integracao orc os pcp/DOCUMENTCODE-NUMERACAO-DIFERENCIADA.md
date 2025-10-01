# DocumentCodeService - Numeração Diferenciada

## Visão Geral

Este documento descreve as extensões do DocumentCodeService para suportar numeração diferenciada entre OS Comercial e OS Interna conforme o **PLANO Fase 1 - Item 8**.

## Objetivo

Implementar numeração diferenciada para:
- OS Comercial: formato `OS-AAAA-NNN`
- OS Interna: formato `OSI-AAAA-NNN`
- Sequências independentes por tipo e loja
- Validações e utilitários para códigos

## Arquitetura

### Componentes Principais

1. **DocumentCodeService** (`backend/src/documentos/document-code.service.ts`)
   - Service principal para geração de códigos
   - Métodos específicos por tipo de OS
   - Validações e utilitários

2. **DocumentCodeController** (`backend/src/documentos/document-code.controller.ts`)
   - Endpoints REST para funcionalidades de numeração
   - Validação e análise de códigos
   - Estatísticas e relatórios

3. **DocumentosModule** (`backend/src/documentos/documentos.module.ts`)
   - Módulo NestJS com service e controller
   - Exportação para outros módulos

## Funcionalidades Implementadas

### Geração de Códigos

#### Métodos Principais
```typescript
// Geração por tipo específico
async gerarCodigoOSComercial(lojaId: string, ano?: number): Promise<string>
async gerarCodigoOSInterna(lojaId: string, ano?: number): Promise<string>

// Geração baseada no tipo
async gerarCodigoOSPorTipo(lojaId: string, tipoOS: TipoOS, ano?: number): Promise<string>
```

#### Exemplos de Uso
```typescript
// OS Comercial
const codigoComercial = await documentCodeService.gerarCodigoOSComercial('loja-001', 2025);
// Resultado: "OS-2025-001"

// OS Interna
const codigoInterna = await documentCodeService.gerarCodigoOSInterna('loja-001', 2025);
// Resultado: "OSI-2025-001"

// Por tipo
const codigo = await documentCodeService.gerarCodigoOSPorTipo('loja-001', TipoOS.COMERCIAL, 2025);
// Resultado: "OS-2025-001"
```

### Validação de Códigos

#### Validação de Formato
```typescript
validarCodigoOS(codigo: string): { valido: boolean; tipo?: TipoOS; erro?: string }
```

#### Exemplos
```typescript
// Códigos válidos
validarCodigoOS('OS-2025-001')   // { valido: true, tipo: TipoOS.COMERCIAL }
validarCodigoOS('OSI-2025-001')  // { valido: true, tipo: TipoOS.INTERNA }

// Códigos inválidos
validarCodigoOS('OS-25-001')     // { valido: false, erro: 'Formato inválido...' }
validarCodigoOS('OSI-2025-1')    // { valido: false, erro: 'Formato inválido...' }
```

### Extração de Informações

#### Análise de Código
```typescript
extrairInformacoesCodigo(codigo: string): { tipo: TipoOS; ano: number; numero: number } | null
```

#### Exemplos
```typescript
extrairInformacoesCodigo('OS-2025-001')
// { tipo: TipoOS.COMERCIAL, ano: 2025, numero: 1 }

extrairInformacoesCodigo('OSI-2025-001')
// { tipo: TipoOS.INTERNA, ano: 2025, numero: 1 }
```

### Verificação de Existência

#### Verificação no Banco
```typescript
async verificarCodigoExistente(codigo: string, lojaId: string): Promise<boolean>
```

#### Exemplos
```typescript
await verificarCodigoExistente('OS-2025-001', 'loja-001')  // true
await verificarCodigoExistente('OS-2025-999', 'loja-001')  // false
```

### Estatísticas e Relatórios

#### Estatísticas por Tipo
```typescript
async obterEstatisticasNumeracao(lojaId: string, ano?: number): Promise<{
  comercial: { total: number; ultimoNumero: number };
  interna: { total: number; ultimoNumero: number };
}>
```

#### Próximo Número
```typescript
async obterProximoNumero(lojaId: string, tipoOS: TipoOS, ano?: number): Promise<number>
```

## Endpoints REST

### POST /documentos/os/gerar
Gera código para OS baseado no tipo.

**Body:**
```json
{
  "lojaId": "loja-001",
  "tipoOS": "COMERCIAL",
  "ano": 2025
}
```

**Response:**
```json
{
  "sucesso": true,
  "codigo": "OS-2025-001",
  "tipo": "COMERCIAL",
  "lojaId": "loja-001",
  "ano": 2025
}
```

### GET /documentos/os/validar/:codigo
Valida formato de código de OS.

**Response:**
```json
{
  "sucesso": true,
  "codigo": "OS-2025-001",
  "valido": true,
  "tipo": "COMERCIAL",
  "erro": null
}
```

### GET /documentos/os/info/:codigo
Extrai informações de um código de OS.

**Response:**
```json
{
  "sucesso": true,
  "codigo": "OS-2025-001",
  "informacoes": {
    "tipo": "COMERCIAL",
    "ano": 2025,
    "numero": 1
  }
}
```

### GET /documentos/os/existe/:codigo/:lojaId
Verifica se código já existe no banco.

**Response:**
```json
{
  "sucesso": true,
  "codigo": "OS-2025-001",
  "lojaId": "loja-001",
  "existe": true
}
```

### GET /documentos/os/estatisticas/:lojaId
Obtém estatísticas de numeração por tipo.

**Response:**
```json
{
  "sucesso": true,
  "lojaId": "loja-001",
  "ano": 2025,
  "estatisticas": {
    "comercial": { "total": 10, "ultimoNumero": 10 },
    "interna": { "total": 5, "ultimoNumero": 5 }
  }
}
```

### GET /documentos/os/proximo/:lojaId/:tipoOS
Obtém próximo número disponível para um tipo.

**Response:**
```json
{
  "sucesso": true,
  "lojaId": "loja-001",
  "tipoOS": "COMERCIAL",
  "ano": 2025,
  "proximoNumero": 11
}
```

### GET /documentos/tipos
Lista tipos de OS disponíveis.

**Response:**
```json
{
  "sucesso": true,
  "tipos": [
    {
      "valor": "COMERCIAL",
      "label": "Comercial",
      "prefixo": "OS",
      "formato": "OS-AAAA-NNN"
    },
    {
      "valor": "INTERNA",
      "label": "Interna",
      "prefixo": "OSI",
      "formato": "OSI-AAAA-NNN"
    }
  ]
}
```

## Estrutura do Banco

### Tabela document_sequence

A tabela `document_sequence` é usada para controlar as sequências de numeração:

```sql
CREATE TABLE document_sequences (
  id VARCHAR(191) PRIMARY KEY,
  loja_id VARCHAR(191) NOT NULL,
  tipo VARCHAR(191) NOT NULL,  -- 'OS' ou 'OSI'
  ano INT NOT NULL,
  ultimo_numero INT DEFAULT 0,
  criado_em DATETIME DEFAULT NOW(),
  atualizado_em DATETIME DEFAULT NOW(),
  
  UNIQUE KEY loja_id_tipo_ano (loja_id, tipo, ano),
  INDEX idx_loja_id (loja_id)
);
```

### Sequências Separadas

- **OS Comercial**: `tipo = 'OS'`
- **OS Interna**: `tipo = 'OSI'`

Cada combinação `(loja_id, tipo, ano)` tem sua própria sequência independente.

## Padrões de Numeração

### Formato dos Códigos

#### OS Comercial
- **Padrão**: `OS-AAAA-NNN`
- **Exemplo**: `OS-2025-001`
- **Prefixo**: `OS`
- **Ano**: 4 dígitos
- **Número**: 3 dígitos com zero à esquerda

#### OS Interna
- **Padrão**: `OSI-AAAA-NNN`
- **Exemplo**: `OSI-2025-001`
- **Prefixo**: `OSI`
- **Ano**: 4 dígitos
- **Número**: 3 dígitos com zero à esquerda

### Regras de Validação

1. **Formato**: Regex específico para cada tipo
2. **Ano**: Deve ser ano válido (4 dígitos)
3. **Número**: Deve ser sequencial (3 dígitos)
4. **Prefixo**: Deve corresponder ao tipo

### Regex de Validação

```typescript
// OS Comercial: OS-AAAA-NNN
const regexOSComercial = /^OS-\d{4}-\d{3}$/;

// OS Interna: OSI-AAAA-NNN
const regexOSInterna = /^OSI-\d{4}-\d{3}$/;
```

## Integração com Outros Módulos

### Uso no OSService

```typescript
// No OSService
async criarOS(dados: CreateOSDto, lojaId: string, usuarioId: string) {
  const codigo = await this.documentCodeService.gerarCodigoOSPorTipo(
    lojaId, 
    dados.tipo_os, 
    new Date().getFullYear()
  );
  
  // Criar OS com código gerado
  const os = await this.prisma.ordemServico.create({
    data: {
      ...dados,
      numero: codigo,
      loja_id: lojaId,
      criado_por: usuarioId
    }
  });
  
  return os;
}
```

### Uso no Frontend

```typescript
// Gerar código antes de criar OS
const response = await fetch('/api/documentos/os/gerar', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    lojaId: 'loja-001',
    tipoOS: 'COMERCIAL',
    ano: 2025
  })
});

const { codigo } = await response.json();
// Usar codigo na criação da OS
```

## Testes

### Testes Unitários

- **DocumentCodeService**: Testa geração, validação e utilitários
- **DocumentCodeController**: Testa endpoints e tratamento de erros

### Cenários Testados

1. **Geração de Códigos**
   - OS Comercial e Interna
   - Sequências independentes
   - Anos diferentes

2. **Validação**
   - Formatos válidos e inválidos
   - Regex específicos
   - Mensagens de erro

3. **Utilitários**
   - Extração de informações
   - Verificação de existência
   - Estatísticas

4. **Endpoints**
   - Parâmetros válidos e inválidos
   - Tratamento de erros
   - Respostas estruturadas

## Performance e Otimização

### Índices do Banco

```sql
-- Índice único para sequências
UNIQUE KEY loja_id_tipo_ano (loja_id, tipo, ano)

-- Índice para consultas por loja
INDEX idx_loja_id (loja_id)
```

### Transações

- Geração de códigos usa transações para evitar conflitos
- Upsert atômico para incremento de sequência
- Rollback automático em caso de erro

### Cache

- Sequências são consultadas apenas quando necessário
- Estatísticas podem ser cacheadas por período
- Validações são feitas em memória (regex)

## Conformidade com PLANO

### ✅ Requisitos Atendidos

- [x] Numeração diferenciada por tipo
- [x] Sequências independentes
- [x] Validações robustas
- [x] Endpoints REST completos
- [x] Integração com sistema existente
- [x] Testes unitários
- [x] Documentação detalhada

### 📋 Entregáveis

1. **DocumentCodeService** - Service estendido com novos métodos
2. **DocumentCodeController** - Endpoints REST para funcionalidades
3. **Testes Unitários** - Cobertura completa de funcionalidades
4. **Documentação** - Este documento

### 🎯 Objetivos Alcançados

- Numeração diferenciada implementada
- Sequências independentes por tipo
- Validações robustas de formato
- APIs REST completas
- Integração com sistema existente
- Código bem testado e documentado

## Próximos Passos

### Melhorias Futuras

1. **Cache de Sequências**: Otimizar performance
2. **Relatórios Avançados**: Dashboard de numeração
3. **Configurações**: Prefixos customizáveis por loja
4. **Auditoria**: Log de geração de códigos

### Monitoramento

1. **Performance**: Tempo de geração de códigos
2. **Conflitos**: Detecção de códigos duplicados
3. **Uso**: Estatísticas de geração por tipo
4. **Erros**: Logs de validação falhada

## Conclusão

O DocumentCodeService foi estendido com sucesso para suportar numeração diferenciada entre OS Comercial e Interna. A implementação mantém compatibilidade com o sistema existente, fornece validações robustas e APIs REST completas.

A solução permite sequências independentes por tipo, facilitando a identificação visual e o controle de numeração, enquanto mantém a performance otimizada através de transações atômicas e índices estratégicos.
