import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class WebsocketsService {
  private server: Server;

  setServer(server: Server) {
    this.server = server;
  }

  /**
   * Enviar mensagem para todos os clientes conectados a um orçamento específico
   */
  async emitToOrcamento(orcamentoId: string, event: string, data: any) {
    if (this.server) {
      this.server.to(`orcamento_${orcamentoId}`).emit(event, data);
    }
  }

  /**
   * Enviar notificação para todos os usuários de uma loja
   */
  async emitToLoja(lojaId: string, event: string, data: any) {
    if (this.server) {
      this.server.to(`loja_${lojaId}`).emit(event, data);
    }
  }

  /**
   * Enviar mensagem para um usuário específico
   */
  async emitToUser(userId: string, event: string, data: any) {
    if (this.server) {
      this.server.to(`user_${userId}`).emit(event, data);
    }
  }

  /**
   * Obter número de clientes conectados a um orçamento
   */
  async getOrcamentoClientsCount(orcamentoId: string): Promise<number> {
    if (this.server) {
      const room = this.server.sockets.adapter.rooms.get(`orcamento_${orcamentoId}`);
      return room ? room.size : 0;
    }
    return 0;
  }

  /**
   * Obter número de clientes conectados a uma loja
   */
  async getLojaClientsCount(lojaId: string): Promise<number> {
    if (this.server) {
      const room = this.server.sockets.adapter.rooms.get(`loja_${lojaId}`);
      return room ? room.size : 0;
    }
    return 0;
  }
} 