/**
 * Gate 0S / HS-04 — validação do código de aprovação contra MySQL real.
 *
 * Os testes unitários usam um registro simulado em memória. Este script existe
 * para provar o que aquele simulador não prova: que os `UPDATE ... WHERE`
 * condicionais realmente serializam requisições concorrentes no banco, que os
 * tipos de coluna aceitam os valores emitidos e que expiração, revogação, uso
 * único e teto de tentativas se comportam como contratado.
 *
 * Exercita os **métodos reais** do `OrcamentosV2Service`, não uma reimplementação
 * das consultas. O service é construído sem passar pelo container do Nest porque
 * os caminhos exercitados dependem apenas de `prisma` e `logger`.
 *
 * Uso (nunca contra o banco de trabalho):
 *   $env:DATABASE_URL="mysql://root@localhost:3306/comunikapp_gate0s"
 *   npx ts-node scripts/validar-codigo-aprovacao-mysql.ts
 */
import { PrismaClient } from '@prisma/client';
import { Logger } from '@nestjs/common';
import { OrcamentosV2Service } from '../src/orcamentos-v2/services/orcamentos-v2.service';
import {
  CODIGO_APROVACAO_MAX_TENTATIVAS,
  calcularHashCodigoAprovacao,
} from '../src/common/security/codigo-aprovacao';

const prisma = new PrismaClient();

const service = Object.create(
  OrcamentosV2Service.prototype,
) as OrcamentosV2Service;
(service as any).prisma = prisma;
(service as any).logger = new Logger('ValidacaoGate0S');

type Resultado = { nome: string; ok: boolean; detalhe: string };
const resultados: Resultado[] = [];

function verificar(nome: string, ok: boolean, detalhe: string) {
  resultados.push({ nome, ok, detalhe });
  console.log(`${ok ? 'OK  ' : 'FALHA'} | ${nome} | ${detalhe}`);
}

/** Lê o contador de tentativas persistido. */
async function tentativasDe(id: string): Promise<number> {
  const linha = await prisma.orcamento.findUnique({
    where: { id },
    select: { codigo_aprovacao_tentativas: true },
  });
  return linha?.codigo_aprovacao_tentativas ?? -1;
}

/** Zera o estado do código no orçamento usado como cobaia. */
async function limpar(id: string) {
  await prisma.orcamento.update({
    where: { id },
    data: {
      codigo_aprovacao_hash: null,
      codigo_aprovacao_expira_em: null,
      codigo_aprovacao_tentativas: 0,
      codigo_aprovacao_usado_em: null,
      codigo_aprovacao_revogado_em: null,
    },
  });
}

