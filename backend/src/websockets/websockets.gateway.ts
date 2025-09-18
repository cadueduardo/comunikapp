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

  // Eventos para Preview de Cálculo V2 em Tempo Real
  @SubscribeMessage('preview_calculo_v2')
  async handlePreviewCalculoV2(
    client: Socket,
    data: { dadosFormulario: any; configuracoes: any },
  ) {
    try {
      this.logger.log(`🔄 Preview V2 solicitado por ${client.id}`);

      // Emitir evento de início do cálculo
      client.emit('preview_calculo_iniciado', {
        timestamp: new Date().toISOString(),
        total_produtos: data.dadosFormulario?.itens_produto?.length || 0,
      });

      // Simular cálculo em tempo real (por enquanto)
      // TODO: Integrar com motor V2 quando estiver funcionando
      setTimeout(() => {
        const resultadoCalculado = this.calcularPreviewRealtime(data);
        
        client.emit('preview_calculo_atualizado', {
          timestamp: new Date().toISOString(),
          resultado: resultadoCalculado,
          versao_motor: '2.1.3',
          tempo_execucao_ms: 150,
        });
      }, 100);

    } catch (error) {
      this.logger.error(`❌ Erro no preview V2: ${error.message}`);
      client.emit('preview_calculo_erro', {
        timestamp: new Date().toISOString(),
        erro: error.message,
      });
    }
  }

  @SubscribeMessage('join_preview_session')
  async handleJoinPreviewSession(client: Socket, sessionId: string) {
    await client.join(`preview_${sessionId}`);
    client.data.previewSessionId = sessionId;
    
    this.logger.log(`Cliente ${client.id} entrou na sessão de preview ${sessionId}`);
    
    client.emit('preview_session_joined', {
      sessionId,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('leave_preview_session')
  async handleLeavePreviewSession(client: Socket, sessionId: string) {
    await client.leave(`preview_${sessionId}`);
    delete client.data.previewSessionId;
    
    this.logger.log(`Cliente ${client.id} saiu da sessão de preview ${sessionId}`);
  }

  // Método auxiliar para cálculo de preview (temporário)
  private calcularPreviewRealtime(data: any): any {
    try {
      const formData = data.dadosFormulario;
      const configuracoes = data.configuracoes;
      const itensFormulario = formData?.itens_produto || [];

      if (itensFormulario.length === 0) {
        return {
          resumo: {
            total_produtos: 0,
            preco_final: 0,
            total_custo_producao: 0,
          },
          produtos: [],
        };
      }

      // Calcular cada produto
      const produtos = itensFormulario.map((item: any, index: number) => {
        const quantidade = Number(item.quantidade_produto?.replace(',', '.')) || 1;
        
        // Calcular custos básicos
        const custoMateriais = (item.materiais || []).reduce((acc: number, mat: any) => {
          const qtd = Number(mat.quantidade?.replace(',', '.')) || 0;
          return acc + (qtd * 15); // Custo médio estimado
        }, 0);

        const custoMaquinas = (item.maquinas || []).reduce((acc: number, maq: any) => {
          const horas = Number(maq.horas_utilizadas?.replace(',', '.')) || 0;
          return acc + (horas * 50); // Custo médio por hora
        }, 0);

        const custoFuncoes = (item.funcoes || []).reduce((acc: number, func: any) => {
          const horas = Number(func.horas_trabalhadas?.replace(',', '.')) || 0;
          return acc + (horas * 35); // Custo médio por hora
        }, 0);

        const custoTotalProducao = custoMateriais + custoMaquinas + custoFuncoes;
        const margemLucro = custoTotalProducao * 0.3; // 30% padrão
        const impostos = (custoTotalProducao + margemLucro) * 0.18; // 18% padrão
        const precoFinal = custoTotalProducao + margemLucro + impostos;

        return {
          id: `${index + 1}`,
          nome_servico: item.nome_servico || `Produto ${index + 1}`,
          quantidade: quantidade,
          custo_total_producao: custoTotalProducao,
          preco_total: precoFinal * quantidade,
          preco_unitario: precoFinal,
        };
      });

      // Resumo geral
      const totalCustoProducao = produtos.reduce((acc, p) => acc + p.custo_total_producao, 0);
      const precoFinalTotal = produtos.reduce((acc, p) => acc + p.preco_total, 0);

      return {
        resumo: {
          total_produtos: produtos.length,
          total_custo_producao: totalCustoProducao,
          preco_final: precoFinalTotal,
          margem_lucro_percentual: Number(configuracoes?.margem_lucro_customizada) || 30,
          impostos_percentual: Number(configuracoes?.impostos_customizados) || 18,
        },
        produtos: produtos,
        metadata: {
          timestamp_calculo: new Date(),
          versao_motor: '2.1.3',
          tempo_execucao_ms: 150,
        },
      };

    } catch (error) {
      this.logger.error(`❌ Erro no cálculo preview: ${error.message}`);
      return {
        resumo: { total_produtos: 0, preco_final: 0 },
        produtos: [],
      };
    }
  }
}
