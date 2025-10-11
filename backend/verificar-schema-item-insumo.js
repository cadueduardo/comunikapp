const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verificarSchemaItemInsumo() {
  try {
    console.log('🔍 Verificando schema da tabela ItemInsumo...');
    
    // Buscar um ItemInsumo para ver a estrutura
    const itemInsumo = await prisma.itemInsumo.findFirst({
      include: {
        insumo: true,
        produto: true
      }
    });

    if (itemInsumo) {
      console.log('📊 Estrutura do ItemInsumo:');
      console.log('   Campos disponíveis:', Object.keys(itemInsumo));
      console.log('   Dados do item:', itemInsumo);
      
      console.log('\n📊 Estrutura do Insumo relacionado:');
      console.log('   Campos disponíveis:', Object.keys(itemInsumo.insumo));
      console.log('   Dados do insumo:', itemInsumo.insumo);
    } else {
      console.log('❌ Nenhum ItemInsumo encontrado!');
    }

    // Verificar schema do Prisma
    console.log('\n🔍 Verificando schema do Prisma...');
    const schema = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'ItemInsumo'
      ORDER BY ordinal_position;
    `;
    
    console.log('📊 Colunas da tabela ItemInsumo:');
    schema.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarSchemaItemInsumo();
















