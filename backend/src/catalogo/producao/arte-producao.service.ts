import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ModoFulfillmentItem, ModoPersonalizacao } from '@prisma/client';
import type { Response } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { EstampaArteMestraService } from '../estampas/estampa-arte-mestra.service';
import {
  ARTE_PRODUCAO_LOG_FALHA,
  ARTE_PRODUCAO_LOG_SUCESSO,
} from './arte-producao.constants';
import { ProducaoStorageUtil } from './producao-storage.util';
import { VdpPdfMergeProvider } from './vdp-pdf-merge.provider';
import {
  normalizarRegistrosVdp,
  resolverAncorasComChaves,
} from './vdp-valores.util';

@Injectable()
export class ArteProducaoService {
  private readonly logger = new Logger(ArteProducaoService.name);
  private readonly storage = new ProducaoStorageUtil();

  constructor(
    private readonly prisma: PrismaService,
    private readonly estampaArteMestraService: EstampaArteMestraService,
    private readonly mergeProvider: VdpPdfMergeProvider,
  ) {}

  /**
   * Dispara geração assíncrona (não bloqueia criação da OS).
   */
  agendarGeracaoItemOS(
    itemOsId: string,
    lojaId: string,
    usuarioId?: string,
  ): void {
    setImmediate(() => {
      this.gerarArteProducaoItemOS(itemOsId, lojaId, usuarioId).catch(
        (error) => {
          this.logger.error(
            `Falha assíncrona na arte de produção do item ${itemOsId}: ${(error as Error).message}`,
          );
        },
      );
    });
  }

