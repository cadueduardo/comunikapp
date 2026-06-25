import { Injectable, Logger } from '@nestjs/common';
import { WebsocketsService } from '../../websockets/websockets.service';
import { WS_EXPEDICAO_ATUALIZADA } from '../constants/expedicao-events.constants';

export interface PayloadExpedicaoAtualizada {
  tipo: 'EXPEDICAO_ATUALIZADA';
  expedicao_id: string;
  os_id: string;
  status_anterior: string;
  status_novo: string;
  loja_id: string;
  timestamp: string;
}

@Injectable()
export class ExpedicaoNotificacaoService {
  private readonly logger = new Logger(ExpedicaoNotificacaoService.name);

  constructor(private readonly websocketsService: WebsocketsService) {}

  emitirAtualizada(
    lojaId: string,
    payload: Omit<PayloadExpedicaoAtualizada, 'tipo' | 'loja_id' | 'timestamp'>,
  ): void {
    try {
      void this.websocketsService.emitToLoja(lojaId, WS_EXPEDICAO_ATUALIZADA, {
        tipo: 'EXPEDICAO_ATUALIZADA',
        loja_id: lojaId,
        timestamp: new Date().toISOString(),
        ...payload,
      } satisfies PayloadExpedicaoAtualizada);
    } catch (error) {
      this.logger.warn(
        `Falha ao emitir WebSocket ${WS_EXPEDICAO_ATUALIZADA}:`,
        error,
      );
    }
  }
}
