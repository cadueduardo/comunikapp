# Validações Condicionais para OS Comercial vs Interna

## Visão Geral

Este documento descreve as validações condicionais implementadas no OSService para garantir integridade dos dados específicos por tipo de OS conforme o **PLANO Fase 1 - Item 9**.

## Objetivo

Implementar validações específicas que se aplicam apenas a:
- OS Comercial - com cliente e valores
- OS Interna - com departamento e centro de custo
- Transições de status específicas por tipo
- Atualizações condicionais

## Arquitetura

### Componentes Principais

1. **OSService** (`backend/src/os/services/os.service.ts`)
   - Validações básicas comuns
   - Validações específicas por tipo
   - Validações de transição de status
   - Validações de atualização

2. **Testes Unitários** (`backend/src/os/services/__tests__/os-validacoes-condicionais.spec.ts`)
   - Cobertura completa de validações
   - Cenários específicos por tipo
   - Testes de transições

## Validações Implementadas

### Validações Básicas (Aplicáveis a Todos os Tipos)

#### Campos Obrigatórios
```typescript
// Nome do serviço
if (!dados.nome_servico || dados.nome_servico.trim() === '') {
  throw new BadRequestException('Nome do serviço é obrigatório');
}

// Quantidade
if (!dados.quantidade || dados.quantidade <= 0) {
  throw new BadRequestException('Quantidade deve ser maior que zero');
}
```

#### Validações de Integridade
```typescript
// Loja deve existir
const loja = await this.prisma.loja.findUnique({ where: { id: lojaId } });
if (!loja) {
  throw new BadRequestException(`Loja ${lojaId} não encontrada`);
}

// Prioridade válida
const prioridadesValidas = ['URGENTE', 'ALTA', 'NORMAL', 'BAIXA'];
if (dados.prioridade && !prioridadesValidas.includes(dados.prioridade)) {
  throw new BadRequestException(`Prioridade inválida: ${dados.prioridade}`);
}

// Responsável deve existir
if (dados.responsavel_id) {
  const responsavel = await this.prisma.usuario.findUnique({
    where: { id: dados.responsavel_id }
  });
  if (!responsavel) {
    throw new BadRequestException(`Responsável ${dados.responsavel_id} não encontrado`);
  }
}
```

### Validações OS Comercial

#### Campos Obrigatórios
```typescript
// Cliente é obrigatório
if (!dados.cliente_id) {
  throw new BadRequestException('Cliente é obrigatório para OS Comercial');
}

// Validar se cliente existe
const cliente = await this.prisma.cliente.findUnique({
  where: { id: dados.cliente_id }
});
if (!cliente) {
  throw new BadRequestException(`Cliente ${dados.cliente_id} não encontrado`);
}
```

#### Validações de Orçamento
```typescript
if (dados.orcamento_id) {
  const orcamento = await this.prisma.orcamento.findUnique({
    where: { id: dados.orcamento_id },
    include: { produtos: true }
  });
  
  if (!orcamento) {
    throw new BadRequestException(`Orçamento ${dados.orcamento_id} não encontrado`);
  }

  if (orcamento.loja_id !== lojaId) {
    throw new BadRequestException('Orçamento não pertence à loja informada');
  }

  if (orcamento.status_aprovacao !== 'APROVADO') {
    throw new BadRequestException('Orçamento deve estar aprovado para gerar OS');
  }

  if (!orcamento.produtos || orcamento.produtos.length === 0) {
    throw new BadRequestException('Orçamento deve ter pelo menos um produto');
  }
}
```

#### Validações Monetárias
```typescript
// Valor orçado não pode ser negativo
if (dados.valor_orcado !== undefined && dados.valor_orcado < 0) {
  throw new BadRequestException('Valor orçado não pode ser negativo');
}

// Satisfação do cliente (1-5)
if (dados.satisfacao_cliente !== undefined) {
  if (!Number.isInteger(dados.satisfacao_cliente) || 
      dados.satisfacao_cliente < 1 || 
      dados.satisfacao_cliente > 5) {
    throw new BadRequestException('Satisfação do cliente deve ser um número inteiro entre 1 e 5');
  }
}
```

### Validações OS Interna

