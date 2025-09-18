# Contratos e Interfaces - Motor de Cálculo Multi-Produto

## 📋 **Visão Geral**

Este documento define todas as interfaces, tipos e contratos para o motor de cálculo multi-produto, incluindo a **agregação inteligente de recursos compartilhados** e o sistema de estágios extensível.

## 🏗️ **Interfaces Principais**

### **MultiProdutoOrchestrator**

```typescript
interface MultiProdutoOrchestrator {
  /**
   * Executa o cálculo completo de um orçamento multi-produto
   */
  executarOrcamento(contexto: ContextoMultiProduto): Promise<ResultadoOrcamento>
  
  /**
   * Valida a configuração dos produtos antes do cálculo
   */
  validarProdutos(produtos: ProdutoOrcamento[]): ValidationResult
  
  /**
   * Gerencia dependências entre produtos
   */
  gerenciarDependencias(produtos: ProdutoOrcamento[]): DependenciaMap
  
  /**
   * Executa cálculo em modo preview
   */
  executarPreview(contexto: ContextoMultiProduto): Promise<ResultadoPreview>
}
```

### **RecursosCompartilhadosAggregator**

```typescript
interface RecursosCompartilhadosAggregator {
  /**
   * Identifica recursos compartilhados entre produtos
   */
  identificarRecursosCompartilhados(produtos: ProdutoOrcamento[]): RecursosCompartilhados
  
  /**
   * Consolida materiais por tipo e unidade
   */
  consolidarMateriais(materiais: Material[]): MaterialConsolidado[]
  
  /**
   * Consolida máquinas por tipo e capacidade
   */
  consolidarMaquinas(maquinas: Maquina[]): MaquinaConsolidada[]
  
  /**
   * Consolida funções por tipo e especialização
   */
  consolidarFuncoes(funcoes: Funcao[]): FuncaoConsolidada[]
  
  /**
   * Calcula distribuição proporcional dos recursos
   */
  calcularDistribuicao(recursos: RecursosCompartilhados): DistribuicaoRecursos
  
  /**
   * Aplica otimizações nos recursos consolidados
   */
  otimizarRecursos(recursos: RecursosCompartilhados): RecursosOtimizados
}
```

### **EstagioCalculo**

```typescript
interface EstagioCalculo {
  /**
   * Nome único do estágio
   */
  nome: string
  
  /**
   * Prioridade de execução (menor = maior prioridade)
   */
  prioridade: number
  
  /**
   * Tipo do estágio (padrão ou customizável)
   */
  tipo: 'padrao' | 'customizavel'
  
  /**
   * Se o estágio pode ser executado em paralelo
   */
  podeExecutarParalelo(): boolean
  
  /**
   * Executa o estágio de cálculo
   */
  executar(contexto: ContextoMultiProduto): Promise<ResultadoEstagio>
  
  /**
   * Valida o contexto antes da execução
   */
  validar(contexto: ContextoMultiProduto): ValidationResult
  
  /**
   * Hook executado antes da execução
   */
  beforeExecution?(contexto: ContextoMultiProduto): Promise<void>
  
  /**
   * Hook executado após a execução
   */
  afterExecution?(resultado: ResultadoEstagio): Promise<void>
}
```

## 🗄️ **Entidades de Dados**

### **OrcamentoMultiProduto**

```typescript
interface OrcamentoMultiProduto {
  id: string
  lojaId: string
  clienteId?: string
  vendedorId?: string
  
  // Produtos do orçamento
  produtos: ProdutoOrcamento[]
  
  // Recursos compartilhados identificados
  recursosCompartilhados: RecursosCompartilhados
  
  // Resultado final consolidado
  resultadoFinal: ResultadoOrcamento
  
  // Status e controle
  status: StatusOrcamento
  modoCalculo: 'preview' | 'final'
  
  // Metadados
  createdAt: Date
  updatedAt: Date
  calculadoEm?: Date
  versaoCalculo: string
}
```

### **ProdutoOrcamento**

```typescript
interface ProdutoOrcamento {
  id: string
  produtoId: string
  quantidade: number
  
  // Dimensões físicas
  dimensoes: DimensoesProduto
  
  // Recursos específicos do produto
  materiais: MaterialProduto[]
  maquinas: MaquinaProduto[]
  funcoes: FuncaoProduto[]
  servicos: ServicoProduto[]
  
  // Resultado individual
  resultado: ResultadoProduto
  
  // Metadados
  observacoes?: string
  prioridade: number
}
```

### **RecursosCompartilhados**

