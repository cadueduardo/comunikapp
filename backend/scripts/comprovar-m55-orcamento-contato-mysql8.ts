/**
 * Provas MySQL 8 (scratch) — M5.5 orçamento.contato_id (critério RP 8.9 / 37).
 *
 * Pré-requisitos:
 * - mysqld 8.x em 127.0.0.1:3307
 * - DATABASE_URL=mysql://.../comunikapp_ci_scratch
 * - migration 20260805120800 aplicada
 * - ALLOW_RBAC_TEST_MUTATIONS=true
 *
 * Caso de uso canônico: ValidacaoV2Service + TransformacaoV2Service + prisma.orcamento.create
 * (mesmo pipeline de OrcamentosV2Service.criarOrcamento, sem rede/HTTP).
 *
 * Uso:
 *   $env:ALLOW_RBAC_TEST_MUTATIONS='true'
 *   npx ts-node --transpile-only scripts/comprovar-m55-orcamento-contato-mysql8.ts
 */
import { createHash, randomUUID } from 'crypto';
import { PrismaClient } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';
import { validarAmbienteTesteMutavel } from './validar-ambiente-teste-mutavel';
import { ValidacaoV2Service } from '../src/orcamentos-v2/services/validacao-v2.service';
import { TransformacaoV2Service } from '../src/orcamentos-v2/services/transformacao-v2.service';
import { OrcamentoStatus } from '../src/orcamentos-v2/enums/orcamento-status.enum';

const prisma = new PrismaClient();

function assert(condicao: boolean, mensagem: string): void {
  if (!condicao) throw new Error(mensagem);
}

function pseudo(valor: string): string {
  return createHash('sha256').update(valor).digest('hex').slice(0, 12);
}

function produtoMinimo(nome: string) {
  return {
    nome_servico: nome,
    quantidade: 1,
    unidade_medida: 'un',
  };
}

