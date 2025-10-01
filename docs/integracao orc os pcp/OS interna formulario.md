<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Análise do Formulário de OS e Plano de Ação

## **Análise do Formulário Atual vs. Necessidades de OS Direta**

### **Campos Presentes no Formulário Atual:**

1. **Cliente*** - Campo obrigatório
2. **Nome do Serviço*** - Campo obrigatório
3. **Descrição** - Campo opcional
4. **Quantidade*** - Campo obrigatório
5. **Data Prazo** - Campo opcional
6. **Responsável** - Campo opcional
7. **Observações** - Campo opcional

### **Avaliação Crítica: ❌ FORMULÁRIO INSUFICIENTE**

**Principais Limitações Identificadas:**

#### **1. Dependência Obrigatória de Cliente**

- Seu formulário atual **EXIGE** um cliente vinculado
- **NÃO CONTEMPLA** os cenários de OS interna/estoque/marketing que discutimos
- **Campo "Cliente" é obrigatório** (marcado com asterisco), impedindo OS sem cliente[^1]


#### **2. Falta de Campos Específicos para OS Interna**

Campos necessários ausentes:

- **Departamento Solicitante** (Marketing, Produção, Vendas)
- **Finalidade da OS** (Estoque, Amostra, Uso Interno, Manutenção)
- **Centro de Custo** para apropriação financeira
- **Tipo de OS** (Comercial vs Interna)
- **Aprovação Orçamentária** (para controle de gastos internos)


#### **3. Informações Técnicas Limitadas**

Ausentes no formulário:

- **Especificações técnicas** (materiais, impressão, acabamentos)
- **Recursos necessários** (máquinas, mão de obra, insumos)
- **Prioridade** da OS
- **Valor estimado** (importante mesmo para OS interna)


## **Verificação no Plano de Ação**

### **✅ Contempla OS Sem Orçamento (Parcialmente)**

Seu plano **menciona** OS direta, mas foca principalmente no fluxo Orçamento → OS:

> "Reaproveitamento: 90% dos dados da OS vem do orçamento V2"[^1]

### **❌ NÃO Contempla OS Sem Cliente**

O plano atual **NÃO PREVÊ** cenários de OS sem cliente. Todas as referências são sobre:

- Criar OS **DE** orçamento aprovado
- Cliente sempre presente nos 40 campos mapeados
- Validações assumem cliente existente[^1]


## **Proposta de Melhorias**

### **1. Reformular o Formulário com Condicionalidade**

```typescript
// Estrutura Condicional Sugerida
interface NovaOSForm {
  // Seletor de Tipo (NOVO)
  tipo_os: 'COMERCIAL' | 'INTERNA';
  
  // Campos Condicionais por Tipo
  // Se COMERCIAL:
  cliente_id?: string; // Obrigatório para comercial
  orcamento_origem_id?: string; // Opcional (pode criar OS direta)
  
  // Se INTERNA:
  departamento_solicitante?: 'MARKETING' | 'PRODUCAO' | 'VENDAS';
  finalidade?: 'ESTOQUE' | 'AMOSTRA' | 'USO_INTERNO' | 'MANUTENCAO';
  centro_custo?: string;
  responsavel_interno?: string;
  justificativa?: string;
  
  // Campos Sempre Presentes
  nome_servico: string;
  descricao?: string;
  quantidade: number;
  data_prazo?: Date;
  observacoes?: string;
  valor_estimado?: number; // Importante para controle
  prioridade: 'BAIXA' | 'NORMAL' | 'ALTA' | 'URGENTE';
}
```


### **2. Interface de Usuário Adaptativa**

**Tela Inicial - Seleção de Tipo:**

```
┌─────────────────────────────────────────┐
│        CRIAR NOVA ORDEM DE SERVIÇO       │
├─────────────────────────────────────────┤
│ Selecione o tipo de OS:                 │
│                                         │
│ ○ Comercial (com cliente)               │
│   Criar OS para cliente externo        │
│                                         │
│ ○ Interna (sem cliente)                 │
│   Produção para estoque, marketing, etc │
│                                         │
│ [Continuar]                             │
└─────────────────────────────────────────┘
```

**Se Comercial - Formulário Atual + Melhorias:**

