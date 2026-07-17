# Plano de Ação - Serviços Manuais V2
## Sistema de Categorias por Tamanho

### 📋 **Visão Geral**

Este documento detalha a implementação do novo sistema de serviços manuais com categorias de tamanho, permitindo cálculos mais realistas e intuitivos para serviços como montagem, instalação e acabamento.

### 🎯 **Objetivo**

Substituir o cálculo "por m²" por um sistema de categorias baseado em tamanho e complexidade, onde cada categoria tem um tempo específico por peça, considerando quantidade, eficiência e setup.

---

## 🔍 **Análise do Problema**

### **Problema Atual:**
- Serviços manuais calculados "por m²" não fazem sentido para muitos casos
- Exemplo: "Montagem de Banner" - não importa se é 1m² ou 10m², o tempo por peça é similar
- Falta de flexibilidade para diferentes tamanhos e complexidades

### **Solução Proposta:**
- Sistema de categorias baseado em área limite
- Tempo específico por categoria (em minutos)
- Cálculo automático baseado no tamanho individual da peça
- Aplicação de quantidade, setup e eficiência

---

## 🏗️ **Arquitetura da Solução**

### **Novo Tipo de Cálculo:**
- **Nome**: `POR_PECA_COM_CATEGORIA`
- **Descrição**: "Por peça com categoria"
- **Lógica**: Baseado em categorias de tamanho com tempo específico

### **Estrutura de Dados:**

#### **Serviço Manual:**
```typescript
interface ServicoManual {
  id: string;
  nome: string;
  descricao?: string;
  custo_hora: number | string;
  tipo_calculo: 'ACOMPANHA_MAQUINA' | 'POR_M2' | 'POR_UNIDADE' | 'POR_PECA_COM_CATEGORIA' | 'MANUAL';
  horas_por_m2?: number | string;
  horas_por_unidade?: number | string;
  eficiencia_percent?: number | string;
  setup_min?: number | string;  // Novo campo
  categorias?: Array<{          // Novo campo
    nome: string;
    ate_m2: number;
    tempo_min: number | string;
  }>;
}
```

#### **Categorias:**
```json
{
  "categorias": [
    {
      "nome": "Pequeno",
      "ate_m2": 2.0,
      "tempo_min": 15
    },
    {
      "nome": "Médio", 
      "ate_m2": 6.0,
      "tempo_min": 25
    },
    {
      "nome": "Grande",
      "ate_m2": 999.0,
      "tempo_min": 40
    }
  ]
}
```

### **Características das Categorias:**
- **Categorias de tamanho**: Nomenclatura flexível (ex: Simples, Padrão, Complexo ou Pequeno, Médio, Grande)
- **Limite de área**: Campo `ate_m2` define até qual área a categoria se aplica
- **Tempo por peça**: Campo `tempo_min` em minutos para cada categoria
- **Setup obrigatório**: Campo `setup_min` para tempo de preparação
- **Flexibilidade**: Empresa pode definir nomes e quantidades de categorias

---

## 🧮 **Fluxo de Cálculo**

### **1. Seleção de Categoria:**
```javascript
// Encontrar categoria baseada na área individual do produto
const categoria = categorias.find(cat => areaIndividual <= cat.ate_m2) || 
                  categorias[categorias.length - 1]; // Última categoria como fallback
```

### **2. Conversão de Tempo:**
```javascript
// Converter tempo_min para minutos (suporte a HH:MM, decimal, minutos)
let tempoMin = 0;
if (typeof categoria.tempo_min === 'number') {
  tempoMin = categoria.tempo_min < 24 ? categoria.tempo_min * 60 : categoria.tempo_min;
} else if (categoria.tempo_min.includes(':')) {
  const [horas, minutos] = categoria.tempo_min.split(':').map(Number);
  tempoMin = (horas * 60) + minutos;
}
```

### **3. Cálculo Final:**
```javascript
const horasBase = (quantidade * tempoMin) / 60;  // Converter para horas
const setupHoras = setup_min / 60;               // Setup em horas
const fatorEficiencia = 100 / eficiencia_percent; // 80% = 1.25x
const horasTotal = (horasBase + setupHoras) * fatorEficiencia;
```

### **4. Exemplo Prático:**
```
Produto: Banner 1.2m² (quantidade: 100)
Serviço: Montagem de Banner

Categoria: Pequeno (até 2m²) - 15 min
- Tempo por peça: 15 min
- Quantidade: 100 peças  
- Tempo base: 100 × 15 min = 1.500 min = 25h
- Setup: 30 min = 0.5h
- Eficiência: 80% → Fator 1.25
- Total: (25h + 0.5h) × 1.25 = 31.875h
```

---

## 📊 **Estrutura do Banco de Dados**

