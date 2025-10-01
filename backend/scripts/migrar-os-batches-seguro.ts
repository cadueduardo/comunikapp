import { PrismaClient } from '@prisma/client';

/**
 * Script para migração segura de OS existentes em batches
 * Objetivo: Migrar OS existentes para novo formato com rollback automático
 * 
 * Execução: npx ts-node scripts/migrar-os-batches-seguro.ts
 * 
 * IMPORTANTE: Executar primeiro em ambiente de homologação!
 */

interface ResultadoMigracao {
  sucesso: boolean;
  totalProcessadas: number;
  totalMigradas: number;
  totalIgnoradas: number;
  erros: string[];
  rollbackDisponivel: boolean;
  tempoExecucao: number;
}

interface ConfiguracaoMigracao {
  batchSize: number;
  maxErros: number;
  criarBackup: boolean;
  validarAposMigracao: boolean;
  modoDryRun: boolean;
}

class MigradorOSBatches {
  private prisma: PrismaClient;
  private backupData: Map<string, any> = new Map();
  private configuracao: ConfiguracaoMigracao;
  
  constructor(configuracao: ConfiguracaoMigracao = {
    batchSize: 50,
    maxErros: 5,
    criarBackup: true,
    validarAposMigracao: true,
    modoDryRun: false
  }) {
    this.prisma = new PrismaClient();
    this.configuracao = configuracao;
  }
  
  async migrar(): Promise<ResultadoMigracao> {
    const inicio = Date.now();
    const resultado: ResultadoMigracao = {
      sucesso: false,
      totalProcessadas: 0,
      totalMigradas: 0,
      totalIgnoradas: 0,
      erros: [],
      rollbackDisponivel: false,
      tempoExecucao: 0
    };
    
    try {
      console.log('🚀 Iniciando migração segura de OS em batches...');
      console.log(`📋 Configuração: Batch=${this.configuracao.batchSize}, MaxErros=${this.configuracao.maxErros}`);
      
      if (this.configuracao.modoDryRun) {
        console.log('🔍 MODO DRY RUN - Nenhuma alteração será feita');
      }
      
      // 1. Validar pré-requisitos
      await this.validarPreRequisitos();
      
      // 2. Criar backup se necessário
      if (this.configuracao.criarBackup) {
        await this.criarBackup();
        resultado.rollbackDisponivel = true;
      }
      
      // 3. Contar total de OS para migração
      const totalOS = await this.contarOSParaMigracao();
      console.log(`📊 Total de OS para migração: ${totalOS}`);
      
      if (totalOS === 0) {
        console.log('✅ Nenhuma OS precisa ser migrada');
        resultado.sucesso = true;
        return resultado;
      }
      
      // 4. Processar em batches
      let offset = 0;
      let errosConsecutivos = 0;
      
      while (offset < totalOS && errosConsecutivos < this.configuracao.maxErros) {
        console.log(`\n📦 Processando batch ${Math.floor(offset / this.configuracao.batchSize) + 1}...`);
        
        try {
          const batchResultado = await this.processarBatch(offset);
          resultado.totalProcessadas += batchResultado.processadas;
          resultado.totalMigradas += batchResultado.migradas;
          resultado.totalIgnoradas += batchResultado.ignoradas;
          
          if (batchResultado.erros.length > 0) {
            resultado.erros.push(...batchResultado.erros);
            errosConsecutivos++;
          } else {
            errosConsecutivos = 0;
          }
          
          offset += this.configuracao.batchSize;
          
          // Pequena pausa entre batches para não sobrecarregar o banco
          await this.pausaEntreBatches();
          
        } catch (error: any) {
          console.error(`❌ Erro no batch ${Math.floor(offset / this.configuracao.batchSize) + 1}:`, error.message);
          resultado.erros.push(`Batch ${Math.floor(offset / this.configuracao.batchSize) + 1}: ${error.message}`);
          errosConsecutivos++;
          offset += this.configuracao.batchSize;
        }
      }
      
      // 5. Validar migração se necessário
      if (this.configuracao.validarAposMigracao && !this.configuracao.modoDryRun) {
        await this.validarMigracao();
      }
      
      // 6. Determinar sucesso
      resultado.sucesso = resultado.erros.length < this.configuracao.maxErros;
      
      if (resultado.sucesso) {
        console.log('✅ Migração concluída com sucesso!');
      } else {
        console.log('⚠️ Migração concluída com erros');
      }
      
    } catch (error: any) {
      console.error('❌ Erro fatal na migração:', error.message);
      resultado.erros.push(`Erro fatal: ${error.message}`);
      
      // Tentar rollback automático
      if (resultado.rollbackDisponivel) {
        console.log('🔄 Tentando rollback automático...');
        await this.rollback();
      }
    } finally {
      resultado.tempoExecucao = Date.now() - inicio;
      await this.prisma.$disconnect();
    }
    
    return resultado;
  }
  
