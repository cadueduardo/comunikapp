/**
 * Gate 0S / HS-05 — reauditoria do aceite ponta a ponta contra banco real.
 *
 * O HS-05 já estava marcado como concluído. Este script existe para *não*
 * aceitar isso pela leitura do código: cada afirmação do checklist vira uma
 * verificação executável contra MySQL/MariaDB, com loja, usuário, cliente e
 * orçamento persistidos de verdade.
 *
 * Duas provas aqui não são triviais e merecem explicação:
 *
 * 1. "efeitos externos rodam fora da transação" é verificado por uma **segunda
 *    conexão**. Se, no instante em que a OS está sendo gerada, outra conexão já
 *    enxerga o status `aprovado`, então o commit ocorreu antes — uma transação
 *    aberta não seria visível de fora.
 * 2. "falha de auditoria reverte a mutação" é verificado sabotando o
 *    `orcamentoLog.create` da transação e conferindo que o status voltou.
 *
 * Uso (nunca contra o banco de trabalho):
 *   $env:DATABASE_URL="mysql://root@localhost:3306/comunikapp_gate0s"
 *   npx ts-node scripts/validar-aceite-hs05-mysql.ts
 */
import { PrismaClient } from '@prisma/client';
import { Logger } from '@nestjs/common';
import { OrcamentosV2Service } from '../src/orcamentos-v2/services/orcamentos-v2.service';
import { TransformacaoV2Service } from '../src/orcamentos-v2/services/transformacao-v2.service';
import { VendasPermissionsService } from '../src/vendas/permissions/vendas-permissions.service';

// O script cria e apaga lojas inteiras, então recusa rodar fora de um banco
// descartável. O padrão é o clone local; o CI declara o seu por variável.
const BANCO_ESPERADO =
  process.env.GATE0S_BANCO_PERMITIDO || 'comunikapp_gate0s';
const MARCA = 'gate0s-hs05-' + Date.now();

const prisma = new PrismaClient();
/** Conexão independente: enxerga apenas o que já foi commitado. */
const observador = new PrismaClient();

type Resultado = { nome: string; ok: boolean; detalhe: string };
const resultados: Resultado[] = [];

function verificar(nome: string, ok: boolean, detalhe: string) {
  resultados.push({ nome, ok, detalhe });
  console.log(`${ok ? 'OK   ' : 'FALHA'} | ${nome} | ${detalhe}`);
}

interface Efeitos {
  osCriadas: number;
  cobrancasCriadas: number;
  /** Status que a conexão observadora enxergava no momento da geração da OS. */
  statusVistoDeFora: string | null;
}

let efeitos: Efeitos;
let sabotarAuditoria = false;

function montarService(orcamentoIdObservado: () => string) {
  const service = Object.create(
    OrcamentosV2Service.prototype,
  ) as OrcamentosV2Service;

  (service as any).logger = new Logger('ValidacaoHS05');
  (service as any).transformacaoService = new TransformacaoV2Service();
  (service as any).vendasPermissions = new VendasPermissionsService(
    prisma as any,
  );
  (service as any).notificacaoService = {
    notificarMudancaStatus: async () => undefined,
  };
  (service as any).notificacoesService = { criarNotificacao: async () => undefined };
  (service as any).homeCacheService = { invalidar: () => undefined };
  (service as any).mailService = { enviarEmail: async () => undefined };
  (service as any).parcelasBuilder = { gerarDescricao: () => 'teste' };
  (service as any).cobrancaVencimentoService = { parsePrazoEntrega: () => 10 };

  // A OS é gravada de verdade. Um mock em memória invalidaria o teste de
  // retry: o `findFirst` que protege contra duplicação consulta o banco, e um
  // mock que não persiste faria a proteção parecer ausente quando não é.
  (service as any).osService = {
    criarOSDeOrcamento: async (lojaId: string) => {
      efeitos.osCriadas += 1;
      // Prova de que o commit já aconteceu: a conexão de fora só enxerga dado
      // commitado. Se aqui aparecer `aprovado`, a transação foi encerrada
      // antes de a OS começar a ser gerada.
      const visto = await observador.orcamento.findUnique({
        where: { id: orcamentoIdObservado() },
        select: { status: true },
      });
      efeitos.statusVistoDeFora = visto?.status ?? null;

      const orc = await prisma.orcamento.findUnique({
        where: { id: orcamentoIdObservado() },
        select: { cliente_id: true, nome_servico: true },
      });
      return prisma.ordemServico.create({
        data: {
          loja_id: lojaId,
          cliente_id: orc!.cliente_id!,
          orcamento_id: orcamentoIdObservado(),
          numero: `${MARCA}-OS-${efeitos.osCriadas}`,
          nome_servico: orc!.nome_servico,
          quantidade: 1,
        },
      });
    },
  };
  (service as any).cobrancasService = {
    criarCobrancaParaOrcamento: async () => {
      efeitos.cobrancasCriadas += 1;
      return undefined;
    },
  };

  // O Prisma real, com um gancho para sabotar a auditoria sob demanda. Tudo o
  // mais passa direto para o client verdadeiro.
  (service as any).prisma = new Proxy(prisma, {
    get(alvo: any, chave: string) {
      if (chave === '$transaction') {
        return (callback: any, opcoes: any) =>
          alvo.$transaction(
            (tx: any) => callback(envolverTx(tx)),
            opcoes,
          );
      }
      return alvo[chave];
    },
  });

  return service;
}

