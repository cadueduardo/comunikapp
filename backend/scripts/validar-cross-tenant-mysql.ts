/**
 * Gate 0S / HS-01 e HS-02 — isolamento multi-tenant contra banco real.
 *
 * Os testes unitários do gate usam um registro simulado em memória, que nunca
 * poderia provar isolamento: o simulador responde ao filtro que o próprio teste
 * escreveu. Este script cria **duas lojas de verdade**, com usuários, clientes,
 * orçamentos e mensagens persistidos, e tenta operar recursos da loja B usando a
 * identidade da loja A.
 *
 * O que ele exercita são os **métodos reais** dos services, não uma
 * reimplementação das consultas. Os services são construídos sem passar pelo
 * container do Nest porque os caminhos exercitados dependem apenas de `prisma`,
 * `logger` e das dependências explicitamente injetadas abaixo.
 *
 * Uso (nunca contra o banco de trabalho):
 *   $env:DATABASE_URL="mysql://root@localhost:3306/comunikapp_gate0s"
 *   npx ts-node scripts/validar-cross-tenant-mysql.ts
 *
 * O script remove tudo o que criou no final, inclusive em caso de falha.
 */
import { PrismaClient } from '@prisma/client';
import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { OrcamentosV2Service } from '../src/orcamentos-v2/services/orcamentos-v2.service';
import { ChatV2Service } from '../src/orcamentos-v2/services/chat-v2.service';
import { ImpressaoV2Service } from '../src/orcamentos-v2/services/impressao-v2.service';
import { LinksV2Service } from '../src/orcamentos-v2/services/links-v2.service';
import { TransformacaoV2Service } from '../src/orcamentos-v2/services/transformacao-v2.service';
import { VendasPermissionsService } from '../src/vendas/permissions/vendas-permissions.service';
import { VENDAS_PERMISSOES } from '../src/vendas/permissions/vendas-permissoes';

// O script cria e apaga lojas inteiras, então recusa rodar fora de um banco
// descartável. O padrão é o clone local; o CI declara o seu por variável.
const BANCO_ESPERADO =
  process.env.GATE0S_BANCO_PERMITIDO || 'comunikapp_gate0s';
const MARCA = 'gate0s-xt-' + Date.now();

const prisma = new PrismaClient();

/** Constrói um service real sem subir o container do Nest. */
function montar<T>(classe: new (...args: any[]) => T, campos: Record<string, unknown>): T {
  const instancia = Object.create(classe.prototype) as T;
  (instancia as any).prisma = prisma;
  (instancia as any).logger = new Logger(classe.name);
  for (const [chave, valor] of Object.entries(campos)) {
    (instancia as any)[chave] = valor;
  }
  return instancia;
}

const permissoes = new VendasPermissionsService(prisma as any);
const orcamentos = montar(OrcamentosV2Service, {
  vendasPermissions: permissoes,
  transformacaoService: new TransformacaoV2Service(),
  notificacaoService: { notificarMudancaStatus: async () => undefined },
  notificacoesService: { criarNotificacao: async () => undefined },
  cacheService: { invalidar: () => undefined },
  osService: { criarOSDeOrcamento: async () => undefined },
  cobrancasService: { criarCobrancaParaOrcamento: async () => undefined },
  prazoEntregaService: { parsePrazoEntrega: () => 10 },
  parcelasBuilder: { gerarDescricao: () => 'condição de teste' },
  mailService: { enviarEmail: async () => undefined },
});
// Chat/Links passaram a exigir VendasPermissionsService (Fase 2 RBAC).
// Sem injetar aqui, o script mascara TypeError como "negado" e quebra no
// caminho legítimo (criar link na própria loja).
const chat = montar(ChatV2Service, { vendasPermissions: permissoes });
const impressao = montar(ImpressaoV2Service, {});
const links = montar(LinksV2Service, { vendasPermissions: permissoes });

type Resultado = { nome: string; ok: boolean; detalhe: string };
const resultados: Resultado[] = [];

function verificar(nome: string, ok: boolean, detalhe: string) {
  resultados.push({ nome, ok, detalhe });
  console.log(`${ok ? 'OK   ' : 'FALHA'} | ${nome} | ${detalhe}`);
}

/**
 * Executa uma operação que **deve** ser negada. Só aceita as respostas HTTP
 * canônicas de autorização/recurso invisível (403/404) ou um resultado vazio
 * explicitamente previsto pelo chamador. Erros internos nunca comprovam
 * isolamento entre tenants.
 */
