/**
 * Script de restauração do backup de OSs
 * Gerado automaticamente em: 2025-10-06T17:34:09.211Z
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function restaurarOSs() {
  try {
    const backupData = JSON.parse(fs.readFileSync('C:\projects\comunikapp\backend\backups\os-materiais\os-materiais-backup-2025-10-06T17-34-09-203Z.json', 'utf8'));
    
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
