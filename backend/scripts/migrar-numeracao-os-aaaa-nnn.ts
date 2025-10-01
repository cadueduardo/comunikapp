import { PrismaClient } from '@prisma/client';

/**
 * Script para migrar numeração de OS e Orçamentos para formato OS-AAAA-NNN
 * Objetivo: Padronizar numeração conforme DocumentCodeService
 * 
 * Execução: npx ts-node scripts/migrar-numeracao-os-aaaa-nnn.ts
 * 
 * IMPORTANTE: Executar primeiro em ambiente de homologação!
 */

interface ResultadoMigracao {
  sucesso: boolean;
  osMigradas: number;
  orcamentosMigrados: number;
  erros: string[];
  rollbackDisponivel: boolean;
}

class MigradorNumeracao {
  private prisma: PrismaClient;
  private backupData: Map<string, any> = new Map();
  
  constructor() {
    this.prisma = new PrismaClient();
  }
  
  async migrar(): Promise<ResultadoMigracao> {
    const resultado: ResultadoMigracao = {
      sucesso: false,
      osMigradas: 0,
      orcamentosMigrados: 0,
      erros: [],
      rollbackDisponivel: false
    };
    
    try {
      console.log('🚀 Iniciando migração de numeração para OS-AAAA-NNN...');
      
      // 1. Validar pré-requisitos
      await this.validarPreRequisitos();
      
      // 2. Criar backup
      await this.criarBackup();
      resultado.rollbackDisponivel = true;
      
      // 3. Migrar OS
      resultado.osMigradas = await this.migrarOS();
      
      // 4. Migrar Orçamentos
      resultado.orcamentosMigrados = await this.migrarOrcamentos();
      
      // 5. Validar migração
      await this.validarMigracao();
      
      resultado.sucesso = true;
      console.log('✅ Migração concluída com sucesso!');
      
    } catch (error: any) {
      console.error('❌ Erro na migração:', error.message);
      resultado.erros.push(error.message);
      
      // Tentar rollback automático
      if (resultado.rollbackDisponivel) {
        console.log('🔄 Tentando rollback automático...');
        await this.rollback();
      }
    } finally {
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
    
    // Verificar se há dados para migrar
    const totalOS = await this.prisma.ordemServico.count();
    const totalOrcamentos = await this.prisma.orcamento.count();
    
    if (totalOS === 0 && totalOrcamentos === 0) {
      throw new Error('Nenhum dado encontrado para migração.');
    }
    
    console.log(`📊 Encontrados ${totalOS} OS e ${totalOrcamentos} Orçamentos para migração`);
  }
  
  private async criarBackup(): Promise<void> {
    console.log('💾 Criando backup dos dados...');
    
    // Backup de OS
    const osData = await this.prisma.ordemServico.findMany({
      select: {
        id: true,
        numero: true,
        loja_id: true
      }
    });
    
    for (const os of osData) {
      this.backupData.set(`os_${os.id}`, {
        numero: os.numero,
        loja_id: os.loja_id
      });
    }
    
    // Backup de Orçamentos
    const orcamentoData = await this.prisma.orcamento.findMany({
      select: {
        id: true,
        numero: true,
        loja_id: true
      }
    });
    
    for (const orcamento of orcamentoData) {
      this.backupData.set(`orcamento_${orcamento.id}`, {
        numero: orcamento.numero,
        loja_id: orcamento.loja_id
      });
    }
    
    console.log(`💾 Backup criado: ${this.backupData.size} registros`);
  }
  
  private async migrarOS(): Promise<number> {
    console.log('🔄 Migrando numeração de OS...');
    
    const osList = await this.prisma.ordemServico.findMany({
      include: {
        loja: true
      }
    });
    
    let migradas = 0;
    
    for (const os of osList) {
      try {
        // Verificar se já está no formato correto
        if (this.estaNoFormatoCorreto(os.numero, 'OS')) {
          console.log(`⏭️ OS ${os.id} já está no formato correto: ${os.numero}`);
          continue;
        }
        
        // Gerar nova numeração
        const novoNumero = await this.gerarNovoNumero('OS', os.loja_id, os.data_abertura.getFullYear());
        
        // Atualizar registro
        await this.prisma.ordemServico.update({
          where: { id: os.id },
          data: { numero: novoNumero }
        });
        
        console.log(`✅ OS ${os.id}: ${os.numero} → ${novoNumero}`);
        migradas++;
        
      } catch (error: any) {
        console.error(`❌ Erro ao migrar OS ${os.id}:`, error.message);
        throw error;
      }
    }
    
    console.log(`📊 OS migradas: ${migradas}`);
    return migradas;
  }
  
  private async migrarOrcamentos(): Promise<number> {
    console.log('🔄 Migrando numeração de Orçamentos...');
    
    const orcamentoList = await this.prisma.orcamento.findMany({
      include: {
        loja: true
      }
    });
    
    let migrados = 0;
    
    for (const orcamento of orcamentoList) {
      try {
        // Verificar se já está no formato correto
        if (this.estaNoFormatoCorreto(orcamento.numero, 'ORC')) {
          console.log(`⏭️ Orçamento ${orcamento.id} já está no formato correto: ${orcamento.numero}`);
          continue;
        }
        
        // Gerar nova numeração
        const novoNumero = await this.gerarNovoNumero('ORC', orcamento.loja_id, orcamento.criado_em.getFullYear());
        
        // Atualizar registro
        await this.prisma.orcamento.update({
          where: { id: orcamento.id },
          data: { numero: novoNumero }
        });
        
        console.log(`✅ Orçamento ${orcamento.id}: ${orcamento.numero} → ${novoNumero}`);
        migrados++;
        
      } catch (error: any) {
        console.error(`❌ Erro ao migrar Orçamento ${orcamento.id}:`, error.message);
        throw error;
      }
    }
    
    console.log(`📊 Orçamentos migrados: ${migrados}`);
    return migrados;
  }
  
  private estaNoFormatoCorreto(numero: string, tipo: string): boolean {
    // Verificar se está no formato TIPO-AAAA-NNN
    const regex = new RegExp(`^${tipo}-\\d{4}-\\d+$`);
    return regex.test(numero);
  }
  
  private async gerarNovoNumero(tipo: string, lojaId: string, ano: number): Promise<string> {
    // Buscar ou criar sequence para o ano
    let sequence = await this.prisma.document_sequence.findUnique({
      where: {
        loja_id_tipo_ano: {
          loja_id: lojaId,
          tipo: tipo,
          ano: ano
        }
      }
    });
    
    if (!sequence) {
      sequence = await this.prisma.document_sequence.create({
        data: {
          loja_id: lojaId,
          tipo: tipo,
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
    
    // Retornar no formato TIPO-AAAA-NNN
    return `${tipo}-${ano}-${novoNumero.toString().padStart(6, '0')}`;
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
    
    // Verificar se todos os Orçamentos estão no formato correto
    const orcamentosIncorretos = await this.prisma.orcamento.findMany({
      where: {
        numero: {
          not: {
            startsWith: 'ORC-'
          }
        }
      }
    });
    
    if (orcamentosIncorretos.length > 0) {
      throw new Error(`${orcamentosIncorretos.length} Orçamentos ainda não estão no formato correto`);
    }
    
    console.log('✅ Validação da migração concluída');
  }
  
  private async rollback(): Promise<void> {
    console.log('🔄 Executando rollback...');
    
    try {
      // Rollback de OS
      for (const [key, data] of this.backupData.entries()) {
        if (key.startsWith('os_')) {
          const id = key.replace('os_', '');
          await this.prisma.ordemServico.update({
            where: { id },
            data: { numero: data.numero }
          });
        }
      }
      
      // Rollback de Orçamentos
      for (const [key, data] of this.backupData.entries()) {
        if (key.startsWith('orcamento_')) {
          const id = key.replace('orcamento_', '');
          await this.prisma.orcamento.update({
            where: { id },
            data: { numero: data.numero }
          });
        }
      }
      
      console.log('✅ Rollback concluído');
      
    } catch (error: any) {
      console.error('❌ Erro no rollback:', error.message);
      throw error;
    }
  }
}

// Executar migração
if (require.main === module) {
  const migrador = new MigradorNumeracao();
  
  migrador.migrar()
    .then((resultado) => {
      console.log('\n📊 RESULTADO DA MIGRAÇÃO:');
      console.log(`✅ Sucesso: ${resultado.sucesso}`);
      console.log(`📄 OS migradas: ${resultado.osMigradas}`);
      console.log(`📄 Orçamentos migrados: ${resultado.orcamentosMigrados}`);
      console.log(`❌ Erros: ${resultado.erros.length}`);
      console.log(`🔄 Rollback disponível: ${resultado.rollbackDisponivel}`);
      
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

export { MigradorNumeracao };