#### Campos Obrigatórios
```typescript
// Departamento solicitante é obrigatório
if (!dados.departamento_solicitante || dados.departamento_solicitante.trim() === '') {
  throw new BadRequestException('Departamento solicitante é obrigatório para OS Interna');
}

// Centro de custo é obrigatório
if (!dados.centro_custo || dados.centro_custo.trim() === '') {
  throw new BadRequestException('Centro de custo é obrigatório para OS Interna');
}
```

#### Validação de Formato
```typescript
// Centro de custo deve ter formato válido
const regexCentroCusto = /^[A-Z]{2,4}-[A-Z0-9-]+$/;
if (!regexCentroCusto.test(dados.centro_custo)) {
  throw new BadRequestException('Centro de custo deve ter formato válido (ex: CC-001, DEP-2024-001)');
}
```

#### Campos Proibidos
```typescript
// Cliente não deve ser informado
if (dados.cliente_id) {
  throw new BadRequestException('Cliente não deve ser informado para OS Interna');
}

// Orçamento não deve ser informado
if (dados.orcamento_id) {
  throw new BadRequestException('Orçamento não deve ser informado para OS Interna');
}

// Campos específicos de OS Comercial não se aplicam
if (dados.valor_orcado !== undefined) {
  throw new BadRequestException('Valor orçado não se aplica a OS Interna');
}

if (dados.satisfacao_cliente !== undefined) {
  throw new BadRequestException('Satisfação do cliente não se aplica a OS Interna');
}
```

## Validações de Transição de Status

### Transições Válidas
```typescript
const transicoesValidas = {
  'FILA': ['PRODUCAO', 'CANCELADA', 'PAUSADA'],
  'PRODUCAO': ['ACABAMENTO', 'PAUSADA', 'AGUARDANDO_MATERIAL'],
  'ACABAMENTO': ['FINALIZADA', 'PRODUCAO'],
  'PAUSADA': ['FILA', 'PRODUCAO', 'ACABAMENTO'],
  'AGUARDANDO_MATERIAL': ['FILA', 'PRODUCAO'],
  'FINALIZADA': [],
  'CANCELADA': []
};
```

### Validações Condicionais por Tipo

#### OS Comercial
```typescript
// Aprovação técnica obrigatória antes de PRODUCAO
if (novaEtapa === 'PRODUCAO') {
  if (os.aprovacao_tecnica_status !== 'APROVADA') {
    return {
      valida: false,
      motivo: 'OS Comercial deve ter aprovação técnica antes de iniciar produção'
    };
  }
}

// Materiais disponíveis para finalização
if (novaEtapa === 'FINALIZADA') {
  if (!os.materiais_disponivel) {
    return {
      valida: false,
      motivo: 'Materiais devem estar disponíveis para finalizar OS'
    };
  }
}
```

#### OS Interna
```typescript
// Aprovação gerencial obrigatória antes de PRODUCAO
if (novaEtapa === 'PRODUCAO') {
  if (os.aprovacao_gerencial !== 'APROVADA') {
    return {
      valida: false,
      motivo: 'OS Interna deve ter aprovação gerencial antes de iniciar produção'
    };
  }
}
```

## Validações de Atualização

### Validações Básicas
```typescript
// OS não pode ser modificada em status final
const statusBloqueados = ['FINALIZADA', 'CANCELADA'];
if (statusBloqueados.includes(os.status)) {
  throw new BadRequestException(`OS não pode ser modificada no status: ${os.status}`);
}

// Verificar permissões de modificação
if (os.criado_por && os.criado_por !== usuarioId) {
  throw new BadRequestException('Apenas o criador da OS pode modificá-la');
}
```

### Validações Condicionais por Tipo

#### OS Comercial
```typescript
// Satisfação do cliente (1-5)
if (dados.satisfacao_cliente !== undefined) {
  if (!Number.isInteger(dados.satisfacao_cliente) || 
      dados.satisfacao_cliente < 1 || 
      dados.satisfacao_cliente > 5) {
    throw new BadRequestException('Satisfação do cliente deve ser um número inteiro entre 1 e 5');
  }
}

// Valor realizado não pode ser negativo
if (dados.valor_realizado !== undefined && dados.valor_realizado < 0) {
  throw new BadRequestException('Valor realizado não pode ser negativo');
}

// Margem de lucro (0-100%)
if (dados.margem_lucro_real !== undefined) {
  if (dados.margem_lucro_real < 0 || dados.margem_lucro_real > 100) {
    throw new BadRequestException('Margem de lucro deve estar entre 0 e 100%');
  }
}

// Campos de OS Interna não se aplicam
if (dados.departamento_solicitante !== undefined) {
  throw new BadRequestException('Departamento solicitante não se aplica a OS Comercial');
}
```

