/**
 * Correção pontual: forçar profundidade=90 no produto do ORC-2026-005 ("Letra Caixa XPS")
 * que foi salvo antes do fix do bug de profundidade da Fase 11. Permite ao usuário
 * validar o fluxo de REABERTURA (frontend deve marcar checkbox 3D e mostrar campo
 * profundidade=90).
 *
 * Uso: npx ts-node scripts/corrigir-profundidade-orc-005.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const orcamento = await prisma.orcamento.findFirst({
    where: { numero: 'ORC-2026-005' },
    include: { produtos: true },
  });

  if (!orcamento) {
    throw new Error('ORC-2026-005 nao encontrado');
  }

  if (orcamento.produtos.length === 0) {
    throw new Error('ORC-2026-005 sem produtos');
  }

  const produto = orcamento.produtos[0];
  console.log(`📦 Produto atual: "${produto.nome_servico}"`);
  console.log(
    `   L=${produto.largura} A=${produto.altura} P=${produto.profundidade} unidade=${produto.unidade_geometria}`,
  );

  if (produto.profundidade && Number(produto.profundidade) > 0) {
    console.log('✅ Profundidade já está preenchida. Nada a fazer.');
    return;
  }

  const atualizado = await prisma.produtoOrcamento.update({
    where: { id: produto.id },
    data: { profundidade: 90 },
  });

  console.log('');
  console.log('✅ Profundidade corrigida:');
  console.log(`   L=${atualizado.largura} A=${atualizado.altura} P=${atualizado.profundidade}`);
  console.log('');
  console.log('🎯 Próximo passo: reabra o rascunho ORC-2026-005 no frontend.');
  console.log('   O checkbox "Este produto tem profundidade (3D)" deve vir marcado');
  console.log('   e o campo Profundidade deve mostrar "90".');
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
