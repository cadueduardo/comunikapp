# 🧮 Cálculo Inteligente de Materiais - OS

## 📋 **Problema Identificado**

### **Situação Atual (Problemática):**
```
OS: Banner 120m²
Materiais calculados:
• Bobina Lona: 27 unidades (irreal - deveria ser 2-3)
• Madeira Banner: 100 unidades (irreal - deveria ser 1-2)  
• Cordão Banner: 120 unidades (irreal - deveria ser metros lineares)
```

### **Causas Raiz:**
1. **Lógica de consumo incorreta**: Todos materiais usam `logica_consumo: 'area'`
2. **Falta de cálculo por unidade**: Não considera dimensões reais dos materiais
3. **Multiplicação inadequada**: Aplica multiplicação por quantidade do produto incorretamente

## 🎯 **Solução: Sistema de Cálculo Inteligente**

### **1. Lógicas de Consumo Específicas por Material**

#### **Enum Expandido:**
```typescript
enum LogicaConsumoInsumo {
  AREA = 'area',                    // Para materiais por m² (lonas, tecidos)
  PERIMETRO = 'perimetro',          // Para materiais lineares (cordões, cabos)
  QUANTIDADE_FIXA = 'quantidade_fixa', // Para materiais por unidade (madeira, parafusos)
  UNIDADE_INTELIGENTE = 'unidade_inteligente', // Para cálculos complexos
  CUSTOM = 'custom'                 // Para lógicas personalizadas
}
```

#### **Exemplos de Aplicação:**
```typescript
const LOGICAS_MATERIAIS = {
  'Bobina Lona Impressão Digital': {
    logica: 'AREA',
    unidade_compra: 'BOBINA',
    dimensoes: { largura: 1.4, altura: 50, area_total: 70 }, // m²
    calculo: 'area_necessaria / area_por_bobina'
  },
  'Cabo De Madeira Para Banner': {
    logica: 'UNIDADE_INTELIGENTE',
    unidade_compra: 'UN',
    dimensoes: { comprimento: 1.05 }, // metros
    uso_necessario: 1.0, // metros por banner
    calculo: 'quantidade_banners * (uso_necessario / comprimento_unidade)'
  },
  'Cordao Para Banner': {
    logica: 'PERIMETRO',
    unidade_compra: 'M',
    calculo: 'perimetro_banner * quantidade_banners'
  }
};
```

### **2. Motor de Cálculo Inteligente**

