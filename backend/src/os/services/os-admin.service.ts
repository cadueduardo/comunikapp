/**
 * Service administrativo de manutencao da OrdemServico.
 *
 * Implementa operacoes de recuperacao pontual / migracao de dados que NAO
 * fazem parte do fluxo normal do dominio. O acesso e gated por funcao
 * ADMINISTRADOR no controller; este service nao faz checagem de permissao
 * (responsabilidade do controller).
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StatusOS } from '../interfaces/os.interfaces';

/**
 * Status historicamente gravados por engano no campo `OrdemServico.status`
 * pelo `OSPrazoService` ate 2026-05-25. Sao na verdade "status de prazo"
 * (calculados dinamicamente em `consultarStatusPrazo`) e foram corrompidos
 * o status operacional. Esta lista e usada apenas para detectar OS
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
}

export interface ResultadoRecuperacaoStatus {
  total_analisadas: number;
  total_corrigidas: number;
  dry_run: boolean;
  detalhes: DetalheRecuperacaoStatus[];
}

@Injectable()
export class OSAdminService {
  private readonly logger = new Logger(OSAdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Recupera o status operacional correto de OS que tiveram o campo
   * `status` corrompido por escrita historica do `OSPrazoService`.
   *
   * Regra de reconstrucao (em ordem de prioridade):
   *  1. `aprovacao_tecnica_status = 'APROVADA'`  -> `LIBERADA_PARA_PCP`
   *  2. `aprovacao_tecnica_status = 'REJEITADA'` -> `REJEITADA`
   *  3. `tipo_os = 'COMERCIAL'` (pendente) -> `AGUARDANDO_APROVACAO_TECNICA`
   *  4. `tipo_os = 'INTERNA'`   (pendente) -> `AGUARDANDO_APROVACAO_ORCAMENTARIA`
   *  5. fallback -> `FILA`
   *
   * Quando `osId` e informado, opera apenas naquela OS (corrige inclusive
   * status nao-corrompidos, mas marca como `aplicado=false` se nao houver
   * inferencia segura). Quando `osId` e omitido, varre todas as OS da loja
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
      },
    });

    if (!candidatas.length && osId) {
      throw new NotFoundException(
        `OS ${osId} nao encontrada na loja informada`,
      );
    }

    const detalhes: DetalheRecuperacaoStatus[] = [];
    let corrigidas = 0;

    for (const os of candidatas) {
      const statusAtual = (os.status || '').toUpperCase();
      const aprovacao = (os.aprovacao_tecnica_status || '').toUpperCase();
      const tipoOs = (os.tipo_os || '').toUpperCase();

      // Quando opera no modo "todas da loja" o filtro ja limita a corrompidas.
      // Quando opera no modo "uma OS especifica" precisa filtrar manualmente.
      if (osId && !STATUS_CORROMPIDOS.has(statusAtual)) {
        detalhes.push({
          os_id: os.id,
          numero: os.numero,
          status_anterior: statusAtual,
          status_novo: null,
          motivo: 'Status atual nao e considerado corrompido - nada a fazer',
          aplicado: false,
        });
        continue;
      }

      const statusReconstruido = this.inferirStatusCorreto(aprovacao, tipoOs);
      const motivo = this.descreverMotivo(aprovacao, tipoOs);

      detalhes.push({
        os_id: os.id,
        numero: os.numero,
        status_anterior: statusAtual,
        status_novo: statusReconstruido,
        motivo,
        aplicado: !dryRun,
      });

      if (!dryRun) {
        await this.prisma.ordemServico.update({
          where: { id: os.id },
          data: {
            status: statusReconstruido,
            motivo_modificacao: `Recuperacao de status corrompido (${statusAtual} -> ${statusReconstruido}). ${motivo}`,
          },
        });
        corrigidas += 1;
        this.logger.log(
          `OS ${os.numero} recuperada: ${statusAtual} -> ${statusReconstruido}`,
        );
      }
    }

    return {
      total_analisadas: candidatas.length,
      total_corrigidas: corrigidas,
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
    return 'fallback -> FILA (sem aprovacao e sem tipo_os identificavel)';
  }
}
