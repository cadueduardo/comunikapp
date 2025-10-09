/**
 * Script de backup das OSs antes da migração de materiais
 * Objetivo: Criar backup de segurança dos dados atuais
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function fazerBackupOSs() {
  console.log('💾 Iniciando backup das OSs antes da migração...\n');

  try {
    // 1. Buscar todas as OSs com orçamento
    const osComOrcamento = await prisma.ordemServico.findMany({
      where: {
        orcamento_id: {
          not: null
        }
      },
      select: {
        id: true,
        numero: true,
        orcamento_id: true,
        insumos_calculados: true,
        criado_em: true,
        atualizado_em: true
      }
    });

    console.log(`📊 Encontradas ${osComOrcamento.length} OSs para backup\n`);

    // 2. Criar diretório de backup
    const backupDir = path.join(__dirname, '..', 'backups', 'os-materiais');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // 3. Gerar nome do arquivo com timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `os-materiais-backup-${timestamp}.json`);

    // 4. Salvar backup
    const backupData = {
      timestamp: new Date().toISOString(),
      total_os: osComOrcamento.length,
      os_list: osComOrcamento.map(os => ({
        id: os.id,
        numero: os.numero,
        orcamento_id: os.orcamento_id,
        insumos_calculados: os.insumos_calculados,
        criado_em: os.criado_em,
        atualizado_em: os.atualizado_em
      }))
    };

    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));

    console.log(`✅ Backup salvo em: ${backupFile}`);
    console.log(`📊 Total de OSs no backup: ${osComOrcamento.length}`);
    console.log(`💾 Tamanho do arquivo: ${(fs.statSync(backupFile).size / 1024).toFixed(2)} KB`);

    // 5. Criar script de restauração
    const restoreScript = `/**
 * Script de restauração do backup de OSs
 * Gerado automaticamente em: ${new Date().toISOString()}
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function restaurarOSs() {
  try {
    const backupData = JSON.parse(fs.readFileSync('${backupFile}', 'utf8'));
    
    console.log('🔄 Iniciando restauração das OSs...');
    
    for (const osData of backupData.os_list) {
      await prisma.ordemServico.update({
        where: { id: osData.id },
        data: {
          insumos_calculados: osData.insumos_calculados,
          atualizado_em: new Date()
        }
      });
    }
    
    console.log('✅ Restauração concluída!');
  } catch (error) {
    console.error('❌ Erro na restauração:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restaurarOSs();
`;

    const restoreFile = path.join(backupDir, `restaurar-os-${timestamp}.ts`);
    fs.writeFileSync(restoreFile, restoreScript);

    console.log(`🔧 Script de restauração criado: ${restoreFile}`);
    console.log('\n🎉 Backup concluído com sucesso!');

  } catch (error) {
    console.error('💥 Erro durante o backup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar backup
if (require.main === module) {
  fazerBackupOSs()
    .then(() => {
      console.log('\n🏁 Script de backup finalizado.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro no script de backup:', error);
      process.exit(1);
    });
}

export { fazerBackupOSs };





