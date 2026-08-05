import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, cliente_status_cliente, usuario_funcao } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { IdentidadeAutenticada } from '../auth/decorators';
import { VendasPermissionsService } from '../vendas/permissions/vendas-permissions.service';
import { VENDAS_PERMISSOES } from '../vendas/permissions/vendas-permissoes';
import {
  pseudonimizar,
  registrarEventoDeSeguranca,
} from '../common/security/eventos-seguranca';
import { EVENTOS_COMERCIAIS } from '../orcamentos-v2/domain/eventos-comerciais';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import {
  EscopoCarteiraCliente,
  ListarClientesQueryDto,
} from './dto/listar-clientes-query.dto';
import { TransferirCarteiraDto } from './dto/transferir-carteira.dto';
import {
  CreateContatoDto,
  PAPEIS_CONTATO_CLIENTE,
  PapelContatoCliente,
} from './dto/create-contato.dto';
import { UpdateContatoDto } from './dto/update-contato.dto';
import {
  normalizarCamposCliente,
  normalizarCamposClienteParcial,
  normalizarDocumentoCliente,
  normalizarEmailCliente,
  normalizarTelefoneCliente,
} from './utils/cliente-normalizacao.util';
import {
  AlertaDuplicidadeCliente,
  ClienteContatoResumo,
  ClienteCriadoResultado,
  ClienteDetalhe,
  ClienteResumo,
  ClientesPaginados,
  ResponsavelComercialResumo,
  TransferenciaCarteiraResumo,
} from './clientes.types';

/** Include da ficha (`GET /clientes/:id`): nomes de quem transferiu/recebeu, nunca e-mail/documento. */
const INCLUDE_TRANSFERENCIA_CARTEIRA = {
  de_usuario: { select: { id: true, nome_completo: true } },
  para_usuario: { select: { id: true, nome_completo: true } },
  autor: { select: { id: true, nome_completo: true } },
} satisfies Prisma.cliente_transferencia_carteiraInclude;

type TransferenciaCarteiraPrisma = Prisma.cliente_transferencia_carteiraGetPayload<{
  include: typeof INCLUDE_TRANSFERENCIA_CARTEIRA;
}>;

/** Include mínimo para listagem/busca: só o necessário para `ClienteResumo`. */
const INCLUDE_RESUMO = {
  responsavel_comercial: { select: { id: true, nome_completo: true } },
} satisfies Prisma.clienteInclude;

/** Include completo: usado sempre que a autorização por escopo precisa dos
 * dados de responsável/participantes, e sempre que a resposta é `ClienteDetalhe`. */
const INCLUDE_COMPLETO = {
  participantes: { select: { usuario_id: true } },
  responsavel_comercial: { select: { id: true, nome_completo: true } },
  contatos: { where: { ativo: true }, orderBy: { criado_em: 'asc' } },
} satisfies Prisma.clienteInclude;

type ClienteComResumo = Prisma.clienteGetPayload<{ include: typeof INCLUDE_RESUMO }>;
type ClienteComRelacoesCompletas = Prisma.clienteGetPayload<{
  include: typeof INCLUDE_COMPLETO;
}>;
type ContatoPrisma = ClienteComRelacoesCompletas['contatos'][number];

/**
 * `cliente` é o cadastro mestre da loja (Fase 0 D-06/DV-11/DV-12). Este
 * service NUNCA aceita `loja_id`, `responsavel_comercial_id` ou permissão do
 * corpo da requisição como prova de autorização — tudo vem de
 * `IdentidadeAutenticada` (JWT) e de `VendasPermissionsService`.
 *
 * Escopos de carteira (RP §5.2.1):
 * - `propria`: eu sou responsável comercial OU participante.
 * - `equipe`: TODOS os `usuario_funcao.VENDAS` ativos da MESMA loja, como
 *   responsáveis OU participantes. O schema não tem hierarquia de time
 *   (sem `gerente_id` em `usuario`), então esta é a definição adotada nesta
 *   fase — documentada aqui e em `listarIdsEquipeVendas`.
 * - `todos`: toda a carteira da loja.
 * - `sem_responsavel`: carteira órfã (`responsavel_comercial_id = null`).
 */
@Injectable()
export class ClientesService {
  private readonly logger = new Logger(ClientesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly vendasPermissions: VendasPermissionsService,
  ) {}

  // --------------------------------------------------------------------
  // Listagem, busca e ficha
  // --------------------------------------------------------------------

