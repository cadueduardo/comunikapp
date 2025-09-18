import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { MotorCalculoV2Service } from '../services/motor-calculo-v2.service';
import { DTOCalculo, EventoCalculo } from '../interfaces/calculo.interface';

/**
 * Gateway WebSocket para cálculos em tempo real
 * Permite preview e notificações instantâneas
 */
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/calculo-v2',
})
export class CalculoWebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(CalculoWebSocketGateway.name);
  private readonly clientesConectados = new Map<string, { socket: Socket; lojaId: string; usuarioId: string }>();

  constructor(
    private readonly motorCalculoV2Service: MotorCalculoV2Service,
  ) {}

  /**
   * Cliente conectado
   */
  async handleConnection(client: Socket) {
    try {
      // TODO: Implementar autenticação via token
      const lojaId = client.handshake.query.lojaId as string;
      const usuarioId = client.handshake.query.usuarioId as string;

      if (!lojaId || !usuarioId) {
        this.logger.warn(`⚠️ Cliente ${client.id} conectou sem lojaId/usuarioId`);
        client.disconnect();
        return;
      }

      this.clientesConectados.set(client.id, {
        socket: client,
        lojaId,
        usuarioId,
      });

      this.logger.log(`🔗 Cliente conectado: ${client.id} (Loja: ${lojaId})`);

      // Enviar status de conexão
      client.emit('status', {
        conectado: true,
        timestamp: new Date(),
        versao_motor: '2.0.0',
      });

    } catch (error) {
      this.logger.error(`❌ Erro na conexão: ${error.message}`);
      client.disconnect();
    }
  }

  /**
   * Cliente desconectado
   */
  handleDisconnect(client: Socket) {
    const clienteInfo = this.clientesConectados.get(client.id);
    if (clienteInfo) {
      this.logger.log(`🔌 Cliente desconectado: ${client.id} (Loja: ${clienteInfo.lojaId})`);
      this.clientesConectados.delete(client.id);
    }
  }

  /**
   * Executa cálculo preview em tempo real
   */
  @SubscribeMessage('calcular_preview')
  async calcularPreview(
    @MessageBody() dto: DTOCalculo,
    @ConnectedSocket() client: Socket,
  ) {
    const clienteInfo = this.clientesConectados.get(client.id);
    if (!clienteInfo) {
      client.emit('erro', { message: 'Cliente não autenticado' });
      return;
    }

    try {
      this.logger.log(`👁️ Preview solicitado por ${client.id}`);

      // Emitir evento de início
      client.emit('calculo_iniciado', {
        timestamp: new Date(),
        total_produtos: dto.produtos?.length || 0,
      });

      // Executar cálculo preview
      const dtoComLoja = {
        ...dto,
        lojaId: clienteInfo.lojaId,
      };

      const resultado = await this.motorCalculoV2Service.executarCalculoPreview(dtoComLoja);

      // Emitir resultado
      client.emit('calculo_concluido', {
        timestamp: new Date(),
        resultado,
      });

      this.logger.log(`✅ Preview enviado para ${client.id}`);

    } catch (error) {
      this.logger.error(`❌ Erro no preview para ${client.id}: ${error.message}`);
      
      client.emit('erro', {
        timestamp: new Date(),
        message: error.message,
        tipo: 'calculo_preview',
      });
    }
  }

  /**
   * Valida dados sem executar cálculo
   */
  @SubscribeMessage('validar_dados')
  async validarDados(
    @MessageBody() dto: DTOCalculo,
    @ConnectedSocket() client: Socket,
  ) {
    const clienteInfo = this.clientesConectados.get(client.id);
    if (!clienteInfo) {
      client.emit('erro', { message: 'Cliente não autenticado' });
      return;
    }

    try {
      const dtoComLoja = {
        ...dto,
        lojaId: clienteInfo.lojaId,
      };

      const validacao = await this.motorCalculoV2Service.validarContexto(dtoComLoja);

      client.emit('validacao_resultado', {
        timestamp: new Date(),
        valido: validacao.valido,
        erros: validacao.erros,
        avisos: validacao.avisos,
      });

    } catch (error) {
      client.emit('erro', {
        timestamp: new Date(),
        message: error.message,
        tipo: 'validacao',
      });
    }
  }

  /**
   * Obtém estatísticas em tempo real
   */
  @SubscribeMessage('obter_estatisticas')
  async obterEstatisticas(@ConnectedSocket() client: Socket) {
    const clienteInfo = this.clientesConectados.get(client.id);
    if (!clienteInfo) {
      client.emit('erro', { message: 'Cliente não autenticado' });
      return;
    }

    try {
      const estatisticas = await this.motorCalculoV2Service.obterEstatisticas(clienteInfo.lojaId);

      client.emit('estatisticas', {
        timestamp: new Date(),
        estatisticas,
      });

    } catch (error) {
      client.emit('erro', {
        timestamp: new Date(),
        message: error.message,
        tipo: 'estatisticas',
      });
    }
  }

  /**
   * Broadcast de evento para todos os clientes da loja
   */
  async broadcastEvento(evento: EventoCalculo) {
    try {
      const clientesDaLoja = Array.from(this.clientesConectados.values())
        .filter(cliente => cliente.lojaId === evento.contexto.lojaId);

      for (const cliente of clientesDaLoja) {
        cliente.socket.emit('evento_calculo', {
          timestamp: new Date(),
          evento,
        });
      }

      this.logger.log(`📡 Evento ${evento.tipo} enviado para ${clientesDaLoja.length} clientes da loja ${evento.contexto.lojaId}`);

    } catch (error) {
      this.logger.error(`❌ Erro no broadcast: ${error.message}`);
    }
  }

  /**
   * Obtém estatísticas de conexões
   */
  getEstatisticasConexoes() {
    const conexoesPorLoja = new Map<string, number>();
    
    for (const cliente of this.clientesConectados.values()) {
      const count = conexoesPorLoja.get(cliente.lojaId) || 0;
      conexoesPorLoja.set(cliente.lojaId, count + 1);
    }

    return {
      total_conexoes: this.clientesConectados.size,
      conexoes_por_loja: Object.fromEntries(conexoesPorLoja),
      timestamp: new Date(),
    };
  }
}
