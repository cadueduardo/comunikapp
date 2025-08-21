import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  try {
    console.log('🔄 Criando tabela estoque_aproveitamentos...');
    
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS estoque_aproveitamentos (
        id VARCHAR(191) PRIMARY KEY,
        sobra_id VARCHAR(191) NOT NULL,
        quantidade_aproveitada DECIMAL(10,2) NOT NULL,
        projeto_destino VARCHAR(255),
        orcamento_destino VARCHAR(191),
        observacoes TEXT,
        loja_id VARCHAR(191) NOT NULL,
        usuario_id VARCHAR(191),
        data_aproveitamento DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        
        INDEX idx_sobra_id (sobra_id),
        INDEX idx_loja_id (loja_id),
        INDEX idx_data_aproveitamento (data_aproveitamento),
        INDEX idx_usuario_id (usuario_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('✅ Tabela estoque_aproveitamentos criada com sucesso!');
    
    // Verificar se foi criada
    const tableExists = await prisma.$queryRawUnsafe('SHOW TABLES LIKE "estoque_aproveitamentos"');
    if ((tableExists as any[]).length > 0) {
      console.log('✅ Confirmação: tabela existe no banco');
      
      const cols = await prisma.$queryRawUnsafe('DESCRIBE estoque_aproveitamentos');
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