async function criarOrcamentoCanonico(input: {
  lojaId: string;
  usuarioId: string;
  clienteId: string;
  contatoId?: string | null;
  titulo: string;
  numero: string;
}) {
  const validacao = new ValidacaoV2Service(prisma);
  const transformacao = new TransformacaoV2Service();
  const dados = {
    titulo: input.titulo,
    status: OrcamentoStatus.RASCUNHO,
    cliente_id: input.clienteId,
    contato_id: input.contatoId ?? undefined,
    produtos: [produtoMinimo('Item prova M5.5')],
  };

  await validacao.validarDadosCriacao(dados, input.lojaId);
  const preparado = transformacao.prepararDadosCriacao(
    dados,
    input.lojaId,
    input.usuarioId,
  );
  preparado.numero = input.numero;
  // Prisma create não aceita relações aninhadas se produtos vierem malformados;
  // o preparador já gera create aninhado.
  const criado = await prisma.orcamento.create({
    data: preparado,
    select: {
      id: true,
      loja_id: true,
      cliente_id: true,
      contato_id: true,
      numero: true,
    },
  });
  return criado;
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Proibido em production.');
  }
  const banco = validarAmbienteTesteMutavel();
  const url = process.env.DATABASE_URL!;
  const host = new URL(url).host;

  const versao = await prisma.$queryRawUnsafe<{ v: string }[]>(
    'SELECT VERSION() AS v',
  );
  const fk = await prisma.$queryRawUnsafe<
    { DELETE_RULE: string; CONSTRAINT_NAME: string }[]
  >(
    `SELECT DELETE_RULE, CONSTRAINT_NAME
     FROM information_schema.REFERENTIAL_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = DATABASE()
       AND TABLE_NAME = 'orcamento'
       AND REFERENCED_TABLE_NAME = 'cliente_contato'`,
  );
  assert(fk.length === 1, 'FK orcamento→cliente_contato ausente');
  assert(
    fk[0].DELETE_RULE === 'SET NULL',
    `DELETE_RULE esperado SET NULL, obtido ${fk[0].DELETE_RULE}`,
  );

  const sufixo = randomUUID().slice(0, 8);
  const lojaA = `loja_m55a_${sufixo}`;
  const lojaB = `loja_m55b_${sufixo}`;
  const userA = `user_m55a_${sufixo}`;
  const cliA = `cli_m55a_${sufixo}`;
  const cliA2 = `cli_m55a2_${sufixo}`;
  const cliB = `cli_m55b_${sufixo}`;
  const ctA = `ct_m55a_${sufixo}`;
  const ctA2 = `ct_m55a2_${sufixo}`;
  const ctB = `ct_m55b_${sufixo}`;

  const agora = new Date();

  await prisma.loja.create({
    data: {
      id: lojaA,
      nome: 'Loja M55 A',
      email: `${lojaA}@scratch.local`,
      telefone: '11000000010',
      slug: lojaA,
      atualizado_em: agora,
      status: 'ATIVO',
    },
  });
  await prisma.loja.create({
    data: {
      id: lojaB,
      nome: 'Loja M55 B',
      email: `${lojaB}@scratch.local`,
      telefone: '11000000011',
      slug: lojaB,
      atualizado_em: agora,
      status: 'ATIVO',
    },
  });

  await prisma.usuario.create({
    data: {
      id: userA,
      loja_id: lojaA,
      nome_completo: 'Vend M55',
      email: `${userA}@scratch.local`,
      senha: 'x',
      funcao: 'VENDAS',
      status: 'ATIVO',
      ativo: true,
    },
  });

  const criarCliente = async (id: string, lojaId: string, doc: string) => {
    await prisma.cliente.create({
      data: {
        id,
        loja_id: lojaId,
        nome: `Cliente ${pseudo(id)}`,
        tipo_pessoa: 'PESSOA_FISICA',
        documento: doc,
        atualizado_em: agora,
        ativo: true,
      },
    });
  };

  await criarCliente(cliA, lojaA, `DOC${sufixo}A`);
  await criarCliente(cliA2, lojaA, `DOC${sufixo}A2`);
  await criarCliente(cliB, lojaB, `DOC${sufixo}B`);

  const criarContato = async (
    id: string,
    lojaId: string,
    clienteId: string,
    nome: string,
  ) => {
    await prisma.cliente_contato.create({
      data: {
        id,
        loja_id: lojaId,
        cliente_id: clienteId,
        nome,
        papeis: ['solicitante'],
        principal: true,
        ativo: true,
      },
    });
  };

  await criarContato(ctA, lojaA, cliA, 'Contato A');
  await criarContato(ctA2, lojaA, cliA2, 'Contato A2');
  await criarContato(ctB, lojaB, cliB, 'Contato B');

  // 1) Persistência real do contato_id
  const orcComContato = await criarOrcamentoCanonico({
    lojaId: lojaA,
    usuarioId: userA,
    clienteId: cliA,
    contatoId: ctA,
    titulo: 'Prova M55 com contato',
    numero: `M55-C-${sufixo}`,
  });
  const relido = await prisma.orcamento.findFirst({
    where: { id: orcComContato.id, loja_id: lojaA },
    select: { id: true, cliente_id: true, contato_id: true },
  });
  assert(!!relido, 'Orçamento não relido no MySQL');
  assert(relido!.cliente_id === cliA, 'cliente_id divergente na leitura');
  assert(relido!.contato_id === ctA, 'contato_id não persistido no MySQL');

  // 2) Contato nulo aceito
  const orcSemContato = await criarOrcamentoCanonico({
    lojaId: lojaA,
    usuarioId: userA,
    clienteId: cliA,
    contatoId: null,
    titulo: 'Prova M55 sem contato',
    numero: `M55-N-${sufixo}`,
  });
  assert(
    orcSemContato.contato_id === null,
    'Orçamento sem contato deveria ter contato_id null',
  );

  // 3) Contato de outro cliente negado
  let negouOutroCliente = false;
  try {
    await criarOrcamentoCanonico({
      lojaId: lojaA,
      usuarioId: userA,
      clienteId: cliA,
      contatoId: ctA2,
      titulo: 'Prova M55 contato alheio',
      numero: `M55-X-${sufixo}`,
    });
  } catch (e) {
    negouOutroCliente = e instanceof BadRequestException;
  }
  assert(negouOutroCliente, 'Deveria negar contato de outro cliente');

  // 4) Contato de outra loja negado
  let negouOutraLoja = false;
  try {
    await criarOrcamentoCanonico({
      lojaId: lojaA,
      usuarioId: userA,
      clienteId: cliA,
      contatoId: ctB,
      titulo: 'Prova M55 contato outra loja',
      numero: `M55-Y-${sufixo}`,
    });
  } catch (e) {
    negouOutraLoja = e instanceof BadRequestException;
  }
  assert(negouOutraLoja, 'Deveria negar contato de outra loja');

  // 5) Contato inativo (soft) negado pela validação
  await prisma.cliente_contato.update({
    where: { id: ctA },
    data: { ativo: false },
  });
  let negouInativo = false;
  try {
    await criarOrcamentoCanonico({
      lojaId: lojaA,
      usuarioId: userA,
      clienteId: cliA,
      contatoId: ctA,
      titulo: 'Prova M55 contato inativo',
      numero: `M55-I-${sufixo}`,
    });
  } catch (e) {
    negouInativo = e instanceof BadRequestException;
  }
  assert(negouInativo, 'Deveria negar contato inativo');
  // Reativa para prova de DELETE SET NULL
  await prisma.cliente_contato.update({
    where: { id: ctA },
    data: { ativo: true },
  });

  // 6) ON DELETE SET NULL — remove contato e comprova null no orçamento
  await prisma.cliente_contato.delete({ where: { id: ctA } });
  const aposDelete = await prisma.orcamento.findFirst({
    where: { id: orcComContato.id, loja_id: lojaA },
    select: { contato_id: true },
  });
  assert(
    aposDelete?.contato_id === null,
    'Após DELETE do contato, orcamento.contato_id deveria ser NULL (SET NULL)',
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        engine: 'mysql8_scratch_3307',
        host,
        banco,
        versao: versao[0]?.v,
        fk_delete_rule: fk[0].DELETE_RULE,
        provas: {
          contato_persistido_e_relido: true,
          orcamento_sem_contato: true,
          nega_contato_outro_cliente: true,
          nega_contato_outra_loja: true,
          nega_contato_inativo: true,
          set_null_ao_deletar_contato: true,
        },
        ids_sanitizados: {
          orcamento_com_contato: pseudo(orcComContato.id),
          orcamento_sem_contato: pseudo(orcSemContato.id),
          cliente: pseudo(cliA),
        },
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
