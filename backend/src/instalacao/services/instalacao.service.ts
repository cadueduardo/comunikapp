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
  categoria?: CategoriaOcorrencia;
  quantidade?: number;
  descricao: string;
  fotosEvidencia?: string[];
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
        fotos_evidencia:
          input.fotosEvidencia && input.fotosEvidencia.length > 0
            ? input.fotosEvidencia
            : undefined,
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

  async listarLotesGestao(lojaId: string) {
    return this.prisma.itemOSInstalacao.findMany({
      where: { loja_id: lojaId },
      orderBy: [{ data_previsao: 'asc' }, { criado_em: 'desc' }],
      select: {
        id: true,
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
        atualizado_em: true,
        item_os: {
          select: {
            produto_servico: true,
            os: {
              select: {
                id: true,
                numero: true,
                nome_servico: true,
                cliente: { select: { nome: true } },
              },
            },
          },
        },
      },
    });
  }

  async obterPainelOs(lojaId: string, osId: string) {
    const os = await this.prisma.ordemServico.findFirst({
      where: { id: osId, loja_id: lojaId },
      select: {
        id: true,
        numero: true,
        nome_servico: true,
        cliente: { select: { nome: true } },
      },
    });

    if (!os) {
      throw new NotFoundException('Ordem de serviço não encontrada.');
    }

    const lotes = await this.prisma.itemOSInstalacao.findMany({
      where: {
        loja_id: lojaId,
        item_os: { os_id: osId },
      },
      orderBy: { criado_em: 'asc' },
      select: {
        id: true,
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
        atualizado_em: true,
        item_os: { select: { produto_servico: true } },
      },
    });

    const ocorrencias = await this.prisma.ocorrenciaInstalacao.findMany({
      where: { loja_id: lojaId, os_id: osId },
      orderBy: { criado_em: 'desc' },
      select: {
        id: true,
        tipo: true,
        categoria: true,
        quantidade: true,
        custo_interno: true,
        preco_cliente: true,
        descricao: true,
        fotos_evidencia: true,
        criado_em: true,
        item_instalacao: {
          select: { id: true, logradouro: true, numero: true },
        },
      },
    });

    return {
      os: {
        ...os,
        cliente_nome: os.cliente?.nome ?? null,
      },
      lotes: lotes.map((lote) => ({
        ...lote,
        fotos_evidencia: this.normalizarFotos(lote.fotos_evidencia),
      })),
      ocorrencias: ocorrencias.map((occ) => ({
        ...occ,
        quantidade: Number(occ.quantidade),
        custo_interno: Number(occ.custo_interno),
        preco_cliente: Number(occ.preco_cliente),
        fotos_evidencia: this.normalizarFotos(occ.fotos_evidencia),
      })),
    };
  }

  async atualizarEnderecoLote(
    lojaId: string,
    loteId: string,
    dados: {
      cep?: string;
      logradouro: string;
      numero: string;
      complemento?: string;
      bairro: string;
      cidade: string;
      uf: string;
      quantidade_alocada?: number;
    },
  ) {
    const lote = await this.prisma.itemOSInstalacao.findFirst({
      where: { id: loteId, loja_id: lojaId },
      select: { id: true, status_instalacao: true },
    });

    if (!lote) {
      throw new NotFoundException('Lote de instalação não encontrado.');
    }

    if (lote.status_instalacao === StatusInstalacao.CONCLUIDO) {
      throw new BadRequestException(
        'Lotes concluídos não podem ter o endereço alterado.',
      );
    }

    return this.prisma.itemOSInstalacao.update({
      where: { id: loteId },
      data: {
        cep: dados.cep?.replace(/\D/g, '') || null,
        logradouro: dados.logradouro.trim(),
        numero: dados.numero.trim(),
        complemento: dados.complemento?.trim() || null,
        bairro: dados.bairro.trim(),
        cidade: dados.cidade.trim(),
        uf: dados.uf.trim().toUpperCase().slice(0, 2),
        ...(dados.quantidade_alocada != null
          ? { quantidade_alocada: dados.quantidade_alocada }
          : {}),
      },
      select: {
        id: true,
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
        atualizado_em: true,
      },
    });
  }

  private normalizarFotos(valor: unknown): string[] {
    if (!Array.isArray(valor)) return [];
    return valor.filter((item): item is string => typeof item === 'string');
  }
}