async function deveNegar(
  nome: string,
  operacao: () => Promise<unknown>,
  aceitaVazio: (valor: unknown) => boolean = () => false,
) {
  try {
    const valor = await operacao();
    if (aceitaVazio(valor)) {
      verificar(nome, true, 'devolveu vazio, sem dado da outra loja');
      return;
    }
    verificar(
      nome,
      false,
      'RETORNOU DADO: ' + JSON.stringify(valor).slice(0, 200),
    );
  } catch (erro: unknown) {
    const nomeErro =
      erro instanceof Error ? erro.constructor.name : 'ErroDesconhecido';
    const status =
      erro instanceof HttpException ? erro.getStatus() : undefined;
    const negacaoEsperada =
      status === HttpStatus.FORBIDDEN || status === HttpStatus.NOT_FOUND;

    verificar(
      nome,
      negacaoEsperada,
      negacaoEsperada
        ? `negado com ${nomeErro} (${status})`
        : `ERRO INESPERADO: ${nomeErro}${status ? ` (${status})` : ''}`,
    );
  }
}

interface Tenant {
  lojaId: string;
  usuarioId: string;
  usuarioInativoId: string;
  clienteId: string;
  orcamentoId: string;
  produtoId: string;
}

async function criarTenant(sufixo: string): Promise<Tenant> {
  const loja = await prisma.loja.create({
    data: {
      nome: `Loja ${sufixo} ${MARCA}`,
      slug: `${MARCA}-${sufixo}`,
      email: `${MARCA}-${sufixo}@exemplo.invalido`,
      telefone: '1130000000',
      atualizado_em: new Date(),
      status: 'ATIVO',
    },
  });

  const usuario = await prisma.usuario.create({
    data: {
      loja_id: loja.id,
      email: `vendedor-${MARCA}-${sufixo}@exemplo.invalido`,
      nome_completo: `Vendedor ${sufixo}`,
      funcao: 'VENDAS',
      status: 'ATIVO',
      ativo: true,
    },
  });

  // Mesma loja, mesma função, mas desativado. Serve para provar que o bloqueio
  // vale na requisição já autenticada, não só no login.
  const usuarioInativo = await prisma.usuario.create({
    data: {
      loja_id: loja.id,
      email: `inativo-${MARCA}-${sufixo}@exemplo.invalido`,
      nome_completo: `Inativo ${sufixo}`,
      funcao: 'VENDAS',
      status: 'ATIVO',
      ativo: false,
    },
  });

  const cliente = await prisma.cliente.create({
    data: {
      loja_id: loja.id,
      nome: `Cliente ${sufixo} ${MARCA}`,
      tipo_pessoa: 'PESSOA_JURIDICA',
      documento: `00000000000${sufixo === 'a' ? '1' : '2'}`,
      email: `cliente-${MARCA}-${sufixo}@exemplo.invalido`,
    },
  });

  const orcamento = await prisma.orcamento.create({
    data: {
      loja_id: loja.id,
      cliente_id: cliente.id,
      numero: `${MARCA}-${sufixo}-001`,
      nome_servico: `Servico secreto da loja ${sufixo}`,
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

  const produto = await prisma.produtoOrcamento.create({
    data: {
      orcamento: { connect: { id: orcamento.id } },
      nome_servico: `Produto da loja ${sufixo}`,
      quantidade: 1,
      preco_unitario: 220,
      preco_total: 220,
      custo_total_producao: 175,
      margem_lucro: 35,
      impostos: 10,
    },
  });

  await prisma.mensagemChat.create({
    data: {
      orcamento_id: orcamento.id,
      usuario_id: usuario.id,
      conteudo: `Mensagem confidencial da loja ${sufixo}`,
      tipo: 'TEXTO',
    },
  });

  return {
    lojaId: loja.id,
    usuarioId: usuario.id,
    usuarioInativoId: usuarioInativo.id,
    clienteId: cliente.id,
    orcamentoId: orcamento.id,
    produtoId: produto.id,
  };
}

async function limparTenant(t: Tenant) {
  // `onDelete: Cascade` na relação com `loja` remove usuários, clientes,
  // orçamentos, produtos e mensagens junto.
  await prisma.loja.deleteMany({ where: { id: t.lojaId } });
}

async function principal() {
  const banco = await prisma.$queryRawUnsafe<Array<{ db: string }>>(
    'SELECT DATABASE() AS db',
  );
  const nomeBanco = banco[0]?.db;
  if (nomeBanco !== BANCO_ESPERADO) {
    throw new Error(
      `Recusando executar fora do banco de validação (atual: ${nomeBanco}).`,
    );
  }
  console.log(`Banco: ${nomeBanco}\nMarca desta execução: ${MARCA}\n`);

  let a: Tenant | null = null;
  let b: Tenant | null = null;

  try {
    a = await criarTenant('a');
    b = await criarTenant('b');
    console.log(`Loja A: ${a.lojaId} | Loja B: ${b.lojaId}\n`);

    const statusOriginalB = (
      await prisma.orcamento.findUnique({
        where: { id: b.orcamentoId },
        select: { status: true },
      })
    )?.status;

    // ---------------------------------------------------------------- leitura
    await deveNegar('leitura: buscarOrcamento(orcB, lojaA)', () =>
      orcamentos.buscarOrcamento(b!.orcamentoId, a!.lojaId),
    );

    const lista = await orcamentos.listarOrcamentos(a.lojaId, {}, {});
    verificar(
      'listagem: listarOrcamentos(lojaA) não inclui orçamento da loja B',
      !lista.orcamentos.some((o: any) => o.id === b!.orcamentoId),
      `total=${lista.total}`,
    );
    verificar(
      'listagem: payload autenticado não devolve codigo_aprovacao',
      !JSON.stringify(lista).includes('codigo_aprovacao'),
      'nenhuma ocorrência do campo',
    );

    // -------------------------------------------------------------- mutações
    await deveNegar('mutação: atualizarOrcamento(orcB, lojaA)', () =>
      orcamentos.atualizarOrcamento(
        b!.orcamentoId,
        { nome_servico: 'INVADIDO' },
        a!.lojaId,
        a!.usuarioId,
      ),
    );

    await deveNegar('mutação: alterarStatus(orcB, cancelado, lojaA)', () =>
      orcamentos.alterarStatus(
        b!.orcamentoId,
        'cancelado',
        a!.lojaId,
        a!.usuarioId,
      ),
    );

    await deveNegar('mutação: removerOrcamento(orcB, lojaA)', () =>
      orcamentos.removerOrcamento(b!.orcamentoId, a!.lojaId, a!.usuarioId),
    );

    await deveNegar('mutação: fecharPedidoInterno(orcB, lojaA)', () =>
      orcamentos.fecharPedidoInterno(b!.orcamentoId, a!.lojaId, a!.usuarioId),
    );

    await deveNegar('mutação: enviarOrcamento(orcB, lojaA)', () =>
      orcamentos.enviarOrcamento(b!.orcamentoId, a!.lojaId, a!.usuarioId),
    );

    const bDepois = await prisma.orcamento.findUnique({
      where: { id: b.orcamentoId },
      select: {
        status: true,
        nome_servico: true,
        excluido_em: true,
        codigo_aprovacao_hash: true,
      },
    });
    verificar(
      'integridade: nenhuma mutação cross-tenant alterou o orçamento da loja B',
      bDepois?.status === statusOriginalB &&
        bDepois?.nome_servico?.includes('loja b') === true &&
        bDepois?.excluido_em === null &&
        bDepois?.codigo_aprovacao_hash === null,
      `status=${bDepois?.status} nome=${bDepois?.nome_servico} excluido=${bDepois?.excluido_em} hash=${bDepois?.codigo_aprovacao_hash}`,
    );

    // ------------------------------------------------------------- impressão
    await deveNegar('impressão: gerarPDF(orcB, lojaA)', () =>
      impressao.gerarPDF(b!.orcamentoId, a!.lojaId),
    );
    await deveNegar('impressão: gerarRelatorioCustos(orcB, lojaA)', () =>
      impressao.gerarRelatorioCustos(b!.orcamentoId, a!.lojaId),
    );
    await deveNegar('impressão: gerarPropostaComercial(orcB, lojaA)', () =>
      impressao.gerarPropostaComercial(b!.orcamentoId, a!.lojaId),
    );

    // ------------------------------------------------------------------ chat
    await deveNegar(
      'chat: buscarMensagens(orcB, userA, lojaA)',
      () => chat.buscarMensagens(b!.orcamentoId, a!.usuarioId, a!.lojaId),
      (v: any) => Array.isArray(v?.mensagens) && v.mensagens.length === 0,
    );
    await deveNegar('chat: enviarMensagem(orcB, userA, lojaA)', () =>
      chat.enviarMensagem(
        b!.orcamentoId,
        a!.usuarioId,
        a!.lojaId,
        'invasao',
      ),
    );

    const mensagensBAntes = await prisma.mensagemChat.count({
      where: { orcamento_id: b.orcamentoId },
    });
    await chat
      .marcarMensagensComoLidas(b.orcamentoId, a.usuarioId, a.lojaId)
      .catch(() => undefined);
    const lidasIndevidas = await prisma.mensagemChat.count({
      where: { orcamento_id: b.orcamentoId, lida: true },
    });
    verificar(
      'chat: marcarMensagensComoLidas não afeta mensagens da outra loja',
      lidasIndevidas === 0,
      `mensagens_b=${mensagensBAntes} marcadas_indevidamente=${lidasIndevidas}`,
    );

    await deveNegar(
      'chat: buscarEstatisticasChat(orcB, lojaA)',
      () => chat.buscarEstatisticasChat(b!.orcamentoId, a!.lojaId),
      (v: any) => v?.total_mensagens === 0,
    );

    // ------------------------------------------------------ produto-detalhes
    // O controller resolve por `orcamento: { loja_id }`; aqui reproduzimos a
    // mesma consulta para provar que o filtro está no `where`, não na aplicação.
    const produtoCruzado = await prisma.produtoOrcamento.findFirst({
      where: { id: b.produtoId, orcamento: { loja_id: a.lojaId } },
    });
    verificar(
      'produto-detalhes: produto da loja B não resolve sob a loja A',
      produtoCruzado === null,
      'findFirst devolveu null',
    );

    // ------------------------------------------------------------------ links
    await deveNegar(
      'links: listarLinksPublicos(orcB, userA, lojaA)',
      () => links.listarLinksPublicos(b!.orcamentoId, a!.usuarioId, a!.lojaId),
      (v: any) => Array.isArray(v) && v.length === 0,
    );
    await deveNegar('links: criarLinkPublico(orcB, userA, lojaA)', () =>
      links.criarLinkPublico(b!.orcamentoId, a!.usuarioId, a!.lojaId, []),
    );

    // A rota `GET links/publico/:token` exige JWT. Resolver o link só pelo
    // token deixava a loja A consumir visualização de um link da loja B.
    const linkDeB: any = await links.criarLinkPublico(
      b.orcamentoId,
      b.usuarioId,
      b.lojaId,
      [],
    );
    await deveNegar('links: acessarLinkPublico(tokenDeB, lojaA)', () =>
      links.acessarLinkPublico(linkDeB.token, a!.lojaId),
    );
    const visualizacoesDepois = await prisma.linkPublico.findUnique({
      where: { token: linkDeB.token },
      select: { visualizacoes: true },
    });
    verificar(
      'links: acesso negado não incrementa visualização do link da outra loja',
      !visualizacoesDepois?.visualizacoes,
      `visualizacoes=${visualizacoesDepois?.visualizacoes ?? 0}`,
    );
    const acessoProprio: any = await links.acessarLinkPublico(
      linkDeB.token,
      b.lojaId,
    );
    verificar(
      'links: dono do link continua acessando pelo token',
      Boolean(acessoProprio?.link?.token),
      'acesso concedido dentro da própria loja',
    );

    // -------------------------------------------------- superfície pública
    // A rota pública não tem tenant por definição: o cliente final não está
    // autenticado. O que ela não pode fazer é devolver dado interno nem servir
    // de oráculo. Aqui se verifica o conteúdo do payload, não o acesso.
    const publico: any = await orcamentos.buscarOrcamentoPublico(b.orcamentoId);
    const serializado = JSON.stringify(publico);
    const camposProibidos = [
      'custo_total',
      'custo_material',
      'custo_mao_obra',
      'custo_indireto',
      'margem_lucro',
      'codigo_aprovacao_hash',
      'codigo_aprovacao',
    ];
    const vazados = camposProibidos.filter((c) => serializado.includes(c));
    verificar(
      'público: payload da proposta não expõe custo, margem nem código',
      vazados.length === 0,
      vazados.length ? 'VAZOU: ' + vazados.join(', ') : 'nenhum campo sensível',
    );

    // Indistinguibilidade: orçamento inexistente e código errado devem produzir
    // a mesma resposta, senão a rota vira oráculo de existência.
    const inexistente = 'ckinexistente0000000000000';
    const erroInexistente = await orcamentos
      .processarAcaoClientePublico(inexistente, {
        acao: 'APROVAR',
        codigo_aprovacao: 'qualquer-coisa',
      } as any)
      .then(() => 'SEM ERRO')
      .catch((e: any) => String(e?.message ?? e));
    const erroCodigoErrado = await orcamentos
      .processarAcaoClientePublico(b.orcamentoId, {
        acao: 'APROVAR',
        codigo_aprovacao: 'codigo-que-nao-existe',
      } as any)
      .then(() => 'SEM ERRO')
      .catch((e: any) => String(e?.message ?? e));
    verificar(
      'público: orçamento inexistente e código errado são indistinguíveis',
      erroInexistente === erroCodigoErrado && erroInexistente !== 'SEM ERRO',
      `inexistente="${erroInexistente}" codigo_errado="${erroCodigoErrado}"`,
    );

    // ------------------------------------------------------- autorização
    const podeUsuarioAtivo = await permissoes.pode(
      a.usuarioId,
      a.lojaId,
      VENDAS_PERMISSOES.PROPOSTA_VER,
    );
    verificar(
      'autorização: vendedor ativo da própria loja tem proposta.ver',
      podeUsuarioAtivo === true,
      `pode=${podeUsuarioAtivo}`,
    );

    const podeNaOutraLoja = await permissoes.pode(
      a.usuarioId,
      b.lojaId,
      VENDAS_PERMISSOES.PROPOSTA_VER,
    );
    verificar(
      'autorização: usuário da loja A não tem permissão sob a loja B',
      podeNaOutraLoja === false,
      `pode=${podeNaOutraLoja}`,
    );

    const podeInativo = await permissoes.pode(
      a.usuarioInativoId,
      a.lojaId,
      VENDAS_PERMISSOES.PROPOSTA_VER,
    );
    verificar(
      'autorização: usuário desativado é negado mesmo com JWT válido',
      podeInativo === false,
      `pode=${podeInativo}`,
    );

    // Revogação tem de valer na requisição seguinte, sem esperar TTL.
    await prisma.usuario.update({
      where: { id: a.usuarioId },
      data: { ativo: false },
    });
    const podeAposRevogacao = await permissoes.pode(
      a.usuarioId,
      a.lojaId,
      VENDAS_PERMISSOES.PROPOSTA_VER,
    );
    await prisma.usuario.update({
      where: { id: a.usuarioId },
      data: { ativo: true },
    });
    verificar(
      'autorização: revogação tem efeito imediato, sem TTL de cache',
      podeAposRevogacao === false,
      `pode_apos_revogacao=${podeAposRevogacao}`,
    );

    // `proposta.excluir` fica fora do piso da função VENDAS de propósito. É o
    // caso que prova que "autenticado" não vira "pode tudo": mesma loja, mesmo
    // usuário válido, permissão negada.
    const podeExcluir = await permissoes.pode(
      a.usuarioId,
      a.lojaId,
      VENDAS_PERMISSOES.PROPOSTA_EXCLUIR,
    );
    verificar(
      'autorização: vendedor não recebe proposta.excluir por ser autenticado',
      podeExcluir === false,
      `pode=${podeExcluir}`,
    );

    // ------------------------------------------------------------ auditoria
    const trilhasDaLojaB = await prisma.orcamentoLog.findMany({
      where: { orcamento_id: b.orcamentoId },
      select: { tipo_acao: true, descricao: true, dados_extras: true },
    });
    const trilhaSerializada = JSON.stringify(trilhasDaLojaB);
    verificar(
      'auditoria: tentativa cross-tenant não gravou trilha no orçamento alheio',
      trilhasDaLojaB.length === 0,
      `trilhas=${trilhasDaLojaB.length} ${trilhaSerializada.slice(0, 120)}`,
    );
  } finally {
    if (a) await limparTenant(a).catch(() => undefined);
    if (b) await limparTenant(b).catch(() => undefined);
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
    const nomeErro =
      erro instanceof Error ? erro.constructor.name : 'ErroDesconhecido';
    console.error(`Falha na validação: ${nomeErro}`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