  async listar(
    identidade: IdentidadeAutenticada,
    query: ListarClientesQueryDto,
  ): Promise<ClientesPaginados | ClienteResumo[]> {
    const escopo = query.escopo ?? 'propria';
    const where = await this.construirWhereEscopo(identidade, escopo);

    if (query.status) {
      where.status_cliente = query.status;
    }
    if (query.ativo !== undefined) {
      where.ativo = query.ativo;
    }

    const termo = query.q?.trim();
    if (termo) {
      where.AND = this.combinarBuscaTextual(where.AND, termo);
    }

    const orderBy: Prisma.clienteOrderByWithRelationInput = {
      [query.orderBy ?? 'criado_em']: query.orderDir ?? 'desc',
    };

    // Dual-read legado: consumidores antigos esperam array puro. Mesmo
    // escopo/permissão do modo paginado; só muda o formato da resposta.
    if (query.legado === '1') {
      const clientes = await this.prisma.cliente.findMany({
        where,
        orderBy,
        take: 200,
        include: INCLUDE_RESUMO,
      });
      return clientes.map((cliente) => this.mapClienteResumo(cliente));
    }

    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? 20, 100);
    const skip = (page - 1) * pageSize;

    const [total, clientes] = await this.prisma.$transaction([
      this.prisma.cliente.count({ where }),
      this.prisma.cliente.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: INCLUDE_RESUMO,
      }),
    ]);

    return {
      data: clientes.map((cliente) => this.mapClienteResumo(cliente)),
      meta: {
        total,
        page,
        pageSize,
        totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
      },
    };
  }

  /** `GET /clientes/search` — usado por selects de orçamento. Array sempre. */
  async buscar(
    identidade: IdentidadeAutenticada,
    q: string | undefined,
    escopoParam?: EscopoCarteiraCliente,
  ): Promise<ClienteResumo[]> {
    const escopo = escopoParam ?? 'propria';
    const where = await this.construirWhereEscopo(identidade, escopo);

    const termo = q?.trim();
    if (termo) {
      where.AND = this.combinarBuscaTextual(where.AND, termo);
    }

    const clientes = await this.prisma.cliente.findMany({
      where,
      orderBy: { nome: 'asc' },
      take: 50,
      include: INCLUDE_RESUMO,
    });

    return clientes.map((cliente) => this.mapClienteResumo(cliente));
  }

  async obterUm(
    identidade: IdentidadeAutenticada,
    clienteId: string,
  ): Promise<ClienteDetalhe> {
    const cliente = await this.carregarClienteComAcesso(identidade, clienteId);
    const transferencias = await this.prisma.cliente_transferencia_carteira.findMany({
      where: { cliente_id: clienteId, loja_id: identidade.lojaId },
      orderBy: { criado_em: 'desc' },
      take: 20,
      include: INCLUDE_TRANSFERENCIA_CARTEIRA,
    });

    return {
      ...this.mapClienteDetalhe(cliente),
      transferencias_carteira: transferencias.map((transferencia) =>
        this.mapTransferenciaCarteira(transferencia),
      ),
    };
  }

  // --------------------------------------------------------------------
  // Criação
  // --------------------------------------------------------------------

  async criar(
    identidade: IdentidadeAutenticada,
    dto: CreateClienteDto,
  ): Promise<ClienteCriadoResultado> {
    await this.vendasPermissions.assertPode(
      identidade.usuarioId,
      identidade.lojaId,
      VENDAS_PERMISSOES.CLIENTE_CRIAR,
    );

    const normalizacao = normalizarCamposCliente({
      documento: dto.documento,
      email: dto.email,
      telefone: dto.telefone,
    });

    const clienteCriado = await this.prisma.cliente.create({
      data: {
        nome: dto.nome,
        tipo_pessoa: dto.tipo_pessoa,
        documento: dto.documento,
        email: dto.email,
        telefone: dto.telefone,
        whatsapp: dto.whatsapp,
        cep: dto.cep,
        endereco: dto.endereco,
        numero: dto.numero,
        complemento: dto.complemento,
        bairro: dto.bairro,
        cidade: dto.cidade,
        estado: dto.estado,
        razao_social: dto.razao_social,
        nome_fantasia: dto.nome_fantasia,
        inscricao_estadual: dto.inscricao_estadual,
        // Contato interno legado — distinto do responsável comercial abaixo.
        responsavel: dto.responsavel,
        cargo_responsavel: dto.cargo_responsavel,
        observacoes: dto.observacoes,
        status_cliente: dto.status_cliente,
        origem: dto.origem,
        segmento: dto.segmento,
        ...normalizacao,
        loja: { connect: { id: identidade.lojaId } },
        // Vendedor responsável pela carteira = quem criou o cadastro.
        responsavel_comercial: { connect: { id: identidade.usuarioId } },
        responsavel_desde: new Date(),
      },
      include: INCLUDE_COMPLETO,
    });

    const avisos = await this.calcularAvisosDuplicidade(
      identidade.lojaId,
      normalizacao,
      clienteCriado.id,
    );

    return {
      cliente: this.mapClienteDetalhe(clienteCriado),
      avisos,
    };
  }

  // --------------------------------------------------------------------
  // Atualização e inativação
  // --------------------------------------------------------------------

  async atualizar(
    identidade: IdentidadeAutenticada,
    clienteId: string,
    dto: UpdateClienteDto,
  ): Promise<ClienteDetalhe> {
    await this.vendasPermissions.assertPode(
      identidade.usuarioId,
      identidade.lojaId,
      VENDAS_PERMISSOES.CLIENTE_EDITAR,
    );

    // `cliente.editar` autoriza a ação em geral; ainda falta confirmar que
    // ESTE cliente está no escopo do chamador (tenant + carteira).
    await this.carregarClienteComAcesso(identidade, clienteId);

    const normalizacaoParcial = normalizarCamposClienteParcial({
      documento: dto.documento,
      email: dto.email,
      telefone: dto.telefone,
    });

    const clienteAtualizado = await this.prisma.cliente.update({
      where: { id: clienteId },
      data: {
        nome: dto.nome,
        tipo_pessoa: dto.tipo_pessoa,
        documento: dto.documento,
        email: dto.email,
        telefone: dto.telefone,
        whatsapp: dto.whatsapp,
        cep: dto.cep,
        endereco: dto.endereco,
        numero: dto.numero,
        complemento: dto.complemento,
        bairro: dto.bairro,
        cidade: dto.cidade,
        estado: dto.estado,
        razao_social: dto.razao_social,
        nome_fantasia: dto.nome_fantasia,
        inscricao_estadual: dto.inscricao_estadual,
        responsavel: dto.responsavel,
        cargo_responsavel: dto.cargo_responsavel,
        observacoes: dto.observacoes,
        status_cliente: dto.status_cliente,
        origem: dto.origem,
        segmento: dto.segmento,
        // `responsavel_comercial_id` propositalmente ausente: só muda via
        // `transferirCarteira`.
        ...normalizacaoParcial,
      },
      include: INCLUDE_COMPLETO,
    });

    return this.mapClienteDetalhe(clienteAtualizado);
  }

  async inativar(
    identidade: IdentidadeAutenticada,
    clienteId: string,
  ): Promise<ClienteDetalhe> {
    await this.vendasPermissions.assertPode(
      identidade.usuarioId,
      identidade.lojaId,
      VENDAS_PERMISSOES.CLIENTE_INATIVAR,
    );

    await this.carregarClienteComAcesso(identidade, clienteId);

    const clienteInativado = await this.prisma.cliente.update({
      where: { id: clienteId },
      data: {
        ativo: false,
        status_cliente: cliente_status_cliente.INATIVO,
      },
      include: INCLUDE_COMPLETO,
    });

    return this.mapClienteDetalhe(clienteInativado);
  }

  // --------------------------------------------------------------------
  // Transferência de carteira
  // --------------------------------------------------------------------

  async listarResponsaveisDisponiveis(
    identidade: IdentidadeAutenticada,
  ): Promise<ResponsavelComercialResumo[]> {
    await this.vendasPermissions.assertPode(
      identidade.usuarioId,
      identidade.lojaId,
      VENDAS_PERMISSOES.CARTEIRA_TRANSFERIR,
    );

    const usuarios = await this.prisma.usuario.findMany({
      where: {
        loja_id: identidade.lojaId,
        status: 'ATIVO',
        ativo: true,
        funcao: {
          in: [usuario_funcao.VENDAS, usuario_funcao.ADMINISTRADOR],
        },
      },
      select: { id: true, nome_completo: true },
      orderBy: { nome_completo: 'asc' },
    });

    return usuarios.map((usuario) => ({
      id: usuario.id,
      nome: usuario.nome_completo,
    }));
  }

  async transferirCarteira(
    identidade: IdentidadeAutenticada,
    clienteId: string,
    dto: TransferirCarteiraDto,
  ): Promise<ClienteDetalhe> {
    await this.vendasPermissions.assertPode(
      identidade.usuarioId,
      identidade.lojaId,
      VENDAS_PERMISSOES.CARTEIRA_TRANSFERIR,
    );

    // Tenant primeiro: cliente de outra loja simplesmente não existe aqui.
    const cliente = await this.prisma.cliente.findFirst({
      where: { id: clienteId, loja_id: identidade.lojaId },
      select: { id: true, responsavel_comercial_id: true },
    });
    if (!cliente) {
      throw new NotFoundException('Cliente não encontrado.');
    }

    // Idempotência: mesma chave + mesmo cliente/loja = devolve o resultado já
    // processado, sem duplicar histórico (cobre duplo clique/retry de rede).
    const transferenciaExistente =
      await this.prisma.cliente_transferencia_carteira.findUnique({
        where: {
          loja_id_chave_operacao: {
            loja_id: identidade.lojaId,
            chave_operacao: dto.chave_operacao,
          },
        },
      });

    if (transferenciaExistente) {
      const mesmoContexto =
        transferenciaExistente.cliente_id === clienteId;

      if (!mesmoContexto) {
        registrarEventoDeSeguranca({
          tipo: 'CONFLITO_IDEMPOTENCIA',
          rota: 'ClientesService.transferirCarteira',
          recursoId: pseudonimizar(clienteId),
          motivo: 'chave_operacao_reutilizada_outro_contexto',
        });
        throw new ConflictException(
          'Esta chave de operação já foi utilizada em outra transferência.',
        );
      }

      const clienteAtual = await this.buscarClienteBrutoOuFalhar(
        identidade,
        clienteId,
      );
      return this.mapClienteDetalhe(clienteAtual);
    }

    // Destino sempre revalidado no backend: ativo e da MESMA loja.
    const paraUsuario = await this.prisma.usuario.findFirst({
      where: {
        id: dto.para_usuario_id,
        loja_id: identidade.lojaId,
        status: 'ATIVO',
        ativo: true,
        funcao: {
          in: [usuario_funcao.VENDAS, usuario_funcao.ADMINISTRADOR],
        },
      },
      select: { id: true },
    });

    if (!paraUsuario) {
      registrarEventoDeSeguranca({
        tipo: 'AUTORIZACAO_NEGADA',
        rota: 'ClientesService.transferirCarteira',
        origem: pseudonimizar(identidade.usuarioId),
        motivo: 'usuario_destino_invalido_ou_outra_loja',
      });
      throw new BadRequestException(
        'Usuário de destino inválido, inativo ou de outra loja.',
      );
    }

    const deUsuarioId = cliente.responsavel_comercial_id;

    if (deUsuarioId === dto.para_usuario_id) {
      throw new BadRequestException(
        'O usuário informado já é o responsável comercial deste cliente.',
      );
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        const alteracao = await tx.cliente.updateMany({
          where: {
            id: clienteId,
            loja_id: identidade.lojaId,
            responsavel_comercial_id: deUsuarioId,
          },
          data: {
            responsavel_comercial_id: dto.para_usuario_id,
            responsavel_desde: new Date(),
          },
        });

        if (alteracao.count !== 1) {
          throw new ConflictException(
            'A carteira foi alterada por outro usuário. Atualize os dados e tente novamente.',
          );
        }

        await tx.cliente_transferencia_carteira.create({
          data: {
            loja_id: identidade.lojaId,
            cliente_id: clienteId,
            de_usuario_id: deUsuarioId,
            para_usuario_id: dto.para_usuario_id,
            autor_id: identidade.usuarioId,
            motivo: dto.motivo,
            chave_operacao: dto.chave_operacao,
          },
        });
      });
    } catch (erro) {
      if (this.isViolacaoUnicidade(erro)) {
        const concorrente =
          await this.prisma.cliente_transferencia_carteira.findUnique({
            where: {
              loja_id_chave_operacao: {
                loja_id: identidade.lojaId,
                chave_operacao: dto.chave_operacao,
              },
            },
          });

        if (concorrente?.cliente_id === clienteId) {
          const clienteAtual = await this.buscarClienteBrutoOuFalhar(
            identidade,
            clienteId,
          );
          return this.mapClienteDetalhe(clienteAtual);
        }

        throw new ConflictException(
          'Esta chave de operação já foi utilizada em outra transferência.',
        );
      }
      throw erro;
    }

    // Evento comercial (eventos-comerciais.ts) — apenas IDs, nunca
    // e-mail/documento do cliente nem do usuário.
    this.logger.log(
      `${EVENTOS_COMERCIAIS.CARTEIRA_TRANSFERIDA} ` +
        `cliente_ref=${pseudonimizar(clienteId)} ` +
        `de_ref=${deUsuarioId ? pseudonimizar(deUsuarioId) : 'sem_responsavel'} ` +
        `para_ref=${pseudonimizar(dto.para_usuario_id)} ` +
        `autor_ref=${pseudonimizar(identidade.usuarioId)}`,
    );

    const clienteAtualizado = await this.buscarClienteBrutoOuFalhar(
      identidade,
      clienteId,
    );
    return this.mapClienteDetalhe(clienteAtualizado);
  }

  /**
   * Mesclagem administrativa de duplicados: diferida para o Núcleo
   * Competitivo (Fase 13 / RP §5.2.3). Recebe os parâmetros para manter a
   * assinatura estável quando a permissão já está gateada no controller.
   */
  async mesclar(
    _identidade: IdentidadeAutenticada,
    _clienteId: string,
  ): Promise<never> {
    throw new ForbiddenException(
      'Mesclagem de clientes ainda não está disponível nesta versão do sistema.',
    );
  }

  // --------------------------------------------------------------------
  // Contatos (/clientes/:id/contatos)
  // --------------------------------------------------------------------

  async listarContatos(
    identidade: IdentidadeAutenticada,
    clienteId: string,
  ): Promise<ClienteContatoResumo[]> {
    const cliente = await this.carregarClienteComAcesso(identidade, clienteId);
    return cliente.contatos.map((contato) => this.mapContato(contato));
  }

  async criarContato(
    identidade: IdentidadeAutenticada,
    clienteId: string,
    dto: CreateContatoDto,
  ): Promise<ClienteContatoResumo> {
    await this.vendasPermissions.assertPode(
      identidade.usuarioId,
      identidade.lojaId,
      VENDAS_PERMISSOES.CONTATO_GERENCIAR,
    );

    await this.carregarClienteComAcesso(identidade, clienteId);

    try {
      const contatoCriado = await this.prisma.cliente_contato.create({
        data: {
          // loja_id sempre da identidade autenticada, nunca do body.
          loja_id: identidade.lojaId,
          cliente_id: clienteId,
          nome: dto.nome,
          email: dto.email,
          telefone: dto.telefone,
          whatsapp: dto.whatsapp,
          cargo: dto.cargo,
          papeis: dto.papeis ?? [],
          principal: dto.principal ?? false,
        },
      });
      return this.mapContato(contatoCriado);
    } catch (erro) {
      if (this.isViolacaoUnicidadeContato(erro)) {
        throw new ConflictException(
          'Já existe um contato com este e-mail para este cliente.',
        );
      }
      throw erro;
    }
  }

  async atualizarContato(
    identidade: IdentidadeAutenticada,
    clienteId: string,
    contatoId: string,
    dto: UpdateContatoDto,
  ): Promise<ClienteContatoResumo> {
    await this.vendasPermissions.assertPode(
      identidade.usuarioId,
      identidade.lojaId,
      VENDAS_PERMISSOES.CONTATO_GERENCIAR,
    );

    await this.carregarClienteComAcesso(identidade, clienteId);
    await this.buscarContatoDoClienteOuFalhar(identidade, clienteId, contatoId);

    try {
      const contatoAtualizado = await this.prisma.cliente_contato.update({
        where: { id: contatoId },
        data: {
          nome: dto.nome,
          email: dto.email,
          telefone: dto.telefone,
          whatsapp: dto.whatsapp,
          cargo: dto.cargo,
          papeis: dto.papeis,
          principal: dto.principal,
        },
      });
      return this.mapContato(contatoAtualizado);
    } catch (erro) {
      if (this.isViolacaoUnicidadeContato(erro)) {
        throw new ConflictException(
          'Já existe um contato com este e-mail para este cliente.',
        );
      }
      throw erro;
    }
  }

  /** Soft delete: `DELETE /clientes/:id/contatos/:contatoId` chama isto. */
  async inativarContato(
    identidade: IdentidadeAutenticada,
    clienteId: string,
    contatoId: string,
  ): Promise<ClienteContatoResumo> {
    await this.vendasPermissions.assertPode(
      identidade.usuarioId,
      identidade.lojaId,
      VENDAS_PERMISSOES.CONTATO_GERENCIAR,
    );

    await this.carregarClienteComAcesso(identidade, clienteId);
    await this.buscarContatoDoClienteOuFalhar(identidade, clienteId, contatoId);

    const contatoInativado = await this.prisma.cliente_contato.update({
      where: { id: contatoId },
      data: { ativo: false },
    });

    return this.mapContato(contatoInativado);
  }

  private async buscarContatoDoClienteOuFalhar(
    identidade: IdentidadeAutenticada,
    clienteId: string,
    contatoId: string,
  ): Promise<ContatoPrisma> {
    const contato = await this.prisma.cliente_contato.findFirst({
      where: {
        id: contatoId,
        cliente_id: clienteId,
        loja_id: identidade.lojaId,
      },
    });
    if (!contato) {
      throw new NotFoundException('Contato não encontrado.');
    }
    return contato;
  }

  private isViolacaoUnicidadeContato(erro: unknown): boolean {
    return this.isViolacaoUnicidade(erro);
  }

  private isViolacaoUnicidade(erro: unknown): boolean {
    return (
      erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === 'P2002'
    );
  }

  // --------------------------------------------------------------------
  // Escopo / autorização por dados (carteira)
  // --------------------------------------------------------------------

  private async construirWhereEscopo(
    identidade: IdentidadeAutenticada,
    escopo: EscopoCarteiraCliente,
  ): Promise<Prisma.clienteWhereInput> {
    const { usuarioId, lojaId } = identidade;

    switch (escopo) {
      case 'propria':
        await this.vendasPermissions.assertPode(
          usuarioId,
          lojaId,
          VENDAS_PERMISSOES.CARTEIRA_VER_PROPRIA,
        );
        return {
          loja_id: lojaId,
          OR: [
            { responsavel_comercial_id: usuarioId },
            { participantes: { some: { usuario_id: usuarioId } } },
          ],
        };

      case 'equipe': {
        await this.vendasPermissions.assertPode(
          usuarioId,
          lojaId,
          VENDAS_PERMISSOES.CARTEIRA_VER_EQUIPE,
        );
        const idsEquipe = await this.listarIdsEquipeVendas(lojaId);
        return {
          loja_id: lojaId,
          OR: [
            { responsavel_comercial_id: { in: idsEquipe } },
            { participantes: { some: { usuario_id: { in: idsEquipe } } } },
          ],
        };
      }

      case 'todos':
        await this.vendasPermissions.assertPode(
          usuarioId,
          lojaId,
          VENDAS_PERMISSOES.CARTEIRA_VER_TODOS,
        );
        return { loja_id: lojaId };

      case 'sem_responsavel':
        await this.vendasPermissions.assertPode(
          usuarioId,
          lojaId,
          VENDAS_PERMISSOES.CARTEIRA_VER_SEM_RESPONSAVEL,
        );
        return { loja_id: lojaId, responsavel_comercial_id: null };

      default: {
        // Exaustividade: se um novo escopo for adicionado ao DTO sem tratar
        // aqui, o TypeScript quebra a build neste ponto.
        const escopoInvalido: never = escopo;
        throw new BadRequestException(
          `Escopo de carteira inválido: ${String(escopoInvalido)}`,
        );
      }
    }
  }

  /**
   * "Equipe" sem hierarquia explícita (schema atual não tem `gerente_id`):
   * todo usuário `usuario_funcao.VENDAS` ATIVO da MESMA loja é considerado
   * parte da equipe comercial. Cobre responsáveis e participantes.
   */
  private async listarIdsEquipeVendas(lojaId: string): Promise<string[]> {
    const usuarios = await this.prisma.usuario.findMany({
      where: {
        loja_id: lojaId,
        status: 'ATIVO',
        ativo: true,
        funcao: usuario_funcao.VENDAS,
      },
      select: { id: true },
    });
    return usuarios.map((usuario) => usuario.id);
  }

  /**
   * Confere se `identidade` tem acesso a ESTE cliente, avaliando os quatro
   * escopos em ordem de abrangência (todos > sem_responsável > equipe >
   * própria). Usado por findOne/update/inativar/contatos — ações "por ID"
   * que não passam pelo filtro de listagem.
   */
  private async possuiAcessoNoEscopo(
    identidade: IdentidadeAutenticada,
    cliente: {
      responsavel_comercial_id: string | null;
      participantes: { usuario_id: string }[];
    },
  ): Promise<boolean> {
    const { usuarioId, lojaId } = identidade;
    const participanteIds = cliente.participantes.map((p) => p.usuario_id);

    if (
      await this.vendasPermissions.pode(
        usuarioId,
        lojaId,
        VENDAS_PERMISSOES.CARTEIRA_VER_TODOS,
      )
    ) {
      return true;
    }

    if (
      cliente.responsavel_comercial_id === null &&
      (await this.vendasPermissions.pode(
        usuarioId,
        lojaId,
        VENDAS_PERMISSOES.CARTEIRA_VER_SEM_RESPONSAVEL,
      ))
    ) {
      return true;
    }

    if (
      await this.vendasPermissions.pode(
        usuarioId,
        lojaId,
        VENDAS_PERMISSOES.CARTEIRA_VER_EQUIPE,
      )
    ) {
      const idsEquipe = await this.listarIdsEquipeVendas(lojaId);
      const responsavelNaEquipe =
        cliente.responsavel_comercial_id !== null &&
        idsEquipe.includes(cliente.responsavel_comercial_id);
      const participanteNaEquipe = participanteIds.some((id) =>
        idsEquipe.includes(id),
      );
      if (responsavelNaEquipe || participanteNaEquipe) {
        return true;
      }
    }

    if (
      await this.vendasPermissions.pode(
        usuarioId,
        lojaId,
        VENDAS_PERMISSOES.CARTEIRA_VER_PROPRIA,
      )
    ) {
      if (
        cliente.responsavel_comercial_id === usuarioId ||
        participanteIds.includes(usuarioId)
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Busca por ID + tenant, sem checar escopo de carteira. Usado internamente
   * DEPOIS que uma ação de maior privilégio (ex.: `CARTEIRA_TRANSFERIR`) já
   * autorizou a operação — reaplicar o escopo de leitura aqui poderia negar
   * indevidamente a resposta de uma mutação que já foi aplicada com sucesso.
   */
  private async buscarClienteBrutoOuFalhar(
    identidade: IdentidadeAutenticada,
    clienteId: string,
  ): Promise<ClienteComRelacoesCompletas> {
    const cliente = await this.prisma.cliente.findFirst({
      where: { id: clienteId, loja_id: identidade.lojaId },
      include: INCLUDE_COMPLETO,
    });
    if (!cliente) {
      throw new NotFoundException('Cliente não encontrado.');
    }
    return cliente;
  }

  /**
   * `findOne`/`update`/`inativar`/contatos: carrega o cliente (tenant já
   * filtrado na query) e SÓ DEPOIS decide se `identidade` pode vê-lo. Como o
   * critério de escopo depende dos dados do próprio registro
   * (`responsavel_comercial_id`/participantes), não há como decidir antes de
   * ler — a garantia de segurança é que, fora do escopo, a resposta é 404
   * genérico (nunca 403 nem qualquer campo do registro), o que impede
   * diferenciar "não existe" de "existe mas não é seu" (anti-IDOR/anti-enumeração).
   */
  private async carregarClienteComAcesso(
    identidade: IdentidadeAutenticada,
    clienteId: string,
  ): Promise<ClienteComRelacoesCompletas> {
    const cliente = await this.buscarClienteBrutoOuFalhar(identidade, clienteId);

    const acesso = await this.possuiAcessoNoEscopo(identidade, cliente);
    if (!acesso) {
      throw new NotFoundException('Cliente não encontrado.');
    }

    return cliente;
  }

  // --------------------------------------------------------------------
  // Deduplicação (alerta, nunca bloqueio — RP §5.2.3)
  // --------------------------------------------------------------------

  private async calcularAvisosDuplicidade(
    lojaId: string,
    normalizacao: {
      documento_normalizado: string | null;
      email_normalizado: string | null;
      telefone_normalizado: string | null;
    },
    clienteIdExcluir: string,
  ): Promise<AlertaDuplicidadeCliente[]> {
    const avisos: AlertaDuplicidadeCliente[] = [];

    const candidatos: {
      campo: AlertaDuplicidadeCliente['campo'];
      valor: string | null;
    }[] = [
      { campo: 'documento', valor: normalizacao.documento_normalizado },
      { campo: 'email', valor: normalizacao.email_normalizado },
      { campo: 'telefone', valor: normalizacao.telefone_normalizado },
    ];

    for (const candidato of candidatos) {
      if (!candidato.valor) continue;

      const duplicado = await this.prisma.cliente.findFirst({
        where: {
          loja_id: lojaId,
          id: { not: clienteIdExcluir },
          ...(candidato.campo === 'documento'
            ? { documento_normalizado: candidato.valor }
            : candidato.campo === 'email'
              ? { email_normalizado: candidato.valor }
              : { telefone_normalizado: candidato.valor }),
        },
        select: { id: true },
      });

      if (duplicado) {
        avisos.push({ campo: candidato.campo });
      }
    }

    return avisos;
  }

  // --------------------------------------------------------------------
  // Busca textual
  // --------------------------------------------------------------------

  private combinarBuscaTextual(
    andAtual: Prisma.clienteWhereInput['AND'],
    termo: string,
  ): Prisma.clienteWhereInput[] {
    const documentoNormalizado = normalizarDocumentoCliente(termo);
    const emailNormalizado = normalizarEmailCliente(termo);
    const telefoneNormalizado = normalizarTelefoneCliente(termo);

    const condicaoBusca: Prisma.clienteWhereInput = {
      OR: [
        { nome: { contains: termo } },
        { razao_social: { contains: termo } },
        { nome_fantasia: { contains: termo } },
        { email: { contains: termo } },
        { telefone: { contains: termo } },
        ...(documentoNormalizado
          ? [{ documento_normalizado: { contains: documentoNormalizado } }]
          : []),
        ...(emailNormalizado
          ? [{ email_normalizado: { contains: emailNormalizado } }]
          : []),
        ...(telefoneNormalizado
          ? [{ telefone_normalizado: { contains: telefoneNormalizado } }]
          : []),
      ],
    };

    const anterior = Array.isArray(andAtual)
      ? andAtual
      : andAtual
        ? [andAtual]
        : [];

    return [...anterior, condicaoBusca];
  }

  // --------------------------------------------------------------------
  // Mapeamento para os tipos de resposta (nunca expõe segredo/campo interno)
  // --------------------------------------------------------------------

  private mapClienteResumo(cliente: ClienteComResumo): ClienteResumo {
    return {
      id: cliente.id,
      nome: cliente.nome,
      tipo_pessoa: cliente.tipo_pessoa,
      documento: cliente.documento,
      email: cliente.email,
      telefone: cliente.telefone,
      whatsapp: cliente.whatsapp,
      cidade: cliente.cidade,
      estado: cliente.estado,
      status_cliente: cliente.status_cliente,
      ativo: cliente.ativo,
      responsavel_comercial_id: cliente.responsavel_comercial_id,
      responsavel_desde: cliente.responsavel_desde,
      responsavel_comercial: cliente.responsavel_comercial
        ? {
            id: cliente.responsavel_comercial.id,
            nome: cliente.responsavel_comercial.nome_completo,
          }
        : null,
      criado_em: cliente.criado_em,
      atualizado_em: cliente.atualizado_em,
    };
  }

  private mapClienteDetalhe(cliente: ClienteComRelacoesCompletas): ClienteDetalhe {
    return {
      ...this.mapClienteResumo(cliente),
      razao_social: cliente.razao_social,
      nome_fantasia: cliente.nome_fantasia,
      inscricao_estadual: cliente.inscricao_estadual,
      cep: cliente.cep,
      endereco: cliente.endereco,
      numero: cliente.numero,
      complemento: cliente.complemento,
      bairro: cliente.bairro,
      responsavel: cliente.responsavel,
      cargo_responsavel: cliente.cargo_responsavel,
      observacoes: cliente.observacoes,
      origem: cliente.origem,
      segmento: cliente.segmento,
      contatos: cliente.contatos.map((contato) => this.mapContato(contato)),
    };
  }

  private mapTransferenciaCarteira(
    transferencia: TransferenciaCarteiraPrisma,
  ): TransferenciaCarteiraResumo {
    return {
      id: transferencia.id,
      de_usuario: transferencia.de_usuario
        ? { id: transferencia.de_usuario.id, nome: transferencia.de_usuario.nome_completo }
        : null,
      para_usuario: {
        id: transferencia.para_usuario.id,
        nome: transferencia.para_usuario.nome_completo,
      },
      autor: { id: transferencia.autor.id, nome: transferencia.autor.nome_completo },
      motivo: transferencia.motivo,
      criado_em: transferencia.criado_em,
    };
  }

  private mapContato(contato: ContatoPrisma): ClienteContatoResumo {
    return {
      id: contato.id,
      nome: contato.nome,
      email: contato.email,
      telefone: contato.telefone,
      whatsapp: contato.whatsapp,
      cargo: contato.cargo,
      papeis: this.normalizarPapeis(contato.papeis),
      principal: contato.principal,
      ativo: contato.ativo,
      criado_em: contato.criado_em,
      atualizado_em: contato.atualizado_em,
    };
  }

  private normalizarPapeis(valor: Prisma.JsonValue): PapelContatoCliente[] {
    if (!Array.isArray(valor)) return [];
    const papeisValidos = PAPEIS_CONTATO_CLIENTE as readonly string[];
    return valor.filter(
      (item): item is PapelContatoCliente =>
        typeof item === 'string' && papeisValidos.includes(item),
    );
  }
}
