import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StatusSolicitacaoCompra, loja } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { DocumentCodeService } from '../../documentos/document-code.service';
import { CreateSolicitacaoDto } from '../dto/create-solicitacao.dto';
import { UpdateSolicitacaoDto } from '../dto/update-solicitacao.dto';
import {
  assertTransicaoSolicitacao,
  statusAlvoSolicitacao,
} from '../policies/compras-estados.policy';
import { ComprasHistoricoService } from './compras-historico.service';
import {
  COMPRAS_PERMISSOES,
  ComprasPermissionsService,
} from './compras-permissions.service';
import { updateSolicitacaoTenantSafe } from './pedido-matriz.util';
import { rethrowUniqueConflict } from './pedido-totais.util';
import {
  montarItensSolicitacao,
  validarItensSolicitacao,
} from './solicitacao-itens.util';

const STATUS_EDITAVEIS: StatusSolicitacaoCompra[] = [
  StatusSolicitacaoCompra.RASCUNHO,
  StatusSolicitacaoCompra.DEVOLVIDA,
];

@Injectable()
export class SolicitacoesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly documentCode: DocumentCodeService,
    private readonly historicoService: ComprasHistoricoService,
    private readonly permissions: ComprasPermissionsService,
  ) {}

  async create(
    dto: CreateSolicitacaoDto,
    lojaAtual: loja,
    usuarioId: string,
  ) {
    await this.permissions.assertPode(
      usuarioId,
      lojaAtual.id,
      COMPRAS_PERMISSOES.SOLICITACAO_CRIAR,
    );

    validarItensSolicitacao(dto.itens);
    const itensData = await montarItensSolicitacao(
      this.prisma,
      dto.itens,
      lojaAtual.id,
    );

    try {
      const numero = await this.documentCode.gerarCodigoSolicitacaoCompra(
        lojaAtual.id,
      );

      const criada = await this.prisma.solicitacaoCompra.create({
        data: {
          loja_id: lojaAtual.id,
          numero,
          status: StatusSolicitacaoCompra.RASCUNHO,
          prioridade: dto.prioridade,
          origem_tipo: dto.origem_tipo,
          origem_id: dto.origem_id,
          solicitante_id: usuarioId,
          justificativa: dto.justificativa,
          data_necessaria: dto.data_necessaria
            ? new Date(dto.data_necessaria)
            : undefined,
          itens: {
            create: itensData,
          },
        },
        include: { itens: true },
      });

      await this.historicoService.registrar({
        lojaId: lojaAtual.id,
        entidadeTipo: 'SOLICITACAO_COMPRA',
        entidadeId: criada.id,
        acao: 'CRIAR',
        statusAnterior: null,
        statusNovo: StatusSolicitacaoCompra.RASCUNHO,
        usuarioId,
        dados: {
          numero: criada.numero,
          itens: criada.itens.length,
        },
      });

      return criada;
    } catch (error) {
      rethrowUniqueConflict(
        error,
        'Já existe uma solicitação com este número nesta loja.',
      );
      throw error;
    }
  }

  async findAll(lojaAtual: loja) {
    return this.prisma.solicitacaoCompra.findMany({
      where: { loja_id: lojaAtual.id },
      orderBy: { criado_em: 'desc' },
      include: {
        itens: true,
        solicitante: {
          select: { id: true, nome_completo: true, email: true },
        },
      },
    });
  }

  async findOne(id: string, lojaAtual: loja) {
    const solicitacao = await this.prisma.solicitacaoCompra.findFirst({
      where: { id, loja_id: lojaAtual.id },
      include: {
        itens: true,
        solicitante: {
          select: { id: true, nome_completo: true, email: true },
        },
      },
    });

    if (!solicitacao) {
      throw new NotFoundException(
        `Solicitação de compra com ID "${id}" não encontrada.`,
      );
    }

    return solicitacao;
  }

  async update(
    id: string,
    dto: UpdateSolicitacaoDto,
    lojaAtual: loja,
    usuarioId: string,
  ) {
    await this.permissions.assertPode(
      usuarioId,
      lojaAtual.id,
      COMPRAS_PERMISSOES.SOLICITACAO_CRIAR,
    );

    const atual = await this.findOne(id, lojaAtual);
    this.assertEditavel(atual.status);

    if (dto.itens) {
      validarItensSolicitacao(dto.itens);
    }

    const itensData = dto.itens
      ? await montarItensSolicitacao(this.prisma, dto.itens, lojaAtual.id)
      : null;

    try {
      // Tenant já confirmado via findOne(loja_id); update por id após findFirst.
      const atualizada = await this.prisma.$transaction(async (tx) => {
        if (itensData) {
          await tx.solicitacaoCompraItem.deleteMany({
            where: { solicitacao_id: id, loja_id: lojaAtual.id },
          });
        }

        return tx.solicitacaoCompra.update({
          where: { id },
          data: {
            ...(dto.prioridade !== undefined
              ? { prioridade: dto.prioridade }
              : {}),
            ...(dto.origem_tipo !== undefined
              ? { origem_tipo: dto.origem_tipo }
              : {}),
            ...(dto.origem_id !== undefined
              ? { origem_id: dto.origem_id }
              : {}),
            ...(dto.justificativa !== undefined
              ? { justificativa: dto.justificativa }
              : {}),
            ...(dto.data_necessaria !== undefined
              ? {
                  data_necessaria: dto.data_necessaria
                    ? new Date(dto.data_necessaria)
                    : null,
                }
              : {}),
            ...(itensData
              ? {
                  itens: {
                    create: itensData,
                  },
                }
              : {}),
          },
          include: { itens: true },
        });
      });

      await this.historicoService.registrar({
        lojaId: lojaAtual.id,
        entidadeTipo: 'SOLICITACAO_COMPRA',
        entidadeId: id,
        acao: 'ATUALIZAR',
        statusAnterior: atual.status,
        statusNovo: atualizada.status,
        usuarioId,
        dados: {
          campos: Object.keys(dto),
        },
      });

      return atualizada;
    } catch (error) {
      rethrowUniqueConflict(error, 'Conflito ao atualizar a solicitação.');
      throw error;
    }
  }

  async enviar(id: string, lojaAtual: loja, usuarioId: string) {
    await this.permissions.assertPode(
      usuarioId,
      lojaAtual.id,
      COMPRAS_PERMISSOES.SOLICITACAO_CRIAR,
    );

    const atual = await this.findOne(id, lojaAtual);
    assertTransicaoSolicitacao('enviar', atual.status);

    if (!atual.itens.length) {
      throw new BadRequestException(
        'Não é possível enviar uma solicitação sem itens.',
      );
    }

    const podeAprovar = await this.permissions.podeAprovarSolicitacao(
      usuarioId,
      lojaAtual.id,
    );

    // enviar → SOLICITADA; caller pode auto-aprovar (D2).
    let statusNovo = statusAlvoSolicitacao('enviar');
    let acaoHistorico: string = 'ENVIAR';

    if (podeAprovar) {
      assertTransicaoSolicitacao('aprovar', statusNovo);
      statusNovo = statusAlvoSolicitacao('aprovar');
      acaoHistorico = 'ENVIAR_AUTO_APROVAR';
    }

    await updateSolicitacaoTenantSafe(this.prisma, id, lojaAtual.id, {
      status: statusNovo,
    });

    await this.historicoService.registrar({
      lojaId: lojaAtual.id,
      entidadeTipo: 'SOLICITACAO_COMPRA',
      entidadeId: id,
      acao: acaoHistorico,
      statusAnterior: atual.status,
      statusNovo,
      usuarioId,
      dados: podeAprovar
        ? {
            permissao: COMPRAS_PERMISSOES.SOLICITACAO_APROVAR,
            politica: 'D2',
          }
        : undefined,
    });

    return this.findOne(id, lojaAtual);
  }

  async aprovar(id: string, lojaAtual: loja, usuarioId: string) {
    await this.permissions.assertPode(
      usuarioId,
      lojaAtual.id,
      COMPRAS_PERMISSOES.SOLICITACAO_APROVAR,
    );

    const atual = await this.findOne(id, lojaAtual);
    assertTransicaoSolicitacao('aprovar', atual.status);

    const statusNovo = statusAlvoSolicitacao('aprovar');
    await updateSolicitacaoTenantSafe(this.prisma, id, lojaAtual.id, {
      status: statusNovo,
    });

    await this.historicoService.registrar({
      lojaId: lojaAtual.id,
      entidadeTipo: 'SOLICITACAO_COMPRA',
      entidadeId: id,
      acao: 'APROVAR',
      statusAnterior: atual.status,
      statusNovo,
      usuarioId,
      dados: { permissao: COMPRAS_PERMISSOES.SOLICITACAO_APROVAR },
    });

    return this.findOne(id, lojaAtual);
  }

  async rejeitar(
    id: string,
    lojaAtual: loja,
    usuarioId: string,
    motivo?: string,
  ) {
    await this.permissions.assertPode(
      usuarioId,
      lojaAtual.id,
      COMPRAS_PERMISSOES.SOLICITACAO_APROVAR,
    );

    const atual = await this.findOne(id, lojaAtual);
    assertTransicaoSolicitacao('rejeitar', atual.status);

    const statusNovo = statusAlvoSolicitacao('rejeitar');
    await updateSolicitacaoTenantSafe(this.prisma, id, lojaAtual.id, {
      status: statusNovo,
    });

    await this.historicoService.registrar({
      lojaId: lojaAtual.id,
      entidadeTipo: 'SOLICITACAO_COMPRA',
      entidadeId: id,
      acao: 'REJEITAR',
      statusAnterior: atual.status,
      statusNovo,
      usuarioId,
      dados: {
        permissao: COMPRAS_PERMISSOES.SOLICITACAO_APROVAR,
        ...(motivo ? { motivo } : {}),
      },
    });

    return this.findOne(id, lojaAtual);
  }

  async devolver(
    id: string,
    lojaAtual: loja,
    usuarioId: string,
    motivo?: string,
  ) {
    await this.permissions.assertPode(
      usuarioId,
      lojaAtual.id,
      COMPRAS_PERMISSOES.SOLICITACAO_APROVAR,
    );

    const atual = await this.findOne(id, lojaAtual);
    assertTransicaoSolicitacao('devolver', atual.status);

    const statusNovo = statusAlvoSolicitacao('devolver');
    await updateSolicitacaoTenantSafe(this.prisma, id, lojaAtual.id, {
      status: statusNovo,
    });

    await this.historicoService.registrar({
      lojaId: lojaAtual.id,
      entidadeTipo: 'SOLICITACAO_COMPRA',
      entidadeId: id,
      acao: 'DEVOLVER',
      statusAnterior: atual.status,
      statusNovo,
      usuarioId,
      dados: {
        permissao: COMPRAS_PERMISSOES.SOLICITACAO_APROVAR,
        ...(motivo ? { motivo } : {}),
      },
    });

    return this.findOne(id, lojaAtual);
  }

  async cancelar(
    id: string,
    lojaAtual: loja,
    usuarioId: string,
    motivo: string,
  ) {
    await this.permissions.assertPode(
      usuarioId,
      lojaAtual.id,
      COMPRAS_PERMISSOES.SOLICITACAO_CRIAR,
    );

    const motivoTrim = motivo?.trim();
    if (!motivoTrim) {
      throw new BadRequestException(
        'motivo é obrigatório para cancelar a solicitação.',
      );
    }

    const atual = await this.findOne(id, lojaAtual);
    assertTransicaoSolicitacao('cancelar', atual.status);

    const statusNovo = statusAlvoSolicitacao('cancelar');
    await updateSolicitacaoTenantSafe(this.prisma, id, lojaAtual.id, {
      status: statusNovo,
    });

    await this.historicoService.registrar({
      lojaId: lojaAtual.id,
      entidadeTipo: 'SOLICITACAO_COMPRA',
      entidadeId: id,
      acao: 'CANCELAR',
      statusAnterior: atual.status,
      statusNovo,
      usuarioId,
      dados: {
        motivo: motivoTrim,
        permissao: COMPRAS_PERMISSOES.SOLICITACAO_CRIAR,
      },
    });

    return this.findOne(id, lojaAtual);
  }

  async historico(id: string, lojaAtual: loja) {
    await this.findOne(id, lojaAtual);
    return this.historicoService.listarPorEntidade(
      lojaAtual.id,
      'SOLICITACAO_COMPRA',
      id,
    );
  }

  private assertEditavel(status: StatusSolicitacaoCompra) {
    if (!STATUS_EDITAVEIS.includes(status)) {
      throw new BadRequestException(
        'Somente solicitações em RASCUNHO ou DEVOLVIDA podem ser editadas.',
      );
    }
  }
}