### **Schema Prisma:**
```prisma
model servico_manual {
  // ... campos existentes
  setup_min          Decimal?            @db.Decimal(10, 2)
  categorias         String?             @db.LongText
  // ... outros campos
}

enum funcao_tipo_calculo {
  // ... tipos existentes
  POR_PECA_COM_CATEGORIA
  MANUAL
}
```

### **Armazenamento:**
- **setup_min**: Decimal para minutos de setup
- **categorias**: JSON stringificado no banco, parseado no frontend

---

## 🖥️ **Interface do Usuário**

### **Formulário de Serviço Manual:**

#### **Campos Principais:**
- Nome do serviço
- Descrição
- Custo por hora
- Tipo de cálculo (dropdown com nova opção)
- Eficiência (%)

#### **Campos Condicionais:**
Quando `tipo_calculo = 'POR_PECA_COM_CATEGORIA'`:
- **Setup (HH:MM)**: Tempo de preparação
- **Grid de Categorias**: Tabela dinâmica para adicionar/remover categorias

#### **Grid de Categorias:**
| Nome | Até (m²) | Tempo (HH:MM) | Ações |
|------|----------|---------------|--------|
| Pequeno | 2.0 | 00:15 | 🗑️ |
| Médio | 6.0 | 00:25 | 🗑️ |
| Grande | 999.0 | 00:40 | 🗑️ |

#### **Componentes Utilizados:**
- `TimeInput`: Para campos de tempo (HH:MM)
- `InfoTooltip`: Explicações sobre o tipo de cálculo
- `CustomCurrencyInput`: Para valores monetários
- `DataTable`: Grid de categorias

### **Preview/Disclaimer:**
```
Categorias configuradas: Pequeno (até 2.0m², 00:15), Médio (até 6.0m², 00:25), 
Grande (até 999.0m², 00:40). O cálculo será feito automaticamente baseado no 
tamanho da peça.
```

### **Listagem de Serviços:**

#### **Coluna Tipo de Cálculo:**
- Tipos normais: Texto simples
- `POR_PECA_COM_CATEGORIA`: Botão "Ver Categorias"

#### **Modal de Categorias:**
- Overlay semi-transparente com blur
- Lista das categorias configuradas
- Fecha ao clicar fora ou no botão fechar

---

## 🔧 **Implementação Técnica**

### **Backend (NestJS + Prisma):**

#### **ServicosManuaisService:**
```typescript
// CREATE
create(data: any, loja: loja) {
  const payload = {
    // ... campos existentes
    setup_min: normalize(data.setup_min),
    categorias: data.categorias ? JSON.stringify(data.categorias) : null,
  };
  return this.prisma.servico_manual.create({ data: payload });
}

// READ
async findAll(loja: loja) {
  const servicos = await this.prisma.servico_manual.findMany(/* ... */);
  return servicos.map(servico => ({
    ...servico,
    categorias: servico.categorias ? JSON.parse(servico.categorias) : null
  }));
}
```

### **Frontend (Next.js + React Hook Form):**

#### **Validação (Zod):**
```typescript
const formSchema = z.object({
  // ... campos existentes
  setup_min: z.string().optional(),
  categorias: z.array(z.object({
    nome: z.string().min(1, 'Nome é obrigatório'),
    ate_m2: z.number().min(0.1, 'Área deve ser maior que 0'),
    tempo_min: z.any().optional() // Flexível para HH:MM
  })).optional(),
});
```

#### **Conversão de Dados:**
```typescript
// Submit: HH:MM → minutos (number)
const categoriasConvertidas = categorias.map(cat => ({
  ...cat,
  tempo_min: converterHHMMParaMinutos(cat.tempo_min)
}));

// Load: minutos (number) → HH:MM (string)  
const categoriasFormatadas = categorias.map(cat => ({
  ...cat,
  tempo_min: converterMinutosParaHHMM(cat.tempo_min)
}));
```

### **Integração com Orçamento V2:**

#### **ServicoSection.tsx:**
```typescript
// Cálculo automático para POR_PECA_COM_CATEGORIA
if (selecionado?.tipo_calculo === 'POR_PECA_COM_CATEGORIA') {
  const categoria = selecionado.categorias.find(cat => areaM2 <= cat.ate_m2) || 
                    selecionado.categorias[selecionado.categorias.length - 1];
  
  if (categoria) {
    const tempoMin = converterParaMinutos(categoria.tempo_min);
    const horasBase = (qtd * tempoMin) / 60;
    const setupHoras = toNumber(selecionado.setup_min) / 60;
    const fatorEficiencia = 100 / eff;
    horasAuto = (horasBase + setupHoras) * fatorEficiencia;
  }
}
```

---

## ✅ **Backlog de Implementação**

### **Fase 1: Backend** ✅
- [x] Atualizar schema Prisma
- [x] Executar migração do banco
- [x] Atualizar ServicosManuaisService
- [x] Testar endpoints CRUD