  private async validarPreRequisitos(): Promise<void> {
    console.log('🔍 Validando pré-requisitos...');
    
    // Verificar se DocumentCodeService está funcionando
    const sequences = await this.prisma.document_sequence.findMany({
      where: {
        tipo: { in: ['OS', 'ORC'] }
      }
    });
    
    if (sequences.length === 0) {
      throw new Error('DocumentCodeService não configurado. Execute primeiro a inicialização das sequences.');
    }
    
    // Verificar se há OS para migração
    const totalOS = await this.prisma.ordemServico.count();
    
    if (totalOS === 0) {
      throw new Error('Nenhuma OS encontrada para migração.');
    }
    
    console.log(`✅ Pré-requisitos validados: ${totalOS} OS encontradas`);
  }
  
  private async criarBackup(): Promise<void> {
    console.log('💾 Criando backup dos dados...');
    
    const osData = await this.prisma.ordemServico.findMany({
      select: {
        id: true,
        numero: true,
        loja_id: true,
        cliente_id: true,
        orcamento_id: true,
        status: true,
        nome_servico: true,
        descricao: true,
        quantidade: true,
        parametros_tecnicos: true,
        insumos_calculados: true,
        materiais_disponivel: true,
        observacoes: true,
        data_abertura: true,
        data_prazo: true,
        responsavel_id: true
      }
    });
    
    for (const os of osData) {
      this.backupData.set(`os_${os.id}`, {
        numero: os.numero,
        loja_id: os.loja_id,
        cliente_id: os.cliente_id,
        orcamento_id: os.orcamento_id,
        status: os.status,
        nome_servico: os.nome_servico,
        descricao: os.descricao,
        quantidade: os.quantidade,
        parametros_tecnicos: os.parametros_tecnicos,
        insumos_calculados: os.insumos_calculados,
        materiais_disponivel: os.materiais_disponivel,
        observacoes: os.observacoes,
        data_abertura: os.data_abertura,
        data_prazo: os.data_prazo,
        responsavel_id: os.responsavel_id
      });
    }
    
    console.log(`💾 Backup criado: ${this.backupData.size} registros`);
  }
  
  private async contarOSParaMigracao(): Promise<number> {
    // Contar OS que precisam ser migradas (que não estão no formato correto)
    const resultado = await this.prisma.$queryRaw<Array<{total: number}>>`
      SELECT COUNT(*) as total
      FROM ordens_servico
      WHERE numero NOT LIKE 'OS-%'
         OR numero NOT REGEXP '^OS-[0-9]{4}-[0-9]{6}$'
    `;
    
    return resultado[0]?.total || 0;
  }
  
  private async processarBatch(offset: number): Promise<{
    processadas: number;
    migradas: number;
    ignoradas: number;
    erros: string[];
  }> {
    const resultado = {
      processadas: 0,
      migradas: 0,
      ignoradas: 0,
      erros: [] as string[]
    };
    
    // Buscar OS do batch
    const osList = await this.prisma.ordemServico.findMany({
      skip: offset,
      take: this.configuracao.batchSize,
      where: {
        OR: [
          { numero: { not: { startsWith: 'OS-' } } },
          { numero: { not: { regex: '^OS-[0-9]{4}-[0-9]{6}$' } } }
        ]
      },
      include: {
        loja: true
      },
      orderBy: {
        criado_em: 'asc'
      }
    });
    
    console.log(`📦 Processando ${osList.length} OS do batch...`);
    
    for (const os of osList) {
      try {
        resultado.processadas++;
        
        // Verificar se já está no formato correto
        if (this.estaNoFormatoCorreto(os.numero)) {
          console.log(`⏭️ OS ${os.id} já está no formato correto: ${os.numero}`);
          resultado.ignoradas++;
          continue;
        }
        
        if (this.configuracao.modoDryRun) {
          console.log(`🔍 DRY RUN: OS ${os.id} seria migrada de ${os.numero} para novo formato`);
          resultado.migradas++;
          continue;
        }
        
        // Migrar OS
        await this.migrarOS(os);
        resultado.migradas++;
        
        console.log(`✅ OS ${os.id} migrada: ${os.numero} → novo formato`);
        
      } catch (error: any) {
        console.error(`❌ Erro ao migrar OS ${os.id}:`, error.message);
        resultado.erros.push(`OS ${os.id}: ${error.message}`);
      }
    }
    
    return resultado;
  }
  
  private estaNoFormatoCorreto(numero: string): boolean {
    // Verificar se está no formato OS-AAAA-NNNNNN
    const regex = /^OS-\d{4}-\d{6}$/;
    return regex.test(numero);
  }
  
