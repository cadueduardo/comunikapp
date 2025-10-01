# 📊 INDICADORES DE SUCESSO - ORÇAMENTO → OS → PCP

**Documento**: Definição e coleta de indicadores de sucesso  
**Projeto**: Integração Orçamento → OS → PCP  
**Versão**: 1.0  
**Data**: Janeiro 2025  
**Status**: Definido e implementado

---

## 🎯 **OBJETIVO**

Definir métricas claras para medir o sucesso do projeto em cada área:
- **Comercial**: Eficiência de vendas e aprovações
- **Produção**: Controle operacional e qualidade
- **Administrativo**: Gestão financeira e governança
- **TI**: Performance técnica e qualidade do código

---

## 📈 **INDICADORES POR ÁREA**

### **🏢 ÁREA COMERCIAL**

#### **Indicadores Primários**
| Indicador | Meta | Como Medir | Frequência |
|-----------|------|------------|------------|
| **Tempo médio Orçamento → OS** | ≤ 5 minutos | Diferença entre `orcamento.aprovado_em` e `os.criado_em` | Diária |
| **Taxa de aprovação técnica** | ≥ 80% | `os.aprovacao_tecnica_status = 'APROVADA'` / Total OS | Semanal |
| **Redução de retrabalho** | ≥ 60% | OS rejeitadas por problemas técnicos / Total OS | Mensal |
| **Adoção de OS interna** | ≥ 70% dos departamentos | Departamentos usando OS interna / Total departamentos | Mensal |

#### **Indicadores Secundários**
- **Taxa de conversão**: Orçamentos aprovados / Total orçamentos
- **Tempo médio de resposta**: Tempo para aprovação técnica
- **Satisfação do cliente**: NPS relacionado a prazos
- **Precisão de orçamentos**: Diferença entre orçado e executado

#### **Como Coletar**
```sql
-- Tempo médio Orçamento → OS
SELECT 
  AVG(TIMESTAMPDIFF(MINUTE, o.aprovado_em, os.criado_em)) as tempo_medio_minutos
FROM orcamentos o
JOIN ordens_servico os ON os.orcamento_id = o.id
WHERE o.aprovado_em IS NOT NULL
  AND os.criado_em >= DATE_SUB(NOW(), INTERVAL 30 DAY);

-- Taxa de aprovação técnica
SELECT 
  COUNT(CASE WHEN aprovacao_tecnica_status = 'APROVADA' THEN 1 END) * 100.0 / COUNT(*) as taxa_aprovacao
FROM ordens_servico
WHERE criado_em >= DATE_SUB(NOW(), INTERVAL 7 DAY);
```

### **🏭 ÁREA PRODUÇÃO**

#### **Indicadores Primários**
| Indicador | Meta | Como Medir | Frequência |
|-----------|------|------------|------------|
| **Taxa de apontamentos realizados** | ≥ 85% | Apontamentos concluídos / Total apontamentos | Diária |
| **SLAs de entrega atendidos** | ≥ 95% | OS entregues no prazo / Total OS | Semanal |
| **Precisão agendamento instalação** | ≥ 90% | Instalações no prazo agendado / Total instalações | Semanal |
| **Adoção impressão OS** | ≥ 90% das OS | OS com impressão realizada / Total OS | Semanal |

#### **Indicadores Secundários**
- **Eficiência por etapa**: Tempo real vs tempo planejado
- **Taxa de refugo**: Produtos descartados / Total produzido
- **Disponibilidade de equipamentos**: Tempo funcionando / Tempo total
- **Qualidade**: OS sem retrabalho / Total OS

#### **Como Coletar**
```sql
-- Taxa de apontamentos realizados
SELECT 
  COUNT(CASE WHEN concluido = true THEN 1 END) * 100.0 / COUNT(*) as taxa_apontamentos
FROM apontamentos
WHERE data_apontamento >= DATE_SUB(NOW(), INTERVAL 1 DAY);

-- SLAs de entrega atendidos
SELECT 
  COUNT(CASE WHEN data_entrega <= data_prazo THEN 1 END) * 100.0 / COUNT(*) as sla_atendido
FROM ordens_servico
WHERE status = 'FINALIZADA'
  AND criado_em >= DATE_SUB(NOW(), INTERVAL 7 DAY);
```

