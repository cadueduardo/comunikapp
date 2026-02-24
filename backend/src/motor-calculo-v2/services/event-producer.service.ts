import { Injectable, Logger } from '@nestjs/common';
import {
  ContextoCalculo,
  EventoCalculo,
  ResultadoRegras,
  ResultadoCalculo,
} from '../interfaces/calculo.interface';

@Injectable()
export class EventProducerService {
  private readonly logger = new Logger(EventProducerService.name);

  /**
   * Produz evento de início de cálculo
   */
  async eventoCalculoIniciado(contexto: ContextoCalculo): Promise<void> {
    const evento: EventoCalculo = {
      id: this.gerarIdEvento(),
      tipo: 'calculo_iniciado',
      timestamp: new Date(),
      contexto,
      dados: {
        total_produtos: contexto.produtos.length,
        modo_calculo: contexto.metadata.modo_calculo,
      },
      metadata: {
        versao_motor: contexto.metadata.versao_motor,
        origem: contexto.metadata.origem,
      },
    };

    await this.publicarEvento(evento);
    this.logger.log(
      `📢 Evento publicado: calculo_iniciado para contexto ${contexto.id}`,
    );
  }

  /**
   * Produz evento de validação
   */
  async eventoValidacao(
    contexto: ContextoCalculo,
    resultadoRegras: ResultadoRegras,
    sucesso: boolean,
  ): Promise<void> {
    const evento: EventoCalculo = {
      id: this.gerarIdEvento(),
      tipo: 'validacao',
      timestamp: new Date(),
      contexto,
      dados: {
        regras_aplicadas: resultadoRegras.regras_aplicadas.length,
        erros: resultadoRegras.erros,
        avisos: resultadoRegras.avisos,
      },
      resultado: {
        sucesso,
        total_regras: resultadoRegras.regras_aplicadas.length,
      },
      metadata: {
        versao_motor: contexto.metadata.versao_motor,
      },
    };

    await this.publicarEvento(evento);
    this.logger.log(
      `📢 Evento publicado: validacao (${sucesso ? 'sucesso' : 'falha'}) para contexto ${contexto.id}`,
    );
  }

  /**
   * Produz evento de estágio executado
   */
  async eventoEstagioExecutado(
    contexto: ContextoCalculo,
    nomeEstagio: string,
    sucesso: boolean,
    dados: any,
  ): Promise<void> {
    const evento: EventoCalculo = {
      id: this.gerarIdEvento(),
      tipo: 'estagio_executado',
      timestamp: new Date(),
      contexto,
      dados: {
        estagio: nomeEstagio,
        sucesso,
        dados_estagio: dados,
      },
      metadata: {
        versao_motor: contexto.metadata.versao_motor,
      },
    };

    await this.publicarEvento(evento);
    this.logger.log(
      `📢 Evento publicado: estagio_executado (${nomeEstagio}) para contexto ${contexto.id}`,
    );
  }

  /**
   * Produz evento de cálculo concluído
   */
  async eventoCalculoConcluido(
    contexto: ContextoCalculo,
    resultado: ResultadoCalculo,
    tempoExecucao: number,
  ): Promise<void> {
    const evento: EventoCalculo = {
      id: this.gerarIdEvento(),
      tipo: 'calculo_concluido',
      timestamp: new Date(),
      contexto,
      dados: {
        tempo_execucao_ms: tempoExecucao,
        total_produtos: resultado.produtos.length,
        preco_final: resultado.resumo.preco_final,
      },
      resultado,
      metadata: {
        versao_motor: contexto.metadata.versao_motor,
        tempo_producao: tempoExecucao,
      },
    };

    await this.publicarEvento(evento);
    this.logger.log(
      `📢 Evento publicado: calculo_concluido para contexto ${contexto.id} em ${tempoExecucao}ms`,
    );
  }

  /**
   * Produz evento de erro
   */
  async eventoErro(contexto: ContextoCalculo, erro: string): Promise<void> {
    const evento: EventoCalculo = {
      id: this.gerarIdEvento(),
      tipo: 'erro',
      timestamp: new Date(),
      contexto,
      dados: {
        mensagem_erro: erro,
      },
      erro,
      metadata: {
        versao_motor: contexto.metadata.versao_motor,
      },
    };

    await this.publicarEvento(evento);
    this.logger.error(
      `📢 Evento publicado: erro para contexto ${contexto.id} - ${erro}`,
    );
  }

  /**
   * Obtém estatísticas de eventos
   */
  async obterEstatisticasEventos(lojaId: string): Promise<{
    total_eventos: number;
    eventos_por_tipo: Record<string, number>;
    ultimo_evento: Date | null;
  }> {
    try {
      // TODO: Implementar quando tivermos persistência de eventos
      return {
        total_eventos: 0,
        eventos_por_tipo: {},
        ultimo_evento: null,
      };
    } catch (error) {
      this.logger.error(
        `❌ Erro ao obter estatísticas de eventos: ${error.message}`,
      );
      return {
        total_eventos: 0,
        eventos_por_tipo: {},
        ultimo_evento: null,
      };
    }
  }

  /**
   * Publica evento no sistema
   * Por enquanto apenas log, futuramente WebSocket/Redis
   */
  private async publicarEvento(evento: EventoCalculo): Promise<void> {
    try {
      // Log estruturado do evento
      this.logger.log(
        `📡 [${evento.tipo}] ${JSON.stringify({
          id: evento.id,
          contexto_id: evento.contexto.id,
          loja_id: evento.contexto.lojaId,
          timestamp: evento.timestamp,
          dados: evento.dados,
        })}`,
      );

      // TODO: Implementar publicação real (WebSocket, Redis, etc.)
      // await this.websocketGateway.broadcast(evento);
      // await this.redisPublisher.publish('calculo_eventos', evento);
    } catch (error) {
      this.logger.error(`❌ Erro ao publicar evento: ${error.message}`);
      // Não propagar erro para não quebrar o cálculo
    }
  }

  /**
   * Gera ID único para evento
   */
  private gerarIdEvento(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