```typescript
interface RecursosCompartilhados {
  // Recursos consolidados
  materiais: MaterialConsolidado[]
  maquinas: MaquinaConsolidada[]
  funcoes: FuncaoConsolidada[]
  
  // Distribuição e otimização
  distribuicao: DistribuicaoRecursos
  otimizacoes: OtimizacaoRecursos[]
  
  // Metadados
  identificadoEm: Date
  versaoIdentificacao: string
}
```

### **MaterialConsolidado**

```typescript
interface MaterialConsolidado {
  id: string
  materialId: string
  nome: string
  unidadeCompra: string
  
  // Consumo consolidado
  consumoTotal: number
  consumoPorProduto: Map<string, number>
  
  // Custos
  custoUnitario: number
  custoTotal: number
  
  // Otimizações
  desperdicioEstimado: number
  quantidadeCompra: number
  
  // Metadados
  produtosOrigem: string[]
  identificadoEm: Date
}
```

### **MaquinaConsolidada**

```typescript
interface MaquinaConsolidada {
  id: string
  maquinaId: string
  nome: string
  tipo: string
  
  // Tempo consolidado
  tempoTotal: number // em minutos
  tempoPorProduto: Map<string, number>
  
  // Capacidade e eficiência
  capacidadeHora: number // m²/h ou unidade/h
  eficiencia: number // 0-1
  
  // Custos
  custoHora: number
  custoTotal: number
  
  // Agendamento
  inicioDisponivel: Date
  fimDisponivel: Date
  
  // Metadados
  produtosOrigem: string[]
  identificadoEm: Date
}
```

### **FuncaoConsolidada**

```typescript
interface FuncaoConsolidada {
  id: string
  funcaoId: string
  nome: string
  especializacao: string
  
  // Tempo consolidado
  tempoTotal: number // em minutos
  tempoPorProduto: Map<string, number>
  
  // Custos
  custoHora: number
  custoTotal: number
  
  // Distribuição proporcional
  distribuicaoProporcional: Map<string, number>
  
  // Metadados
  produtosOrigem: string[]
  identificadoEm: Date
}
```

## 🔄 **Contextos e Estados**

### **ContextoMultiProduto**

```typescript
interface ContextoMultiProduto {
  // Dados do orçamento
  orcamento: OrcamentoMultiProduto
  
  // Configurações globais
  configuracaoGlobal: ConfiguracaoGlobal
  
  // Dados compartilhados
  dadosCompartilhados: {
    loja: Loja
    cliente?: Cliente
    vendedor?: Usuario
    dataOrcamento: Date
    moeda: string
  }
  
  // Cache e otimizações
  cache: Map<string, any>
  otimizacoes: {
    usarCache: boolean
    paralelizar: boolean
    explicar: boolean
    modoDebug: boolean
  }
  
  // Controle de execução
  estagiosExecutados: Set<string>
  estagiosPendentes: string[]
  resultadosIntermediarios: Map<string, ResultadoEstagio>
}
```

### **ConfiguracaoGlobal**

```typescript
interface ConfiguracaoGlobal {
  // Configurações de cálculo
  margemPadrao: number
  impostos: Imposto[]
  descontos: Desconto[]
  
  // Configurações de agregação
  agregação: {
    habilitarMateriais: boolean
    habilitarMaquinas: boolean
    habilitarFuncoes: boolean
    otimizarCompras: boolean
    otimizarAgendamento: boolean
  }
  
  // Configurações de estágios
  estagios: ConfiguracaoEstagio[]
  
  // Configurações de regras
  regrasNegocio: RegraNegocio[]
}
```

## 📊 **Resultados e Deltas**

### **ResultadoOrcamento**

```typescript
interface ResultadoOrcamento {
  // Custos por categoria
  custosDiretos: CustoDireto
  custosMaquinas: CustoMaquina
  custosFuncoes: CustoFuncao
  custosIndiretos: CustoIndireto
  custosCustomizaveis: CustoCustomizavel[]
  
  // Totais e margens
  subtotal: number
  margem: number
  precoFinal: number
  
  // Metadados
  calculadoEm: Date
  tempoCalculo: number
  versaoCalculo: string
  
  // Rastreabilidade
  deltas: DeltaCalculo[]
  recursosUtilizados: RecursosUtilizados
}
```

### **ResultadoProduto**

```typescript
interface ResultadoProduto {
  produtoId: string
  
  // Custos individuais
  custosDiretos: CustoDireto
  custosMaquinas: CustoMaquina
  custosFuncoes: CustoFuncao
  
  // Totais
  custoTotal: number
  precoUnitario: number
  precoTotal: number
  
  // Metadados
  calculadoEm: Date
  tempoCalculo: number
}
```