```typescript
@Injectable()
export class CalculoMaterialInteligenteService {
  
  /**
   * Calcula quantidade necessária baseada na lógica específica do material
   */
  async calcularQuantidadeMaterial(
    insumo: InsumoComDimensoes,
    produto: ProdutoOS,
    parametros: ParametrosCalculo
  ): Promise<CalculoMaterialResultado> {
    
    switch (insumo.logica_consumo) {
      case 'AREA':
        return this.calcularPorArea(insumo, produto, parametros);
      
      case 'PERIMETRO':
        return this.calcularPorPerimetro(insumo, produto, parametros);
      
      case 'QUANTIDADE_FIXA':
        return this.calcularQuantidadeFixa(insumo, produto, parametros);
      
      case 'UNIDADE_INTELIGENTE':
        return this.calcularUnidadeInteligente(insumo, produto, parametros);
      
      case 'CUSTOM':
        return this.calcularCustom(insumo, produto, parametros);
      
      default:
        return this.calcularPadrao(insumo, produto, parametros);
    }
  }

  /**
   * Cálculo por área (bobinas, lonas, tecidos)
   */
  private calcularPorArea(
    insumo: InsumoComDimensoes,
    produto: ProdutoOS,
    parametros: ParametrosCalculo
  ): CalculoMaterialResultado {
    
    // 1. Calcular área total necessária
    const areaNecessaria = produto.largura * produto.altura * produto.quantidade;
    
    // 2. Aplicar desperdício padrão
    const desperdicio = insumo.desperdicio_padrao || 5; // %
    const areaComDesperdicio = areaNecessaria * (1 + desperdicio / 100);
    
    // 3. Calcular unidades necessárias
    const unidadesNecessarias = Math.ceil(areaComDesperdicio / insumo.area_total);
    
    // 4. Calcular sobras
    const areaTotalComprar = unidadesNecessarias * insumo.area_total;
    const sobraAproveitavel = areaTotalComprar - areaComDesperdicio;
    
    return {
      quantidade_necessaria: unidadesNecessarias,
      area_necessaria: areaNecessaria,
      area_com_desperdicio: areaComDesperdicio,
      sobra_aproveitavel: sobraAproveitavel,
      desperdicio_estimado: sobraAproveitavel * (desperdicio / 100),
      unidade: insumo.unidade_compra,
      logica_aplicada: 'AREA',
      otimizacoes: this.sugerirOtimizacoesArea(insumo, areaNecessaria, unidadesNecessarias)
    };
  }

  /**
   * Cálculo por perímetro (cordões, cabos, fitas)
   */
  private calcularPorPerimetro(
    insumo: InsumoComDimensoes,
    produto: ProdutoOS,
    parametros: ParametrosCalculo
  ): CalculoMaterialResultado {
    
    // 1. Calcular perímetro do produto
    const perimetro = (produto.largura + produto.altura) * 2;
    
    // 2. Aplicar quantidade de produtos
    const metrosNecessarios = perimetro * produto.quantidade;
    
    // 3. Aplicar desperdício para cortes
    const desperdicio = insumo.desperdicio_padrao || 10; // % para cordões
    const metrosComDesperdicio = metrosNecessarios * (1 + desperdicio / 100);
    
    // 4. Converter para unidade de compra
    const unidadesNecessarias = Math.ceil(metrosComDesperdicio / insumo.comprimento_unidade);
    
    return {
      quantidade_necessaria: unidadesNecessarias,
      metros_necessarios: metrosNecessarios,
      metros_com_desperdicio: metrosComDesperdicio,
      perimetro_produto: perimetro,
      unidade: insumo.unidade_compra,
      logica_aplicada: 'PERIMETRO',
      otimizacoes: this.sugerirOtimizacoesPerimetro(insumo, metrosNecessarios)
    };
  }

  /**
   * Cálculo inteligente por unidade (madeira, parafusos, peças)
   */
  private calcularUnidadeInteligente(
    insumo: InsumoComDimensoes,
    produto: ProdutoOS,
    parametros: ParametrosCalculo
  ): CalculoMaterialResultado {
    
    // 1. Determinar uso necessário por produto
    const usoNecessario = this.determinarUsoNecessario(insumo, produto);
    
    // 2. Calcular aproveitamento por unidade
    const aproveitamentoPorUnidade = this.calcularAproveitamento(insumo, usoNecessario);
    
    // 3. Calcular unidades necessárias
    const unidadesNecessarias = Math.ceil(produto.quantidade / aproveitamentoPorUnidade);
    
    // 4. Calcular desperdício
    const desperdicio = this.calcularDesperdicio(insumo, usoNecessario, aproveitamentoPorUnidade);
    
    return {
      quantidade_necessaria: unidadesNecessarias,
      uso_necessario_por_produto: usoNecessario,
      aproveitamento_por_unidade: aproveitamentoPorUnidade,
      desperdicio_estimado: desperdicio,
      unidade: insumo.unidade_compra,
      logica_aplicada: 'UNIDADE_INTELIGENTE',
      otimizacoes: this.sugerirOtimizacoesUnidade(insumo, usoNecessario, aproveitamentoPorUnidade)
    };
  }

  /**
   * Determina uso necessário baseado no tipo de material
   */
  private determinarUsoNecessario(
    insumo: InsumoComDimensoes,
    produto: ProdutoOS
  ): number {
    
    // Exemplo: Madeira para banner
    if (insumo.nome.includes('Madeira') && insumo.nome.includes('Banner')) {
      // Madeira de 105cm, uso de 100cm por banner
      return 1.0; // 1 unidade por banner
    }
    
    // Exemplo: Parafusos
    if (insumo.nome.includes('Parafuso')) {
      return insumo.parametros_consumo?.quantidade_por_produto || 4; // 4 parafusos por banner
    }
    
    // Padrão: 1 unidade por produto
    return 1;
  }

  /**
   * Calcula quantos produtos cabem em uma unidade do material
   */
  private calcularAproveitamento(
    insumo: InsumoComDimensoes,
    usoNecessario: number
  ): number {
    
    // Para madeira: 105cm disponível, 100cm necessário = 1 produto por unidade
    if (insumo.comprimento_unidade && usoNecessario) {
      return Math.floor(insumo.comprimento_unidade / usoNecessario);
    }
    
    // Para parafusos: 1 unidade = 1 produto
    return 1;
  }

  /**
   * Calcula desperdício em unidades
   */
  private calcularDesperdicio(
    insumo: InsumoComDimensoes,
    usoNecessario: number,
    aproveitamentoPorUnidade: number
  ): number {
    
    if (insumo.comprimento_unidade && usoNecessario) {
      const sobraPorUnidade = insumo.comprimento_unidade - (usoNecessario * aproveitamentoPorUnidade);
      return sobraPorUnidade;
    }
    
    return 0;
  }
}
```