```
┌─────────────────────────────────────────┐
│     ORDEM DE SERVIÇO - COMERCIAL        │
├─────────────────────────────────────────┤
│ ○ Criar de Orçamento Aprovado           │
│   Orçamento: [Selecionar▼]             │
│                                         │
│ ○ Criar OS Direta (sem orçamento)      │
│   Cliente*: [Selecionar▼]              │
│   Nome do Serviço*: [_______________]   │
│   Descrição: [_____________________]    │
│   Quantidade*: [____]                   │
│   Valor Estimado: R$ [__________]       │
│   Data Prazo: [dd/mm/aaaa]             │
│   Prioridade: [Normal▼]                 │
│   Responsável: [Selecionar▼]            │
│   Observações: [___________________]    │
└─────────────────────────────────────────┘
```

**Se Interna - Formulário Específico:**

```
┌─────────────────────────────────────────┐
│      ORDEM DE SERVIÇO - INTERNA         │
├─────────────────────────────────────────┤
│ Departamento Solicitante*:              │
│ ○ Marketing  ○ Produção  ○ Vendas      │
│                                         │
│ Finalidade*: [Estoque▼]                 │
│ Centro de Custo*: [001.002 - Marketing▼]│
│ Responsável Interno*: [João Silva▼]     │
│                                         │
│ Nome do Serviço*: [_______________]     │
│ Descrição/Justificativa:                │
│ [Material promocional para feira FESPA] │
│                                         │
│ Quantidade*: [^100] Un: [unidades▼]      │
│ Valor Estimado: R$ [850,00]             │
│ Data Necessidade: [15/10/2024]          │
│ Prioridade: [Normal▼]                   │
│                                         │
│ Observações: [_____________________]    │
└─────────────────────────────────────────┘
```


### **3. Atualização no Schema do Plano**

**Adicionar ao Plano de Ação (Fase 1):**

```markdown
## Campos para OS Interna (NOVO - adicionar aos 4 campos novos)

5. **OrdemServico.tipo_os** (Enum: 'COMERCIAL', 'INTERNA')
6. **OrdemServico.departamento_solicitante** (String opcional)
7. **OrdemServico.finalidade_interna** (String opcional)  
8. **OrdemServico.centro_custo** (String opcional)
9. **OrdemServico.justificativa_interna** (Text opcional)

## Validações Condicionais

- Se tipo_os = 'COMERCIAL': cliente_id obrigatório
- Se tipo_os = 'INTERNA': departamento_solicitante, finalidade_interna e centro_custo obrigatórios
- Se origem_orcamento existe: herdar 90% dos dados (atual)
- Se origem_orcamento NULL: usuário preenche manualmente
```


### **4. Numeração Diferenciada**

**Atualizar DocumentCodeService:**

```typescript
// Tipos de OS
OS-2024-001234  // Comercial com orçamento
OSD-2024-001235 // Comercial direta (sem orçamento)  
OSI-2024-001236 // Interna
OSE-2024-001237 // Estoque
OSM-2024-001238 // Marketing
```


### **5. Aprovações e Controles**

**Para OS Interna:**

- **Alçada por valor**: até R\$ 500 - aprovação automática
- **R\$ 500 a R\$ 2000**: aprovação gerente departamento
- **Acima R\$ 2000**: aprovação diretoria
- **Centro de custo**: validar se tem orçamento disponível


## **Implementação Prioritária**

### **Fase 1A (Adicional) - Suporte a OS Interna (2 semanas)**

1. **Estender schema** com novos campos tipo_os, departamento_solicitante, etc.
2. **Criar validações condicionais** no backend
3. **Implementar interface adaptativa** no frontend
4. **Atualizar DocumentCodeService** para novos prefixos
5. **Criar controles de aprovação** por alçada
6. **Testes** para todos os cenários

### **Benefícios Imediatos**

- ✅ **Flexibilidade total**: OS com ou sem cliente/orçamento
- ✅ **Controle financeiro**: centro de custo e aprovações
- ✅ **Rastreabilidade**: numeração específica por tipo
- ✅ **Governança**: alçadas e justificativas obrigatórias
- ✅ **Praticidade**: interface intuitiva e contextual

**Conclusão**: Seu formulário atual é muito simples e **não contempla** OS sem cliente. É necessária uma reformulação significativa para atender às práticas de mercado que discutimos. O plano de ação precisa incluir explicitamente esses cenários na Fase 1.
<span style="display:none">[^2]</span>

<div align="center">⁂</div>

[^1]: plano-acao-integracao-orc-os-pcp.md

[^2]: image.jpg

