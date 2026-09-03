import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, usuario_funcao } from '@prisma/client';
import { IdentidadeAutenticada } from '../../auth/decorators';
import { PrismaService } from '../../prisma/prisma.service';
import { VendasPermissionsService } from '../permissions/vendas-permissions.service';
import { VENDAS_PERMISSOES } from '../permissions/vendas-permissoes';

/** Fonte compartilhada do recorte de carteira usado pelas superfícies de Vendas. */
@Injectable()
export class VendasCarteiraEscopoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissoes: VendasPermissionsService,
  ) {}

  async whereCliente(
    identidade: IdentidadeAutenticada,
    opcoes?: { incluirSemResponsavel?: boolean },
  ): Promise<Prisma.clienteWhereInput> {
    const { usuarioId, lojaId } = identidade;
    const incluirSemResponsavel = opcoes?.incluirSemResponsavel !== false;
    const [todos, equipe, propria, semResponsavel] = await Promise.all([
      this.permissoes.pode(usuarioId, lojaId, VENDAS_PERMISSOES.CARTEIRA_VER_TODOS),
      this.permissoes.pode(usuarioId, lojaId, VENDAS_PERMISSOES.CARTEIRA_VER_EQUIPE),
      this.permissoes.pode(usuarioId, lojaId, VENDAS_PERMISSOES.CARTEIRA_VER_PROPRIA),
      this.permissoes.pode(
        usuarioId,
        lojaId,
        VENDAS_PERMISSOES.CARTEIRA_VER_SEM_RESPONSAVEL,
      ),
    ]);

    if (todos) return { loja_id: lojaId };

    const alternativas: Prisma.clienteWhereInput[] = [];
    if (equipe) {
      const equipeIds = await this.prisma.usuario.findMany({
        where: {
          loja_id: lojaId,
          ativo: true,
          status: 'ATIVO',
          funcao: usuario_funcao.VENDAS,
        },
        select: { id: true },
      });
      const ids = equipeIds.map((usuario) => usuario.id);
      alternativas.push(
        { responsavel_comercial_id: { in: ids } },
        { participantes: { some: { usuario_id: { in: ids } } } },
      );
    } else if (propria) {
      alternativas.push(
        { responsavel_comercial_id: usuarioId },
        { participantes: { some: { usuario_id: usuarioId } } },
      );
    }
    if (incluirSemResponsavel && semResponsavel) {
      alternativas.push({ responsavel_comercial_id: null });
    }

    // Sem qualquer escopo, nenhuma consulta pode degradar para a loja inteira.
    return alternativas.length > 0
      ? { loja_id: lojaId, OR: alternativas }
      : { loja_id: lojaId, id: '__escopo_negado__' };
  }

  async assertClienteAcessivel(
    identidade: IdentidadeAutenticada,
    clienteId: string,
  ): Promise<void> {
    const escopo = await this.whereCliente(identidade);
    const cliente = await this.prisma.cliente.findFirst({
      where: { AND: [escopo, { id: clienteId }] },
      select: { id: true },
    });
    if (!cliente) throw new NotFoundException('Cliente não encontrado.');
  }

  async whereOrcamento(
    identidade: IdentidadeAutenticada,
  ): Promise<Prisma.orcamentoWhereInput> {
    const { usuarioId, lojaId } = identidade;
    const [todos, propria, semResponsavel] = await Promise.all([
      this.permissoes.pode(usuarioId, lojaId, VENDAS_PERMISSOES.CARTEIRA_VER_TODOS),
      this.permissoes.pode(usuarioId, lojaId, VENDAS_PERMISSOES.CARTEIRA_VER_PROPRIA),
      this.permissoes.pode(
        usuarioId,
        lojaId,
        VENDAS_PERMISSOES.CARTEIRA_VER_SEM_RESPONSAVEL,
      ),
    ]);

    if (todos) {
      return { loja_id: lojaId };
    }

    // Carteira de clientes sem o bolo de contas sem responsável: esse recorte
    // é da ficha de cliente, não da fila de orçamentos sem dono.
    const clienteCarteira = await this.whereCliente(identidade, {
      incluirSemResponsavel: false,
    });
    const clienteNegado =
      'id' in clienteCarteira && clienteCarteira.id === '__escopo_negado__';

    const alternativas: Prisma.orcamentoWhereInput[] = [];
    if (!clienteNegado) {
      alternativas.push({ cliente: { is: clienteCarteira } });
    }
    if (propria) {
      alternativas.push({ responsavel_id: usuarioId });
    }
    if (semResponsavel) {
      alternativas.push({ responsavel_id: null });
    }

    return alternativas.length > 0
      ? { loja_id: lojaId, OR: alternativas }
      : { loja_id: lojaId, id: '__escopo_negado__' };
  }

  async assertOrcamentoAcessivel(
    identidade: IdentidadeAutenticada,
    orcamentoId: string,
  ): Promise<void> {
    const escopo = await this.whereOrcamento(identidade);
    const orcamento = await this.prisma.orcamento.findFirst({
      where: { AND: [escopo, { id: orcamentoId, loja_id: identidade.lojaId }] },
      select: { id: true },
    });
    if (!orcamento) throw new NotFoundException('Orçamento não encontrado.');
  }
}