### **3. Exemplos Práticos de Cálculo**

#### **Exemplo 1: Bobina Lona (Área)**
```typescript
// Entrada
insumo = {
  nome: 'Bobina Lona Impressão Digital',
  logica_consumo: 'AREA',
  unidade_compra: 'BOBINA',
  dimensoes: { largura: 1.4, altura: 50, area_total: 70 }, // m²
  desperdicio_padrao: 5
};

produto = {
  nome: 'Banner',
  largura: 1.2, // metros
  altura: 1.0,  // metros
  quantidade: 100 // unidades
};

// Cálculo
areaNecessaria = 1.2 * 1.0 * 100 = 120m²
areaComDesperdicio = 120 * 1.05 = 126m²
unidadesNecessarias = Math.ceil(126 / 70) = 2 bobinas
sobraAproveitavel = (2 * 70) - 126 = 14m²

// Resultado
{
  quantidade_necessaria: 2,
  area_necessaria: 120,
  sobra_aproveitavel: 14,
  unidade: 'BOBINA'
}
```

#### **Exemplo 2: Madeira Banner (Unidade Inteligente)**
```typescript
// Entrada
insumo = {
  nome: 'Cabo De Madeira Para Banner',
  logica_consumo: 'UNIDADE_INTELIGENTE',
  unidade_compra: 'UN',
  dimensoes: { comprimento: 1.05 }, // metros
  uso_necessario: 1.0 // metros por banner
};

produto = {
  nome: 'Banner',
  quantidade: 100 // unidades
};

// Cálculo
aproveitamentoPorUnidade = Math.floor(1.05 / 1.0) = 1
unidadesNecessarias = Math.ceil(100 / 1) = 100
desperdicio = 1.05 - (1.0 * 1) = 0.05m por unidade

// Resultado
{
  quantidade_necessaria: 100,
  aproveitamento_por_unidade: 1,
  desperdicio_estimado: 0.05,
  unidade: 'UN'
}
```

#### **Exemplo 3: Cordão Banner (Perímetro)**
```typescript
// Entrada
insumo = {
  nome: 'Cordao Para Banner',
  logica_consumo: 'PERIMETRO',
  unidade_compra: 'M',
  comprimento_unidade: 205, // metros por rolo
  desperdicio_padrao: 10
};

produto = {
  nome: 'Banner',
  largura: 1.2,
  altura: 1.0,
  quantidade: 100
};

// Cálculo
perimetro = (1.2 + 1.0) * 2 = 4.4m
metrosNecessarios = 4.4 * 100 = 440m
metrosComDesperdicio = 440 * 1.10 = 484m
unidadesNecessarias = Math.ceil(484 / 205) = 3 rolos

// Resultado
{
  quantidade_necessaria: 3,
  metros_necessarios: 440,
  perimetro_produto: 4.4,
  unidade: 'M'
}
```

### **4. Interface de Configuração de Materiais**

```
┌─────────────────────────────────────────────────────────┐
│ ⚙️ Configuração de Lógica de Consumo - Material        │
├─────────────────────────────────────────────────────────┤
│ Nome: [Cabo De Madeira Para Banner            ]       │
│ Categoria: [Madeiras ▼]                                │
│                                                         │
│ Lógica de Consumo:                                      │
│ ○ Área (m²) - Para lonas, tecidos, papéis             │
│ ○ Perímetro (m) - Para cordões, cabos, fitas          │
│ ● Unidade Inteligente - Para peças, madeiras          │
│ ○ Quantidade Fixa - Para parafusos, pregos            │
│ ○ Personalizada - Para casos específicos              │
│                                                         │
│ Dimensões do Material:                                  │
│ Comprimento: [1.05] m                                  │
│ Largura: [0.019] m                                     │
│ Altura: [0.0105] m                                     │
│                                                         │
│ Uso por Produto:                                        │
│ Comprimento necessário: [1.0] m                        │
│ Quantidade por produto: [1] unidade                    │
│ Desperdício padrão: [5] %                              │
│                                                         │
│ Cálculo de Teste:                                       │
│ Produto: Banner 1.2m x 1.0m x 100 unidades            │
│ Resultado: 100 unidades (1 por banner)                │
│ Desperdício: 0.05m por unidade                        │
│                                                         │
│ [💾 Salvar] [🧪 Testar] [❌ Cancelar]                  │
└─────────────────────────────────────────────────────────┘
```

