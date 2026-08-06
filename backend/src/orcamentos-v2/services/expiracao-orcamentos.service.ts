import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TransicaoComercialService } from './transicao-comercial.service';
import { OrcamentoStatusComercial } from '../domain/status-comercial';

export interface ResultadoExpiracaoLote {
  processados: number;
  expirados: number;
  ignoradosConcorrencia: number;
  erros: number;
  orcamentoIdsExpirados: string[];
}

/**
 * Servico 6.3 - Expiracao Canonica de Propostas Comerciais.
 *
 * Seleciona propostas com `expira_em <= agora` (UTC) que estejam em `enviada` ou `em_negociacao`
 * e executa a transicao para `expirada` atraves do writer unico `TransicaoComercialService`.
 */
@Injectable()
export class ExpiracaoOrcamentosService {
  private readonly logger = new Logger(ExpiracaoOrcamentosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly transicaoComercialService: TransicaoComercialService,
  ) {}

  /**
   * Processa propostas vencidas (`expira_em <= agora`) em lotes indexados.
   *
   * @param limiteLote Tamanho máximo de cada lote (padrão: 50).
   * @param maxLotes Número máximo de lotes por ciclo para evitar loops infinitos (padrão: 10).
   */
  async processarPropostasExpiradas(
    limiteLote = 50,
    maxLotes = 10,
  ): Promise<ResultadoExpiracaoLote> {
    const resultado: ResultadoExpiracaoLote = {
      processados: 0,
      expirados: 0,
      ignoradosConcorrencia: 0,
      erros: 0,
      orcamentoIdsExpirados: [],
    };

    let lotesExecutados = 0;

    while (lotesExecutados < maxLotes) {
      lotesExecutados++;
      const agoraUtc = new Date();

      const candidatos = await this.prisma.orcamento.findMany({
        where: {
          status_comercial: {
            in: [
              OrcamentoStatusComercial.ENVIADA,
              OrcamentoStatusComercial.EM_NEGOCIACAO,
            ],
          },
          expira_em: {
            lte: agoraUtc,
          },
          excluido_em: null,
        },
        select: {
          id: true,
          loja_id: true,
          numero: true,
          status_comercial: true,
          responsavel_id: true,
          expira_em: true,
        },
        take: limiteLote,
        orderBy: {
          expira_em: 'asc',
        },
      });

      if (candidatos.length === 0) {
        break;
      }

      resultado.processados += candidatos.length;

      for (const item of candidatos) {
        try {
          const transicionado = await this.transicaoComercialService.executar({
            orcamentoId: item.id,
            lojaId: item.loja_id,
            origemStatus: item.status_comercial as OrcamentoStatusComercial,
            destinoStatus: OrcamentoStatusComercial.EXPIRADA,
            origemAcao: 'SISTEMA',
            autor: 'SISTEMA',
            tipoAuditoria: 'expiracao_automatica',
            descricao: `Proposta ${item.numero} expirada automaticamente por atingir a data de validade (${item.expira_em?.toISOString() ?? 'sem data'}).`,
            evento: 'vendas.proposta.expirada',
          });

          if (transicionado) {
            resultado.expirados++;
            resultado.orcamentoIdsExpirados.push(item.id);
            this.logger.log(`Proposta #${item.numero} (${item.id}) expirada com sucesso.`);
          } else {
            // CAS falhou (transicao concorrente ou estado alterado por outro processo)
            resultado.ignoradosConcorrencia++;
          }
        } catch (err) {
          resultado.erros++;
          this.logger.error(
            `Erro ao expirar proposta ${item.id} (loja ${item.loja_id}): ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }

      if (candidatos.length < limiteLote) {
        break;
      }
    }

    this.logger.log(
      `Expiração automática concluída: ${resultado.processados} processados, ${resultado.expirados} expirados, ${resultado.ignoradosConcorrencia} concorrentes ignorados, ${resultado.erros} erros.`,
    );

    return resultado;
  }
}
