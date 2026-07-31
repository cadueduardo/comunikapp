/**
 * Gate 0S / HS-04 — verifica o resultado da migration do código de aprovação
 * seguro na engine em que ela acabou de ser aplicada.
 *
 * Complementa `validar-codigo-aprovacao-mysql.ts`: aquele exercita o
 * comportamento (emissão, expiração, revogação, uso único, concorrência); este
 * confere o **efeito estrutural** da migration — tipos de coluna, nulidade,
 * default e a invalidação irreversível dos códigos legados.
 *
 * Uso: rodar logo após aplicar o SQL da migration.
 *   npx ts-node scripts/verificar-migration-hs04.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface Coluna {
  COLUMN_NAME: string;
  COLUMN_TYPE: string;
  IS_NULLABLE: string;
  COLUMN_DEFAULT: string | null;
}

const ESPERADO: Record<
  string,
  { tipo: RegExp; nulo: boolean; padrao: string | null }
> = {
  codigo_aprovacao_hash: { tipo: /^char\(64\)/i, nulo: true, padrao: null },
  codigo_aprovacao_expira_em: { tipo: /^datetime\(3\)/i, nulo: true, padrao: null },
  codigo_aprovacao_tentativas: { tipo: /^int/i, nulo: false, padrao: '0' },
  codigo_aprovacao_usado_em: { tipo: /^datetime\(3\)/i, nulo: true, padrao: null },
  codigo_aprovacao_revogado_em: { tipo: /^datetime\(3\)/i, nulo: true, padrao: null },
};

const resultados: Array<{ nome: string; ok: boolean; detalhe: string }> = [];

function verificar(nome: string, ok: boolean, detalhe: string) {
  resultados.push({ nome, ok, detalhe });
  console.log(`${ok ? 'OK   ' : 'FALHA'} | ${nome} | ${detalhe}`);
}

async function principal() {
  const versao = await prisma.$queryRawUnsafe<Array<{ v: string; c: string }>>(
    'SELECT VERSION() AS v, @@version_comment AS c',
  );
  console.log(`Engine: ${versao[0]?.v} (${versao[0]?.c})\n`);

  const colunas = await prisma.$queryRawUnsafe<Coluna[]>(
    `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orcamento'
        AND COLUMN_NAME LIKE 'codigo_aprovacao%'`,
  );
  const porNome = new Map(colunas.map((c) => [c.COLUMN_NAME, c]));

  for (const [nome, esperado] of Object.entries(ESPERADO)) {
    const c = porNome.get(nome);
    if (!c) {
      verificar(`coluna ${nome}`, false, 'AUSENTE');
      continue;
    }
    const tipoOk = esperado.tipo.test(c.COLUMN_TYPE);
    const nuloOk = (c.IS_NULLABLE === 'YES') === esperado.nulo;
    const padraoOk = (c.COLUMN_DEFAULT ?? null) === esperado.padrao;
    verificar(
      `coluna ${nome}`,
      tipoOk && nuloOk && padraoOk,
      `tipo=${c.COLUMN_TYPE} nulo=${c.IS_NULLABLE} default=${c.COLUMN_DEFAULT}`,
    );
  }

  // A migration não pode ter criado índice sobre o hash: o código só é
  // verificado com o orçamento já resolvido por id.
  const indicesHash = await prisma.$queryRawUnsafe<Array<{ qtd: bigint }>>(
    `SELECT COUNT(*) AS qtd FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orcamento'
        AND COLUMN_NAME = 'codigo_aprovacao_hash'`,
  );
  verificar(
    'sem índice sobre o hash',
    Number(indicesHash[0]?.qtd ?? 0) === 0,
    `indices=${Number(indicesHash[0]?.qtd ?? 0)}`,
  );

  const legados = await prisma.$queryRawUnsafe<Array<{ qtd: bigint }>>(
    'SELECT COUNT(*) AS qtd FROM `orcamento` WHERE `codigo_aprovacao` IS NOT NULL',
  );
  verificar(
    'códigos legados em texto claro foram zerados',
    Number(legados[0]?.qtd ?? 0) === 0,
    `restantes=${Number(legados[0]?.qtd ?? 0)}`,
  );

  const falhas = resultados.filter((r) => !r.ok);
  console.log(
    `\n${resultados.length - falhas.length}/${resultados.length} verificações passaram.`,
  );
  if (falhas.length > 0) process.exitCode = 1;
}

principal()
  .catch((erro) => {
    console.error('Falha na verificação:', erro);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
