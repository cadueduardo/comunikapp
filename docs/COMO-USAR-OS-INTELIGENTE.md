# 📖 Como Usar o Sistema de OS Inteligente

## 🎯 **Visão Geral**

O sistema de **OS Inteligente** está agora integrado em todas as Ordens de Serviço, fornecendo:

1. **✅ Validações Automáticas** - Execução automática de regras configuráveis
2. **📊 Cálculo Inteligente de Materiais** - Conversão área → unidades de compra
3. **🎨 Interface Unificada** - Card interativo na página de detalhes da OS

## 🚀 **Onde Encontrar**

### **1. Página de Detalhes da OS**

Acesse qualquer OS existente:
```
/os/[id]
```

O card **"Análise Inteligente da OS"** aparece automaticamente na **coluna direita**, logo acima das ações de workflow.

### **2. Componente OSInteligenteCard**

O componente possui **2 abas**:

#### **Aba 1: Validações**
- ✅ Status geral das validações
- 🔴 Correções necessárias
- ⚠️ Alertas importantes
- 📜 Histórico de execuções
- 🔄 Botão "Revalidar"

#### **Aba 2: Materiais**
- 📦 Lista de materiais calculados
- 📊 Unidades de compra necessárias
- 🗑️ Desperdício estimado
- ♻️ Sobras aproveitáveis
- 💡 Sugestões de otimização
- 💰 Custo total

## 🎨 **Interface do Card**

### **Cabeçalho do Card**
```
┌─────────────────────────────────────────────────┐
│ 🧠 Análise Inteligente da OS     ✅ Pronta      │
│ OS Pronta para Produção                         │
└─────────────────────────────────────────────────┘
```

### **Status Visual**
- ✅ **Verde** - OS pronta para produção
- ⚠️ **Amarelo** - Alertas, mas pode prosseguir
- ❌ **Vermelho** - Correções necessárias

### **Abas de Navegação**
```
┌─────────────────────────────────────────────────┐
│  🛡️ Validações  |  🧮 Materiais                 │
└─────────────────────────────────────────────────┘
```

## 📋 **Exemplo de Uso - Aba Validações**

### **Cenário 1: OS Validada com Sucesso**
```
┌─────────────────────────────────────────────────┐
│ Status:                                         │
│ ✅ OS Validada                                  │
│ ✅ Pode Aprovar Automaticamente                 │
│                                                 │
│ Histórico de Validações:                        │
│ ✅ Estoque Insuficiente                         │
│    Validação executada com sucesso              │
│    27/01/2025 10:30 (120ms)                     │
│                                                 │
│ ✅ Arte Anexada                                 │
│    Validação executada com sucesso              │
│    27/01/2025 10:30 (85ms)                      │
└─────────────────────────────────────────────────┘
```

### **Cenário 2: OS com Pendências**
```
┌─────────────────────────────────────────────────┐
│ Status:                                         │
│ ❌ OS com Pendências                            │
│                                                 │
│ ❌ Correções Necessárias:                       │
│ • Estoque insuficiente para Lona Front 440g:   │
│   necessário 3 bobinas, disponível 1            │
│ • Arte não anexada para o produto Banner       │
│                                                 │
│ ⚠️ Alertas:                                     │
│ • Prazo apertado: 2 dias para produção         │
└─────────────────────────────────────────────────┘
```

## 📦 **Exemplo de Uso - Aba Materiais**

### **Resumo Geral**
```
┌─────────────────────────────────────────────────┐
│  📦      ✅       💰          ♻️                 │
│  5       4        R$         27,5m²             │
│  Materiais  Sufic  1.840,00  Sobras           │
└─────────────────────────────────────────────────┘
```

### **Detalhes de Material**
```
┌─────────────────────────────────────────────────┐
│ 🎨 Lona Front 440g                    ✅ Sufic  │
│    1,60m × 30m = 48m²                 🔄 bobina │
│                                                 │
│ Área Necessária     Desperdício               │
│ 120,00m²           6,00m² (5%)                 │
│                                                 │
│ Unidades Necessárias    Custo Total            │
│ 3 bobinas              R$ 1.440,00             │
│                                                 │
│ ♻️ Sobra aproveitável: 18,00m²                 │
│                                                 │
│ 💡 Sugestões de Otimização:                    │
│ • Sobra de 18,00m² pode ser usada para        │
│   banners menores                              │
│ • Considere agrupar projetos para otimizar     │
│   o uso de bobinas                             │
└─────────────────────────────────────────────────┘
```