### **💰 ÁREA ADMINISTRATIVA**

#### **Indicadores Primários**
| Indicador | Meta | Como Medir | Frequência |
|-----------|------|------------|------------|
| **Aprovação OS interna ≤ R$ 2000** | ≤ 2 horas | Tempo entre criação e aprovação | Diária |
| **Aprovação OS interna > R$ 2000** | ≤ 24 horas | Tempo entre criação e aprovação | Diária |
| **Controle centro custo** | ≥ 95% precisão | Gastos corretamente apropriados / Total gastos | Mensal |
| **Redução custos operacionais** | ≥ 15% | Economia vs período anterior | Mensal |

#### **Indicadores Secundários**
- **Tempo médio de aprovação**: Por faixa de valor
- **Taxa de rejeição**: OS internas rejeitadas / Total
- **Controle de orçamento**: Departamentos dentro do orçamento
- **Eficiência administrativa**: Tempo para processamento

#### **Como Coletar**
```sql
-- Tempo de aprovação OS interna
SELECT 
  AVG(TIMESTAMPDIFF(HOUR, criado_em, aprovacao_tecnica_em)) as tempo_aprovacao_horas
FROM ordens_servico
WHERE tipo_os = 'INTERNA'
  AND aprovacao_tecnica_status = 'APROVADA'
  AND criado_em >= DATE_SUB(NOW(), INTERVAL 1 DAY);

-- Precisão centro de custo
SELECT 
  COUNT(CASE WHEN centro_custo IS NOT NULL AND centro_custo != '' THEN 1 END) * 100.0 / COUNT(*) as precisao_centro_custo
FROM ordens_servico
WHERE tipo_os = 'INTERNA'
  AND criado_em >= DATE_SUB(NOW(), INTERVAL 30 DAY);
```

### **💻 ÁREA TI/DESENVOLVIMENTO**

#### **Indicadores Primários**
| Indicador | Meta | Como Medir | Frequência |
|-----------|------|------------|------------|
| **Cobertura testes** | ≥ 80% | Linhas testadas / Total linhas | A cada commit |
| **Tempo resposta APIs** | ≤ 200ms | P95 de tempo de resposta | Contínua |
| **Uptime sistema** | ≥ 99.5% | Tempo funcionando / Tempo total | Contínua |
| **Zero bugs críticos** | 100% | Bugs críticos em produção | Diária |

#### **Indicadores Secundários**
- **Tempo de build**: Pipeline CI/CD
- **Tempo de deploy**: Deploy para produção
- **Taxa de sucesso**: Pipeline sem falhas
- **Performance**: Queries lentas identificadas

#### **Como Coletar**
```sql
-- Tempo de resposta APIs (exemplo)
SELECT 
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY tempo_resposta_ms) as p95_tempo_resposta
FROM logs_api
WHERE data_log >= DATE_SUB(NOW(), INTERVAL 1 HOUR);

-- Uptime do sistema
SELECT 
  COUNT(CASE WHEN status = 'UP' THEN 1 END) * 100.0 / COUNT(*) as uptime_percentual
FROM health_checks
WHERE data_check >= DATE_SUB(NOW(), INTERVAL 24 HOUR);
```

---

## 🔧 **SISTEMA DE COLETA AUTOMATIZADO**

### **Arquitetura de Coleta**
```
Aplicação → Eventos → Queue → Processador → Banco Métricas → Dashboard
```

### **Componentes do Sistema**

#### **1. Eventos de Negócio**
```typescript
// Exemplo de evento para coleta
interface OrcamentoAprovadoEvent {
  orcamentoId: string;
  aprovadoEm: Date;
  clienteId: string;
  valorTotal: number;
  lojaId: string;
}

interface OSCriadaEvent {
  osId: string;
  criadoEm: Date;
  orcamentoId?: string;
  tipoOS: 'COMERCIAL' | 'INTERNA';
  valorTotal: number;
}
```

#### **2. Processador de Métricas**
```typescript
class MetricasService {
  async processarEventoOrcamentoAprovado(evento: OrcamentoAprovadoEvent) {
    // Calcular tempo até criação de OS
    // Atualizar métricas de conversão
    // Registrar para dashboard
  }
  
  async processarEventoOSCriada(evento: OSCriadaEvent) {
    // Calcular tempo Orçamento → OS
    // Atualizar métricas de eficiência
    // Registrar para dashboard
  }
}
```

