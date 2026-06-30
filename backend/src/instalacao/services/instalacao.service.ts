import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  CategoriaOcorrencia,
  Prisma,
  StatusInstalacao,
  TipoOcorrencia,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { sanitizarTextoCampo } from '../utils/sanitizar-texto.util';

export interface RegistrarOcorrenciaObraInput {
  lojaId: string;
  osId: string;
  itemInstalacaoId?: string;
  tipo: TipoOcorrencia;
  categoria: CategoriaOcorrencia;
  quantidade?: number;
  descricao: string;
}

export interface OcorrenciaObraRespostaInstalador {
  id: string;
  tipo: TipoOcorrencia;
  categoria: CategoriaOcorrencia;
  quantidade: number;
  descricao: string;
  criado_em: Date;
}

const CATEGORIA_POR_TIPO: Record<TipoOcorrencia, CategoriaOcorrencia> = {
  VISITA_IMPRODUTIVA: CategoriaOcorrencia.INSTALACAO,
  MATERIAL_EXTRA: CategoriaOcorrencia.PRODUCAO,
  SERVICO_ADICIONAL: CategoriaOcorrencia.INSTALACAO,
  RETRABALHO: CategoriaOcorrencia.PRODUCAO,
};

@Injectable()
export class InstalacaoService {
  private readonly logger = new Logger(InstalacaoService.name);

  constructor(private readonly prisma: PrismaService) {}

  async listarLotesPendentesInstalador(lojaId: string) {
    return this.prisma.itemOSInstalacao.findMany({
      where: {
        loja_id: lojaId,
        status_instalacao: {
          in: [StatusInstalacao.AGUARDANDO, StatusInstalacao.EM_ANDAMENTO],
        },
      },
      orderBy: [{ data_previsao: 'asc' }, { criado_em: 'asc' }],
      select: {
        id: true,
        item_os_id: true,
        cep: true,
        logradouro: true,
        numero: true,
        complemento: true,
        bairro: true,
        cidade: true,
        uf: true,
        quantidade_alocada: true,
        status_instalacao: true,
        data_previsao: true,
        data_execucao: true,
        fotos_evidencia: true,
        assinatura_url: true,
        criado_em: true,
        item_os: {
          select: {
            produto_servico: true,
            os: {
              select: {
                id: true,
                numero: true,
                nome_servico: true,
              },
            },
          },
        },
      },
    });
  }

  async obterLoteInstalador(lojaId: string, loteId: string) {
    const lote = await this.prisma.itemOSInstalacao.findFirst({
      where: { id: loteId, loja_id: lojaId },
      select: {
        id: true,
        item_os_id: true,
        cep: true,
        logradouro: true,
        numero: true,
        complemento: true,
        bairro: true,
        cidade: true,
        uf: true,
        quantidade_alocada: true,
        status_instalacao: true,
        data_previsao: true,
        data_execucao: true,
        fotos_evidencia: true,
        assinatura_url: true,
        criado_em: true,
        item_os: {
          select: {
            produto_servico: true,
            os: {
              select: {
                id: true,
                numero: true,
                nome_servico: true,
              },
            },
          },
        },
        ocorrencias: {
          orderBy: { criado_em: 'desc' },
          select: {
            id: true,
            tipo: true,
            categoria: true,
            quantidade: true,
            descricao: true,
            criado_em: true,
          },
        },
      },
    });

    if (!lote) {
      throw new NotFoundException('Lote de instalação não encontrado.');
    }

    return lote;
  }

  async iniciarLote(lojaId: string, loteId: string) {
    const lote = await this.obterLoteInstalador(lojaId, loteId);

    if (lote.status_instalacao !== StatusInstalacao.AGUARDANDO) {
      throw new BadRequestException(
        'Somente lotes aguardando podem ser iniciados.',
      );
    }

    return this.prisma.itemOSInstalacao.update({
      where: { id: loteId },
      data: {
        status_instalacao: StatusInstalacao.EM_ANDAMENTO,
        data_execucao: new Date(),
      },
      select: {
        id: true,
        status_instalacao: true,
        data_execucao: true,
      },
    });
  }

  async concluirLote(
    lojaId: string,
    loteId: string,
    dados: {
      fotos_evidencia?: string[];
      assinatura_url?: string;
    },
  ) {
    const lote = await this.obterLoteInstalador(lojaId, loteId);

    if (lote.status_instalacao !== StatusInstalacao.EM_ANDAMENTO) {
      throw new BadRequestException(
        'O lote precisa estar em andamento para ser concluído.',
      );
    }

    return this.prisma.itemOSInstalacao.update({
      where: { id: loteId },
      data: {
        status_instalacao: StatusInstalacao.CONCLUIDO,
        fotos_evidencia: dados.fotos_evidencia ?? undefined,
        assinatura_url: dados.assinatura_url ?? null,
        data_execucao: new Date(),
      },
      select: {
        id: true,
        status_instalacao: true,
        fotos_evidencia: true,
        assinatura_url: true,
        data_execucao: true,
      },
    });
  }

  /**
   * Registra ocorrência de obra com custos financeiros calculados no backend.
   */
  async registrarOcorrenciaObra(
    input: RegistrarOcorrenciaObraInput,
  ): Promise<OcorrenciaObraRespostaInstalador> {
    const descricao = sanitizarTextoCampo(input.descricao);
    if (!descricao) {
      throw new BadRequestException('Descrição da ocorrência é obrigatória.');
    }

    const os = await this.prisma.ordemServico.findFirst({
      where: { id: input.osId, loja_id: input.lojaId },
      select: { id: true },
    });

    if (!os) {
      throw new NotFoundException('Ordem de serviço não encontrada.');
    }

    if (input.itemInstalacaoId) {
      const lote = await this.prisma.itemOSInstalacao.findFirst({
        where: {
          id: input.itemInstalacaoId,
          loja_id: input.lojaId,
          item_os: { os_id: input.osId },
        },
        select: { id: true },
      });

      if (!lote) {
        throw new NotFoundException(
          'Lote de instalação não encontrado para esta OS.',
        );
      }
    }

    const taxa = await this.prisma.taxaOcorrenciaLoja.findUnique({
      where: {
        loja_id_tipo: {
          loja_id: input.lojaId,
          tipo: input.tipo,
        },
      },
    });

    const quantidade = input.quantidade ?? 1;
    const custoUnitario = Number(taxa?.custo_padrao ?? 0);
    const precoUnitario = Number(taxa?.preco_padrao ?? 0);
    const categoria =
      input.categoria ??
      CATEGORIA_POR_TIPO[input.tipo] ??
      CategoriaOcorrencia.INSTALACAO;

    const ocorrencia = await this.prisma.ocorrenciaInstalacao.create({
      data: {
        loja_id: input.lojaId,
        os_id: input.osId,
        item_instalacao_id: input.itemInstalacaoId ?? null,
        tipo: input.tipo,
        categoria,
        quantidade: new Prisma.Decimal(quantidade),
        custo_interno: new Prisma.Decimal(custoUnitario * quantidade),
        preco_cliente: new Prisma.Decimal(precoUnitario * quantidade),
        descricao,
      },
      select: {
        id: true,
        tipo: true,
        categoria: true,
        quantidade: true,
        descricao: true,
        criado_em: true,
      },
    });

    this.logger.log(
      `Ocorrência ${ocorrencia.id} registrada (${input.tipo}) — OS ${input.osId}`,
    );

    return {
      ...ocorrencia,
      quantidade: Number(ocorrencia.quantidade),
    };
  }
}
