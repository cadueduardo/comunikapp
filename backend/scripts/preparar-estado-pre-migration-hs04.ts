/**
 * Gate 0S / HS-04 — coloca o banco no estado *anterior* à migration do código
 * de aprovação seguro, para que ela possa ser aplicada e verificada de verdade.
 *
 * Por que isso é necessário: o histórico de migrations do repositório não roda
 * do zero (ver §2.8 do gate — a migration `20251101000100_add_workflow_categories`
 * falha com errno 150 num banco vazio). Sem esse contorno, não haveria como
 * exercitar a migration do HS-04 em MySQL 8 no CI.
 *
 * O caminho usado é: `prisma db push` materializa o schema completo, este
 * script desfaz apenas o pedaço que a migration do HS-04 introduz e recria uma
 * linha com código legado em texto claro. Depois disso, aplicar o SQL da
 * migration exercita exatamente o DDL e o UPDATE de invalidação que rodarão em
 * produção.
 *
 * Uso:
 *   npx ts-node scripts/preparar-estado-pre-migration-hs04.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const COLUNAS_DA_MIGRATION = [
  'codigo_aprovacao_hash',
  'codigo_aprovacao_expira_em',
  'codigo_aprovacao_tentativas',
  'codigo_aprovacao_usado_em',
  'codigo_aprovacao_revogado_em',
];

async function principal() {
  const versao = await prisma.$queryRawUnsafe<Array<{ v: string }>>(
    'SELECT VERSION() AS v',
  );
  console.log(`Engine: ${versao[0]?.v}`);

  for (const coluna of COLUNAS_DA_MIGRATION) {
    const existe = await prisma.$queryRawUnsafe<Array<{ qtd: bigint }>>(
      `SELECT COUNT(*) AS qtd FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'orcamento'
          AND COLUMN_NAME = ?`,
      coluna,
    );
    if (Number(existe[0]?.qtd ?? 0) > 0) {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE \`orcamento\` DROP COLUMN \`${coluna}\``,
      );
      console.log(`removida: ${coluna}`);
    }
  }

  // Uma loja, um orçamento e um código legado em texto claro — é esse valor que
  // a migration precisa apagar. Sem ele, o passo 2 da migration não seria
  // exercitado de fato.
  const marca = 'ci-hs04-' + Date.now();
  const loja = await prisma.loja.create({
    data: {
      nome: 'CI HS04',
      slug: marca,
      email: `${marca}@exemplo.invalido`,
      telefone: '1130000000',
      atualizado_em: new Date(),
      status: 'ATIVO',
    },
  });
  const cliente = await prisma.cliente.create({
    data: {
      loja_id: loja.id,
      nome: 'Cliente CI',
      tipo_pessoa: 'PESSOA_JURIDICA',
      documento: '00000000000155',
    },
  });
  const orcamento = await prisma.orcamento.create({
    data: {
      loja_id: loja.id,
      cliente_id: cliente.id,
      numero: `${marca}-001`,
      nome_servico: 'Proposta CI',
      atualizado_em: new Date(),
      horas_producao: 1,
      custo_material: 100,
      custo_mao_obra: 50,
      custo_indireto: 25,
      custo_total: 175,
      margem_lucro: 35,
      impostos: 10,
      preco_final: 220,
      status: 'enviado',
    },
  });
  await prisma.$executeRawUnsafe(
    'UPDATE `orcamento` SET `codigo_aprovacao` = ? WHERE `id` = ?',
    'ABC12345',
    orcamento.id,
  );

  console.log(
    `Estado pré-migration pronto: 1 orçamento com código legado em texto claro.`,
  );
}

principal()
  .catch((erro) => {
    console.error('Falha ao preparar o estado pré-migration:', erro);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
