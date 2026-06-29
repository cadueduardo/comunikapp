import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../prisma/prisma.service';

@WebSocketGateway({
  namespace: '/arte-aprovacao',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
@Injectable()
export class ArteWebSocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ArteWebSocketGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('Arte WebSocket Gateway inicializado');
  }

  async handleConnection(client: Socket) {
    this.logger.debug(`WS arte conectado socket=${client.id}`);

    // Extrair token do handshake
    const token =
      client.handshake.auth.token ||
      client.handshake.headers.authorization?.replace('Bearer ', '');

    if (token) {
      try {
        // Tentar validar token (JWT normal ou token de aprovação)
        const payload = this.jwtService.verify(token);

        if (payload.sub) {
          // Token JWT normal (usuário logado)
          const user = await this.prisma.usuario.findUnique({
            where: { id: payload.sub },
            include: { loja: true },
          });

          if (user) {
            client.data.user = user;
            client.data.lojaId = user.loja_id;
            client.data.userId = user.id;
            client.data.tipo = 'designer';

            // Entrar nas salas da loja e do usuário
            await client.join(`loja_${user.loja_id}`);
            await client.join(`user_${user.id}`);

            this.logger.debug(
              `WS arte designer loja=${user.loja_id} socket=${client.id}`,
            );
          }
        } else if (payload.versao_id) {
          // Token de aprovação público
          client.data.versaoId = payload.versao_id;
          client.data.tipo = 'cliente';
          client.data.tokenAprovacao = token;

          this.logger.debug(
            `WS arte cliente público versao=${payload.versao_id} socket=${client.id}`,
          );
        }
      } catch (error) {
        const autenticado = await this.autenticarTokenLinkPublico(client, token);
        if (!autenticado) {
          this.logger.warn(
            `Token inválido para cliente ${client.id}: ${error.message}`,
          );
        }
      }
    } else {
      this.logger.debug(`WS arte sem token socket=${client.id}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`WS arte desconectado socket=${client.id}`);
  }

  @SubscribeMessage('join_arte_versao')
  async handleJoinArteVersao(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { versaoId: string },
  ) {
    try {
      const { versaoId } = data;

      // Verificar se a versão existe
      const versao = await this.prisma.arteVersao.findUnique({
        where: { id: versaoId },
        include: {
          os: {
            select: { loja_id: true },
          },
        },
      });

      if (!versao) {
        client.emit('error', { message: 'Versão não encontrada' });
        return;
      }

      // Verificar permissões baseado no tipo de cliente
      if (client.data.tipo === 'designer') {
        // Designer deve pertencer à mesma loja
        if (client.data.lojaId !== versao.os.loja_id) {
          client.emit('error', { message: 'Acesso negado' });
          return;
        }
      } else if (client.data.tipo === 'cliente') {
        const linkAprovacao = await this.prisma.arteLinkAprovacao.findFirst({
          where: {
            token_publico: client.data.tokenAprovacao,
          },
          include: {
            versao: true,
          },
        });

        if (!linkAprovacao) {
          client.emit('error', { message: 'Token inválido para esta versão' });
          return;
        }

        if (linkAprovacao.expira_em && linkAprovacao.expira_em < new Date()) {
          client.emit('error', { message: 'Link de aprovação expirado' });
          return;
        }

        if (linkAprovacao.versao.os_id !== versao.os_id) {
          client.emit('error', { message: 'Token inválido para esta versão' });
          return;
        }
      } else {
        client.emit('error', { message: 'Autenticação necessária' });
        return;
      }

      // Entrar na sala da versão
      await client.join(`arte_versao_${versaoId}`);
      client.data.versaoId = versaoId;

      this.logger.debug(
        `WS arte join versao=${versaoId} socket=${client.id}`,
      );

      // Notificar outros clientes na sala
      client.to(`arte_versao_${versaoId}`).emit('user_joined_arte', {
        clientId: client.id,
        tipo: client.data.tipo,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error('Erro ao entrar na sala da versão:', error);
      client.emit('error', { message: 'Erro interno do servidor' });
    }
  }

  @SubscribeMessage('leave_arte_versao')
  async handleLeaveArteVersao(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { versaoId: string },
  ) {
    const { versaoId } = data;

    await client.leave(`arte_versao_${versaoId}`);
    delete client.data.versaoId;

    this.logger.debug(`WS arte leave versao=${versaoId} socket=${client.id}`);

    // Notificar outros clientes na sala
    client.to(`arte_versao_${versaoId}`).emit('user_left_arte', {
      clientId: client.id,
      tipo: client.data.tipo,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('typing_arte')
  async handleTypingArte(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { versaoId: string; isTyping: boolean },
  ) {
    const { versaoId, isTyping } = data;

    // Verificar se o cliente está na sala da versão
    if (!client.rooms.has(`arte_versao_${versaoId}`)) {
      client.emit('error', { message: 'Você não está nesta sala' });
      return;
    }

    client.to(`arte_versao_${versaoId}`).emit('user_typing_arte', {
      clientId: client.id,
      tipo: client.data.tipo,
      isTyping,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('mensagem_lida')
  async handleMensagemLida(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { versaoId: string; mensagemId: string },
  ) {
    try {
      const { versaoId, mensagemId } = data;

      // Verificar se o cliente está na sala da versão
      if (!client.rooms.has(`arte_versao_${versaoId}`)) {
        client.emit('error', { message: 'Você não está nesta sala' });
        return;
      }

      // Marcar mensagem como lida no banco
      await this.prisma.arteMensagem.update({
        where: { id: mensagemId },
        data: {
          lida: true,
          data_leitura: new Date(),
        },
      });

      // Notificar outros clientes na sala
      client.to(`arte_versao_${versaoId}`).emit('mensagem_marcada_lida', {
        mensagemId,
        lidaPor: client.data.tipo,
        timestamp: new Date().toISOString(),
      });

      this.logger.debug(
        `WS arte mensagem lida id=${mensagemId} tipo=${client.data.tipo}`,
      );
    } catch (error) {
      this.logger.error('Erro ao marcar mensagem como lida:', error);
      client.emit('error', { message: 'Erro ao marcar mensagem como lida' });
    }
  }

  @SubscribeMessage('ping_arte')
  handlePingArte(@ConnectedSocket() client: Socket) {
    client.emit('pong_arte', {
      timestamp: new Date().toISOString(),
      tipo: client.data.tipo,
    });
  }

  private async autenticarTokenLinkPublico(
    client: Socket,
    token: string,
  ): Promise<boolean> {
    const link = await this.prisma.arteLinkAprovacao.findUnique({
      where: { token_publico: token },
      include: {
        versao: { select: { os_id: true, loja_id: true } },
      },
    });

    if (!link) return false;
    if (link.expira_em && link.expira_em < new Date()) return false;

    client.data.tipo = 'cliente';
    client.data.tokenAprovacao = token;
    client.data.lojaId = link.versao.loja_id;

    this.logger.debug(
      `WS arte cliente público (link) os=${link.versao.os_id} socket=${client.id}`,
    );
    return true;
  }

  /**
   * Método público para emitir nova mensagem para todos na sala da versão e da loja (kanban).
   */
  async emitirNovaMensagem(
    versaoId: string | null | undefined,
    mensagem: Record<string, unknown>,
  ) {
    try {
      const payload = {
        mensagem,
        timestamp: new Date().toISOString(),
      };

      if (versaoId) {
        this.server.to(`arte_versao_${versaoId}`).emit('nova_mensagem_arte', payload);
        this.logger.debug(`WS arte emit nova_mensagem versao=${versaoId}`);
      }

      const lojaId = mensagem.loja_id as string | undefined;
      if (lojaId) {
        this.server.to(`loja_${lojaId}`).emit('nova_mensagem_arte', payload);
        this.logger.debug(`WS arte emit nova_mensagem loja=${lojaId}`);
      }
    } catch (error) {
      this.logger.error('Erro ao emitir nova mensagem:', error);
    }
  }

  /**
   * Notifica equipe (kanban) que mensagens do cliente foram lidas em um produto.
   */
  async emitirMensagensLidas(
    lojaId: string,
    data: { os_id: string; produto_id: string; versao_id?: string | null },
  ) {
    try {
      this.server.to(`loja_${lojaId}`).emit('mensagens_lidas_arte', {
        ...data,
        timestamp: new Date().toISOString(),
      });
      this.logger.debug(
        `WS arte emit mensagens_lidas loja=${lojaId} produto=${data.produto_id}`,
      );
    } catch (error) {
      this.logger.error('Erro ao emitir mensagens lidas:', error);
    }
  }

  async emitirStatusArteAtualizado(
    lojaId: string,
    data: { item_id: string; os_id: string; status_arte: string },
  ) {
    try {
      const payload = {
        ...data,
        timestamp: new Date().toISOString(),
      };
      this.server.to(`loja_${lojaId}`).emit('status_arte_atualizado', payload);
      this.logger.debug(
        `WS arte emit status_arte item=${data.item_id} status=${data.status_arte}`,
      );
    } catch (error) {
      this.logger.error('Erro ao emitir status arte:', error);
    }
  }

  /**
   * Método público para emitir atualização de contadores
   * Será chamado quando mensagens forem marcadas como lidas
   */
  async emitirContadorAtualizado(
    versaoId: string,
    produtoId: string,
    dadosContador: Record<string, unknown>,
    lojaId?: string,
  ) {
    try {
      const payload = {
        produtoId,
        dadosContador,
        timestamp: new Date().toISOString(),
      };

      this.server.to(`arte_versao_${versaoId}`).emit('contador_atualizado', payload);

      if (lojaId) {
        this.server.to(`loja_${lojaId}`).emit('contador_atualizado', {
          ...payload,
          versaoId,
        });
      }

      this.logger.debug(`WS arte emit contador versao=${versaoId}`);
    } catch (error) {
      this.logger.error('Erro ao emitir contador atualizado:', error);
    }
  }
}
