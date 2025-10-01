import { PrismaClient } from '@prisma/client';

/**
 * Script para analisar dados existentes de OS e orçamentos
 * Objetivo: Extrair amostra representativa e mapear lacunas de dados
 * 
 * Execução: npx ts-node scripts/analisar-dados-os-existente.ts
 */

interface AnaliseOS {
  totalOS: number;
  totalOrcamentos: number;
  amostraOS: any[];
  amostraOrcamentos: any[];
  lacunasIdentificadas: string[];
  recomendacoes: string[];
}

async function analisarDadosExistentes(): Promise<AnaliseOS> {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Iniciando análise de dados existentes...');
    
    // 1. Contar total de registros
    const totalOS = await prisma.ordemServico.count();
    const totalOrcamentos = await prisma.orcamento.count();
    
    console.log(`📊 Total de OS: ${totalOS}`);
    console.log(`📊 Total de Orçamentos: ${totalOrcamentos}`);
    
    // 2. Extrair amostra representativa (máximo 50 registros de cada)
    const amostraOS = await prisma.ordemServico.findMany({
      take: Math.min(50, totalOS),
      include: {
        loja: true,
        cliente: true,
        orcamento: true,
        itens: true,
        movimentacoes: true,
        checklists: true
      },
      orderBy: {
        criado_em: 'desc'
      }
    });
    
    const amostraOrcamentos = await prisma.orcamento.findMany({
      take: Math.min(50, totalOrcamentos),
      include: {
        loja: true,
        cliente: true,
        itens: true
      },
      orderBy: {
        criado_em: 'desc'
      }
    });
    
    // 3. Analisar lacunas de dados
    const lacunasIdentificadas = await identificarLacunas(amostraOS, amostraOrcamentos);
    
    // 4. Gerar recomendações
    const recomendacoes = gerarRecomendacoes(lacunasIdentificadas);
    
    const resultado: AnaliseOS = {
      totalOS,
      totalOrcamentos,
      amostraOS,
      amostraOrcamentos,
      lacunasIdentificadas,
      recomendacoes
    };
    
    // 5. Salvar resultado em arquivo
    await salvarResultado(resultado);
    
    return resultado;
    
  } catch (error) {
    console.error('❌ Erro na análise:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function identificarLacunas(amostraOS: any[], amostraOrcamentos: any[]): Promise<string[]> {
  const lacunas: string[] = [];
  
  console.log('🔍 Identificando lacunas de dados...');
  
  // Analisar OS
  for (const os of amostraOS) {
    // Verificar campos obrigatórios
    if (!os.numero || os.numero.trim() === '') {
      lacunas.push(`OS ${os.id}: Campo 'numero' vazio ou nulo`);
    }
    
    if (!os.nome_servico || os.nome_servico.trim() === '') {
      lacunas.push(`OS ${os.id}: Campo 'nome_servico' vazio ou nulo`);
    }
    
    if (!os.quantidade || os.quantidade <= 0) {
      lacunas.push(`OS ${os.id}: Campo 'quantidade' inválido (${os.quantidade})`);
    }
    
    // Verificar relacionamentos
    if (!os.cliente_id) {
      lacunas.push(`OS ${os.id}: Sem cliente associado`);
    }
    
    if (!os.orcamento_id) {
      lacunas.push(`OS ${os.id}: Sem orçamento associado (OS direta)`);
    }
    
    // Verificar dados JSON
    if (os.parametros_tecnicos) {
      try {
        JSON.parse(os.parametros_tecnicos);
      } catch {
        lacunas.push(`OS ${os.id}: Campo 'parametros_tecnicos' com JSON inválido`);
      }
    }
    
    if (os.insumos_calculados) {
      try {
        JSON.parse(os.insumos_calculados);
      } catch {
        lacunas.push(`OS ${os.id}: Campo 'insumos_calculados' com JSON inválido`);
      }
    }
    
    // Verificar itens
    if (os.itens && os.itens.length === 0) {
      lacunas.push(`OS ${os.id}: Sem itens associados`);
    }
  }
  
  // Analisar Orçamentos
  for (const orcamento of amostraOrcamentos) {
    // Verificar campos obrigatórios
    if (!orcamento.numero || orcamento.numero.trim() === '') {
      lacunas.push(`Orçamento ${orcamento.id}: Campo 'numero' vazio ou nulo`);
    }
    
    if (!orcamento.nome_servico || orcamento.nome_servico.trim() === '') {
      lacunas.push(`Orçamento ${orcamento.id}: Campo 'nome_servico' vazio ou nulo`);
    }
    
    // Verificar valores financeiros
    if (!orcamento.custo_total || orcamento.custo_total <= 0) {
      lacunas.push(`Orçamento ${orcamento.id}: Campo 'custo_total' inválido (${orcamento.custo_total})`);
    }
    
    if (!orcamento.preco_final || orcamento.preco_final <= 0) {
      lacunas.push(`Orçamento ${orcamento.id}: Campo 'preco_final' inválido (${orcamento.preco_final})`);
    }
    
    // Verificar relacionamentos
    if (!orcamento.cliente_id) {
      lacunas.push(`Orçamento ${orcamento.id}: Sem cliente associado`);
    }
    
    // Verificar itens
    if (orcamento.itens && orcamento.itens.length === 0) {
      lacunas.push(`Orçamento ${orcamento.id}: Sem itens associados`);
    }
  }
  
  // Verificar padrões de numeração
  const numerosOS = amostraOS.map(os => os.numero).filter(n => n);
  const numerosOrcamentos = amostraOrcamentos.map(o => o.numero).filter(n => n);
  
  const padraoOSAtual = analisarPadraoNumeracao(numerosOS);
  const padraoOrcamentoAtual = analisarPadraoNumeracao(numerosOrcamentos);
  
  if (padraoOSAtual.inconsistente) {
    lacunas.push(`Padrão de numeração OS inconsistente: ${padraoOSAtual.exemplos.join(', ')}`);
  }
  
  if (padraoOrcamentoAtual.inconsistente) {
    lacunas.push(`Padrão de numeração Orçamento inconsistente: ${padraoOrcamentoAtual.exemplos.join(', ')}`);
  }
  
  console.log(`📋 Lacunas identificadas: ${lacunas.length}`);
  
  return lacunas;
}

function analisarPadraoNumeracao(numeros: string[]): { inconsistente: boolean; exemplos: string[] } {
  const padroes = new Set<string>();
  const exemplos: string[] = [];
  
  for (const numero of numeros) {
    // Identificar padrões comuns
    if (numero.match(/^\d+$/)) {
      padroes.add('NUMERICO_SIMPLES');
    } else if (numero.match(/^OS-\d+$/)) {
      padroes.add('OS-NUMERO');
    } else if (numero.match(/^OS-\d{4}-\d+$/)) {
      padroes.add('OS-AAAA-NNN');
    } else if (numero.match(/^ORC-\d+$/)) {
      padroes.add('ORC-NUMERO');
    } else if (numero.match(/^ORC-\d{4}-\d+$/)) {
      padroes.add('ORC-AAAA-NNN');
    } else {
      padroes.add('OUTRO');
      exemplos.push(numero);
    }
  }
  
  return {
    inconsistente: padroes.size > 1,
    exemplos: exemplos.slice(0, 5) // Máximo 5 exemplos
  };
}

function gerarRecomendacoes(lacunas: string[]): string[] {
  const recomendacoes: string[] = [];
  
  // Agrupar lacunas por tipo
  const lacunasPorTipo = {
    camposVazios: lacunas.filter(l => l.includes('vazio ou nulo')).length,
    relacionamentos: lacunas.filter(l => l.includes('Sem cliente') || l.includes('Sem orçamento')).length,
    dadosInvalidos: lacunas.filter(l => l.includes('inválido')).length,
    jsonInvalido: lacunas.filter(l => l.includes('JSON inválido')).length,
    numeracao: lacunas.filter(l => l.includes('numeração')).length
  };
  
  if (lacunasPorTipo.camposVazios > 0) {
    recomendacoes.push(`Implementar validação obrigatória para ${lacunasPorTipo.camposVazios} campos vazios identificados`);
  }
  
  if (lacunasPorTipo.relacionamentos > 0) {
    recomendacoes.push(`Revisar ${lacunasPorTipo.relacionamentos} registros sem relacionamentos obrigatórios`);
  }
  
  if (lacunasPorTipo.dadosInvalidos > 0) {
    recomendacoes.push(`Corrigir ${lacunasPorTipo.dadosInvalidos} registros com dados inválidos`);
  }
  
  if (lacunasPorTipo.jsonInvalido > 0) {
    recomendacoes.push(`Validar e corrigir ${lacunasPorTipo.jsonInvalido} campos JSON malformados`);
  }
  
  if (lacunasPorTipo.numeracao > 0) {
    recomendacoes.push(`Padronizar numeração para formato OS-AAAA-NNN em todos os registros`);
  }
  
  // Recomendações gerais
  recomendacoes.push('Criar scripts de migração com validação e rollback');
  recomendacoes.push('Implementar backup completo antes da migração');
  recomendacoes.push('Testar migração em ambiente de homologação primeiro');
  
  return recomendacoes;
}

async function salvarResultado(resultado: AnaliseOS): Promise<void> {
  const fs = require('fs');
  const path = require('path');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `analise-dados-os-${timestamp}.json`;
  const filepath = path.join(__dirname, '..', 'docs', 'integracao orc os pcp', filename);
  
  // Criar diretório se não existir
  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Salvar resultado
  fs.writeFileSync(filepath, JSON.stringify(resultado, null, 2));
  
  console.log(`💾 Resultado salvo em: ${filepath}`);
  
  // Gerar relatório resumido
  const relatorioResumido = gerarRelatorioResumido(resultado);
  const relatorioPath = path.join(__dirname, '..', 'docs', 'integracao orc os pcp', `relatorio-analise-${timestamp}.md`);
  
  fs.writeFileSync(relatorioPath, relatorioResumido);
  
  console.log(`📄 Relatório salvo em: ${relatorioPath}`);
}

function gerarRelatorioResumido(resultado: AnaliseOS): string {
  return `# 📊 RELATÓRIO DE ANÁLISE - DADOS EXISTENTES

**Data**: ${new Date().toLocaleDateString('pt-BR')}  
**Projeto**: Integração Orçamento → OS → PCP  
**Fase**: 0 - Preparação e Governança

---

## 📈 **RESUMO EXECUTIVO**

- **Total de OS**: ${resultado.totalOS}
- **Total de Orçamentos**: ${resultado.totalOrcamentos}
- **Amostra analisada**: ${resultado.amostraOS.length} OS + ${resultado.amostraOrcamentos.length} Orçamentos
- **Lacunas identificadas**: ${resultado.lacunasIdentificadas.length}

---

## 🔍 **LACUNAS IDENTIFICADAS**

### **Campos Vazios/Nulos**
${resultado.lacunasIdentificadas.filter(l => l.includes('vazio ou nulo')).map(l => `- ${l}`).join('\n') || '- Nenhuma'}

### **Relacionamentos Faltantes**
${resultado.lacunasIdentificadas.filter(l => l.includes('Sem cliente') || l.includes('Sem orçamento')).map(l => `- ${l}`).join('\n') || '- Nenhuma'}

### **Dados Inválidos**
${resultado.lacunasIdentificadas.filter(l => l.includes('inválido')).map(l => `- ${l}`).join('\n') || '- Nenhuma'}

### **JSON Malformado**
${resultado.lacunasIdentificadas.filter(l => l.includes('JSON inválido')).map(l => `- ${l}`).join('\n') || '- Nenhuma'}

### **Numeração Inconsistente**
${resultado.lacunasIdentificadas.filter(l => l.includes('numeração')).map(l => `- ${l}`).join('\n') || '- Nenhuma'}

---

## 💡 **RECOMENDAÇÕES**

${resultado.recomendacoes.map(r => `- ${r}`).join('\n')}

---

## 📋 **PRÓXIMOS PASSOS**

1. **Revisar lacunas críticas** identificadas
2. **Criar scripts de migração** com validação
3. **Implementar backup** antes da migração
4. **Testar em homologação** primeiro
5. **Executar migração** em produção

---

**📝 Relatório gerado automaticamente pelo script de análise**  
**🔄 Versão**: 1.0  
**📋 Status**: Aguardando revisão e aprovação
`;
}

// Executar análise
if (require.main === module) {
  analisarDadosExistentes()
    .then(() => {
      console.log('✅ Análise concluída com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro na análise:', error);
      process.exit(1);
    });
}

export { analisarDadosExistentes };