### **DeltaCalculo**

```typescript
interface DeltaCalculo {
  id: string
  
  // Identificação
  tipo: TipoDelta
  categoria: CategoriaCusto
  estagio: string
  
  // Valores
  valor: number
  valorAnterior?: number
  variacao: number
  
  // Contexto
  descricao: string
  contexto: string
  produtoId?: string
  
  // Metadados
  timestamp: Date
  usuarioId?: string
  versao: string
}
```

### **ResultadoEstagio**

```typescript
interface ResultadoEstagio {
  estagio: string
  
  // Resultados
  sucesso: boolean
  erro?: string
  
  // Dados calculados
  dados: any
  deltas: DeltaCalculo[]
  
  // Performance
  tempoExecucao: number
  memoriaUtilizada: number
  
  // Metadados
  executadoEm: Date
  versao: string
}
```

## 🔧 **Configurações e Regras**

### **ConfiguracaoEstagio**

```typescript
interface ConfiguracaoEstagio {
  id: string
  estagioId: string
  
  // Configuração
  chave: string
  valor: any
  tipo: 'string' | 'number' | 'boolean' | 'json'
  
  // Controle
  ativo: boolean
  prioridade: number
  
  // Validade
  validade?: Date
  versao: string
  
  // Metadados
  criadoEm: Date
  atualizadoEm: Date
  criadoPor: string
}
```

### **RegraNegocio**

```typescript
interface RegraNegocio {
  id: string
  nome: string
  descricao: string
  
  // Condições
  condicoes: CondicaoRegra[]
  
  // Ações
  acoes: AcaoRegra[]
  
  // Controle
  ativo: boolean
  prioridade: number
  
  // Validade
  dataInicio: Date
  dataFim?: Date
  
  // Metadados
  criadoEm: Date
  versao: string
  criadoPor: string
}
```

### **CondicaoRegra**

```typescript
interface CondicaoRegra {
  id: string
  campo: string
  operador: 'igual' | 'diferente' | 'maior' | 'menor' | 'contem' | 'regex'
  valor: any
  operadorLogico?: 'e' | 'ou'
}
```

### **AcaoRegra**

```typescript
interface AcaoRegra {
  id: string
  tipo: 'aplicar_desconto' | 'aplicar_taxa' | 'ajustar_margem' | 'executar_calculo'
  parametros: Record<string, any>
  prioridade: number
}
```

## 📡 **APIs e WebSockets**

### **Request de Cálculo**

```typescript
interface CalculoRequest {
  // Dados do orçamento
  orcamento: {
    clienteId?: string
    vendedorId?: string
    observacoes?: string
  }
  
  // Produtos
  produtos: {
    produtoId: string
    quantidade: number
    dimensoes: DimensoesProduto
    materiais: MaterialProduto[]
    maquinas: MaquinaProduto[]
    funcoes: FuncaoProduto[]
    servicos: ServicoProduto[]
  }[]
  
  // Configurações
  configuracao: {
    modo: 'preview' | 'final'
    explicar: boolean
    paralelizar: boolean
    usarCache: boolean
  }
}
```

### **Response de Cálculo**

```typescript
interface CalculoResponse {
  // Resultado
  sucesso: boolean
  erro?: string
  
  // Dados calculados
  resultado: ResultadoOrcamento
  
  // Metadados
  calculadoEm: Date
  tempoCalculo: number
  versao: string
  
  // Rastreabilidade
  trace: TraceCalculo
}
```

### **Eventos WebSocket**

```typescript
interface WebSocketEvent {
  tipo: 'calculo_iniciado' | 'estagio_executado' | 'produto_calculado' | 'orcamento_finalizado' | 'erro_calculo'
  dados: any
  timestamp: Date
  orcamentoId: string
}
```

## 🧪 **Validação e Testes**

### **ValidationResult**

```typescript
interface ValidationResult {
  valido: boolean
  erros: ValidationError[]
  avisos: ValidationWarning[]
}
```

### **ValidationError**

```typescript
interface ValidationError {
  campo: string
  mensagem: string
  codigo: string
  severidade: 'erro' | 'critico'
}
```

### **ValidationWarning**

```typescript
interface ValidationWarning {
  campo: string
  mensagem: string
  codigo: string
  recomendacao?: string
}
```

---

*Estas interfaces são a base para implementação do motor de cálculo multi-produto e serão refinadas conforme o desenvolvimento.*
