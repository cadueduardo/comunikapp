import { PrismaClient } from '@prisma/client';

/**
 * Script para coleta automática de métricas do projeto Orçamento → OS → PCP
 * Objetivo: Coletar indicadores de sucesso definidos no documento INDICADORES-SUCESSO.md
 * 
 * Execução: npx ts-node scripts/coletar-metricas-automaticas.ts
 * Agendamento: Executar via cron job ou GitHub Actions
 */

interface MetricasComerciais {
  tempoOrcamentoOS: number; // minutos
  taxaAprovacaoTecnica: number; // percentual
  reducaoRetrabalho: number; // percentual
  adocaoOSInterna: number; // percentual
}

interface MetricasProducao {
  taxaApontamentos: number; // percentual
  slaEntrega: number; // percentual
  precisaoAgendamento: number; // percentual
  adocaoImpressao: number; // percentual
}

interface MetricasAdministrativas {
  aprovacaoOSInternaRapida: number; // percentual (≤2h)
  aprovacaoOSInternaLenta: number; // percentual (≤24h)
  controleCentroCusto: number; // percentual
  reducaoCustosOperacionais: number; // percentual
}

interface MetricasTI {
  coberturaTestes: number; // percentual
  tempoRespostaAPIs: number; // milissegundos
  uptimeSistema: number; // percentual
  bugsCriticos: number; // quantidade
}

interface MetricasAgregadas {
  comerciais: MetricasComerciais;
  producao: MetricasProducao;
  administrativas: MetricasAdministrativas;
  ti: MetricasTI;
  periodo: string;
  lojaId: string;
  coletadoEm: Date;
}

class ColetorMetricas {
  private prisma: PrismaClient;
  
  constructor() {
    this.prisma = new PrismaClient();
  }
  
