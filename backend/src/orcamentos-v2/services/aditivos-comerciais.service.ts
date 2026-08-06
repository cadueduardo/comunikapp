import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { VendasPermissionsService } from '../../vendas/permissions/vendas-permissions.service';
import { VENDAS_PERMISSOES } from '../../vendas/permissions/vendas-permissoes';
import { InstalacaoSplitFinanceiroService } from '../../instalacao/services/instalacao-split-financeiro.service';
import { PrecificarOcorrenciaDto } from '../dto/precificar-ocorrencia.dto';
import { GerarOsAditivaDto } from '../dto/gerar-os-aditiva.dto';

export interface OcorrenciaAditivoItem {
  id: string;
  os_pai_id: string;
  os_numero: string;
  cliente_nome: string;
  tipo: string;
  descricao: string;
  quantidade: number;
  custo_sugerido: number;
  preco_sugerido: number;
  valor_cobrado: number | null;
  status_financeiro: string;
  criado_em: Date;
}

/**
 * Service de Aditivos Comerciais e OS Aditiva (Fase 9).
 *
 * Coloca a decisão comercial de ocorrências em Vendas, reutilizando
 * integralmente o motor de split financeiro (`InstalacaoSplitFinanceiroService`).
 */
@Injectable()
export class AditivosComerciaisService {
  private readonly logger = new Logger(AditivosComerciaisService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly vendasPermissions: VendasPermissionsService,
    private readonly instalacaoSplitService: InstalacaoSplitFinanceiroService,
  ) {}

  /**
   * Lista as ocorrências operacionais elegíveis para aditivo comercial.
   */
  async listarOcorrenciasPendentes(
    lojaId: string,
    usuarioId: string,
  ): Promise<OcorrenciaAditivoItem[]> {
    await this.vendasPermissions.assertPode(
      usuarioId,
      lojaId,
      VENDAS_PERMISSOES.ADITIVO_VER,
    );

    const ocorrencias = await this.prisma.ocorrenciaInstalacao.findMany({
      where: {
        loja_id: lojaId,
        os_aditiva_id: null,
      },
      include: {
        ordem_servico: {
          select: {
            id: true,
            numero: true,
            cliente: { select: { nome: true } },
          },
        },
      },
      orderBy: { criado_em: 'desc' },
    });

    return ocorrencias.map((o) => ({
      id: o.id,
      os_pai_id: o.os_id,
      os_numero: o.ordem_servico?.numero ?? 'N/A',
      cliente_nome: o.ordem_servico?.cliente?.nome ?? 'Cliente não informado',
      tipo: o.tipo,
      descricao: o.descricao ?? 'Sem observações operacionais',
      quantidade: Number(o.quantidade),
      custo_sugerido: Number(o.custo_sugerido ?? 0),
      preco_sugerido: Number(o.preco_sugerido ?? 0),
      valor_cobrado: o.preco_cliente ? Number(o.preco_cliente) : null,
      status_financeiro: o.status_financeiro,
      criado_em: o.criado_em,
    }));
  }

  /**
   * Registra a precificação comercial de uma ocorrência operacional.
   */
  async precificarOcorrencia(
    lojaId: string,
    usuarioId: string,
    dto: PrecificarOcorrenciaDto,
  ) {
    await this.vendasPermissions.assertPode(
      usuarioId,
      lojaId,
      VENDAS_PERMISSOES.ADITIVO_PRECIFICAR,
    );

    const ocorrencia = await this.prisma.ocorrenciaInstalacao.findFirst({
      where: { id: dto.ocorrencia_id, loja_id: lojaId },
    });

    if (!ocorrencia) {
      throw new NotFoundException('Ocorrência operacional não encontrada.');
    }

    if (ocorrencia.os_aditiva_id) {
      throw new BadRequestException('Esta ocorrência já pertence a uma OS Aditiva existente.');
    }

    if (dto.valor_cobrado === 0) {
      // Abono exige permissão de gestor comercial
      await this.vendasPermissions.assertPode(
        usuarioId,
        lojaId,
        VENDAS_PERMISSOES.ALCADA_APROVAR,
      );

      return await this.instalacaoSplitService.abonarOcorrencia(
        dto.ocorrencia_id,
        lojaId,
        usuarioId,
        {
          versao: ocorrencia.versao,
          observacao_gestor: dto.justificativa ?? 'Abonado pelo Gestor Comercial',
        },
      );
    }

    const custoInterno = Number(ocorrencia.custo_sugerido ?? 0);

    return await this.instalacaoSplitService.precificarOcorrencia(
      dto.ocorrencia_id,
      lojaId,
      usuarioId,
      {
        custo_interno: custoInterno,
        preco_cliente: dto.valor_cobrado,
        versao: ocorrencia.versao,
        observacao_gestor: dto.justificativa,
      },
    );
  }

  /**
   * Consolida ocorrências precificadas e gera a OS Aditiva e Cobrança comercial.
   */
  async gerarOsAditiva(
    lojaId: string,
    usuarioId: string,
    dto: GerarOsAditivaDto,
  ) {
    await this.vendasPermissions.assertPode(
      usuarioId,
      lojaId,
      VENDAS_PERMISSOES.ADITIVO_GERAR_OS,
    );

    const resultado = await this.instalacaoSplitService.gerarOsAditiva(
      dto.os_pai_id,
      lojaId,
      usuarioId,
      dto.ocorrencia_ids,
    );

    this.logger.log(
      `OS Aditiva ${resultado.os_aditiva_numero} gerada com sucesso para a OS pai ${dto.os_pai_id}`
    );

    return resultado;
  }
}
