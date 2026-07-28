import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { MotorCalculoV2Service } from '../services/motor-calculo-v2.service';
import { DTOCalculo, EventoCalculo } from '../interfaces/calculo.interface';
import { PrismaService } from '../../prisma/prisma.service';
import {
  extractJwtFromSocketHandshake,
  getSocketCorsOrigins,
} from '../../auth/socket-jwt';

/**
 * Gateway WebSocket para cálculos em tempo real
 * Permite preview e notificações instantâneas
 */
@WebSocketGateway({
  cors: {
    origin: getSocketCorsOrigins(),
    credentials: true,
  },
  namespace: '/calculo-v2',
})
export class CalculoWebSocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(CalculoWebSocketGateway.name);
  private readonly clientesConectados = new Map<
    string,
    { socket: Socket; lojaId: string; usuarioId: string }
  >();

  constructor(
    private readonly motorCalculoV2Service: MotorCalculoV2Service,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Cliente conectado — autentica via cookie HttpOnly / auth.token
   */
  async handleConnection(client: Socket) {
    try {
      const token = extractJwtFromSocketHandshake(client.handshake);
      if (!token) {
        this.logger.warn(`⚠️ Cliente ${client.id} sem JWT de sessão`);
        client.disconnect();
        return;
      }

      let lojaId: string | undefined;
      let usuarioId: string | undefined;

      try {
        const payload = this.jwtService.verify(token) as {
          sub?: string;
          loja_id?: string;
        };
        if (payload?.sub) {
          const user = await this.prisma.usuario.findUnique({
            where: { id: payload.sub },
            select: { id: true, loja_id: true },
          });
          if (user) {
            usuarioId = user.id;
            lojaId = user.loja_id;
          }
        }
      } catch {
        this.logger.warn(`⚠️ JWT inválido no WS cálculo (${client.id})`);
        client.disconnect();
        return;
      }

      // Fallback legado (query) só se JWT não trouxe tenant — ainda exige JWT válido acima
      if (!lojaId || !usuarioId) {
        lojaId = (client.handshake.query.lojaId as string) || lojaId;
        usuarioId = (client.handshake.query.usuarioId as string) || usuarioId;
      }

      if (!lojaId || !usuarioId) {
        this.logger.warn(
          `⚠️ Cliente ${client.id} autenticado sem lojaId/usuarioId`,
        );
        client.disconnect();
        return;
      }

      this.clientesConectados.set(client.id, {
        socket: client,
        lojaId,
        usuarioId,
      });

      this.logger.log(`🔗 Cliente conectado: ${client.id} (Loja: ${lojaId})`);

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
      this.logger.log(
        `🔌 Cliente desconectado: ${client.id} (Loja: ${clienteInfo.lojaId})`,
      );
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

      const resultado =
        await this.motorCalculoV2Service.executarCalculoPreview(dtoComLoja);

      // Emitir resultado
      client.emit('calculo_concluido', {
        timestamp: new Date(),
        resultado,
      });

      this.logger.log(`✅ Preview enviado para ${client.id}`);
    } catch (error) {
      this.logger.error(
        `❌ Erro no preview para ${client.id}: ${error.message}`,
      );

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

      const validacao =
        await this.motorCalculoV2Service.validarContexto(dtoComLoja);

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
      const estatisticas = await this.motorCalculoV2Service.obterEstatisticas(
        clienteInfo.lojaId,
      );

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
      const clientesDaLoja = Array.from(
        this.clientesConectados.values(),
      ).filter((cliente) => cliente.lojaId === evento.contexto.lojaId);

      for (const cliente of clientesDaLoja) {
        cliente.socket.emit('evento_calculo', {
          timestamp: new Date(),
          evento,
        });
      }

      this.logger.log(
        `📡 Evento ${evento.tipo} enviado para ${clientesDaLoja.length} clientes da loja ${evento.contexto.lojaId}`,
      );
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
