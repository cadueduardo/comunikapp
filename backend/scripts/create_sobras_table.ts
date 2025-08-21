import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  try {
    console.log('🔄 Criando tabela estoque_sobras...');
    
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS estoque_sobras (
        id VARCHAR(191) PRIMARY KEY,
        estoque_id VARCHAR(191) NOT NULL,
        codigo_sobra VARCHAR(191) UNIQUE NOT NULL,
        descricao TEXT,
        dimensoes VARCHAR(255),
        area DECIMAL(10,2),
        quantidade DECIMAL(10,2) NOT NULL,
        unidade_medida VARCHAR(50),
        material VARCHAR(255),
        cor VARCHAR(100),
        acabamento VARCHAR(100),
        status ENUM('DISPONIVEL', 'APROVEITADA', 'DESCARTADA') DEFAULT 'DISPONIVEL',
        origem VARCHAR(255),
        data_geracao DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        orcamento_origem VARCHAR(191),
        data_aproveitamento DATETIME(3),
        quantidade_aproveitada DECIMAL(10,2) DEFAULT 0,
        economia_gerada DECIMAL(12,2) DEFAULT 0,
        loja_id VARCHAR(191) NOT NULL,
        created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        
        INDEX idx_estoque_id (estoque_id),
        INDEX idx_loja_id (loja_id),
        INDEX idx_status (status),
        INDEX idx_codigo_sobra (codigo_sobra),
        INDEX idx_data_geracao (data_geracao)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('✅ Tabela estoque_sobras criada com sucesso!');
    
    // Verificar se foi criada
    const tableExists = await prisma.$queryRawUnsafe('SHOW TABLES LIKE "estoque_sobras"');
    if ((tableExists as any[]).length > 0) {
      console.log('✅ Confirmação: tabela existe no banco');
      
      const cols = await prisma.$queryRawUnsafe('DESCRIBE estoque_sobras');
      console.log('\nColunas da tabela:');
      for (const c of cols as any[]) {
        console.log(`${c.Field}\t${c.Type}\t${c.Null}\t${c.Key}\t${c.Default}\t${c.Extra}`);
      }
    }
    
  } catch (e: any) {
    console.error('❌ Erro ao criar tabela:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

run();
