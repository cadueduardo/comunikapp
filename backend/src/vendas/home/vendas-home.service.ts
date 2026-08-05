import { Injectable } from '@nestjs/common';
import { IdentidadeAutenticada } from '../../auth/decorators';
import { PrismaService } from '../../prisma/prisma.service';
import { VendasPermissionsService } from '../permissions/vendas-permissions.service';
import { VENDAS_PERMISSOES } from '../permissions/vendas-permissoes';
import { limitesDiaOperacional } from '../timezone/vendas-timezone';
import { VendasCarteiraEscopoService } from '../carteira/vendas-carteira-escopo.service';

@Injectable()
export class VendasHomeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vendasPermissions: VendasPermissionsService,
    private readonly carteiraEscopo: VendasCarteiraEscopoService,
  ) {}

  async obter(identidade: IdentidadeAutenticada) {
    await this.vendasPermissions.assertPode(
      identidade.usuarioId,
      identidade.lojaId,
      VENDAS_PERMISSOES.ATIVIDADE_VER_PROPRIA,
    );

    const verEquipe = await this.vendasPermissions.pode(
      identidade.usuarioId,
      identidade.lojaId,
      VENDAS_PERMISSOES.ATIVIDADE_VER_EQUIPE,
    );

    const { inicioUtc, fimUtc } = limitesDiaOperacional();
    const escopoResponsavel = verEquipe
      ? {}
      : { responsavel_id: identidade.usuarioId };

    const whereBase = {
      loja_id: identidade.lojaId,
      concluida_em: null as null,
      ...escopoResponsavel,
    };

    const [vencidas, hoje, proximas, propostasAguardando, kpis, mensagens] =
      await Promise.all([
        this.prisma.atividade_comercial.findMany({
          where: { ...whereBase, prazo: { lt: inicioUtc } },
          orderBy: [{ prazo: 'asc' }, { criado_em: 'asc' }, { id: 'asc' }],
          take: 5,
          select: {
            id: true,
            titulo: true,
            tipo: true,
            prazo: true,
            responsavel_id: true,
            cliente_id: true,
          },
        }),
        this.prisma.atividade_comercial.findMany({
          where: {
            ...whereBase,
            prazo: { gte: inicioUtc, lte: fimUtc },
          },
          orderBy: [{ prazo: 'asc' }, { criado_em: 'asc' }, { id: 'asc' }],
          take: 5,
          select: {
            id: true,
            titulo: true,
            tipo: true,
            prazo: true,
            responsavel_id: true,
            cliente_id: true,
          },
        }),
        this.prisma.atividade_comercial.findMany({
          where: { ...whereBase, prazo: { gt: fimUtc } },
          orderBy: [{ prazo: 'asc' }, { criado_em: 'asc' }, { id: 'asc' }],
          take: 5,
          select: {
            id: true,
            titulo: true,
            tipo: true,
            prazo: true,
            responsavel_id: true,
            cliente_id: true,
          },
        }),
        this.carregarPropostasAguardando(identidade),
        this.carregarKpis(identidade, inicioUtc, fimUtc),
        this.carregarMensagens(identidade),
      ]);

    const mapItem = (a: {
      id: string;
      titulo: string;
      tipo: string;
      prazo: Date;
      responsavel_id: string;
      cliente_id: string | null;
    }) => ({
      id: a.id,
      titulo: a.titulo,
      tipo: a.tipo,
      prazo: a.prazo.toISOString(),
      responsavel_id: a.responsavel_id,
      cliente_id: a.cliente_id,
    });

    return {
      prioridades: {
        vencidas: vencidas.map(mapItem),
        hoje: hoje.map(mapItem),
        proximas: proximas.map(mapItem),
      },
      propostas_aguardando: propostasAguardando,
      kpis,
      mensagens_nao_lidas: mensagens,
      links: {
        atividades: '/vendas/atividades',
        atendimento: '/vendas/atendimento',
        carteira: '/vendas/carteira',
      },
    };
  }

  private async carregarPropostasAguardando(identidade: IdentidadeAutenticada) {
    try {
      const pode = await this.vendasPermissions.pode(
        identidade.usuarioId,
        identidade.lojaId,
        VENDAS_PERMISSOES.PROPOSTA_VER,
      );
      if (!pode) {
        return { disponivel: false as const, items: [] };
      }
      const escopo = await this.carteiraEscopo.whereOrcamento(identidade);
      const rows = await this.prisma.orcamento.findMany({
        where: {
          ...escopo,
          status_comercial: { in: ['enviada', 'em_negociacao'] },
        },
        orderBy: { atualizado_em: 'desc' },
        take: 5,
        select: {
          id: true,
          numero: true,
          nome_servico: true,
          status_comercial: true,
          enviado_em: true,
        },
      });
      return {
        disponivel: true as const,
        items: rows.map((r) => ({
          id: r.id,
          numero: r.numero,
          nome: r.nome_servico,
          status_comercial: r.status_comercial,
          enviado_em: r.enviado_em?.toISOString() ?? null,
        })),
      };
    } catch {
      return { disponivel: false as const, items: [] };
    }
  }

  private async carregarKpis(
    identidade: IdentidadeAutenticada,
    inicioUtc: Date,
    fimUtc: Date,
  ) {
    try {
      const pode = await this.vendasPermissions.pode(
        identidade.usuarioId,
        identidade.lojaId,
        VENDAS_PERMISSOES.PROPOSTA_VER,
      );
      if (!pode) {
        return {
          disponivel: false as const,
          enviadas_periodo: null,
          aguardando_cliente: null,
          aprovadas_periodo: null,
        };
      }

      const periodoInicio = new Date(inicioUtc);
      periodoInicio.setUTCDate(periodoInicio.getUTCDate() - 30);
      const escopo = await this.carteiraEscopo.whereOrcamento(identidade);

      const [enviadas, aguardando, aprovadas] = await Promise.all([
        this.prisma.orcamento.count({
          where: {
            ...escopo,
            enviado_em: { gte: periodoInicio, lte: fimUtc },
          },
        }),
        this.prisma.orcamento.count({
          where: {
            ...escopo,
            status_comercial: { in: ['enviada', 'em_negociacao'] },
          },
        }),
        this.prisma.orcamento.count({
          where: {
            ...escopo,
            aceito_em: { gte: periodoInicio, lte: fimUtc },
          },
        }),
      ]);

      return {
        disponivel: true as const,
        enviadas_periodo: enviadas,
        aguardando_cliente: aguardando,
        aprovadas_periodo: aprovadas,
      };
    } catch {
      return {
        disponivel: false as const,
        enviadas_periodo: null,
        aguardando_cliente: null,
        aprovadas_periodo: null,
      };
    }
  }

  private async carregarMensagens(identidade: IdentidadeAutenticada) {
    try {
      const escopo = await this.carteiraEscopo.whereOrcamento(identidade);
      const count = await this.prisma.mensagemChat.count({
        where: {
          lida: false,
          orcamento: { is: escopo },
        },
      });
      return { disponivel: true as const, total: count };
    } catch {
      return { disponivel: false as const, total: null };
    }
  }
}