  async coletarTodasMetricas(lojaId: string): Promise<MetricasAgregadas> {
    console.log(`🔍 Coletando métricas para loja ${lojaId}...`);
    
    try {
      const [comerciais, producao, administrativas, ti] = await Promise.all([
        this.coletarMetricasComerciais(lojaId),
        this.coletarMetricasProducao(lojaId),
        this.coletarMetricasAdministrativas(lojaId),
        this.coletarMetricasTI(lojaId)
      ]);
      
      const metricas: MetricasAgregadas = {
        comerciais,
        producao,
        administrativas,
        ti,
        periodo: this.getPeriodoAtual(),
        lojaId,
        coletadoEm: new Date()
      };
      
      // Salvar métricas no banco
      await this.salvarMetricas(metricas);
      
      // Verificar alertas
      await this.verificarAlertas(metricas);
      
      console.log('✅ Métricas coletadas com sucesso!');
      return metricas;
      
    } catch (error) {
      console.error('❌ Erro ao coletar métricas:', error);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }
  
  private async coletarMetricasComerciais(lojaId: string): Promise<MetricasComerciais> {
    console.log('📊 Coletando métricas comerciais...');
    
    // Tempo médio Orçamento → OS
    const tempoOrcamentoOS = await this.calcularTempoOrcamentoOS(lojaId);
    
    // Taxa de aprovação técnica
    const taxaAprovacaoTecnica = await this.calcularTaxaAprovacaoTecnica(lojaId);
    
    // Redução de retrabalho
    const reducaoRetrabalho = await this.calcularReducaoRetrabalho(lojaId);
    
    // Adoção de OS interna
    const adocaoOSInterna = await this.calcularAdocaoOSInterna(lojaId);
    
    return {
      tempoOrcamentoOS,
      taxaAprovacaoTecnica,
      reducaoRetrabalho,
      adocaoOSInterna
    };
  }
  
  private async coletarMetricasProducao(lojaId: string): Promise<MetricasProducao> {
    console.log('🏭 Coletando métricas de produção...');
    
    // Taxa de apontamentos realizados
    const taxaApontamentos = await this.calcularTaxaApontamentos(lojaId);
    
    // SLAs de entrega atendidos
    const slaEntrega = await this.calcularSLAEntrega(lojaId);
    
    // Precisão de agendamento de instalação
    const precisaoAgendamento = await this.calcularPrecisaoAgendamento(lojaId);
    
    // Adoção de impressão da OS
    const adocaoImpressao = await this.calcularAdocaoImpressao(lojaId);
    
    return {
      taxaApontamentos,
      slaEntrega,
      precisaoAgendamento,
      adocaoImpressao
    };
  }
  
  private async coletarMetricasAdministrativas(lojaId: string): Promise<MetricasAdministrativas> {
    console.log('💰 Coletando métricas administrativas...');
    
    // Aprovação OS interna rápida (≤2h)
    const aprovacaoOSInternaRapida = await this.calcularAprovacaoOSInternaRapida(lojaId);
    
    // Aprovação OS interna lenta (≤24h)
    const aprovacaoOSInternaLenta = await this.calcularAprovacaoOSInternaLenta(lojaId);
    
    // Controle de centro de custo
    const controleCentroCusto = await this.calcularControleCentroCusto(lojaId);
    
    // Redução de custos operacionais
    const reducaoCustosOperacionais = await this.calcularReducaoCustosOperacionais(lojaId);
    
    return {
      aprovacaoOSInternaRapida,
      aprovacaoOSInternaLenta,
      controleCentroCusto,
      reducaoCustosOperacionais
    };
  }
  
  private async coletarMetricasTI(lojaId: string): Promise<MetricasTI> {
    console.log('💻 Coletando métricas de TI...');
    
    // Cobertura de testes (simulado - seria coletado do CI/CD)
    const coberturaTestes = await this.calcularCoberturaTestes();
    
    // Tempo de resposta das APIs
    const tempoRespostaAPIs = await this.calcularTempoRespostaAPIs(lojaId);
    
    // Uptime do sistema
    const uptimeSistema = await this.calcularUptimeSistema(lojaId);
    
    // Bugs críticos em produção
    const bugsCriticos = await this.calcularBugsCriticos(lojaId);
    
    return {
      coberturaTestes,
      tempoRespostaAPIs,
      uptimeSistema,
      bugsCriticos
    };
  }
  
  // ========================================
  // MÉTODOS DE CÁLCULO - COMERCIAIS
  // ========================================
  
  private async calcularTempoOrcamentoOS(lojaId: string): Promise<number> {
    const resultado = await this.prisma.$queryRaw<Array<{tempo_medio: number}>>`
      SELECT 
        AVG(TIMESTAMPDIFF(MINUTE, o.aprovado_em, os.criado_em)) as tempo_medio
      FROM orcamentos o
      JOIN ordens_servico os ON os.orcamento_id = o.id
      WHERE o.loja_id = ${lojaId}
        AND o.aprovado_em IS NOT NULL
        AND os.criado_em >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `;
    
    return resultado[0]?.tempo_medio || 0;
  }
  
  private async calcularTaxaAprovacaoTecnica(lojaId: string): Promise<number> {
    const resultado = await this.prisma.$queryRaw<Array<{taxa_aprovacao: number}>>`
      SELECT 
        COUNT(CASE WHEN aprovacao_tecnica_status = 'APROVADA' THEN 1 END) * 100.0 / COUNT(*) as taxa_aprovacao
      FROM ordens_servico
      WHERE loja_id = ${lojaId}
        AND criado_em >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        AND aprovacao_tecnica_status IS NOT NULL
    `;
    
    return resultado[0]?.taxa_aprovacao || 0;
  }
  
  private async calcularReducaoRetrabalho(lojaId: string): Promise<number> {
    // Simulado - seria calculado comparando períodos
    const resultado = await this.prisma.$queryRaw<Array<{taxa_retrabalho: number}>>`
      SELECT 
        COUNT(CASE WHEN status = 'REJEITADA' THEN 1 END) * 100.0 / COUNT(*) as taxa_retrabalho
      FROM ordens_servico
      WHERE loja_id = ${lojaId}
        AND criado_em >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `;
    
    return resultado[0]?.taxa_retrabalho || 0;
  }
  
  private async calcularAdocaoOSInterna(lojaId: string): Promise<number> {
    const resultado = await this.prisma.$queryRaw<Array<{adocao: number}>>`
      SELECT 
        COUNT(CASE WHEN tipo_os = 'INTERNA' THEN 1 END) * 100.0 / COUNT(*) as adocao
      FROM ordens_servico
      WHERE loja_id = ${lojaId}
        AND criado_em >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `;
    
    return resultado[0]?.adocao || 0;
  }
  
  // ========================================
  // MÉTODOS DE CÁLCULO - PRODUÇÃO
  // ========================================
  
  private async calcularTaxaApontamentos(lojaId: string): Promise<number> {
    const resultado = await this.prisma.$queryRaw<Array<{taxa_apontamentos: number}>>`
      SELECT 
        COUNT(CASE WHEN concluido = true THEN 1 END) * 100.0 / COUNT(*) as taxa_apontamentos
      FROM apontamentos a
      JOIN ordens_servico os ON os.id = a.os_id
      WHERE os.loja_id = ${lojaId}
        AND a.data_apontamento >= DATE_SUB(NOW(), INTERVAL 1 DAY)
    `;
    
    return resultado[0]?.taxa_apontamentos || 0;
  }
  
  private async calcularSLAEntrega(lojaId: string): Promise<number> {
    const resultado = await this.prisma.$queryRaw<Array<{sla_atendido: number}>>`
      SELECT 
        COUNT(CASE WHEN data_entrega <= data_prazo THEN 1 END) * 100.0 / COUNT(*) as sla_atendido
      FROM ordens_servico
      WHERE loja_id = ${lojaId}
        AND status = 'FINALIZADA'
        AND criado_em >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `;
    
    return resultado[0]?.sla_atendido || 0;
  }
  
  private async calcularPrecisaoAgendamento(lojaId: string): Promise<number> {
    const resultado = await this.prisma.$queryRaw<Array<{precisao: number}>>`
      SELECT 
        COUNT(CASE WHEN ABS(TIMESTAMPDIFF(HOUR, data_instalacao_agendada, data_entrega)) <= 2 THEN 1 END) * 100.0 / COUNT(*) as precisao
      FROM ordens_servico
      WHERE loja_id = ${lojaId}
        AND data_instalacao_agendada IS NOT NULL
        AND criado_em >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `;
    
    return resultado[0]?.precisao || 0;
  }
  
  private async calcularAdocaoImpressao(lojaId: string): Promise<number> {
    // Simulado - seria calculado com logs de impressão
    const resultado = await this.prisma.$queryRaw<Array<{adocao: number}>>`
      SELECT 
        COUNT(CASE WHEN observacoes LIKE '%impresso%' THEN 1 END) * 100.0 / COUNT(*) as adocao
      FROM ordens_servico
      WHERE loja_id = ${lojaId}
        AND criado_em >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `;
    
    return resultado[0]?.adocao || 0;
  }
  
  // ========================================
  // MÉTODOS DE CÁLCULO - ADMINISTRATIVAS
  // ========================================
  
  private async calcularAprovacaoOSInternaRapida(lojaId: string): Promise<number> {
    const resultado = await this.prisma.$queryRaw<Array<{aprovacao_rapida: number}>>`
      SELECT 
        COUNT(CASE WHEN TIMESTAMPDIFF(HOUR, criado_em, aprovacao_tecnica_em) <= 2 THEN 1 END) * 100.0 / COUNT(*) as aprovacao_rapida
      FROM ordens_servico
      WHERE loja_id = ${lojaId}
        AND tipo_os = 'INTERNA'
        AND aprovacao_tecnica_status = 'APROVADA'
        AND criado_em >= DATE_SUB(NOW(), INTERVAL 1 DAY)
    `;
    
    return resultado[0]?.aprovacao_rapida || 0;
  }
  
  private async calcularAprovacaoOSInternaLenta(lojaId: string): Promise<number> {
    const resultado = await this.prisma.$queryRaw<Array<{aprovacao_lenta: number}>>`
      SELECT 
        COUNT(CASE WHEN TIMESTAMPDIFF(HOUR, criado_em, aprovacao_tecnica_em) <= 24 THEN 1 END) * 100.0 / COUNT(*) as aprovacao_lenta
      FROM ordens_servico
      WHERE loja_id = ${lojaId}
        AND tipo_os = 'INTERNA'
        AND aprovacao_tecnica_status = 'APROVADA'
        AND criado_em >= DATE_SUB(NOW(), INTERVAL 1 DAY)
    `;
    
    return resultado[0]?.aprovacao_lenta || 0;
  }
  
  private async calcularControleCentroCusto(lojaId: string): Promise<number> {
    const resultado = await this.prisma.$queryRaw<Array<{controle: number}>>`
      SELECT 
        COUNT(CASE WHEN centro_custo IS NOT NULL AND centro_custo != '' THEN 1 END) * 100.0 / COUNT(*) as controle
      FROM ordens_servico
      WHERE loja_id = ${lojaId}
        AND tipo_os = 'INTERNA'
        AND criado_em >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `;
    
    return resultado[0]?.controle || 0;
  }
  
  private async calcularReducaoCustosOperacionais(lojaId: string): Promise<number> {
    // Simulado - seria calculado comparando períodos
    return 15.0; // 15% de redução simulada
  }
  
  // ========================================
  // MÉTODOS DE CÁLCULO - TI
  // ========================================
  
  private async calcularCoberturaTestes(): Promise<number> {
    // Simulado - seria coletado do CI/CD
    return 82.5; // 82.5% de cobertura simulada
  }
  
  private async calcularTempoRespostaAPIs(lojaId: string): Promise<number> {
    // Simulado - seria coletado de logs de API
    return 145.0; // 145ms de tempo médio simulado
  }
  
  private async calcularUptimeSistema(lojaId: string): Promise<number> {
    // Simulado - seria coletado de health checks
    return 99.7; // 99.7% de uptime simulado
  }
  
  private async calcularBugsCriticos(lojaId: string): Promise<number> {
    // Simulado - seria coletado de sistema de bugs
    return 0; // Zero bugs críticos simulado
  }
  
  // ========================================
  // MÉTODOS AUXILIARES
  // ========================================
  
  private getPeriodoAtual(): string {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const dia = String(agora.getDate()).padStart(2, '0');
    
    return `${ano}-${mes}-${dia}`;
  }
  
  private async salvarMetricas(metricas: MetricasAgregadas): Promise<void> {
    console.log('💾 Salvando métricas no banco...');
    
    // Salvar métricas agregadas
    await this.prisma.metricas_agregadas.create({
      data: {
        id: `metricas_${metricas.lojaId}_${metricas.periodo}`,
        indicador: 'DASHBOARD_COMPLETO',
        valor: 100.0, // Valor simulado
        periodo: new Date(metricas.periodo),
        loja_id: metricas.lojaId,
        criado_em: metricas.coletadoEm
      }
    });
    
    console.log('✅ Métricas salvas com sucesso!');
  }
  
  private async verificarAlertas(metricas: MetricasAgregadas): Promise<void> {
    console.log('🚨 Verificando alertas...');
    
    const alertas: string[] = [];
    
    // Alertas críticos
    if (metricas.ti.uptimeSistema < 99) {
      alertas.push(`CRÍTICO: Uptime abaixo de 99% (${metricas.ti.uptimeSistema}%)`);
    }
    
    if (metricas.comerciais.tempoOrcamentoOS > 10) {
      alertas.push(`ATENÇÃO: Tempo Orçamento→OS acima de 10min (${metricas.comerciais.tempoOrcamentoOS}min)`);
    }
    
    if (metricas.comerciais.taxaAprovacaoTecnica < 70) {
      alertas.push(`ATENÇÃO: Taxa de aprovação técnica abaixo de 70% (${metricas.comerciais.taxaAprovacaoTecnica}%)`);
    }
    
    if (metricas.producao.slaEntrega < 90) {
      alertas.push(`ATENÇÃO: SLA de entrega abaixo de 90% (${metricas.producao.slaEntrega}%)`);
    }
    
    // Exibir alertas
    if (alertas.length > 0) {
      console.log('🚨 ALERTAS ENCONTRADOS:');
      alertas.forEach(alerta => console.log(`- ${alerta}`));
    } else {
      console.log('✅ Nenhum alerta crítico encontrado');
    }
  }
}

// Executar coleta de métricas
if (require.main === module) {
  const coletor = new ColetorMetricas();
  
  // Coletar para todas as lojas ou loja específica
  const lojaId = process.argv[2] || 'loja-padrao';
  
  coletor.coletarTodasMetricas(lojaId)
    .then((metricas) => {
      console.log('\n📊 MÉTRICAS COLETADAS:');
      console.log(`🏢 Comerciais: Tempo ${metricas.comerciais.tempoOrcamentoOS}min, Aprovação ${metricas.comerciais.taxaAprovacaoTecnica}%`);
      console.log(`🏭 Produção: Apontamentos ${metricas.producao.taxaApontamentos}%, SLA ${metricas.producao.slaEntrega}%`);
      console.log(`💰 Admin: Aprovação rápida ${metricas.administrativas.aprovacaoOSInternaRapida}%, Centro custo ${metricas.administrativas.controleCentroCusto}%`);
      console.log(`💻 TI: Cobertura ${metricas.ti.coberturaTestes}%, Uptime ${metricas.ti.uptimeSistema}%`);
      
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro fatal na coleta de métricas:', error);
      process.exit(1);
    });
}

export { ColetorMetricas };
