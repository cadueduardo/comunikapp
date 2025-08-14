import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { WebsocketsService } from './websockets.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
@Injectable()
export class WebsocketsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebsocketsGateway.name);

  constructor(
    private readonly websocketsService: WebsocketsService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  afterInit(server: Server) {
    this.websocketsService.setServer(server);
    this.logger.log('WebSocket Gateway inicializado');
  }

  async handleConnection(client: Socket) {
    this.logger.log(`Cliente conectado: ${client.id}`);

    // Extrair token do handshake
    const token =
      client.handshake.auth.token ||
      client.handshake.headers.authorization?.replace('Bearer ', '');

    if (token) {
      try {
        const payload = this.jwtService.verify(token);
        const user = await this.prisma.usuario.findUnique({
          where: { id: payload.sub },
          include: { loja: true },
        });

        if (user) {
          client.data.user = user;
          client.data.lojaId = user.loja_id;
          client.data.userId = user.id;

          // Entrar nas salas da loja e do usuário
          await client.join(`loja_${user.loja_id}`);
          await client.join(`user_${user.id}`);

          this.logger.log(
            `Usuário autenticado conectado: ${user.email} (Loja: ${user.loja_id})`,
          );
        }
      } catch (error) {
        this.logger.warn(`Token inválido para cliente ${client.id}`);
      }
    } else {
      this.logger.log(`Cliente público conectado: ${client.id}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);
  }

  @SubscribeMessage('join_orcamento')
  async handleJoinOrcamento(client: Socket, orcamentoId: string) {
    try {
      // Verificar se o orçamento existe
      const orcamento = await this.prisma.orcamento.findUnique({
        where: { id: orcamentoId },
        select: { loja_id: true },
      });

      if (!orcamento) {
        client.emit('error', { message: 'Orçamento não encontrado' });
        return;
      }

      // Se é um usuário autenticado, verificar se pertence à mesma loja
      if (client.data.user && client.data.lojaId !== orcamento.loja_id) {
        client.emit('error', { message: 'Acesso negado' });
        return;
      }

      // Entrar na sala do orçamento
      await client.join(`orcamento_${orcamentoId}`);
      client.data.orcamentoId = orcamentoId;

      this.logger.log(
        `Cliente ${client.id} entrou na sala do orçamento ${orcamentoId}`,
      );

      // Notificar outros clientes
      client.to(`orcamento_${orcamentoId}`).emit('user_joined', {
        clientId: client.id,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error('Erro ao entrar na sala do orçamento:', error);
      client.emit('error', { message: 'Erro interno do servidor' });
    }
  }

  @SubscribeMessage('leave_orcamento')
  async handleLeaveOrcamento(client: Socket, orcamentoId: string) {
    await client.leave(`orcamento_${orcamentoId}`);
    delete client.data.orcamentoId;

    this.logger.log(
      `Cliente ${client.id} saiu da sala do orçamento ${orcamentoId}`,
    );

    // Notificar outros clientes
    client.to(`orcamento_${orcamentoId}`).emit('user_left', {
      clientId: client.id,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('typing')
  async handleTyping(
    client: Socket,
    data: { orcamentoId: string; isTyping: boolean },
  ) {
    client.to(`orcamento_${data.orcamentoId}`).emit('user_typing', {
      clientId: client.id,
      isTyping: data.isTyping,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('message_read')
  async handleMessageRead(
    client: Socket,
    data: { orcamentoId: string; messageId: string },
  ) {
    client.to(`orcamento_${data.orcamentoId}`).emit('message_read', {
      messageId: data.messageId,
      readBy: client.id,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('ping')
  handlePing(client: Socket) {
    client.emit('pong', { timestamp: new Date().toISOString() });
  }
}