#### OS Interna
```typescript
// Centro de custo deve ter formato válido
if (dados.centro_custo !== undefined) {
  const regexCentroCusto = /^[A-Z]{2,4}-[A-Z0-9-]+$/;
  if (!regexCentroCusto.test(dados.centro_custo)) {
    throw new BadRequestException('Centro de custo deve ter formato válido');
  }
}

// Campos de OS Comercial não se aplicam
if (dados.satisfacao_cliente !== undefined) {
  throw new BadRequestException('Satisfação do cliente não se aplica a OS Interna');
}
```

## Fluxo de Validação

### Criação de OS
```
1. Validar dados básicos (loja, campos obrigatórios, prioridade, responsável)
2. Validar dados específicos por tipo:
   - OS Comercial: cliente, orçamento, valores monetários
   - OS Interna: departamento, centro de custo, campos proibidos
3. Gerar código diferenciado
4. Criar OS com validações aplicadas
```

### Atualização de OS
```
1. Verificar se OS pode ser modificada (status não final)
2. Verificar permissões de usuário
3. Validar campos específicos por tipo
4. Aplicar atualizações
```

### Transição de Status
```
1. Verificar transição válida (matriz de transições)
2. Aplicar validações condicionais por tipo:
   - OS Comercial: aprovação técnica, materiais disponíveis
   - OS Interna: aprovação gerencial
3. Executar transição se válida
```

## Casos de Uso

### OS Comercial
1. **Criação**: Cliente obrigatório, orçamento opcional mas aprovado
2. **Transição**: Aprovação técnica antes de produção
3. **Finalização**: Materiais disponíveis obrigatório
4. **Atualização**: Valores monetários válidos

### OS Interna
1. **Criação**: Departamento e centro de custo obrigatórios
2. **Transição**: Aprovação gerencial antes de produção
3. **Atualização**: Centro de custo com formato válido
4. **Restrições**: Campos comerciais proibidos

## Testes

### Cenários Testados

#### Validações Básicas
- Loja inexistente
- Nome do serviço vazio
- Quantidade zero/negativa
- Prioridade inválida
- Responsável inexistente

#### OS Comercial
- Cliente obrigatório
- Cliente inexistente
- Orçamento não aprovado
- Valor orçado negativo
- Satisfação inválida

#### OS Interna
- Departamento obrigatório
- Centro de custo obrigatório
- Centro de custo formato inválido
- Cliente proibido
- Orçamento proibido
- Campos comerciais proibidos

#### Transições
- OS Comercial sem aprovação técnica
- OS Interna sem aprovação gerencial
- Finalização sem materiais
- Transições válidas

## Conformidade com PLANO

### ✅ Requisitos Atendidos

- [x] Validações específicas por tipo de OS
- [x] Campos obrigatórios diferenciados
- [x] Validações de transição de status
- [x] Validações de atualização condicionais
- [x] Integridade de dados garantida
- [x] Testes unitários completos
- [x] Documentação detalhada

### 📋 Entregáveis

1. **OSService** - Validações condicionais implementadas
2. **Testes Unitários** - Cobertura completa de cenários
3. **Documentação** - Este documento

### 🎯 Objetivos Alcançados

- Validações robustas por tipo de OS
- Integridade de dados garantida
- Fluxos específicos por tipo
- Código bem testado e documentado

## Próximos Passos

### Melhorias Futuras

1. **Permissões Granulares**: Validação de permissões de usuário
2. **Validações Customizáveis**: Regras configuráveis por loja
3. **Auditoria**: Log de validações aplicadas
4. **Performance**: Cache de validações frequentes

### Monitoramento

1. **Validações Falhadas**: Log de erros de validação
2. **Performance**: Tempo de validação
3. **Uso**: Estatísticas de validações por tipo
4. **Erros**: Padrões de validação falhada

## Conclusão

As validações condicionais foram implementadas com sucesso, garantindo integridade dos dados específicos por tipo de OS. A implementação fornece validações robustas, fluxos específicos e testes completos, mantendo a flexibilidade e performance do sistema.

A solução permite diferenciação clara entre OS Comercial e Interna, com validações apropriadas para cada contexto, garantindo que os dados sejam consistentes e que os fluxos de trabalho sejam respeitados.
