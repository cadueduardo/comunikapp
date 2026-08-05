import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { IdentidadeAutenticada } from '../../auth/decorators';
import { PrismaService } from '../../prisma/prisma.service';
import { VendasPermissionsService } from '../permissions/vendas-permissions.service';
import { VENDAS_PERMISSOES } from '../permissions/vendas-permissoes';
import { NotificacoesService, TipoNotificacao } from '../../notificacoes/notificacoes.service';
import { OutboxEmailVendasService } from '../outbox/outbox-email-vendas.service';
import {
  AtualizarAtividadeDto,
  CriarAtividadeDto,
  ListarAtividadesQueryDto,
} from './dto/atividade.dto';

function mapAtividade(row: {
  id: string;
  loja_id: string;
  cliente_id: string | null;
  orcamento_id: string | null;
  contato_id: string | null;
  responsavel_id: string;
  criado_por: string;
  concluida_por: string | null;
  tipo: string;
  titulo: string;
  descricao: string | null;
  origem: string | null;
  prazo: Date;
  prazo_desejado: Date | null;
  concluida_em: Date | null;
  criado_em: Date;
  atualizado_em: Date;
}) {
  return {
    id: row.id,
    loja_id: row.loja_id,
    cliente_id: row.cliente_id,
    orcamento_id: row.orcamento_id,
    contato_id: row.contato_id,
    responsavel_id: row.responsavel_id,
    criado_por: row.criado_por,
    concluida_por: row.concluida_por,
    tipo: row.tipo,
    titulo: row.titulo,
    descricao: row.descricao,
    origem: row.origem,
    prazo: row.prazo.toISOString(),
    prazo_desejado: row.prazo_desejado?.toISOString() ?? null,
    concluida_em: row.concluida_em?.toISOString() ?? null,
    criado_em: row.criado_em.toISOString(),
    atualizado_em: row.atualizado_em.toISOString(),
  };
}