### **Fase 2: Frontend - CRUD** ✅
- [x] Atualizar interface ServicoManual
- [x] Implementar formulário com grid de categorias
- [x] Adicionar validações Zod
- [x] Implementar conversão HH:MM ↔ minutos
- [x] Testar criação e edição

### **Fase 3: Frontend - Listagem** ✅
- [x] Atualizar grid de serviços
- [x] Adicionar botão "Ver Categorias"
- [x] Implementar modal de categorias
- [x] Melhorar UX do modal

### **Fase 4: Integração Orçamento V2** ✅
- [x] Atualizar ServicoSection
- [x] Implementar lógica de cálculo automático
- [x] Testar integração completa
- [x] Validar cálculos

### **Fase 5: Refinamentos** ✅
- [x] Corrigir conversões de tempo
- [x] Ajustar validações e limites
- [x] Melhorar formatação de preview
- [x] Otimizar performance

---

## 🎯 **Critérios de Aceite**

### **Funcionalidades Básicas:**
- [x] Criar serviço manual com tipo "Por peça com categoria"
- [x] Configurar múltiplas categorias com nome, limite de área e tempo
- [x] Editar serviços existentes mantendo categorias
- [x] Visualizar categorias na listagem

### **Cálculos:**
- [x] Seleção automática de categoria baseada na área individual
- [x] Cálculo correto considerando quantidade de peças
- [x] Aplicação de setup e eficiência
- [x] Conversão correta entre formatos de tempo

### **Interface:**
- [x] Formulário intuitivo com grid dinâmico
- [x] Validações em tempo real
- [x] Preview das categorias configuradas
- [x] Modal informativo na listagem

### **Integração:**
- [x] Funcionamento no Orçamento V2
- [x] Cálculo automático de horas
- [x] Compatibilidade com outros tipos de cálculo
- [x] Performance adequada

---

## 📈 **Exemplos de Uso**

### **Exemplo 1: Montagem de Banner**
```
Serviço: Montagem de Banner
Tipo: Por peça com categoria
Custo/hora: R$ 25,00
Eficiência: 80%
Setup: 30 min

Categorias:
- Pequeno (até 2m²): 15 min
- Médio (até 6m²): 25 min  
- Grande (6m²+): 40 min

Produto: Banner 1.2m² × 100 unidades
→ Categoria: Pequeno (15 min)
→ Cálculo: (100 × 15min + 30min setup) ÷ 60 × 1.25 eficiência = 32.125h
→ Custo: 32.125h × R$ 25,00 = R$ 803,13
```

### **Exemplo 2: Instalação de Painel**
```
Serviço: Instalação de Painel
Tipo: Por peça com categoria
Custo/hora: R$ 35,00
Eficiência: 70%
Setup: 60 min

Categorias:
- Simples (até 4m²): 30 min
- Padrão (até 10m²): 45 min
- Complexo (10m²+): 90 min

Produto: Painel 8m² × 5 unidades
→ Categoria: Padrão (45 min)
→ Cálculo: (5 × 45min + 60min setup) ÷ 60 × 1.43 eficiência = 7.15h
→ Custo: 7.15h × R$ 35,00 = R$ 250,25
```

---

## ⏱️ **Estimativa de Tempo**

### **Desenvolvimento Total:** ~5 dias
- **Backend:** 1 dia
- **Frontend CRUD:** 2 dias  
- **Frontend Listagem:** 1 dia
- **Integração Orçamento:** 1 dia
- **Testes e Refinamentos:** Contínuo

### **Status Atual:** ✅ **CONCLUÍDO**
- Todas as fases foram implementadas e testadas
- Sistema funcionando em produção
- Cálculos validados e precisos
- Interface intuitiva e responsiva

---

## 🚀 **Próximos Passos**

### **Melhorias Futuras:**
- [ ] Relatórios de desempenho por categoria
- [ ] Histórico de tempos reais vs. estimados
- [ ] Sugestões automáticas de categorias
- [ ] Templates de categorias por tipo de serviço

### **Otimizações:**
- [ ] Cache de categorias no frontend
- [ ] Validação de sobreposição de categorias
- [ ] Importação/exportação de configurações
- [ ] Auditoria de mudanças

---

## 📝 **Notas Técnicas**

### **Conversões de Tempo:**
- **HH:MM → Minutos**: `(horas * 60) + minutos`
- **Decimal → Minutos**: `< 24 ? valor * 60 : valor`
- **Validação**: Máximo 8 horas (480 min) por categoria

### **Validações de Segurança:**
- Setup máximo: 2 horas (120 min)
- Resultado máximo: 100 horas
- Conversão automática de valores altos

### **Performance:**
- JSON parsing otimizado
- Memoização de cálculos
- Lazy loading de categorias

---

**Documento criado em:** Setembro 2025  
**Última atualização:** Setembro 2025  
**Status:** ✅ Implementado e Funcional