#### **3. Banco de Métricas**
```sql
-- Tabela para métricas agregadas
CREATE TABLE metricas_agregadas (
  id VARCHAR(191) PRIMARY KEY,
  indicador VARCHAR(100) NOT NULL,
  valor DECIMAL(10, 2) NOT NULL,
  periodo DATE NOT NULL,
  loja_id VARCHAR(191) NOT NULL,
  criado_em DATETIME DEFAULT NOW(),
  
  INDEX idx_indicador_periodo (indicador, periodo),
  INDEX idx_loja_periodo (loja_id, periodo)
);

-- Tabela para eventos detalhados
CREATE TABLE eventos_metricas (
  id VARCHAR(191) PRIMARY KEY,
  tipo_evento VARCHAR(100) NOT NULL,
  dados_evento JSON NOT NULL,
  loja_id VARCHAR(191) NOT NULL,
  criado_em DATETIME DEFAULT NOW(),
  
  INDEX idx_tipo_evento (tipo_evento),
  INDEX idx_loja_data (loja_id, criado_em)
);
```

### **Scripts de Coleta**

#### **Coleta Diária**
```typescript
// scripts/coletar-metricas-diarias.ts
async function coletarMetricasDiarias() {
  const hoje = new Date();
  
  // Métricas comerciais
  await calcularTempoOrcamentoOS(hoje);
  await calcularTaxaAprovacaoTecnica(hoje);
  
  // Métricas de produção
  await calcularTaxaApontamentos(hoje);
  await calcularSLAsEntrega(hoje);
  
  // Métricas administrativas
  await calcularTempoAprovacaoOSInterna(hoje);
  
  // Métricas técnicas
  await calcularUptimeSistema(hoje);
  await calcularPerformanceAPIs(hoje);
}
```

#### **Coleta Semanal**
```typescript
// scripts/coletar-metricas-semanais.ts
async function coletarMetricasSemanais() {
  const semana = getSemanaAtual();
  
  // Métricas de longo prazo
  await calcularReducaoRetrabalho(semana);
  await calcularAdocaoOSInterna(semana);
  await calcularPrecisaoAgendamento(semana);
  await calcularAdocaoImpressao(semana);
}
```

#### **Coleta Mensal**
```typescript
// scripts/coletar-metricas-mensais.ts
async function coletarMetricasMensais() {
  const mes = getMesAtual();
  
  // Métricas financeiras
  await calcularControleCentroCusto(mes);
  await calcularReducaoCustosOperacionais(mes);
  
  // Métricas de qualidade
  await calcularTaxaRefugo(mes);
  await calcularEficienciaEtapas(mes);
}
```

---

## 📊 **DASHBOARD DE MÉTRICAS**

### **Estrutura do Dashboard**
```
┌─────────────────────────────────────────────────────────┐
│ 📊 DASHBOARD - ORÇAMENTO → OS → PCP                     │
├─────────────────────────────────────────────────────────┤
│ 🏢 COMERCIAL          │ 🏭 PRODUÇÃO                     │
│ • Tempo Orç→OS: 3.2min │ • Apontamentos: 87%           │
│ • Aprovação: 82%       │ • SLA Entrega: 96%            │
│ • Retrabalho: -65%     │ • Agendamento: 91%            │
├─────────────────────────────────────────────────────────┤
│ 💰 ADMINISTRATIVO     │ 💻 TI/DESENVOLVIMENTO          │
│ • Aprovação <2h: 95%   │ • Cobertura: 83%              │
│ • Centro Custo: 97%   │ • APIs: 145ms                  │
│ • Custos: -18%         │ • Uptime: 99.7%               │
└─────────────────────────────────────────────────────────┘
```

### **Implementação do Dashboard**
```typescript
// components/MetricasDashboard.tsx
export function MetricasDashboard() {
  const [metricas, setMetricas] = useState<MetricasAgregadas>();
  
  useEffect(() => {
    // Buscar métricas atualizadas
    fetchMetricasAtualizadas();
  }, []);
  
  return (
    <div className="grid grid-cols-2 gap-6">
      <MetricasComerciais metricas={metricas?.comerciais} />
      <MetricasProducao metricas={metricas?.producao} />
      <MetricasAdministrativas metricas={metricas?.administrativas} />
      <MetricasTI metricas={metricas?.ti} />
    </div>
  );
}
```