@Injectable()
export class AtividadesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vendasPermissions: VendasPermissionsService,
    private readonly notificacoes: NotificacoesService,
    private readonly outbox: OutboxEmailVendasService,
  ) {}

  async listar(
    identidade: IdentidadeAutenticada,
    query: ListarAtividadesQueryDto,
  ) {
    await this.vendasPermissions.assertPode(
      identidade.usuarioId,
      identidade.lojaId,
      VENDAS_PERMISSOES.ATIVIDADE_VER_PROPRIA,
    );

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const verEquipe = await this.vendasPermissions.pode(
      identidade.usuarioId,
      identidade.lojaId,
      VENDAS_PERMISSOES.ATIVIDADE_VER_EQUIPE,
    );

    const where: Prisma.atividade_comercialWhereInput = {
      loja_id: identidade.lojaId,
    };

    if (query.status === 'abertas' || !query.status) {
      where.concluida_em = null;
    } else if (query.status === 'concluidas') {
      where.concluida_em = { not: null };
    }

    if (query.cliente_id) {
      where.cliente_id = query.cliente_id;
    }

    if (query.responsavel_id) {
      if (!verEquipe && query.responsavel_id !== identidade.usuarioId) {
        throw new ForbiddenException(
          'Sem permissão para ver atividades da equipe.',
        );
      }
      where.responsavel_id = query.responsavel_id;
    } else if (!verEquipe) {
      where.responsavel_id = identidade.usuarioId;
    }

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.atividade_comercial.count({ where }),
      this.prisma.atividade_comercial.findMany({
        where,
        orderBy: [
          { prazo: 'asc' },
          { criado_em: 'asc' },
          { id: 'asc' },
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      items: rows.map(mapAtividade),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async obter(identidade: IdentidadeAutenticada, id: string) {
    await this.vendasPermissions.assertPode(
      identidade.usuarioId,
      identidade.lojaId,
      VENDAS_PERMISSOES.ATIVIDADE_VER_PROPRIA,
    );
    const row = await this.carregarComEscopo(identidade, id, 'ver');
    return mapAtividade(row);
  }

  async criar(identidade: IdentidadeAutenticada, dto: CriarAtividadeDto) {
    await this.vendasPermissions.assertPode(
      identidade.usuarioId,
      identidade.lojaId,
      VENDAS_PERMISSOES.ATIVIDADE_VER_PROPRIA,
    );

    let responsavelId = identidade.usuarioId;
    if (dto.responsavel_id && dto.responsavel_id !== identidade.usuarioId) {
      await this.assertPodeGerenciarEquipe(identidade);
      await this.assertUsuarioAtivoMesmaLoja(
        identidade.lojaId,
        dto.responsavel_id,
      );
      responsavelId = dto.responsavel_id;
    }

    if (dto.cliente_id) {
      await this.assertClienteNaLoja(identidade.lojaId, dto.cliente_id);
    }
    if (dto.contato_id) {
      await this.assertContatoNaLoja(
        identidade.lojaId,
        dto.contato_id,
        dto.cliente_id,
      );
    }
    if (dto.orcamento_id) {
      await this.assertOrcamentoNaLoja(identidade.lojaId, dto.orcamento_id);
    }

    const prazo = new Date(dto.prazo);
    if (Number.isNaN(prazo.getTime())) {
      throw new BadRequestException('Prazo inválido.');
    }

    const criada = await this.prisma.$transaction(async (tx) => {
      const row = await tx.atividade_comercial.create({
        data: {
          loja_id: identidade.lojaId,
          cliente_id: dto.cliente_id ?? null,
          orcamento_id: dto.orcamento_id ?? null,
          contato_id: dto.contato_id ?? null,
          responsavel_id: responsavelId,
          criado_por: identidade.usuarioId,
          tipo: dto.tipo,
          titulo: dto.titulo.trim(),
          descricao: dto.descricao?.trim() || null,
          origem: dto.origem ?? null,
          prazo,
          prazo_desejado: dto.prazo_desejado
            ? new Date(dto.prazo_desejado)
            : null,
        },
      });

      await this.outbox.enfileirarAtribuida({
        lojaId: identidade.lojaId,
        atividadeId: row.id,
        responsavelId,
        atorId: identidade.usuarioId,
        tx,
      });

      return row;
    });

    if (responsavelId !== identidade.usuarioId) {
      await this.notificacoes.criarNotificacaoEndereçada({
        lojaId: identidade.lojaId,
        usuarioId: responsavelId,
        tipo: TipoNotificacao.SISTEMA,
        titulo: 'Nova atividade atribuída',
        mensagem: criada.titulo,
        urlDestino: `/vendas/atividades?id=${criada.id}`,
        chaveDedup: `ativ:${criada.id}:atribuida`,
      });
    }

    return mapAtividade(criada);
  }

  async atualizar(
    identidade: IdentidadeAutenticada,
    id: string,
    dto: AtualizarAtividadeDto,
  ) {
    const atual = await this.carregarComEscopo(identidade, id, 'mutar');
    if (atual.concluida_em) {
      throw new ConflictException('Atividade já concluída não pode ser editada.');
    }

    const prazoAnterior = atual.prazo;
    let novoResponsavel = atual.responsavel_id;
    if (dto.responsavel_id && dto.responsavel_id !== atual.responsavel_id) {
      await this.assertPodeGerenciarEquipe(identidade);
      await this.assertUsuarioAtivoMesmaLoja(
        identidade.lojaId,
        dto.responsavel_id,
      );
      novoResponsavel = dto.responsavel_id;
    }

    const novoPrazo = dto.prazo ? new Date(dto.prazo) : atual.prazo;

    const atualizada = await this.prisma.$transaction(async (tx) => {
      const row = await tx.atividade_comercial.update({
        where: { id },
        data: {
          tipo: dto.tipo ?? undefined,
          titulo: dto.titulo?.trim(),
          descricao:
            dto.descricao === undefined
              ? undefined
              : dto.descricao?.trim() || null,
          origem:
            dto.origem === undefined ? undefined : dto.origem || null,
          prazo: dto.prazo ? novoPrazo : undefined,
          prazo_desejado:
            dto.prazo_desejado === undefined
              ? undefined
              : dto.prazo_desejado
                ? new Date(dto.prazo_desejado)
                : null,
          responsavel_id: novoResponsavel,
        },
      });

      if (novoResponsavel !== atual.responsavel_id) {
        await this.outbox.enfileirarAtribuida({
          lojaId: identidade.lojaId,
          atividadeId: row.id,
          responsavelId: novoResponsavel,
          atorId: identidade.usuarioId,
          tx,
        });
      }

      if (
        dto.prazo &&
        novoPrazo.getTime() !== prazoAnterior.getTime() &&
        novoResponsavel !== identidade.usuarioId
      ) {
        await this.outbox.enfileirarReprogramada({
          lojaId: identidade.lojaId,
          atividadeId: row.id,
          responsavelId: novoResponsavel,
          atorId: identidade.usuarioId,
          prazo: novoPrazo,
          tx,
        });
      }

      return row;
    });

    return mapAtividade(atualizada);
  }

  /**
   * Conclusão naturalmente idempotente (CAS concluida_em null).
   * Sem e-mail de conclusão.
   */
  async concluir(identidade: IdentidadeAutenticada, id: string) {
    await this.vendasPermissions.assertPode(
      identidade.usuarioId,
      identidade.lojaId,
      VENDAS_PERMISSOES.ATIVIDADE_VER_PROPRIA,
    );

    const escopo = await this.whereEscopoMutacao(identidade);
    const agora = new Date();

    const result = await this.prisma.atividade_comercial.updateMany({
      where: {
        id,
        loja_id: identidade.lojaId,
        concluida_em: null,
        ...escopo,
      },
      data: {
        concluida_em: agora,
        concluida_por: identidade.usuarioId,
      },
    });

    if (result.count === 1) {
      const row = await this.prisma.atividade_comercial.findFirst({
        where: { id, loja_id: identidade.lojaId },
      });
      if (!row) throw new NotFoundException('Atividade não encontrada.');

      // Notificação in-app opcional ao criador se diferente — sem outbox.
      if (row.criado_por !== identidade.usuarioId) {
        await this.notificacoes.criarNotificacaoEndereçada({
          lojaId: identidade.lojaId,
          usuarioId: row.criado_por,
          tipo: TipoNotificacao.SISTEMA,
          titulo: 'Atividade concluída',
          mensagem: row.titulo,
          urlDestino: `/vendas/atividades?id=${row.id}`,
          chaveDedup: `ativ:${row.id}:concluida`,
        });
      }

      return mapAtividade(row);
    }

    const existente = await this.prisma.atividade_comercial.findFirst({
      where: { id, loja_id: identidade.lojaId },
    });
    if (!existente) {
      throw new NotFoundException('Atividade não encontrada.');
    }

    const podeVer = await this.podeVerRegistro(identidade, existente);
    if (!podeVer) {
      throw new NotFoundException('Atividade não encontrada.');
    }

    if (existente.concluida_em) {
      return mapAtividade(existente);
    }

    throw new ForbiddenException(
      'Sem permissão para concluir esta atividade.',
    );
  }

  private async assertPodeGerenciarEquipe(identidade: IdentidadeAutenticada) {
    const [gerenciar, verEquipe] = await Promise.all([
      this.vendasPermissions.pode(
        identidade.usuarioId,
        identidade.lojaId,
        VENDAS_PERMISSOES.ATIVIDADE_GERENCIAR,
      ),
      this.vendasPermissions.pode(
        identidade.usuarioId,
        identidade.lojaId,
        VENDAS_PERMISSOES.ATIVIDADE_VER_EQUIPE,
      ),
    ]);
    if (!(gerenciar && verEquipe)) {
      throw new ForbiddenException(
        'Sem permissão para gerenciar atividades da equipe.',
      );
    }
  }

  private async whereEscopoMutacao(
    identidade: IdentidadeAutenticada,
  ): Promise<Prisma.atividade_comercialWhereInput> {
    const [gerenciar, verEquipe] = await Promise.all([
      this.vendasPermissions.pode(
        identidade.usuarioId,
        identidade.lojaId,
        VENDAS_PERMISSOES.ATIVIDADE_GERENCIAR,
      ),
      this.vendasPermissions.pode(
        identidade.usuarioId,
        identidade.lojaId,
        VENDAS_PERMISSOES.ATIVIDADE_VER_EQUIPE,
      ),
    ]);
    if (gerenciar && verEquipe) {
      return {};
    }
    return { responsavel_id: identidade.usuarioId };
  }

  private async carregarComEscopo(
    identidade: IdentidadeAutenticada,
    id: string,
    modo: 'ver' | 'mutar',
  ) {
    const row = await this.prisma.atividade_comercial.findFirst({
      where: { id, loja_id: identidade.lojaId },
    });
    if (!row) throw new NotFoundException('Atividade não encontrada.');

    if (modo === 'ver') {
      if (!(await this.podeVerRegistro(identidade, row))) {
        throw new NotFoundException('Atividade não encontrada.');
      }
      return row;
    }

    const escopo = await this.whereEscopoMutacao(identidade);
    if (
      escopo.responsavel_id &&
      row.responsavel_id !== identidade.usuarioId
    ) {
      throw new ForbiddenException(
        'Sem permissão para alterar esta atividade.',
      );
    }
    return row;
  }

  private async podeVerRegistro(
    identidade: IdentidadeAutenticada,
    row: { responsavel_id: string },
  ): Promise<boolean> {
    if (row.responsavel_id === identidade.usuarioId) return true;
    return this.vendasPermissions.pode(
      identidade.usuarioId,
      identidade.lojaId,
      VENDAS_PERMISSOES.ATIVIDADE_VER_EQUIPE,
    );
  }

  private async assertUsuarioAtivoMesmaLoja(lojaId: string, usuarioId: string) {
    const u = await this.prisma.usuario.findFirst({
      where: { id: usuarioId, loja_id: lojaId, ativo: true },
      select: { id: true, status: true },
    });
    if (!u || u.status === 'INATIVO' || u.status === 'BLOQUEADO') {
      throw new BadRequestException('Responsável inválido para a loja.');
    }
  }

  private async assertClienteNaLoja(lojaId: string, clienteId: string) {
    const c = await this.prisma.cliente.findFirst({
      where: { id: clienteId, loja_id: lojaId },
      select: { id: true },
    });
    if (!c) throw new NotFoundException('Cliente não encontrado.');
  }

  private async assertContatoNaLoja(
    lojaId: string,
    contatoId: string,
    clienteId?: string,
  ) {
    const c = await this.prisma.cliente_contato.findFirst({
      where: {
        id: contatoId,
        loja_id: lojaId,
        ...(clienteId ? { cliente_id: clienteId } : {}),
      },
      select: { id: true },
    });
    if (!c) throw new NotFoundException('Contato não encontrado.');
  }

  private async assertOrcamentoNaLoja(lojaId: string, orcamentoId: string) {
    const o = await this.prisma.orcamento.findFirst({
      where: { id: orcamentoId, loja_id: lojaId },
      select: { id: true },
    });
    if (!o) throw new NotFoundException('Orçamento não encontrado.');
  }
}
