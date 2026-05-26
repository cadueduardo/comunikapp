/**
 * Service administrativo de manutenção da OrdemServico.
 *
 * Implementa operações de recuperação pontual / migração de dados que NÃO
 * fazem parte do fluxo normal do domínio. O acesso é gated por função
 * ADMINISTRADOR no controller; este service não faz checagem de permissão
 * (responsabilidade do controller).
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StatusOS } from '../interfaces/os.interfaces';

/**
 * Status historicamente gravados por engano no campo `OrdemServico.status`
 * pelo `OSPrazoService` até 2026-05-25. São na verdade "status de prazo"
 * (calculados dinamicamente em `consultarStatusPrazo`) e foram corrompendo
 * o status operacional. Esta lista é usada apenas para detectar OS
 * corrompidas e reconstruir o status correto.
 */
const STATUS_CORROMPIDOS = new Set<string>([
  'AGUARDANDO_INICIO',
  'PRONTA_PRODUCAO',
  'EM_PRODUCAO',
]);

export interface DetalheRecuperacaoStatus {
  os_id: string;
  numero: string;
  status_anterior: string;
  status_novo: string | null;
  motivo: string;
  aplicado: boolean;
  // Reconciliação de itens: quando a OS está APROVADA tecnicamente porém
  // tem `ItemOS` ainda `PENDENTE` (gap histórico anterior ao helper
  // `promoverAprovacaoParaPCP`), o admin libera esses itens para o PCP.
  itens_liberados: number;
}

export interface ResultadoRecuperacaoStatus {
  total_analisadas: number;
  total_corrigidas: number;
  total_itens_liberados: number;
  dry_run: boolean;
  detalhes: DetalheRecuperacaoStatus[];
}

