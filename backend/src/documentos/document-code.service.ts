import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

const DOCUMENTO_ORCAMENTO = 'ORC';
const PADRAO_NUMERO = 3;

interface GerarCodigoParams {
  tipoDocumento: string;
  lojaId: string;
  ano?: number;
}

@Injectable()
export class DocumentCodeService {
  private readonly logger = new Logger(DocumentCodeService.name);

  constructor(private readonly prisma: PrismaService) {}

  async gerarCodigoOrcamento(lojaId: string, ano?: number): Promise<string> {
    return this.gerarCodigo({
      tipoDocumento: DOCUMENTO_ORCAMENTO,
      lojaId,
      ano,
    });
  }

  private async gerarCodigo({
    tipoDocumento,
    lojaId,
    ano,
  }: GerarCodigoParams): Promise<string> {
    const anoReferencia = ano ?? new Date().getFullYear();

    const sequence = await this.prisma.$transaction((tx) =>
      tx.document_sequence.upsert({
        where: {
          loja_id_tipo_ano: {
            loja_id: lojaId,
            tipo: tipoDocumento,
            ano: anoReferencia,
          },
        },
        update: {
          ultimo_numero: {
            increment: 1,
          },
        },
        create: {
          loja_id: lojaId,
          tipo: tipoDocumento,
          ano: anoReferencia,
          ultimo_numero: 1,
        },
      }),
    );

    const numeroSequencial = sequence.ultimo_numero;
    const codigo = `${tipoDocumento}-${anoReferencia}-${numeroSequencial
      .toString()
      .padStart(PADRAO_NUMERO, '0')}`;

    this.logger.debug(
      `Codigo ${codigo} gerado para ${tipoDocumento} (loja: ${lojaId})`,
    );

    return codigo;
  }
}

