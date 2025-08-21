import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  try {
    console.log('🔄 Criando tabela estoque_transferencias...');
    
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS estoque_transferencias (
        id VARCHAR(191) PRIMARY KEY,
        estoqueId VARCHAR(191) NOT NULL,
        localizacaoOrigemId VARCHAR(191) NOT NULL,
        localizacaoDestinoId VARCHAR(191) NOT NULL,
        quantidade DECIMAL(10,2) NOT NULL,
        observacoes TEXT,
        status ENUM('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA') DEFAULT 'CONCLUIDA',
        usuarioId VARCHAR(191),
        lojaId VARCHAR(191) NOT NULL,
        dataTransferencia DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        
        INDEX idx_estoqueId (estoqueId),
        INDEX idx_lojaId (lojaId),
        INDEX idx_dataTransferencia (dataTransferencia),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('✅ Tabela estoque_transferencias criada com sucesso!');
    
    // Verificar se foi criada
    const tableExists = await prisma.$queryRawUnsafe<any[]>('SHOW TABLES LIKE "estoque_transferencias"');
    if (tableExists.length > 0) {
      console.log('✅ Confirmação: tabela existe no banco');
      
      const cols = await prisma.$queryRawUnsafe<any[]>('DESCRIBE estoque_transferencias');
      console.log('\nColunas da tabela:');
      for (const c of cols) {
        console.log(`${c.Field}\t${c.Type}\t${c.Null}\t${c.Key}\t${c.Default}\t${c.Extra}`);
      }
    }
    
  } catch (e) {
    console.error('❌ Erro ao criar tabela:', e);
  } finally {
    await prisma.$disconnect();
  }
}

run();