function envolverTx(tx: any) {
  return new Proxy(tx, {
    get(alvo: any, chave: string) {
      if (chave === 'orcamentoLog') {
        return {
          ...alvo.orcamentoLog,
          create: async (args: any) => {
            if (sabotarAuditoria) {
              throw new Error('falha simulada ao gravar auditoria');
            }
            return alvo.orcamentoLog.create(args);
          },
        };
      }
      return alvo[chave];
    },
  });
}

interface Cenario {
  lojaId: string;
  usuarioId: string;
  orcamentoId: string;
}

async function criarCenario(): Promise<Cenario> {
  const loja = await prisma.loja.create({
    data: {
      nome: `HS05 ${MARCA}`,
      slug: MARCA,
      email: `${MARCA}@exemplo.invalido`,
      telefone: '1130000000',
      atualizado_em: new Date(),
      status: 'ATIVO',
    },
  });
  const usuario = await prisma.usuario.create({
    data: {
      loja_id: loja.id,
      email: `hs05-${MARCA}@exemplo.invalido`,
      nome_completo: 'Vendedor HS05',
      funcao: 'VENDAS',
      status: 'ATIVO',
      ativo: true,
    },
  });
  const cliente = await prisma.cliente.create({
    data: {
      loja_id: loja.id,
      nome: 'Cliente HS05',
      tipo_pessoa: 'PESSOA_JURIDICA',
      documento: '00000000000199',
      email: 'cliente-hs05@exemplo.invalido',
    },
  });
  const orcamento = await prisma.orcamento.create({
    data: {
      loja_id: loja.id,
      cliente_id: cliente.id,
      numero: `${MARCA}-001`,
      nome_servico: 'Proposta HS05',
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
      responsavel_id: usuario.id,
    },
  });
  return {
    lojaId: loja.id,
    usuarioId: usuario.id,
    orcamentoId: orcamento.id,
  };
}

async function reiniciar(c: Cenario) {
  efeitos = { osCriadas: 0, cobrancasCriadas: 0, statusVistoDeFora: null };
  sabotarAuditoria = false;
  await prisma.orcamento.update({
    where: { id: c.orcamentoId },
    data: {
      status: 'enviado',
      status_aprovacao: 'PENDENTE',
      codigo_aprovacao_hash: null,
      codigo_aprovacao_expira_em: null,
      codigo_aprovacao_tentativas: 0,
      codigo_aprovacao_usado_em: null,
      codigo_aprovacao_revogado_em: null,
    },
  });
  await prisma.orcamentoLog.deleteMany({
    where: { orcamento_id: c.orcamentoId },
  });
  await prisma.ordemServico.deleteMany({
    where: { orcamento_id: c.orcamentoId },
  });
}

