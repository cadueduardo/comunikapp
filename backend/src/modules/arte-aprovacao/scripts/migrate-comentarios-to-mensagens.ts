/**
 * Script de Migração: ArteComentario -> ArteMensagem
 * 
 * Este script migra os comentários antigos para o novo sistema de mensagens
 * 
 * Uso: npm run migrate:arte-comentarios
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateComentariosToMensagens() {
  console.log('🚀 Iniciando migração de ArteComentario para ArteMensagem...\n');

  try {
    // 1. Buscar todos os comentários existentes
    const comentarios = await prisma.arteComentario.findMany({
      include: {
        versao: {
          include: {
            os: true,
          },
        },
        usuario: true,
      },
    });

    console.log(`📊 Encontrados ${comentarios.length} comentários para migrar\n`);

    if (comentarios.length === 0) {
      console.log('✅ Nenhum comentário para migrar. Concluído!');
      return;
    }

    let migrados = 0;
    let erros = 0;

    // 2. Migrar cada comentário
    for (const comentario of comentarios) {
      try {
        // Verificar se já existe uma mensagem com o mesmo ID
        const mensagemExistente = await prisma.arteMensagem.findUnique({
          where: { id: comentario.id },
        });

        if (mensagemExistente) {
          console.log(`⏭️  Comentário ${comentario.id} já migrado, pulando...`);
          continue;
        }

        // Determinar autor_tipo baseado no tipo do comentário
        let autorTipo = 'EQUIPE';
        if (comentario.tipo === 'CLIENTE') {
          autorTipo = 'CLIENTE';
        }

        // Criar a mensagem correspondente
        await prisma.arteMensagem.create({
          data: {
            id: comentario.id, // Manter mesmo ID para referência
            os_id: comentario.versao.os_id,
            produto_id: comentario.versao.servico_id || 'default',
            versao_id: comentario.versao_id,
            mensagem: comentario.comentario,
            autor_tipo: autorTipo as any,
            autor_nome: comentario.usuario?.nome || 'Usuário',
            autor_email: comentario.usuario?.email || '',
            lida: true, // Comentários antigos são considerados lidos
            loja_id: comentario.versao.os.loja_id,
            created_at: comentario.data_comentario,
            updated_at: comentario.data_comentario,
          },
        });

        migrados++;
        console.log(`✅ Migrado: ${comentario.id} - ${comentario.comentario.substring(0, 50)}...`);
      } catch (error) {
        erros++;
        console.error(`❌ Erro ao migrar comentário ${comentario.id}:`, error.message);
      }
    }

    console.log(`\n📈 Resumo da Migração:`);
    console.log(`   ✅ Migrados: ${migrados}`);
    console.log(`   ❌ Erros: ${erros}`);
    console.log(`   📊 Total: ${comentarios.length}`);

    if (erros === 0) {
      console.log('\n🎉 Migração concluída com sucesso!');
      console.log('\n⚠️  IMPORTANTE: Faça backup da tabela ArteComentario antes de excluí-la!');
      console.log('   Comando SQL para backup: CREATE TABLE ArteComentario_backup AS SELECT * FROM ArteComentario;');
    } else {
      console.log('\n⚠️  Migração concluída com erros. Verifique os logs acima.');
    }
  } catch (error) {
    console.error('\n❌ Erro fatal na migração:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar migração
migrateComentariosToMensagens()
  .then(() => {
    console.log('\n✅ Script de migração finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });

