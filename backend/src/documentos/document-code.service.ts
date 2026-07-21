import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

const DOCUMENTO_ORCAMENTO = 'ORC';
const DOCUMENTO_OS = 'OS';
const DOCUMENTO_OS_INTERNA = 'OSI';
const DOCUMENTO_NOTA_FISCAL = 'NF';
const DOCUMENTO_SOLICITACAO_COMPRA = 'SC';
const DOCUMENTO_PEDIDO_COMPRA = 'PC';
const DOCUMENTO_RECEBIMENTO_COMPRA = 'RC';
const DOCUMENTO_ACEITE_SERVICO = 'AS';
const PADRAO_NUMERO = 3;

interface GerarCodigoParams {
  tipoDocumento: string;
  lojaId: string;
  ano?: number;
}

export enum TipoOS {
  COMERCIAL = 'COMERCIAL',
  INTERNA = 'INTERNA',
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

  async gerarCodigoOS(lojaId: string, ano?: number): Promise<string> {
    return this.gerarCodigo({
      tipoDocumento: DOCUMENTO_OS,
      lojaId,
      ano,
    });
  }

  /**
   * Gera código para OS Comercial (formato: OS-AAAA-NNN)
   */
  async gerarCodigoOSComercial(lojaId: string, ano?: number): Promise<string> {
    return this.gerarCodigo({
      tipoDocumento: DOCUMENTO_OS,
      lojaId,
      ano,
    });
  }

  /**
   * Gera código para OS Interna (formato: OSI-AAAA-NNN)
   */
  async gerarCodigoOSInterna(lojaId: string, ano?: number): Promise<string> {
    return this.gerarCodigo({
      tipoDocumento: DOCUMENTO_OS_INTERNA,
      lojaId,
      ano,
    });
  }

  /**
   * Gera código para OS baseado no tipo (Comercial ou Interna)
   */
  async gerarCodigoOSPorTipo(
    lojaId: string,
    tipoOS: TipoOS,
    ano?: number,
  ): Promise<string> {
    if (tipoOS === TipoOS.COMERCIAL) {
      return this.gerarCodigoOSComercial(lojaId, ano);
    } else if (tipoOS === TipoOS.INTERNA) {
      return this.gerarCodigoOSInterna(lojaId, ano);
    } else {
      throw new Error(`Tipo de OS inválido: ${tipoOS}`);
    }
  }

  async gerarCodigoNotaFiscal(lojaId: string, ano?: number): Promise<string> {
    return this.gerarCodigo({
      tipoDocumento: DOCUMENTO_NOTA_FISCAL,
      lojaId,
      ano,
    });
  }

  async gerarCodigoSolicitacaoCompra(
    lojaId: string,
    ano?: number,
  ): Promise<string> {
    return this.gerarCodigo({
      tipoDocumento: DOCUMENTO_SOLICITACAO_COMPRA,
      lojaId,
      ano,
    });
  }

  async gerarCodigoPedidoCompra(
    lojaId: string,
    ano?: number,
  ): Promise<string> {
    return this.gerarCodigo({
      tipoDocumento: DOCUMENTO_PEDIDO_COMPRA,
      lojaId,
      ano,
    });
  }

  async gerarCodigoRecebimentoCompra(
    lojaId: string,
    ano?: number,
  ): Promise<string> {
    return this.gerarCodigo({
      tipoDocumento: DOCUMENTO_RECEBIMENTO_COMPRA,
      lojaId,
      ano,
    });
  }

  async gerarCodigoAceiteServico(
    lojaId: string,
    ano?: number,
  ): Promise<string> {
    return this.gerarCodigo({
      tipoDocumento: DOCUMENTO_ACEITE_SERVICO,
      lojaId,
      ano,
    });
  }

  /**
   * Deriva OS-AAAA-NNN a partir de ORC-AAAA-NNN (mesma sequência, prefixo diferente).
   * Regra de rastreabilidade orçamento → OS.
   */
  derivarCodigoOSDeOrcamento(numeroOrcamento: string): string | null {
    const match = numeroOrcamento.trim().match(/^ORC-(\d{4})-(\d+)$/i);
    if (!match) {
      return null;
    }

    const ano = match[1];
    const sequencia = match[2].padStart(PADRAO_NUMERO, '0');
    return `${DOCUMENTO_OS}-${ano}-${sequencia}`;
  }

  /**
   * Ao criar OS a partir de orçamento, reutiliza o número do ORC e sincroniza a sequência OS.
   */
  async resolverNumeroOSDeOrcamento(
    lojaId: string,
    numeroOrcamento: string,
  ): Promise<string> {
    const derivado = this.derivarCodigoOSDeOrcamento(numeroOrcamento);
    if (!derivado) {
      this.logger.warn(
        `Orçamento ${numeroOrcamento} fora do padrão ORC-AAAA-NNN — gerando OS sequencial`,
      );
      return this.gerarCodigoOS(lojaId);
    }

    await this.sincronizarSequenciaOSComCodigo(lojaId, derivado);
    return derivado;
  }

  private async sincronizarSequenciaOSComCodigo(
    lojaId: string,
    codigoOS: string,
  ): Promise<void> {
    const info = this.extrairInformacoesCodigo(codigoOS);
    if (!info || info.tipo !== TipoOS.COMERCIAL) {
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      const existente = await tx.document_sequence.findUnique({
        where: {
          loja_id_tipo_ano: {
            loja_id: lojaId,
            tipo: DOCUMENTO_OS,
            ano: info.ano,
          },
        },
      });

      if (existente && existente.ultimo_numero >= info.numero) {
        return;
      }

      await tx.document_sequence.upsert({
        where: {
          loja_id_tipo_ano: {
            loja_id: lojaId,
            tipo: DOCUMENTO_OS,
            ano: info.ano,
          },
        },
        update: { ultimo_numero: info.numero },
        create: {
          loja_id: lojaId,
          tipo: DOCUMENTO_OS,
          ano: info.ano,
          ultimo_numero: info.numero,
        },
      });
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

  /**
   * Valida se um código de OS é válido
   */
  validarCodigoOS(codigo: string): {
    valido: boolean;
    tipo?: TipoOS;
    erro?: string;
  } {
    // Regex para OS Comercial: OS-AAAA-NNN
    const regexOSComercial = /^OS-\d{4}-\d{3}$/;
    // Regex para OS Interna: OSI-AAAA-NNN
    const regexOSInterna = /^OSI-\d{4}-\d{3}$/;

    if (regexOSComercial.test(codigo)) {
      return { valido: true, tipo: TipoOS.COMERCIAL };
    } else if (regexOSInterna.test(codigo)) {
      return { valido: true, tipo: TipoOS.INTERNA };
    } else {
      return {
        valido: false,
        erro: 'Formato inválido. Use OS-AAAA-NNN para comercial ou OSI-AAAA-NNN para interna',
      };
    }
  }

  /**
   * Extrai informações de um código de OS
   */
  extrairInformacoesCodigo(
    codigo: string,
  ): { tipo: TipoOS; ano: number; numero: number } | null {
    const validacao = this.validarCodigoOS(codigo);
    if (!validacao.valido) {
      return null;
    }

    const partes = codigo.split('-');
    const tipo = validacao.tipo;
    const ano = parseInt(partes[1], 10);
    const numero = parseInt(partes[2], 10);

    return { tipo, ano, numero };
  }

  /**
   * Verifica se um código já existe no banco
   */
  async verificarCodigoExistente(
    codigo: string,
    lojaId: string,
  ): Promise<boolean> {
    const informacoes = this.extrairInformacoesCodigo(codigo);
    if (!informacoes) {
      return false;
    }

    const tipoDocumento =
      informacoes.tipo === TipoOS.COMERCIAL
        ? DOCUMENTO_OS
        : DOCUMENTO_OS_INTERNA;

    const sequence = await this.prisma.document_sequence.findUnique({
      where: {
        loja_id_tipo_ano: {
          loja_id: lojaId,
          tipo: tipoDocumento,
          ano: informacoes.ano,
        },
      },
    });

    return sequence ? sequence.ultimo_numero >= informacoes.numero : false;
  }

  /**
   * Obtém estatísticas de numeração por tipo
   */
  async obterEstatisticasNumeracao(
    lojaId: string,
    ano?: number,
  ): Promise<{
    comercial: { total: number; ultimoNumero: number };
    interna: { total: number; ultimoNumero: number };
  }> {
    const anoReferencia = ano ?? new Date().getFullYear();

    const [sequenceComercial, sequenceInterna] = await Promise.all([
      this.prisma.document_sequence.findUnique({
        where: {
          loja_id_tipo_ano: {
            loja_id: lojaId,
            tipo: DOCUMENTO_OS,
            ano: anoReferencia,
          },
        },
      }),
      this.prisma.document_sequence.findUnique({
        where: {
          loja_id_tipo_ano: {
            loja_id: lojaId,
            tipo: DOCUMENTO_OS_INTERNA,
            ano: anoReferencia,
          },
        },
      }),
    ]);

    return {
      comercial: {
        total: sequenceComercial?.ultimo_numero || 0,
        ultimoNumero: sequenceComercial?.ultimo_numero || 0,
      },
      interna: {
        total: sequenceInterna?.ultimo_numero || 0,
        ultimoNumero: sequenceInterna?.ultimo_numero || 0,
      },
    };
  }

  /**
   * Obtém próximo número disponível para um tipo específico
   */
  async obterProximoNumero(
    lojaId: string,
    tipoOS: TipoOS,
    ano?: number,
  ): Promise<number> {
    const anoReferencia = ano ?? new Date().getFullYear();
    const tipoDocumento =
      tipoOS === TipoOS.COMERCIAL ? DOCUMENTO_OS : DOCUMENTO_OS_INTERNA;

    const sequence = await this.prisma.document_sequence.findUnique({
      where: {
        loja_id_tipo_ano: {
          loja_id: lojaId,
          tipo: tipoDocumento,
          ano: anoReferencia,
        },
      },
    });

    return (sequence?.ultimo_numero || 0) + 1;
  }
}