  private async migrarOS(os: any): Promise<void> {
    // Gerar nova numeração
    const novoNumero = await this.gerarNovoNumeroOS(os.loja_id, os.data_abertura.getFullYear());
    
    // Atualizar registro
    await this.prisma.ordemServico.update({
      where: { id: os.id },
      data: { 
        numero: novoNumero,
        // Adicionar campos novos com valores padrão
        aprovacao_tecnica_status: 'PENDENTE',
        tipo_os: 'COMERCIAL' // Padrão para OS existentes
      }
    });
  }
  
  private async gerarNovoNumeroOS(lojaId: string, ano: number): Promise<string> {
    // Buscar ou criar sequence para o ano
    let sequence = await this.prisma.document_sequence.findUnique({
      where: {
        loja_id_tipo_ano: {
          loja_id: lojaId,
          tipo: 'OS',
          ano: ano
        }
      }
    });
    
    if (!sequence) {
      sequence = await this.prisma.document_sequence.create({
        data: {
          loja_id: lojaId,
          tipo: 'OS',
          ano: ano,
          ultimo_numero: 0
        }
      });
    }
    
    // Incrementar número
    const novoNumero = sequence.ultimo_numero + 1;
    
    // Atualizar sequence
    await this.prisma.document_sequence.update({
      where: { id: sequence.id },
      data: { ultimo_numero: novoNumero }
    });
    
    // Retornar no formato OS-AAAA-NNNNNN
    return `OS-${ano}-${novoNumero.toString().padStart(6, '0')}`;
  }
  
  private async validarMigracao(): Promise<void> {
    console.log('🔍 Validando migração...');
    
    // Verificar se todas as OS estão no formato correto
    const osIncorretas = await this.prisma.ordemServico.findMany({
      where: {
        numero: {
          not: {
            startsWith: 'OS-'
          }
        }
      }
    });
    
    if (osIncorretas.length > 0) {
      throw new Error(`${osIncorretas.length} OS ainda não estão no formato correto`);
    }
    
    // Verificar se não há duplicatas
    const duplicatas = await this.prisma.$queryRaw<Array<{numero: string, count: number}>>`
      SELECT numero, COUNT(*) as count
      FROM ordens_servico
      GROUP BY numero
      HAVING COUNT(*) > 1
    `;
    
    if (duplicatas.length > 0) {
      throw new Error(`Encontradas ${duplicatas.length} OS com números duplicados`);
    }
    
    console.log('✅ Validação da migração concluída');
  }
  
  private async rollback(): Promise<void> {
    console.log('🔄 Executando rollback...');
    
    try {
      let rollbackCount = 0;
      
      for (const [key, data] of this.backupData.entries()) {
        if (key.startsWith('os_')) {
          const id = key.replace('os_', '');
          
          await this.prisma.ordemServico.update({
            where: { id },
            data: {
              numero: data.numero,
              // Remover campos novos adicionados
              aprovacao_tecnica_status: null,
              tipo_os: null
            }
          });
          
          rollbackCount++;
        }
      }
      
      console.log(`✅ Rollback concluído: ${rollbackCount} registros restaurados`);
      
    } catch (error: any) {
      console.error('❌ Erro no rollback:', error.message);
      throw error;
    }
  }
  
  private async pausaEntreBatches(): Promise<void> {
    // Pausa de 100ms entre batches para não sobrecarregar o banco
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// Executar migração
if (require.main === module) {
  const configuracao: ConfiguracaoMigracao = {
    batchSize: parseInt(process.argv[2]) || 50,
    maxErros: parseInt(process.argv[3]) || 5,
    criarBackup: process.argv[4] !== 'false',
    validarAposMigracao: process.argv[5] !== 'false',
    modoDryRun: process.argv[6] === 'true'
  };
  
  const migrador = new MigradorOSBatches(configuracao);
  
  migrador.migrar()
    .then((resultado) => {
      console.log('\n📊 RESULTADO DA MIGRAÇÃO:');
      console.log(`✅ Sucesso: ${resultado.sucesso}`);
      console.log(`📄 Total processadas: ${resultado.totalProcessadas}`);
      console.log(`📄 Total migradas: ${resultado.totalMigradas}`);
      console.log(`📄 Total ignoradas: ${resultado.totalIgnoradas}`);
      console.log(`❌ Erros: ${resultado.erros.length}`);
      console.log(`🔄 Rollback disponível: ${resultado.rollbackDisponivel}`);
      console.log(`⏱️ Tempo de execução: ${resultado.tempoExecucao}ms`);
      
      if (resultado.erros.length > 0) {
        console.log('\n❌ ERROS:');
        resultado.erros.forEach(erro => console.log(`- ${erro}`));
      }
      
      process.exit(resultado.sucesso ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Erro fatal na migração:', error);
      process.exit(1);
    });
}

export { MigradorOSBatches };
