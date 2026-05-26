/**
 * Seed: Bloco EPS Densidade 30 — exemplo de insumo 3D (Fase 11)
 *
 * Cadastra um insumo de exemplo com `unidade_uso = 'M3'` para validar manualmente o
 * fluxo de produtos 3D no Orçamento V2. Idempotente: pode ser rodado várias vezes sem
 * duplicar (faz findFirst antes de create).
 *
 * Uso:
 *   # Auto-detecta a primeira loja ATIVO
 *   npx ts-node scripts/seed-bloco-eps.ts
 *
 *   # Loja específica
 *   npx ts-node scripts/seed-bloco-eps.ts --loja=cmqxxxxxxxx
 *
 * Pré-requisito: `npx prisma generate` precisa ter rodado depois da migration
 *   20260526090000_add_profundidade_item_os (Fase 11). Se o `dev:backend` estiver
 *   segurando o arquivo `query_engine-windows.dll.node`, pare o backend antes.
 *
 * NOTA: usamos findFirst + create em vez de upsert com unique composto porque assim
 * o script não depende do nome gerado pelo Prisma Client para o composite key (que
 * pode variar entre versões/regenerações).
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seed: Bloco EPS Densidade 30 (exemplo 3D - Fase 11)');
  console.log('');

  // 1) Resolver loja_id (argumento --loja=<id> ou primeira loja ATIVO)
  const lojaArg = process.argv
    .find((arg) => arg.startsWith('--loja='))
    ?.split('=')[1];

  const loja = lojaArg
    ? await prisma.loja.findUnique({ where: { id: lojaArg } })
    : await prisma.loja.findFirst({
        where: { status: 'ATIVO' as any },
        orderBy: { criado_em: 'asc' },
      });

  if (!loja) {
    throw new Error(
      lojaArg
        ? `Loja '${lojaArg}' não encontrada.`
        : "Nenhuma loja ATIVO encontrada. Rode o seed principal (`npm run prisma:seed`) ou passe --loja=<id>.",
    );
  }

  console.log(`📦 Loja alvo: ${loja.nome} (${loja.id})`);
  console.log('');

  // 2) Categoria "Estrutura 3D"
  let categoria = await prisma.categoria.findFirst({
    where: { loja_id: loja.id, nome: 'Estrutura 3D' },
  });
  if (!categoria) {
    categoria = await prisma.categoria.create({
      data: {
        nome: 'Estrutura 3D',
        loja_id: loja.id,
      },
    });
    console.log(`✅ Categoria criada: ${categoria.nome} (${categoria.id})`);
  } else {
    console.log(`↪️  Categoria já existe: ${categoria.nome} (${categoria.id})`);
  }

  // 3) Fornecedor "Genérico (3D)"
  let fornecedor = await prisma.fornecedor.findFirst({
    where: { loja_id: loja.id, nome: 'Genérico (3D)' },
  });
  if (!fornecedor) {
    fornecedor = await prisma.fornecedor.create({
      data: {
        nome: 'Genérico (3D)',
        loja_id: loja.id,
        ativo: true,
      },
    });
    console.log(`✅ Fornecedor criado: ${fornecedor.nome} (${fornecedor.id})`);
  } else {
    console.log(`↪️  Fornecedor já existe: ${fornecedor.nome} (${fornecedor.id})`);
  }

  // 4) Insumo "Bloco EPS Densidade 30"
  //
  // Decisões do exemplo (ajuste depois pelo cadastro real do seu fornecedor):
  // - unidade_compra = 'M3': compra-se em metro cúbico (placas/blocos vendidos por volume).
  // - unidade_uso    = 'M3': consome-se em metro cúbico → MaterialSection auto-calcula
  //   `quantidade = Largura × Altura × Profundidade × fator × (1 + perda%)` quando o
  //   produto está marcado como 3D (Fase 11).
  // - fator_conversao = 1.0: compra e uso na mesma unidade.
  // - quantidade_compra = 1: cada compra equivale a 1 m³ (alinhado com custo_unitario).
  // - custo_unitario = R$ 280,00/m³: preço de mercado aproximado para EPS densidade 30.
  // - logica_consumo = 'area': default do banco. NÃO afeta o cálculo porque o
  //   MaterialSection prioriza `unidade_uso` no switch quando logica_consumo != 'custom'.
  //   Mantido por compatibilidade com listagens antigas que ainda leem esse campo.
  let insumo = await prisma.insumo.findFirst({
    where: {
      loja_id: loja.id,
      nome: 'Bloco EPS Densidade 30',
      fornecedorId: fornecedor.id,
    },
  });

  if (!insumo) {
    insumo = await prisma.insumo.create({
      data: {
        nome: 'Bloco EPS Densidade 30',
        descricao:
          'Bloco de EPS (Isopor) densidade 30 kg/m³ para preenchimento interno de produtos 3D (totens, letras caixa, displays). Cobrado por volume.',
        codigo: 'EPS-D30',
        unidade_compra: 'M3',
        unidade_uso: 'M3',
        fator_conversao: 1.0,
        quantidade_compra: 1,
        custo_unitario: 280.0,
        estoque_minimo: 1,
        ativo: true,
        logica_consumo: 'area',
        categoriaId: categoria.id,
        fornecedorId: fornecedor.id,
        loja_id: loja.id,
      },
    });
    console.log(`✅ Insumo criado: ${insumo.nome} (${insumo.id})`);
  } else {
    // Re-execução: garante que os campos críticos da Fase 11 estejam corretos
    // (caso alguém tenha editado manualmente no banco).
    insumo = await prisma.insumo.update({
      where: { id: insumo.id },
      data: {
        unidade_uso: 'M3',
        unidade_compra: 'M3',
        fator_conversao: 1.0,
        ativo: true,
      },
    });
    console.log(`↪️  Insumo já existe (campos Fase 11 reafirmados): ${insumo.nome} (${insumo.id})`);
  }

  console.log('');
  console.log('📋 Resumo do insumo:');
  console.log(`   nome:            ${insumo.nome}`);
  console.log(`   codigo:          ${insumo.codigo}`);
  console.log(`   unidade_compra:  ${insumo.unidade_compra}`);
  console.log(`   unidade_uso:     ${insumo.unidade_uso}`);
  console.log(`   fator_conversao: ${insumo.fator_conversao}`);
  console.log(`   custo_unitario:  R$ ${insumo.custo_unitario}/m³`);
  console.log('');
  console.log('🎯 Próximo passo: no Orçamento V2, crie um produto 3D');
  console.log('   (marque "Este produto tem profundidade (3D)" e preencha LxAxP).');
  console.log(`   Adicione "${insumo.nome}" como material — o motor preencherá`);
  console.log('   automaticamente a quantidade em m³ (Largura × Altura × Profundidade).');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed do Bloco EPS:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