  async gerarArteProducaoItemOS(
    itemOsId: string,
    lojaId: string,
    usuarioId?: string,
  ): Promise<string> {
    const item = await this.prisma.itemOS.findFirst({
      where: {
        id: itemOsId,
        os: { loja_id: lojaId },
      },
      include: {
        os: { select: { id: true, loja_id: true, numero: true } },
        estampa: {
          include: {
            conjunto_campos: {
              include: { campos: true },
            },
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Item da OS não encontrado para esta loja.');
    }

    if (
      item.modo_fulfillment !== ModoFulfillmentItem.MAKE &&
      item.modo_fulfillment !== ModoFulfillmentItem.HIBRIDO
    ) {
      throw new BadRequestException(
        'Item não requer arte de produção (modo de fulfillment é separação direta).',
      );
    }

    if (!item.valores_personalizacao) {
      throw new BadRequestException(
        'Item sem dados de personalização para consolidar.',
      );
    }

    const quantidade = Math.max(Number(item.quantidade) || 1, 1);
    let caminhoParcial: string | null = null;
    const tokenAnterior =
      this.storage.extrairTokenDaUrl(item.arte_producao_url) ?? null;

    try {
      const registros = normalizarRegistrosVdp(
        item.valores_personalizacao,
        quantidade,
      );

      if (!registros.length) {
        throw new BadRequestException(
          'Nenhum registro VDP válido para gerar arte de produção.',
        );
      }

      let ancoras = [] as ReturnType<typeof resolverAncorasComChaves>;
      let arteMestraBytes: Buffer | null = null;
      let arteMestraMime: string | null = null;
      let tituloFallback: string | undefined;

      if (
        item.personalizacao_modo === ModoPersonalizacao.ESTAMPA &&
        item.estampa
      ) {
        ancoras = resolverAncorasComChaves(
          item.estampa.metadados,
          item.estampa.conjunto_campos?.campos ?? [],
        );

        const tokenMestra = this.extrairTokenArteMestra(
          item.estampa.arte_mestra_url,
        );
        if (tokenMestra) {
          const mestra =
            await this.estampaArteMestraService.obterConteudoArteMestra(
              tokenMestra,
              lojaId,
            );
          arteMestraBytes = mestra.buffer;
          arteMestraMime = mestra.mime_type;
        }

        tituloFallback = item.estampa.nome;
      } else if (
        item.personalizacao_modo === ModoPersonalizacao.IMPRINT_LIVRE
      ) {
        tituloFallback = 'Personalização livre';
      } else {
        throw new BadRequestException(
          'Modo de personalização não suportado para arte de produção VDP.',
        );
      }

      const pdfBytes = await this.mergeProvider.gerarPdfMultipaginas({
        registros,
        ancoras,
        arteMestraBytes,
        arteMestraMime,
        tituloFallback,
      });

      const { urlRelativa, meta } = await this.storage.persistirArquivo({
        lojaId,
        itemOsId,
        conteudo: pdfBytes,
        loteTamanho: registros.length,
      });

      caminhoParcial = this.storage.resolverCaminhoSeguro(
        lojaId,
        meta.nome_fisico,
      );

      await this.prisma.itemOS.updateMany({
        where: { id: itemOsId, os: { loja_id: lojaId } },
        data: {
          arte_producao_url: urlRelativa,
          status_arte: 'APROVADA',
        },
      });

      if (tokenAnterior && tokenAnterior !== meta.token) {
        await this.storage.removerArquivosPorToken(tokenAnterior, lojaId);
      }

      await this.prisma.ordemServicoLog.create({
        data: {
          os_id: item.os_id,
          tipo_acao: ARTE_PRODUCAO_LOG_SUCESSO,
          descricao:
            `Arte de produção consolidada para o item "${item.produto_servico}" ` +
            `(${registros.length} página(s)). Hash SHA-256: ${meta.hash_sha256}.`,
          usuario_id: usuarioId ?? null,
          dados_extras: JSON.stringify({
            item_os_id: itemOsId,
            lote_tamanho: registros.length,
            hash_sha256: meta.hash_sha256,
            arte_producao_url: urlRelativa,
            imutavel: true,
          }),
        },
      });

      this.logger.log(
        `Arte de produção gerada: item=${itemOsId} páginas=${registros.length} hash=${meta.hash_sha256}`,
      );

      return urlRelativa;
    } catch (error) {
      await this.storage.removerArquivoParcial(caminhoParcial);

      await this.prisma.ordemServicoLog.create({
        data: {
          os_id: item.os_id,
          tipo_acao: ARTE_PRODUCAO_LOG_FALHA,
          descricao:
            `Falha ao consolidar arte de produção do item "${item.produto_servico}": ` +
            `${(error as Error).message}`,
          usuario_id: usuarioId ?? null,
          dados_extras: JSON.stringify({
            item_os_id: itemOsId,
            erro: (error as Error).message,
          }),
        },
      });

      await this.prisma.itemOS.updateMany({
        where: { id: itemOsId, os: { loja_id: lojaId } },
        data: { status_arte: 'ERRO_PRODUCAO' },
      });

      throw error;
    }
  }

  async servirArteProducaoItemOS(
    itemOsId: string,
    lojaId: string,
    res: Response,
  ): Promise<void> {
    const item = await this.prisma.itemOS.findFirst({
      where: {
        id: itemOsId,
        os: { loja_id: lojaId },
      },
      select: {
        arte_producao_url: true,
        produto_servico: true,
      },
    });

    if (!item?.arte_producao_url) {
      throw new NotFoundException(
        'Este item ainda não possui arte de produção consolidada.',
      );
    }

    const token = this.storage.extrairTokenDaUrl(item.arte_producao_url);
    if (!token) {
      throw new NotFoundException('Referência de arte de produção inválida.');
    }

    const meta = await this.storage.carregarMeta(token, lojaId);
    if (meta.item_os_id !== itemOsId) {
      throw new NotFoundException('Arte de produção não encontrada.');
    }

    await this.storage.servirArquivo(
      token,
      lojaId,
      res,
      `arte-producao-${itemOsId}.pdf`,
    );
  }

  private extrairTokenArteMestra(
    url: string | null | undefined,
  ): string | null {
    if (!url) return null;
    const partes = url.split('/');
    return partes[partes.length - 1] || null;
  }
}
