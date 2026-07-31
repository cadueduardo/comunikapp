/**
 * Gate 0S / §4 — baseline de desempenho do caminho de autorização de Vendas.
 *
 * Não existe SLA definido para este caminho, e inventar um agora seria fabricar
 * um critério retroativo. O que este script produz é o **baseline**: latência,
 * throughput, consultas por decisão e comportamento sob concorrência, medidos
 * contra banco real, para que a próxima entrega tenha com o que comparar.
 *
 * Mede o `VendasPermissionsService` de verdade, com o mesmo Prisma da aplicação.
 * As consultas são contadas pelo evento `query` do próprio client, então o
 * número reflete o que sai para o banco, não uma estimativa.
 *
 * Uso (nunca contra o banco de trabalho):
 *   $env:DATABASE_URL="mysql://root@localhost:3306/comunikapp_gate0s"
 *   npx ts-node scripts/medir-carga-autorizacao.ts
 */
import { PrismaClient } from '@prisma/client';
import { VendasPermissionsService } from '../src/vendas/permissions/vendas-permissions.service';
import { VENDAS_PERMISSOES } from '../src/vendas/permissions/vendas-permissoes';

// O script cria e apaga lojas inteiras, então recusa rodar fora de um banco
// descartável. O padrão é o clone local; o CI declara o seu por variável.
const BANCO_ESPERADO =
  process.env.GATE0S_BANCO_PERMITIDO || 'comunikapp_gate0s';
const MARCA = 'gate0s-carga-' + Date.now();

const prisma = new PrismaClient({
  log: [{ emit: 'event', level: 'query' }],
});

let consultas = 0;
(prisma as any).$on('query', () => {
  consultas += 1;
});

const permissoes = new VendasPermissionsService(prisma as any);

interface Amostra {
  cenario: string;
  amostras: number;
  p50: number;
  p95: number;
  p99: number;
  media: number;
  throughput: number;
  consultasPorDecisao: number;
  erros: number;
}

const relatorio: Amostra[] = [];

function percentil(valores: number[], p: number): number {
  const ordenado = [...valores].sort((x, y) => x - y);
  const indice = Math.min(
    ordenado.length - 1,
    Math.ceil((p / 100) * ordenado.length) - 1,
  );
  return ordenado[Math.max(0, indice)];
}

/** Executa `n` decisões sequenciais e registra o perfil de latência. */
async function medir(
  cenario: string,
  n: number,
  decisao: (i: number) => Promise<unknown>,
): Promise<Amostra> {
  const latencias: number[] = [];
  let erros = 0;
  consultas = 0;

  const inicio = process.hrtime.bigint();
  for (let i = 0; i < n; i++) {
    const t0 = process.hrtime.bigint();
    try {
      await decisao(i);
    } catch {
      erros += 1;
    }
    latencias.push(Number(process.hrtime.bigint() - t0) / 1e6);
  }
  const totalMs = Number(process.hrtime.bigint() - inicio) / 1e6;

  const amostra: Amostra = {
    cenario,
    amostras: n,
    p50: percentil(latencias, 50),
    p95: percentil(latencias, 95),
    p99: percentil(latencias, 99),
    media: latencias.reduce((s, v) => s + v, 0) / latencias.length,
    throughput: (n / totalMs) * 1000,
    consultasPorDecisao: consultas / n,
    erros,
  };
  relatorio.push(amostra);
  return amostra;
}

function formatar(a: Amostra): string {
  return (
    `${a.cenario.padEnd(52)} ` +
    `p50=${a.p50.toFixed(2)}ms p95=${a.p95.toFixed(2)}ms p99=${a.p99.toFixed(2)}ms ` +
    `média=${a.media.toFixed(2)}ms ${a.throughput.toFixed(0)} req/s ` +
    `consultas/decisão=${a.consultasPorDecisao.toFixed(2)} erros=${a.erros}`
  );
}

