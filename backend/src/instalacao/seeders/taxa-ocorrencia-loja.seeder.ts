import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TAXAS_OCORRENCIA_PADRAO } from '../constants/taxa-ocorrencia.defaults';

export interface ResultadoSeedTaxasOcorrencia {
  loja_id: string;
  criadas: string[];
  ignoradas: string[];
}

/**
 * Popula taxas padrão de ocorrências de instalação por loja.
 * Operação idempotente: não sobrescreve taxas já existentes.
 */
@Injectable()
export class TaxaOcorrenciaLojaSeeder {
  private readonly logger = new Logger(TaxaOcorrenciaLojaSeeder.name);

  constructor(private readonly prisma: PrismaService) {}

  async seed(lojaId: string): Promise<ResultadoSeedTaxasOcorrencia> {
    const criadas: string[] = [];
    const ignoradas: string[] = [];

    for (const taxa of TAXAS_OCORRENCIA_PADRAO) {
      const existente = await this.prisma.taxaOcorrenciaLoja.findUnique({
        where: {
          loja_id_tipo: {
            loja_id: lojaId,
            tipo: taxa.tipo,
          },
        },
        select: { id: true },
      });

      if (existente) {
        ignoradas.push(taxa.tipo);
        continue;
      }

      await this.prisma.taxaOcorrenciaLoja.create({
        data: {
          loja_id: lojaId,
          tipo: taxa.tipo,
          custo_padrao: new Prisma.Decimal(taxa.custo_padrao),
          preco_padrao: new Prisma.Decimal(taxa.preco_padrao),
        },
      });

      criadas.push(taxa.tipo);
    }

    if (criadas.length > 0) {
      this.logger.log(
        `Taxas de ocorrência criadas para loja ${lojaId}: ${criadas.join(', ')}`,
      );
    }

    return { loja_id: lojaId, criadas, ignoradas };
  }
}