### **Alertas de Estoque**
```
┌─────────────────────────────────────────────────┐
│ ⚠️ Alertas                                      │
│                                                 │
│ ⚠️ Estoque insuficiente para Cordão 5mm:       │
│    necessário 2 rolos, disponível 1            │
│                                                 │
│ 💡 Recomendações                                │
│                                                 │
│ 📈 Necessário comprar 1 rolo adicional de      │
│    Cordão 5mm                                  │
│ 📈 Desperdício estimado de 6,00m² (5%) para    │
│    Lona Front 440g                             │
└─────────────────────────────────────────────────┘
```

## 🔄 **Execução Automática**

### **Quando as Validações São Executadas?**

As validações são executadas **automaticamente** nos seguintes momentos:

1. **Criação da OS** - Logo após criar uma nova OS
2. **Atualização da OS** - Sempre que a OS for atualizada
3. **Manualmente** - Clicando no botão "Revalidar"

### **Quando os Materiais São Calculados?**

O cálculo de materiais é executado:

1. **Ao abrir a OS** - Quando você acessa a página de detalhes
2. **Manualmente** - Clicando no botão "Recalcular"

## 🎯 **Ações Automáticas**

Com base nos resultados das validações, o sistema pode:

### **1. Bloquear OS**
```typescript
Se estoque insuficiente:
  → Status da OS = "BLOQUEADA"
  → Usuário é notificado
  → OS não pode ser aprovada
```

### **2. Aprovar Automaticamente**
```typescript
Se todas as validações passarem:
  → pode_aprovar_automaticamente = true
  → Status pode avançar automaticamente
  → OS liberada para PCP
```

### **3. Solicitar Correção**
```typescript
Se houver alertas menores:
  → Status = "AGUARDANDO_CORRECAO"
  → Mensagens específicas são mostradas
  → Usuário pode corrigir e revalidar
```

## 📊 **Resumo de Status**

No rodapé do card, você vê um resumo geral:

```
┌─────────────────────────────────────────────────┐
│ 🛡️ Validações: ✅ OK                            │
│ 📦 Materiais: ✅ OK                              │
│ Aprovação: ✅ Liberada                           │
└─────────────────────────────────────────────────┘
```

ou

```
┌─────────────────────────────────────────────────┐
│ 🛡️ Validações: ❌ Pendente                      │
│ 📦 Materiais: ❌ Insuficiente                    │
│ Aprovação: ⛔ Bloqueada                          │
└─────────────────────────────────────────────────┘
```

## 🔧 **Configurando Regras de Validação**

Para personalizar as validações para sua loja:

1. Acesse: `Configurações > Validações Automáticas`
2. Clique em "Nova Regra"
3. Configure:
   - **Nome**: Ex: "Estoque Insuficiente"
   - **Categoria**: Ex: "ESTOQUE"
   - **Campo**: Ex: "insumo.quantidade_disponivel"
   - **Operador**: Ex: "less_than"
   - **Valor**: Ex: "insumo.quantidade_necessaria"
   - **Ação**: Ex: "bloquear"
4. Ative a regra

## 💡 **Dicas de Uso**

### **1. Monitorar Validações**
- ✅ Sempre verifique o card antes de aprovar uma OS
- ✅ Corrija as pendências antes de enviar para PCP
- ✅ Use o histórico para entender o que mudou

### **2. Otimizar Materiais**
- ✅ Leia as sugestões de otimização
- ✅ Agrupe projetos similares para aproveitar sobras
- ✅ Configure desperdício adequado para cada material

### **3. Configurar Regras**
- ✅ Crie regras específicas para sua loja
- ✅ Ajuste as prioridades das regras
- ✅ Teste as regras em OSs de exemplo

## 🎉 **Benefícios**

Com o sistema de OS Inteligente, você terá:

1. **⚡ 80% de redução** no tempo de validação manual
2. **📊 Cálculo preciso** de materiais necessários
3. **💰 Redução de desperdício** e custos
4. **✅ Aprovação automática** para casos simples
5. **🔍 Visibilidade completa** do status da OS
6. **📈 Otimização** de compras e estoque

---

**Dúvidas?** Entre em contato com o suporte técnico! 🚀