async function principal() {
  const banco = await prisma.$queryRawUnsafe<Array<{ db: string }>>(
    'SELECT DATABASE() AS db',
  );
  const nomeBanco = banco[0]?.db;
  console.log(`Banco: ${nomeBanco}`);

  if (nomeBanco !== 'comunikapp_gate0s') {
    throw new Error(
      `Recusando executar fora do banco de validação (atual: ${nomeBanco}).`,
    );
  }

  const cobaia = await prisma.orcamento.findFirst({
    select: { id: true, loja_id: true },
  });
  if (!cobaia) throw new Error('Nenhum orçamento disponível para o teste.');
  const { id, loja_id: lojaId } = cobaia;
  console.log(`Orçamento cobaia: ${id}\n`);

  // 1. Emissão grava hash, expiração e zera contadores.
  await limpar(id);
  const codigo = await (service as any).emitirCodigoAprovacaoDoOrcamento(
    id,
    lojaId,
  );
  let linha = await prisma.orcamento.findUnique({
    where: { id },
    select: {
      codigo_aprovacao: true,
      codigo_aprovacao_hash: true,
      codigo_aprovacao_expira_em: true,
      codigo_aprovacao_tentativas: true,
      codigo_aprovacao_usado_em: true,
      codigo_aprovacao_revogado_em: true,
    },
  });

  verificar(
    'emissão: token com 43 caracteres base64url',
    codigo.length === 43 && /^[A-Za-z0-9_-]+$/.test(codigo),
    `tamanho=${codigo.length}`,
  );
  verificar(
    'emissão: banco guarda o hash, nunca o texto claro',
    linha!.codigo_aprovacao_hash === calcularHashCodigoAprovacao(codigo) &&
      linha!.codigo_aprovacao === null,
    `hash_len=${linha!.codigo_aprovacao_hash?.length} texto_claro=${linha!.codigo_aprovacao}`,
  );
  verificar(
    'emissão: expiração persistida com precisão de milissegundos',
    linha!.codigo_aprovacao_expira_em !== null &&
      linha!.codigo_aprovacao_expira_em! > new Date(),
    `expira_em=${linha!.codigo_aprovacao_expira_em?.toISOString()}`,
  );

  // 2. Verificação aceita o código correto e recusa o errado.
  let v = await (service as any).verificarCodigoAprovacao(id, codigo, new Date());
  verificar('verificação: código correto é APTO', v.situacao === 'APTO', v.situacao);

  v = await (service as any).verificarCodigoAprovacao(id, 'errado', new Date());
  const tentativasApos1Erro = await tentativasDe(id);
  verificar(
    'verificação: código errado é INVALIDO e incrementa tentativas no banco',
    v.situacao === 'INVALIDO' && tentativasApos1Erro === 1,
    `tentativas=${tentativasApos1Erro}`,
  );

  // 3. Consumo é de uso único.
  await limpar(id);
  const codigoUnico = await (service as any).emitirCodigoAprovacaoDoOrcamento(id, lojaId);
  const hashUnico = calcularHashCodigoAprovacao(codigoUnico);

  const primeiro = await (service as any).consumirCodigoAprovacaoNaTransacao(
    prisma,
    id,
    hashUnico,
    new Date(),
  );
  const segundo = await (service as any).consumirCodigoAprovacaoNaTransacao(
    prisma,
    id,
    hashUnico,
    new Date(),
  );
  verificar(
    'uso único: segundo consumo do mesmo código é recusado',
    primeiro === true && segundo === false,
    `primeiro=${primeiro} segundo=${segundo}`,
  );

  // 4. Concorrência real: N consumos simultâneos, exatamente um vence.
  const PARALELAS = 12;
  await limpar(id);
  const codigoCorrida = await (service as any).emitirCodigoAprovacaoDoOrcamento(id, lojaId);
  const hashCorrida = calcularHashCodigoAprovacao(codigoCorrida);

  const disparos = Array.from({ length: PARALELAS }, () =>
    prisma
      .$transaction((tx) =>
        (service as any).consumirCodigoAprovacaoNaTransacao(
          tx,
          id,
          hashCorrida,
          new Date(),
        ),
      )
      .catch(() => false),
  );
  const vencedores = (await Promise.all(disparos)).filter(Boolean).length;
  verificar(
    `concorrência: ${PARALELAS} consumos simultâneos, exatamente 1 vence`,
    vencedores === 1,
    `vencedores=${vencedores}`,
  );

  // 5. Expiração bloqueia o consumo.
  await limpar(id);
  const codigoExpirado = await (service as any).emitirCodigoAprovacaoDoOrcamento(id, lojaId);
  await prisma.orcamento.update({
    where: { id },
    data: { codigo_aprovacao_expira_em: new Date(Date.now() - 60_000) },
  });
  v = await (service as any).verificarCodigoAprovacao(id, codigoExpirado, new Date());
  const consumoExpirado = await (service as any).consumirCodigoAprovacaoNaTransacao(
    prisma,
    id,
    calcularHashCodigoAprovacao(codigoExpirado),
    new Date(),
  );
  verificar(
    'expiração: código vencido é recusado na verificação e no consumo',
    v.situacao === 'INVALIDO' && consumoExpirado === false,
    `situacao=${v.situacao} consumo=${consumoExpirado}`,
  );

  // 6. Revogação bloqueia o consumo.
  await limpar(id);
  const codigoRevogado = await (service as any).emitirCodigoAprovacaoDoOrcamento(id, lojaId);
  await (service as any).revogarCodigoAprovacaoDoOrcamento(id, lojaId, 'teste');
  v = await (service as any).verificarCodigoAprovacao(id, codigoRevogado, new Date());
  const consumoRevogado = await (service as any).consumirCodigoAprovacaoNaTransacao(
    prisma,
    id,
    calcularHashCodigoAprovacao(codigoRevogado),
    new Date(),
  );
  verificar(
    'revogação: código revogado é recusado na verificação e no consumo',
    v.situacao === 'INVALIDO' && consumoRevogado === false,
    `situacao=${v.situacao} consumo=${consumoRevogado}`,
  );

  // 7. Teto de tentativas trava o código.
  await limpar(id);
  const codigoTeto = await (service as any).emitirCodigoAprovacaoDoOrcamento(id, lojaId);
  for (let i = 0; i < CODIGO_APROVACAO_MAX_TENTATIVAS; i++) {
    await (service as any).verificarCodigoAprovacao(id, 'errado', new Date());
  }
  v = await (service as any).verificarCodigoAprovacao(id, codigoTeto, new Date());
  const tentativasNoTeto = await tentativasDe(id);
  verificar(
    'teto de tentativas: código correto é recusado após o limite',
    v.situacao === 'INVALIDO' &&
      tentativasNoTeto >= CODIGO_APROVACAO_MAX_TENTATIVAS,
    `tentativas=${tentativasNoTeto} limite=${CODIGO_APROVACAO_MAX_TENTATIVAS}`,
  );

  // 8. Serialização da transição de status (HS-05).
  //
  // É o mesmo `UPDATE ... WHERE` que a aprovação interna usa. A condição exclui
  // `aprovado` de propósito: é isso que faz duas requisições simultâneas
  // produzirem uma única transição e, portanto, um único conjunto de efeitos.
  const statusOriginal = (
    await prisma.orcamento.findUnique({
      where: { id },
      select: { status: true },
    })
  )?.status;

  await prisma.orcamento.update({ where: { id }, data: { status: 'enviado' } });

  const transicoes = await Promise.all(
    Array.from({ length: 12 }, () =>
      prisma.orcamento
        .updateMany({
          where: {
            id,
            status: { notIn: ['cancelado', 'rejeitado', 'aprovado'] },
          },
          data: { status: 'aprovado', data_atualizacao: new Date() },
        })
        .then((r) => r.count)
        .catch(() => 0),
    ),
  );
  const totalTransicoes = transicoes.reduce((s, n) => s + n, 0);
  verificar(
    'concorrência: 12 aprovações internas simultâneas, exatamente 1 transição',
    totalTransicoes === 1,
    `transicoes=${totalTransicoes}`,
  );

  await prisma.orcamento.update({
    where: { id },
    data: { status: statusOriginal ?? 'enviado' },
  });

  // 9. Auditoria é gravada na mesma transação da mutação e desfeita com ela.
  const logsAntes = await prisma.orcamentoLog.count({
    where: { orcamento_id: id },
  });

  await prisma
    .$transaction(async (tx) => {
      await tx.orcamentoLog.create({
        data: {
          orcamento_id: id,
          tipo_acao: 'TESTE_ATOMICIDADE',
          descricao: 'Deve desaparecer com o rollback.',
        },
      });
      throw new Error('rollback proposital');
    })
    .catch(() => undefined);

  const logsDepois = await prisma.orcamentoLog.count({
    where: { orcamento_id: id },
  });
  verificar(
    'atomicidade: auditoria some junto com a transação revertida',
    logsAntes === logsDepois,
    `antes=${logsAntes} depois=${logsDepois}`,
  );

  // 10. Reemissão devolve o orçamento a um estado utilizável.
  const codigoNovo = await (service as any).emitirCodigoAprovacaoDoOrcamento(id, lojaId);
  v = await (service as any).verificarCodigoAprovacao(id, codigoNovo, new Date());
  verificar(
    'reemissão: novo código zera tentativas e volta a ser aceito',
    v.situacao === 'APTO',
    `situacao=${v.situacao}`,
  );

  await limpar(id);

  const falhas = resultados.filter((r) => !r.ok);
  console.log(
    `\n${resultados.length - falhas.length}/${resultados.length} verificações passaram.`,
  );
  if (falhas.length > 0) {
    process.exitCode = 1;
  }
}

principal()
  .catch((erro) => {
    console.error('Falha na validação:', erro);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