### **5. Interface de Resultado na OS**

```
┌─────────────────────────────────────────────────────────┐
│ 📦 Materiais - Banner (100 unidades)                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ✅ Bobina Lona Impressão Digital                       │
│    • Quantidade: 2 bobinas (140m²)                     │
│    • Área necessária: 120m²                            │
│    • Sobra aproveitável: 14m²                          │
│    • Lógica: Área (m²)                                 │
│    • Custo: R$ 1.400,00                                │
│                                                         │
│ ✅ Cabo De Madeira Para Banner                         │
│    • Quantidade: 100 unidades                          │
│    • Uso: 1 unidade por banner                         │
│    • Desperdício: 0.05m por unidade                    │
│    • Lógica: Unidade Inteligente                       │
│    • Custo: R$ 500,00                                  │
│                                                         │
│ ✅ Cordao Para Banner                                   │
│    • Quantidade: 3 rolos (615m)                        │
│    • Perímetro: 4.4m por banner                        │
│    • Total necessário: 440m                            │
│    • Lógica: Perímetro (m)                             │
│    • Custo: R$ 150,00                                  │
│                                                         │
│ 📊 Resumo:                                             │
│ • Total de materiais: 3 tipos                          │
│ • Custo total: R$ 2.050,00                            │
│ • Desperdício estimado: 5%                             │
│                                                         │
│ [🔄 Recalcular] [⚙️ Configurar] [📋 Detalhes]          │
└─────────────────────────────────────────────────────────┘
```

## 🎯 **Benefícios da Implementação**

### **Para Produção:**
- ✅ **Quantidades realistas** baseadas em cálculos inteligentes
- ✅ **Otimização de materiais** com aproveitamento máximo
- ✅ **Controle de desperdício** por tipo de material
- ✅ **Cálculos específicos** para cada tipo de material

### **Para Estoque:**
- ✅ **Previsão precisa** de compras
- ✅ **Controle de sobras** aproveitáveis
- ✅ **Redução de desperdício** financeiro
- ✅ **Otimização de cortes** e aproveitamento

### **Para Financeiro:**
- ✅ **Custos mais precisos** por OS
- ✅ **Controle de desperdício** por material
- ✅ **Margem de lucro** mais realista
- ✅ **Auditoria completa** de cálculos

## 🚀 **Plano de Implementação**

### **Fase 1: Estrutura Base (2 semanas)**
- [ ] Expandir enum `LogicaConsumoInsumo`
- [ ] Criar `CalculoMaterialInteligenteService`
- [ ] Implementar interfaces de dados
- [ ] Testes unitários básicos

### **Fase 2: Lógicas de Cálculo (3 semanas)**
- [ ] Implementar cálculo por área
- [ ] Implementar cálculo por perímetro
- [ ] Implementar cálculo por unidade inteligente
- [ ] Implementar cálculo personalizado
- [ ] Testes de integração

### **Fase 3: Interface e Configuração (2 semanas)**
- [ ] Interface de configuração de materiais
- [ ] Interface de resultado na OS
- [ ] Sistema de testes de cálculo
- [ ] Migração de dados existentes

### **Fase 4: Otimizações (1 semana)**
- [ ] Sugestões de otimização
- [ ] Relatórios de desperdício
- [ ] Métricas de performance
- [ ] Documentação final

## 📈 **Métricas de Sucesso**

### **Métricas Técnicas:**
- Redução de 80% nas quantidades irreais
- Aumento de 90% na precisão dos cálculos
- Redução de 60% no desperdício de materiais
- Aumento de 100% na flexibilidade de configuração

### **Métricas de Negócio:**
- Redução de 25% nos custos de materiais
- Aumento de 30% no aproveitamento de materiais
- Redução de 40% no desperdício financeiro
- Aumento de 50% na satisfação da produção

## 📝 **Conclusão**

O sistema de cálculo inteligente de materiais resolve completamente os problemas identificados:

1. **Quantidades realistas** baseadas em lógicas específicas por material
2. **Cálculo inteligente** considerando dimensões e aproveitamento
3. **Controle de desperdício** com otimizações automáticas
4. **Flexibilidade total** para configurar lógicas por material
5. **Interface intuitiva** para configuração e visualização

Esta implementação trará benefícios significativos em termos de precisão, economia e satisfação do usuário, tornando o sistema verdadeiramente inteligente para o cálculo de materiais.

---

**Documento criado em:** 2025-01-27  
**Versão:** 1.0  
**Status:** Proposta para Implementação  
**Responsável:** Equipe de Desenvolvimento OS/PCP


