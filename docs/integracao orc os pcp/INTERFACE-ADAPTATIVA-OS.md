# 🎨 INTERFACE ADAPTATIVA PARA CRIAÇÃO DE OS

## Visão Geral

A Interface Adaptativa para criação de OS é uma solução completa que permite criar Ordens de Serviço tanto **Comerciais** quanto **Internas** através de uma interface intuitiva e condicional.

## Arquitetura da Solução

### Componentes Principais

1. **`OSTypeSelector`** - Seleção inicial do tipo de OS
2. **`OSWizard`** - Wizard com abas para criação detalhada
3. **`OSAdaptiveForm`** - Componente principal que orquestra o fluxo

### Fluxo de Navegação

```
Tela Inicial
    ↓
Seleção de Tipo (Comercial/Interna)
    ↓
Wizard com 6 Abas:
    ├── Básico
    ├── Insumos
    ├── Máquinas
    ├── Mão de Obra
    ├── Serviços
    └── Custos
    ↓
Criação da OS
```

## Funcionalidades Implementadas

### 1. Seleção de Tipo de OS

**Componente**: `OSTypeSelector`

- **Interface visual** com cards para cada tipo
- **Descrição clara** das diferenças entre OS Comercial e Interna
- **Features destacadas** para cada tipo
- **Seleção intuitiva** com feedback visual

**Tipos Suportados**:
- **OS Comercial**: Cliente obrigatório, aprovação técnica, valores comerciais
- **OS Interna**: Departamento solicitante, centro de custo, aprovação gerencial

### 2. Wizard de Criação

**Componente**: `OSWizard`

#### Aba 1: Básico
- **Campos condicionais** baseados no tipo de OS
- **Validações em tempo real** com Zod
- **Interface responsiva** para desktop e mobile

**Para OS Comercial**:
- Cliente (obrigatório)
- Nome do serviço
- Descrição
- Quantidade
- Data prazo
- Prioridade
- Valores comerciais

**Para OS Interna**:
- Departamento solicitante (obrigatório)
- Centro de custo (obrigatório)
- Projeto interno
- Justificativa interna (obrigatória)
- Valor estimado

#### Abas 2-6: Funcionalidades Avançadas
- **Insumos**: Configuração de materiais (placeholder)
- **Máquinas**: Seleção de equipamentos (placeholder)
- **Mão de Obra**: Definição de funções (placeholder)
- **Serviços**: Serviços manuais (placeholder)
- **Custos**: Valores e custos específicos

### 3. Validações Condicionais

**Schema Dinâmico**:
```typescript
// Schema base
const baseOSSchema = z.object({
  nome_servico: z.string().min(1, 'Nome do serviço é obrigatório'),
  quantidade: z.number().min(0.001, 'Quantidade deve ser maior que zero'),
  // ... outros campos base
});

// Schema para OS Comercial
const comercialSchema = baseOSSchema.extend({
  tipo_os: z.literal('COMERCIAL'),
  cliente_id: z.string().min(1, 'Cliente é obrigatório para OS Comercial'),
  // ... campos específicos comerciais
});

// Schema para OS Interna
const internaSchema = baseOSSchema.extend({
  tipo_os: z.literal('INTERNA'),
  departamento_solicitante: z.string().min(1, 'Departamento solicitante é obrigatório'),
  // ... campos específicos internos
});
```

### 4. Navegação Intuitiva

**Progress Steps**:
- **Indicador visual** do progresso atual
- **Navegação sequencial** com validação
- **Botões de navegação** (Anterior/Próximo)
- **Validação por etapa** antes de avançar

**Controles de Navegação**:
- Voltar para seleção de tipo
- Navegar entre abas do wizard
- Validação automática antes de avançar
- Botão de criação final

## Integração com Backend

### Endpoints Utilizados

**OS Comercial**:
```typescript
POST /os/comercial
```

**OS Interna**:
```typescript
POST /os/interna
```

### Dados Enviados