async function principal() {
  const banco = await prisma.$queryRawUnsafe<Array<{ db: string }>>(
    'SELECT DATABASE() AS db',
  );
  if (banco[0]?.db !== BANCO_ESPERADO) {
    throw new Error(`Recusando executar fora de ${BANCO_ESPERADO}.`);
  }
  console.log(`Banco: ${BANCO_ESPERADO}\n`);

  // Medido antes de qualquer cenário: a pergunta é sobre o dado que já existe,
  // não sobre o que este script cria.
  const duplicatasPreExistentes = await prisma.$queryRawUnsafe<
    Array<{ qtd: bigint }>
  >(
    `SELECT COUNT(*) AS qtd FROM (
       SELECT orcamento_id FROM ordens_servico
        WHERE orcamento_id IS NOT NULL
        GROUP BY orcamento_id HAVING COUNT(*) > 1
     ) d`,
  );
  verificar(
    'pré-condição da migration: clone de desenvolvimento não tem OS duplicada por orçamento',
    Number(duplicatasPreExistentes[0]?.qtd ?? 0) === 0,
    `orcamentos_com_mais_de_uma_os=${Number(duplicatasPreExistentes[0]?.qtd ?? 0)}`,
  );

  let cenario: Cenario | null = null;

  try {
    cenario = await criarCenario();
    const c = cenario;
    const service = montarService(() => c.orcamentoId);

    // ------------------------------------------- aceite público, caminho feliz
    await reiniciar(c);
    const codigo = await (service as any).emitirCodigoAprovacaoDoOrcamento(
      c.orcamentoId,
      c.lojaId,
    );
    await service.processarAcaoClientePublico(
      c.orcamentoId,
      { acao: 'APROVAR', codigo_aprovacao: codigo } as any,
      { ip: '203.0.113.7', userAgent: 'Navegador/1.0' },
    );

    let linha = await prisma.orcamento.findUnique({
      where: { id: c.orcamentoId },
      select: { status: true, codigo_aprovacao_usado_em: true },
    });
    let trilhas = await prisma.orcamentoLog.findMany({
      where: { orcamento_id: c.orcamentoId },
    });

    verificar(
      'público: aceite transita, queima o código, gera 1 OS e grava trilha',
      linha?.status === 'aprovado' &&
        linha?.codigo_aprovacao_usado_em !== null &&
        efeitos.osCriadas === 1 &&
        trilhas.length === 1,
      `status=${linha?.status} os=${efeitos.osCriadas} trilhas=${trilhas.length}`,
    );

    verificar(
      'efeitos externos: OS é gerada depois do commit, não dentro da transação',
      efeitos.statusVistoDeFora === 'aprovado',
      `outra conexão via status="${efeitos.statusVistoDeFora}" durante a geração da OS`,
    );

    const trilhaSerializada = JSON.stringify(trilhas);
    const proibidos = [
      codigo,
      'cliente-hs05@exemplo.invalido',
      '00000000000199',
      '175',
      'margem',
      'custo',
    ];
    const encontrados = proibidos.filter((p) => trilhaSerializada.includes(p));
    verificar(
      'auditoria: trilha não contém token, e-mail, documento, custo nem margem',
      encontrados.length === 0,
      encontrados.length
        ? 'ENCONTRADO: ' + encontrados.join(', ')
        : 'nenhum termo sensível',
    );
    verificar(
      'auditoria: IP e user-agent vêm do contexto confiável da requisição',
      trilhas[0]?.ip_origem === '203.0.113.7' &&
        trilhas[0]?.user_agent === 'Navegador/1.0',
      `ip=${trilhas[0]?.ip_origem} ua=${trilhas[0]?.user_agent}`,
    );

    // ------------------------------------ concorrência no caminho público
    await reiniciar(c);
    const codigoCorrida = await (service as any).emitirCodigoAprovacaoDoOrcamento(
      c.orcamentoId,
      c.lojaId,
    );
    const publicasSimultaneas = await Promise.all(
      Array.from({ length: 12 }, () =>
        service
          .processarAcaoClientePublico(c.orcamentoId, {
            acao: 'APROVAR',
            codigo_aprovacao: codigoCorrida,
          } as any)
          .then(() => 'ok')
          .catch(() => 'negado'),
      ),
    );
    trilhas = await prisma.orcamentoLog.findMany({
      where: { orcamento_id: c.orcamentoId },
    });
    verificar(
      'concorrência pública: 12 aceites simultâneos produzem 1 OS e 1 trilha',
      efeitos.osCriadas === 1 && trilhas.length === 1,
      `aceitos=${publicasSimultaneas.filter((r) => r === 'ok').length} os=${efeitos.osCriadas} trilhas=${trilhas.length}`,
    );

    // ------------------------------------ concorrência no caminho interno
    await reiniciar(c);
    const internasSimultaneas = await Promise.all(
      Array.from({ length: 12 }, () =>
        service
          .fecharPedidoInterno(c.orcamentoId, c.lojaId, c.usuarioId)
          .then(() => 'ok')
          .catch(() => 'erro'),
      ),
    );
    trilhas = await prisma.orcamentoLog.findMany({
      where: { orcamento_id: c.orcamentoId },
    });
    verificar(
      'concorrência interna: 12 aprovações simultâneas produzem 1 OS e 1 trilha',
      efeitos.osCriadas === 1 && trilhas.length === 1,
      `respostas_ok=${internasSimultaneas.filter((r) => r === 'ok').length} os=${efeitos.osCriadas} trilhas=${trilhas.length}`,
    );

    // ------------------------------------ falha de auditoria reverte tudo
    await reiniciar(c);
    const codigoSabotado = await (service as any).emitirCodigoAprovacaoDoOrcamento(
      c.orcamentoId,
      c.lojaId,
    );
    sabotarAuditoria = true;
    const desfecho = await service
      .processarAcaoClientePublico(c.orcamentoId, {
        acao: 'APROVAR',
        codigo_aprovacao: codigoSabotado,
      } as any)
      .then(() => 'SEM ERRO')
      .catch((e: any) => e?.constructor?.name ?? 'erro');
    sabotarAuditoria = false;

    linha = await prisma.orcamento.findUnique({
      where: { id: c.orcamentoId },
      select: { status: true, codigo_aprovacao_usado_em: true },
    });
    trilhas = await prisma.orcamentoLog.findMany({
      where: { orcamento_id: c.orcamentoId },
    });
    verificar(
      'falha de auditoria: mutação e queima do código são revertidas juntas',
      desfecho !== 'SEM ERRO' &&
        linha?.status === 'enviado' &&
        linha?.codigo_aprovacao_usado_em === null &&
        trilhas.length === 0 &&
        efeitos.osCriadas === 0,
      `desfecho=${desfecho} status=${linha?.status} usado_em=${linha?.codigo_aprovacao_usado_em} os=${efeitos.osCriadas}`,
    );

    // Depois da falha, o código continua utilizável — o cliente não fica sem
    // saída por causa de um erro interno.
    const retomada = await service
      .processarAcaoClientePublico(c.orcamentoId, {
        acao: 'APROVAR',
        codigo_aprovacao: codigoSabotado,
      } as any)
      .then(() => 'ok')
      .catch((e: any) => String(e?.message ?? e));
    verificar(
      'recuperação: após a falha, o mesmo código ainda conclui o aceite',
      retomada === 'ok' && efeitos.osCriadas === 1,
      `retomada=${retomada} os=${efeitos.osCriadas}`,
    );

    // ----------------------------- retry do caminho interno não duplica efeito
    const osAntesDoRetry = efeitos.osCriadas;
    await service
      .fecharPedidoInterno(c.orcamentoId, c.lojaId, c.usuarioId)
      .catch(() => undefined);
    verificar(
      'retry: aprovar de novo uma proposta já aprovada não cria segunda OS',
      efeitos.osCriadas === osAntesDoRetry,
      `os_antes=${osAntesDoRetry} os_depois=${efeitos.osCriadas}`,
    );

    // ------------- corrida no caminho de recuperação (proposta aprovada sem OS)
    //
    // Este é o único caminho do aceite que **não** passa por uma transição de
    // status: a proposta já está `aprovado` e só falta a OS. Sem transição não
    // há `UPDATE ... WHERE` para serializar, e o `findFirst` de
    // `criarOSAutomaticaParaOrcamento` é consulta prévia, não idempotência —
    // duas requisições o atravessam juntas. Até a migration
    // `20260731220000_os_orcamento_id_unico`, as 8 rodadas duplicavam, com pior
    // caso de 4 OS para o mesmo orçamento.
    //
    // Agora quem garante é o índice único, e o perdedor da corrida recebe
    // `P2002` e o trata como efeito já produzido. Duas coisas são verificadas
    // ao mesmo tempo: que ninguém duplica **e** que a OS continua sendo criada
    // — uma proteção que impedisse a criação também zeraria a duplicação.
    // Várias rodadas porque uma só pode passar por acaso.
    const RODADAS = 8;
    const SIMULTANEAS = 8;
    let piorCaso = 0;
    let melhorCaso = Number.POSITIVE_INFINITY;
    let rodadasComDuplicata = 0;
    let rodadasSemOS = 0;
    for (let rodada = 0; rodada < RODADAS; rodada++) {
      await reiniciar(c);
      await prisma.orcamento.update({
        where: { id: c.orcamentoId },
        data: { status: 'aprovado', status_aprovacao: 'APROVADO' },
      });
      await Promise.all(
        Array.from({ length: SIMULTANEAS }, () =>
          service
            .fecharPedidoInterno(c.orcamentoId, c.lojaId, c.usuarioId)
            .catch(() => undefined),
        ),
      );
      const criadas = await prisma.ordemServico.count({
        where: { orcamento_id: c.orcamentoId },
      });
      piorCaso = Math.max(piorCaso, criadas);
      melhorCaso = Math.min(melhorCaso, criadas);
      if (criadas > 1) rodadasComDuplicata += 1;
      if (criadas === 0) rodadasSemOS += 1;
    }
    verificar(
      `recuperação concorrente: ${RODADAS} rodadas de ${SIMULTANEAS} retries em proposta aprovada sem OS`,
      piorCaso === 1 && melhorCaso === 1,
      piorCaso === 1 && melhorCaso === 1
        ? `exatamente 1 OS em todas as ${RODADAS} rodadas`
        : `${rodadasComDuplicata}/${RODADAS} duplicaram (pior caso ${piorCaso} OS), ` +
          `${rodadasSemOS}/${RODADAS} não geraram OS alguma (ver §4.5)`,
    );

    // ------------------- idempotência estrutural: o que o banco garante mesmo
    const indices = await prisma.$queryRawUnsafe<
      Array<{ TABLE_NAME: string; INDEX_NAME: string }>
    >(
      `SELECT DISTINCT TABLE_NAME, INDEX_NAME
         FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = ?
          AND NON_UNIQUE = 0
          AND COLUMN_NAME = 'orcamento_id'
          AND TABLE_NAME IN ('ordens_servico', 'cobrancas')`,
      BANCO_ESPERADO,
    );
    const temUnicoOS = indices.some((i) => i.TABLE_NAME === 'ordens_servico');
    const temUnicoCobranca = indices.some((i) => i.TABLE_NAME === 'cobrancas');
    verificar(
      'idempotência estrutural: cobrança tem índice único por orçamento',
      temUnicoCobranca,
      temUnicoCobranca
        ? 'cobrancas.orcamento_id é UNIQUE — duplicata é impossível no banco'
        : 'AUSENTE',
    );
    verificar(
      'idempotência estrutural: OS tem índice único por orçamento',
      temUnicoOS,
      temUnicoOS
        ? 'ordens_servico.orcamento_id é UNIQUE — a unicidade não depende mais da transição'
        : 'AUSENTE — a migration 20260731220000_os_orcamento_id_unico não foi aplicada neste banco',
    );

  } finally {
    if (cenario) {
      // A OS é apagada explicitamente: o cascade da loja não a alcança, e
      // deixar resíduo aqui contaminaria a contagem de duplicatas da próxima
      // execução — que é justamente a pré-condição da migration do índice único.
      await prisma.ordemServico
        .deleteMany({ where: { orcamento_id: cenario.orcamentoId } })
        .catch(() => undefined);
      await prisma.loja
        .deleteMany({ where: { id: cenario.lojaId } })
        .catch(() => undefined);
    }
  }

  const falhas = resultados.filter((r) => !r.ok);
  console.log(
    `\n${resultados.length - falhas.length}/${resultados.length} verificações passaram.`,
  );
  if (falhas.length > 0) {
    console.log('\nFalhas:');
    for (const f of falhas) console.log(` - ${f.nome}: ${f.detalhe}`);
    process.exitCode = 1;
  }
}

principal()
  .catch((erro) => {
    console.error('Falha na validação:', erro);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await observador.$disconnect();
  });