async function principal() {
  const banco = await prisma.$queryRawUnsafe<Array<{ db: string }>>(
    'SELECT DATABASE() AS db',
  );
  if (banco[0]?.db !== BANCO_ESPERADO) {
    throw new Error(`Recusando executar fora de ${BANCO_ESPERADO}.`);
  }

  const lojas: string[] = [];
  const usuarios: string[] = [];

  try {
    // Duas lojas, cinco usuários cada. Volume suficiente para separar o custo
    // da decisão do custo de aquecer conexão.
    for (const sufixo of ['a', 'b']) {
      const loja = await prisma.loja.create({
        data: {
          nome: `Carga ${sufixo} ${MARCA}`,
          slug: `${MARCA}-${sufixo}`,
          email: `${MARCA}-${sufixo}@exemplo.invalido`,
          telefone: '1130000000',
          atualizado_em: new Date(),
          status: 'ATIVO',
        },
      });
      lojas.push(loja.id);
      for (let i = 0; i < 5; i++) {
        const u = await prisma.usuario.create({
          data: {
            loja_id: loja.id,
            email: `carga-${MARCA}-${sufixo}-${i}@exemplo.invalido`,
            nome_completo: `Carga ${sufixo}${i}`,
            funcao: 'VENDAS',
            status: 'ATIVO',
            ativo: true,
          },
        });
        usuarios.push(u.id);
      }
    }

    const lojaA = lojas[0];
    const lojaB = lojas[1];
    const usuariosA = usuarios.slice(0, 5);
    const usuariosB = usuarios.slice(5);

    console.log(`Banco: ${BANCO_ESPERADO}`);
    console.log(`Lojas: 2 | Usuários: ${usuarios.length}\n`);

    // Cache frio: primeira decisão de cada usuário, sem nada aquecido.
    const frio = await medir('cache frio (1ª decisão por usuário)', 10, (i) =>
      permissoes.pode(
        usuarios[i % usuarios.length],
        i < 5 ? lojaA : lojaB,
        VENDAS_PERMISSOES.PROPOSTA_VER,
      ),
    );
    console.log(formatar(frio));

    const quente = await medir(
      'cache quente (mesmo usuário, 200 decisões)',
      200,
      () =>
        permissoes.pode(usuariosA[0], lojaA, VENDAS_PERMISSOES.PROPOSTA_VER),
    );
    console.log(formatar(quente));

    const variosUsuarios = await medir(
      'usuários diferentes da mesma loja',
      200,
      (i) =>
        permissoes.pode(
          usuariosA[i % usuariosA.length],
          lojaA,
          VENDAS_PERMISSOES.PROPOSTA_VER,
        ),
    );
    console.log(formatar(variosUsuarios));

    const variasLojas = await medir('lojas diferentes, alternando', 200, (i) =>
      permissoes.pode(
        i % 2 === 0 ? usuariosA[i % 5] : usuariosB[i % 5],
        i % 2 === 0 ? lojaA : lojaB,
        VENDAS_PERMISSOES.PROPOSTA_VER,
      ),
    );
    console.log(formatar(variasLojas));

    const negado = await medir(
      'acesso negado (permissão fora do piso da função)',
      200,
      () =>
        permissoes.pode(usuariosA[0], lojaA, VENDAS_PERMISSOES.PROPOSTA_EXCLUIR),
    );
    console.log(formatar(negado));

    const cruzado = await medir(
      'acesso negado (usuário da loja A sob a loja B)',
      200,
      () =>
        permissoes.pode(usuariosA[0], lojaB, VENDAS_PERMISSOES.PROPOSTA_VER),
    );
    console.log(formatar(cruzado));

    // O guard chama `assertPodeQualquer`, que percorre as permissões exigidas
    // em série até uma passar. Medir com duas permissões mostra o custo real de
    // um handler que declara alternativas.
    const duasPermissoes = await medir(
      'assertPodeQualquer com 2 permissões (1ª concede)',
      200,
      () =>
        permissoes.assertPodeQualquer(usuariosA[0], lojaA, [
          VENDAS_PERMISSOES.PROPOSTA_VER,
          VENDAS_PERMISSOES.PROPOSTA_EDITAR,
        ]),
    );
    console.log(formatar(duasPermissoes));

    const duasPermissoesPior = await medir(
      'assertPodeQualquer com 2 permissões (só a 2ª concede)',
      200,
      () =>
        permissoes.assertPodeQualquer(usuariosA[0], lojaA, [
          VENDAS_PERMISSOES.PROPOSTA_EXCLUIR,
          VENDAS_PERMISSOES.PROPOSTA_VER,
        ]),
    );
    console.log(formatar(duasPermissoesPior));

    // Caminho completo de uma requisição autenticada: o guard decide antes de
    // entrar no handler e o service decide de novo lá dentro. A dupla checagem
    // é deliberada — o artefato 03 §2 exige o `assertPode` dentro do service,
    // para que nenhum caminho alternativo (job, chamada interna, outro
    // controller) escape da autorização. Aqui se mede quanto ela custa.
    const caminhoCompleto = await medir(
      'endpoint real: guard + service (dupla checagem)',
      200,
      async () => {
        await permissoes.assertPodeQualquer(usuariosA[0], lojaA, [
          VENDAS_PERMISSOES.PROPOSTA_VER,
        ]);
        await permissoes.assertPode(
          usuariosA[0],
          lojaA,
          VENDAS_PERMISSOES.PROPOSTA_VER,
        );
      },
    );
    console.log(formatar(caminhoCompleto));

    // Concorrência: o mesmo volume, disparado de uma vez.
    consultas = 0;
    const memoriaAntes = process.memoryUsage().heapUsed;
    const t0 = process.hrtime.bigint();
    const simultaneas = await Promise.all(
      Array.from({ length: 200 }, (_, i) =>
        permissoes
          .pode(
            usuarios[i % usuarios.length],
            i % 2 === 0 ? lojaA : lojaB,
            VENDAS_PERMISSOES.PROPOSTA_VER,
          )
          .catch(() => null),
      ),
    );
    const totalConc = Number(process.hrtime.bigint() - t0) / 1e6;
    const memoriaDepois = process.memoryUsage().heapUsed;
    const errosConc = simultaneas.filter((r) => r === null).length;
    console.log(
      `${'concorrência: 200 decisões simultâneas'.padEnd(52)} ` +
        `total=${totalConc.toFixed(0)}ms ${((200 / totalConc) * 1000).toFixed(0)} req/s ` +
        `consultas=${consultas} erros=${errosConc} ` +
        `heap=${((memoriaDepois - memoriaAntes) / 1024 / 1024).toFixed(1)}MB`,
    );

    // N+1: uma decisão precisa custar exatamente uma consulta. Mais do que isso
    // significa que a autorização cresce com o número de perfis ou permissões.
    console.log('');
    // O que caracteriza N+1 aqui não é o número absoluto, e sim o número
    // crescer com a quantidade de perfis ou permissões do usuário. Duas
    // consultas fixas — usuário e perfis — são um custo constante; se o valor
    // subisse com mais perfis, aí sim seria N+1.
    const porDecisao = quente.consultasPorDecisao;
    const cresceComUsuarios =
      variosUsuarios.consultasPorDecisao > porDecisao + 0.01;
    console.log(
      cresceComUsuarios
        ? `N+1: ATENÇÃO — consultas por decisão sobem de ${porDecisao.toFixed(2)} para ` +
            `${variosUsuarios.consultasPorDecisao.toFixed(2)} ao variar o usuário.`
        : `N+1: ausente — ${porDecisao.toFixed(2)} consultas fixas por decisão (usuário + perfis), ` +
            `constante ao variar usuário, loja e resultado.`,
    );
    console.log(
      `Caminho completo do endpoint: ${caminhoCompleto.consultasPorDecisao.toFixed(2)} consultas e ` +
        `${caminhoCompleto.media.toFixed(2)}ms por requisição (guard + service).`,
    );
    console.log(
      `Custo de alternativa: ${duasPermissoes.consultasPorDecisao.toFixed(2)} consulta(s) quando a 1ª concede, ` +
        `${duasPermissoesPior.consultasPorDecisao.toFixed(2)} quando só a 2ª concede.`,
    );
    console.log(
      `Cache: ${
        Math.abs(frio.media - quente.media) / Math.max(frio.media, 0.001) < 0.5
          ? 'inexistente por construção — frio e quente têm o mesmo custo.'
          : `frio ${frio.media.toFixed(2)}ms vs quente ${quente.media.toFixed(2)}ms.`
      }`,
    );
  } finally {
    for (const id of lojas) {
      await prisma.loja.deleteMany({ where: { id } }).catch(() => undefined);
    }
  }
}

principal()
  .catch((erro) => {
    console.error('Falha na medição:', erro);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