**Estrutura Condicional**:
```typescript
interface OSComercialData {
  tipo_os: 'COMERCIAL';
  cliente_id: string;
  nome_servico: string;
  quantidade: number;
  prioridade: 'BAIXA' | 'NORMAL' | 'ALTA' | 'URGENTE';
  valor_orcado?: number;
  valor_realizado?: number;
  data_entrega_cliente?: string;
  satisfacao_cliente?: number;
  observacoes_cliente?: string;
  // ... outros campos
}

interface OSInternaData {
  tipo_os: 'INTERNA';
  departamento_solicitante: string;
  centro_custo: string;
  projeto_interno?: string;
  justificativa_interna: string;
  valor_estimado?: number;
  // ... outros campos
}
```

## Experiência do Usuário

### 1. Interface Responsiva
- **Desktop**: Layout em grid com cards lado a lado
- **Mobile**: Layout em coluna única
- **Tablet**: Adaptação automática baseada no tamanho da tela

### 2. Feedback Visual
- **Estados de loading** durante operações
- **Mensagens de erro** contextuais
- **Validação em tempo real** com indicadores visuais
- **Progress steps** com indicadores de conclusão

### 3. Acessibilidade
- **Labels apropriados** para screen readers
- **Navegação por teclado** funcional
- **Contraste adequado** para leitura
- **Ícones descritivos** com texto alternativo

## Validações Implementadas

### Validações de Frontend
- **Campos obrigatórios** baseados no tipo de OS
- **Formato de dados** (números, datas, emails)
- **Validação de range** (satisfação 1-5, quantidades > 0)
- **Validação condicional** por tipo de OS

### Validações de Backend
- **Validação de negócio** no OSService
- **Verificação de permissões** por tipo de usuário
- **Validação de dados** com class-validator
- **Validação de integridade** referencial

## Extensibilidade

### Estrutura Modular
- **Componentes independentes** para fácil manutenção
- **Schemas separados** por tipo de OS
- **Validações centralizadas** em arquivos específicos
- **Estilos consistentes** com design system

### Preparação para Futuras Funcionalidades
- **Placeholders** para abas avançadas
- **Estrutura extensível** para novos campos
- **Validações preparadas** para novos tipos de OS
- **API preparada** para integração com outros módulos

## Testes e Qualidade

### Testes Implementados
- **Validação de schemas** com Zod
- **Testes de integração** com backend
- **Validação de formulários** em tempo real
- **Testes de navegação** entre etapas

### Qualidade de Código
- **TypeScript** para type safety
- **ESLint** para qualidade de código
- **Prettier** para formatação consistente
- **Componentes reutilizáveis** seguindo padrões

## Próximos Passos

### Funcionalidades Pendentes
1. **Implementação das abas avançadas** (Insumos, Máquinas, etc.)
2. **Integração com catálogo de insumos** existente
3. **Validação de estoque** em tempo real
4. **Cálculo automático de custos** baseado em insumos
5. **Templates de OS** para reutilização

### Melhorias Planejadas
1. **Autocomplete** para campos de cliente e departamento
2. **Upload de arquivos** para especificações técnicas
3. **Preview da OS** antes da criação
4. **Salvamento de rascunho** para continuar depois
5. **Histórico de alterações** e versionamento

## Conclusão

A Interface Adaptativa para criação de OS representa um avanço significativo na usabilidade do sistema, oferecendo:

- ✅ **Flexibilidade total** para diferentes tipos de OS
- ✅ **Interface intuitiva** com wizard guiado
- ✅ **Validações robustas** em tempo real
- ✅ **Experiência responsiva** em todos os dispositivos
- ✅ **Arquitetura extensível** para futuras funcionalidades
- ✅ **Integração completa** com backend existente

Esta implementação atende completamente ao **Item 11 da Fase 1** do plano de ação, estabelecendo uma base sólida para o desenvolvimento das funcionalidades avançadas de OS Direta/Interna.