@Injectable()
export class OSAdminService {
  private readonly logger = new Logger(OSAdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Recupera o status operacional correto de OS que tiveram o campo
   * `status` corrompido por escrita histórica do `OSPrazoService`.
   *
   * Regra de reconstrução (em ordem de prioridade):
   *  1. `aprovacao_tecnica_status = 'APROVADA'`  -> `LIBERADA_PARA_PCP`
   *  2. `aprovacao_tecnica_status = 'REJEITADA'` -> `REJEITADA`
   *  3. `tipo_os = 'COMERCIAL'` (pendente) -> `AGUARDANDO_APROVACAO_TECNICA`
   *  4. `tipo_os = 'INTERNA'`   (pendente) -> `AGUARDANDO_APROVACAO_ORCAMENTARIA`
   *  5. fallback -> `FILA`
   *
   * Quando `osId` é informado, opera apenas naquela OS (corrige inclusive
   * status não-corrompidos, mas marca como `aplicado=false` se não houver
   * inferência segura). Quando `osId` é omitido, varre todas as OS da loja
   * com status corrompido.
   */
  async recuperarStatusOS(args: {
    lojaId: string;
    dryRun?: boolean;
    osId?: string;
  }): Promise<ResultadoRecuperacaoStatus> {
    const { lojaId, dryRun = false, osId } = args;

    const where: Record<string, unknown> = {
      loja_id: lojaId,
    };

    if (osId) {
      where.id = osId;
    } else {
      where.status = { in: Array.from(STATUS_CORROMPIDOS) };
    }

    const candidatas = await this.prisma.ordemServico.findMany({
      where,
      select: {
        id: true,
        numero: true,
        status: true,
        tipo_os: true,
        aprovacao_tecnica_status: true,
        aprovacao_tecnica_por: true,
        criado_por: true,
      },
    });

    if (!candidatas.length && osId) {
      throw new NotFoundException(
        `OS ${osId} não encontrada na loja informada`,
      );
    }

    const detalhes: DetalheRecuperacaoStatus[] = [];
    let corrigidas = 0;
    let totalItensLiberados = 0;

    for (const os of candidatas) {
      const statusAtual = (os.status || '').toUpperCase();
      const aprovacao = (os.aprovacao_tecnica_status || '').toUpperCase();
      const tipoOs = (os.tipo_os || '').toUpperCase();
      const statusCorrompido = STATUS_CORROMPIDOS.has(statusAtual);

      // Calcula status novo apenas se o atual for corrompido. Caso contrário,
      // mantém o atual e prossegue para a fase de reconciliação de itens.
      const statusReconstruido = statusCorrompido
        ? this.inferirStatusCorreto(aprovacao, tipoOs)
        : null;
      const motivo = statusCorrompido
        ? this.descreverMotivo(aprovacao, tipoOs)
        : 'Status atual não é corrompido — apenas reconciliando itens';

      // Reconciliação de itens: libera ItemOS PENDENTE quando a OS está
      // APROVADA tecnicamente (sempre, independente de o status estar
      // corrompido). Inferido em dry-run pela contagem.
      let itensALiberar = 0;
      if (aprovacao === 'APROVADA') {
        itensALiberar = await this.prisma.itemOS.count({
          where: {
            os_id: os.id,
            status_liberacao_pcp: 'PENDENTE',
          },
        });
      }

      detalhes.push({
        os_id: os.id,
        numero: os.numero,
        status_anterior: statusAtual,
        status_novo: statusReconstruido,
        motivo,
        aplicado: !dryRun && (statusCorrompido || itensALiberar > 0),
        itens_liberados: itensALiberar,
      });

      if (!dryRun) {
        if (statusCorrompido && statusReconstruido) {
          await this.prisma.ordemServico.update({
            where: { id: os.id },
            data: {
              status: statusReconstruido,
              motivo_modificacao: `Recuperação de status corrompido (${statusAtual} -> ${statusReconstruido}). ${motivo}`,
            },
          });
          corrigidas += 1;
          this.logger.log(
            `OS ${os.numero} recuperada: ${statusAtual} -> ${statusReconstruido}`,
          );
        }

        if (itensALiberar > 0) {
          // Atribui liberador rastreável: aprovador técnico se conhecido,
          // senão quem criou a OS, senão 'SISTEMA' (string sentinel para
          // operação administrativa).
          const liberadorId =
            os.aprovacao_tecnica_por || os.criado_por || 'SISTEMA';

          const resultado = await this.prisma.itemOS.updateMany({
            where: {
              os_id: os.id,
              status_liberacao_pcp: 'PENDENTE',
            },
            data: {
              status_liberacao_pcp: 'LIBERADO',
              liberado_pcp_por: liberadorId,
              liberado_pcp_em: new Date(),
            },
          });
          totalItensLiberados += resultado.count;
          this.logger.log(
            `OS ${os.numero}: ${resultado.count} itens PENDENTE liberados para o PCP`,
          );
        }
      }
    }

    return {
      total_analisadas: candidatas.length,
      total_corrigidas: corrigidas,
      total_itens_liberados: totalItensLiberados,
      dry_run: dryRun,
      detalhes,
    };
  }

  private inferirStatusCorreto(
    aprovacao: string,
    tipoOs: string,
  ): StatusOS {
    if (aprovacao === 'APROVADA') {
      return StatusOS.LIBERADA_PARA_PCP;
    }

    if (aprovacao === 'REJEITADA') {
      return StatusOS.REJEITADA;
    }

    if (tipoOs === 'COMERCIAL') {
      return StatusOS.AGUARDANDO_APROVACAO_TECNICA;
    }

    if (tipoOs === 'INTERNA') {
      return StatusOS.AGUARDANDO_APROVACAO_ORCAMENTARIA;
    }

    return StatusOS.FILA;
  }

  private descreverMotivo(aprovacao: string, tipoOs: string): string {
    if (aprovacao === 'APROVADA') {
      return 'aprovacao_tecnica_status=APROVADA -> LIBERADA_PARA_PCP';
    }
    if (aprovacao === 'REJEITADA') {
      return 'aprovacao_tecnica_status=REJEITADA -> REJEITADA';
    }
    if (tipoOs === 'COMERCIAL') {
      return 'tipo_os=COMERCIAL pendente -> AGUARDANDO_APROVACAO_TECNICA';
    }
    if (tipoOs === 'INTERNA') {
      return 'tipo_os=INTERNA pendente -> AGUARDANDO_APROVACAO_ORCAMENTARIA';
    }
    return 'fallback -> FILA (sem aprovação e sem tipo_os identificável)';
  }
}