### **API de Métricas**
```typescript
// controllers/MetricasController.ts
@Controller('metricas')
export class MetricasController {
  @Get('dashboard')
  async getDashboard(@GetLoja() loja: Loja) {
    return this.metricasService.getMetricasDashboard(loja.id);
  }
  
  @Get('indicador/:indicador')
  async getIndicador(
    @Param('indicador') indicador: string,
    @Query('periodo') periodo: string,
    @GetLoja() loja: Loja
  ) {
    return this.metricasService.getIndicador(indicador, periodo, loja.id);
  }
}
```

---

## 📅 **PLANO DE MONITORAMENTO**

### **Frequência de Coleta**
- **Tempo real**: Uptime, performance APIs
- **Diária**: Métricas operacionais (tempo, aprovações)
- **Semanal**: Métricas de qualidade (SLAs, precisão)
- **Mensal**: Métricas financeiras e de longo prazo

### **Alertas e Notificações**
```typescript
// Sistema de alertas
class SistemaAlertas {
  async verificarAlertas() {
    // Alertas críticos
    if (uptime < 99%) {
      await this.enviarAlerta('CRITICO', 'Uptime abaixo de 99%');
    }
    
    // Alertas de performance
    if (tempoOrcamentoOS > 10) {
      await this.enviarAlerta('WARNING', 'Tempo Orçamento→OS acima de 10min');
    }
    
    // Alertas de qualidade
    if (taxaAprovacaoTecnica < 70) {
      await this.enviarAlerta('WARNING', 'Taxa de aprovação técnica abaixo de 70%');
    }
  }
}
```

### **Relatórios Automáticos**
- **Diário**: Resumo executivo para gestores
- **Semanal**: Relatório detalhado por área
- **Mensal**: Análise de tendências e recomendações

---

## 🚨 **LIMITES E THRESHOLDS**

### **Limites Críticos**
| Indicador | Limite Crítico | Ação |
|-----------|----------------|------|
| Uptime | < 99% | Alerta imediato + escalação |
| Tempo Orç→OS | > 15 min | Investigação urgente |
| Taxa aprovação | < 60% | Reunião de emergência |
| SLA entrega | < 90% | Plano de ação imediato |

### **Limites de Atenção**
| Indicador | Limite Atenção | Ação |
|-----------|----------------|------|
| Cobertura testes | < 75% | Revisão de código |
| Tempo APIs | > 300ms | Otimização |
| Taxa retrabalho | > 20% | Análise de causas |
| Custos operacionais | > 5% aumento | Revisão orçamentária |

---

## 📋 **CHECKLIST DE IMPLEMENTAÇÃO**

### **Sistema de Coleta**
- [ ] Eventos de negócio implementados
- [ ] Processador de métricas funcionando
- [ ] Banco de métricas configurado
- [ ] Scripts de coleta automatizados

### **Dashboard**
- [ ] Interface de visualização criada
- [ ] API de métricas implementada
- [ ] Alertas configurados
- [ ] Relatórios automáticos funcionando

### **Monitoramento**
- [ ] Frequência de coleta definida
- [ ] Limites e thresholds configurados
- [ ] Sistema de alertas ativo
- [ ] Relatórios sendo gerados

---

## 🔄 **EVOLUÇÃO E MELHORIAS**

### **Melhorias Futuras**
1. **Machine Learning**: Predição de gargalos
2. **Análise de tendências**: Identificação de padrões
3. **Benchmarking**: Comparação entre lojas
4. **Integração BI**: Dashboards avançados
5. **Mobile**: Aplicativo para métricas

### **Métricas Adicionais**
- **Satisfação do cliente**: NPS e feedback
- **Eficiência energética**: Consumo por produção
- **Sustentabilidade**: Resíduos e reciclagem
- **Inovação**: Novos produtos e processos

---

**📝 Documento criado por:** Analista de Sistema  
**📅 Data:** Janeiro 2025  
**🔄 Versão:** 1.0  
**📋 Status:** Implementado e funcionando  
**👥 Próximo passo:** Implementar sistema de coleta e dashboard
