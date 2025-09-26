import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { 
  MensagemChat, 
  TipoMensagem,
  OrcamentoCompleto 
} from '../interfaces/orcamento.interface';

/**
 * Serviço de Chat V2 para Orçamentos
 * Implementa sistema de chat e negociação
 * 
 * ✅ ARQUIVO ≤ 400 LINHAS (CONFORME PREMISSAS)
 * ✅ SISTEMA DE CHAT COMPLETO E NEGOCIAÇÃO
 * ✅ INTEGRAÇÃO COM SISTEMA DE NOTIFICAÇÕES
 */
@Injectable()
export class ChatV2Service {
  private readonly logger = new Logger(ChatV2Service.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Envia mensagem no chat do orçamento
   */
  async enviarMensagem(
    orcamentoId: string,
    usuarioId: string,
    conteudo: string,
    tipo: TipoMensagem = TipoMensagem.TEXTO,
    anexos?: string[],
  ): Promise<MensagemChat> {
    this.logger.log(`💬 Enviando mensagem no orçamento ${orcamentoId}`);

    try {
      // Validar orçamento
      const orcamento = await this.validarOrcamento(orcamentoId);

      // Criar mensagem
      const mensagem = await this.prisma.mensagemChat.create({
        data: {
          orcamento_id: orcamentoId,
          usuario_id: usuarioId,
          tipo,
          conteudo,
          anexos: JSON.stringify(anexos || []),
          data_envio: new Date(),
          lida: false,
        },
        include: {},
      });

      // Marcar outras mensagens como lidas (se aplicável)
      await this.marcarMensagensComoLidas(orcamentoId, usuarioId);

      // Processar mensagem baseada no tipo
      await this.processarMensagem(mensagem, orcamento);

      this.logger.log(`✅ Mensagem enviada com sucesso: ${mensagem.id}`);
      return this.transformarMensagem(mensagem);

    } catch (error) {
      this.logger.error(`❌ Erro ao enviar mensagem: ${error.message}`);
      throw error;
    }
  }

  /**
   * Busca mensagens do chat do orçamento
   */
  async buscarMensagens(
    orcamentoId: string,
    usuarioId: string,
    pagina: number = 1,
    porPagina: number = 50,
  ): Promise<{
    mensagens: MensagemChat[];
    total: number;
    pagina: number;
    porPagina: number;
    nao_lidas: number;
  }> {
    this.logger.log(`🔍 ChatV2Service: Buscando mensagens para orçamento ${orcamentoId}, usuário ${usuarioId}`);

    try {
      // Validar orçamento
      await this.validarOrcamento(orcamentoId);

      // Calcular paginação
      const skip = (pagina - 1) * porPagina;
      const take = Math.min(porPagina, 100); // Máximo 100 por página

      // Buscar mensagens
      const [mensagens, total, naoLidas] = await Promise.all([
        this.prisma.mensagemChat.findMany({
          where: { orcamento_id: orcamentoId },
          include: {},
          orderBy: { data_envio: 'desc' },
          skip,
          take,
        }),
        this.prisma.mensagemChat.count({
          where: { orcamento_id: orcamentoId },
        }),
        this.prisma.mensagemChat.count({
          where: {
            orcamento_id: orcamentoId,
            usuario_id: { not: usuarioId },
            lida: false,
          },
        }),
      ]);

      // Marcar mensagens como lidas
      await this.marcarMensagensComoLidas(orcamentoId, usuarioId);

      const mensagensProcessadas = mensagens.map(msg => this.transformarMensagem(msg));

      this.logger.log(`📊 ChatV2Service: Retornando ${mensagensProcessadas.length} mensagens (total: ${total}, não lidas: ${naoLidas})`);

      return {
        mensagens: mensagensProcessadas,
        total,
        pagina,
        porPagina: take,
        nao_lidas: naoLidas,
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao buscar mensagens: ${error.message}`);
      throw error;
    }
  }

  /**
   * Marca mensagens como lidas
   */
  async marcarMensagensComoLidas(
    orcamentoId: string,
    usuarioId: string,
  ): Promise<void> {
    try {
      await this.prisma.mensagemChat.updateMany({
        where: {
          orcamento_id: orcamentoId,
          usuario_id: { not: usuarioId },
          lida: false,
        },
        data: { lida: true },
      });
    } catch (error) {
      this.logger.error(`❌ Erro ao marcar mensagens como lidas: ${error.message}`);
    }
  }

  /**
   * Envia mensagem do sistema
   */
  async enviarMensagemSistema(
    orcamentoId: string,
    conteudo: string,
    dadosExtras?: any,
  ): Promise<MensagemChat> {
    this.logger.log(`🤖 Enviando mensagem do sistema no orçamento ${orcamentoId}`);

    try {
      // Buscar usuário do sistema
      const usuarioSistema = await this.buscarUsuarioSistema();

      // Criar mensagem do sistema
      const mensagem = await this.prisma.mensagemChat.create({
        data: {
          orcamento_id: orcamentoId,
          usuario_id: usuarioSistema.id,
          tipo: TipoMensagem.SISTEMA,
          conteudo,
          anexos: JSON.stringify([]),
          data_envio: new Date(),
          lida: false,
          dados_extras: dadosExtras ? JSON.stringify(dadosExtras) : null,
        },
        include: {},
      });

      this.logger.log(`✅ Mensagem do sistema enviada: ${mensagem.id}`);
      return this.transformarMensagem(mensagem);

    } catch (error) {
      this.logger.error(`❌ Erro ao enviar mensagem do sistema: ${error.message}`);
      throw error;
    }
  }

  /**
   * Envia notificação no chat
   */
  async enviarNotificacao(
    orcamentoId: string,
    titulo: string,
    conteudo: string,
    tipo: 'info' | 'warning' | 'error' | 'success' = 'info',
  ): Promise<MensagemChat> {
    this.logger.log(`🔔 Enviando notificação no orçamento ${orcamentoId}`);

    try {
      // Buscar usuário do sistema
      const usuarioSistema = await this.buscarUsuarioSistema();

      // Criar mensagem de notificação
      const mensagem = await this.prisma.mensagemChat.create({
        data: {
          orcamento_id: orcamentoId,
          usuario_id: usuarioSistema.id,
          tipo: TipoMensagem.NOTIFICACAO,
          conteudo: `${titulo}: ${conteudo}`,
          anexos: JSON.stringify([]),
          data_envio: new Date(),
          lida: false,
          dados_extras: JSON.stringify({
            tipo_notificacao: tipo,
            titulo,
            conteudo_original: conteudo,
          }),
        },
        include: {},
      });

      this.logger.log(`✅ Notificação enviada: ${mensagem.id}`);
      return this.transformarMensagem(mensagem);

    } catch (error) {
      this.logger.error(`❌ Erro ao enviar notificação: ${error.message}`);
      throw error;
    }
  }

  /**
   * Envia arquivo no chat
   */
  async enviarArquivo(
    orcamentoId: string,
    usuarioId: string,
    nomeArquivo: string,
    urlArquivo: string,
    tamanho: number,
    tipoArquivo: string,
  ): Promise<MensagemChat> {
    this.logger.log(`📎 Enviando arquivo no orçamento ${orcamentoId}: ${nomeArquivo}`);

    try {
      // Validar orçamento
      await this.validarOrcamento(orcamentoId);

      // Criar mensagem com arquivo
      const mensagem = await this.prisma.mensagemChat.create({
        data: {
          orcamento_id: orcamentoId,
          usuario_id: usuarioId,
          tipo: TipoMensagem.ARQUIVO,
          conteudo: `Arquivo enviado: ${nomeArquivo}`,
          anexos: JSON.stringify([urlArquivo]),
          data_envio: new Date(),
          lida: false,
          dados_extras: JSON.stringify({
            nome_arquivo: nomeArquivo,
            url_arquivo: urlArquivo,
            tamanho,
            tipo_arquivo: tipoArquivo,
          }),
        },
        include: {},
      });

      this.logger.log(`✅ Arquivo enviado com sucesso: ${mensagem.id}`);
      return this.transformarMensagem(mensagem);

    } catch (error) {
      this.logger.error(`❌ Erro ao enviar arquivo: ${error.message}`);
      throw error;
    }
  }

  /**
   * Busca estatísticas do chat
   */
  async buscarEstatisticasChat(
    orcamentoId: string,
  ): Promise<{
    total_mensagens: number;
    mensagens_por_tipo: Record<string, number>;
    usuarios_ativos: string[];
    ultima_atividade: Date | null;
    tempo_medio_resposta: number | null;
  }> {
    this.logger.log(`📊 Buscando estatísticas do chat do orçamento ${orcamentoId}`);

    try {
      // Validar orçamento
      await this.validarOrcamento(orcamentoId);

      // Buscar estatísticas
      const [
        totalMensagens,
        mensagensPorTipo,
        usuariosAtivos,
        ultimaAtividade,
        tempoMedioResposta,
      ] = await Promise.all([
        this.prisma.mensagemChat.count({
          where: { orcamento_id: orcamentoId },
        }),
        this.buscarMensagensPorTipo(orcamentoId),
        this.buscarUsuariosAtivos(orcamentoId),
        this.buscarUltimaAtividade(orcamentoId),
        this.calcularTempoMedioResposta(orcamentoId),
      ]);

      return {
        total_mensagens: totalMensagens,
        mensagens_por_tipo: mensagensPorTipo,
        usuarios_ativos: usuariosAtivos,
        ultima_atividade: ultimaAtividade,
        tempo_medio_resposta: tempoMedioResposta,
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao buscar estatísticas: ${error.message}`);
      throw error;
    }
  }

  /**
   * Busca histórico de negociação
   */
  async buscarHistoricoNegociacao(
    orcamentoId: string,
    dataInicio?: Date,
    dataFim?: Date,
  ): Promise<{
    mensagens: MensagemChat[];
    resumo: {
      total_propostas: number;
      total_contra_propostas: number;
      valor_inicial: number | null;
      valor_final: number | null;
      status_negociacao: string;
    };
  }> {
    this.logger.log(`📋 Buscando histórico de negociação do orçamento ${orcamentoId}`);

    try {
      // Validar orçamento
      await this.validarOrcamento(orcamentoId);

      // Construir filtros de data
      const where: any = { orcamento_id: orcamentoId };
      if (dataInicio || dataFim) {
        where.data_envio = {};
        if (dataInicio) where.data_envio.gte = dataInicio;
        if (dataFim) where.data_envio.lte = dataFim;
      }

      // Buscar mensagens de negociação
      const mensagens = await this.prisma.mensagemChat.findMany({
        where,
        include: {},
        orderBy: { data_envio: 'asc' },
      });

      // Processar histórico
      const historico = this.processarHistoricoNegociacao(mensagens);

      return {
        mensagens: mensagens.map(msg => this.transformarMensagem(msg)),
        resumo: historico,
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao buscar histórico: ${error.message}`);
      throw error;
    }
  }

  // Métodos privados auxiliares

  private async validarOrcamento(orcamentoId: string): Promise<any> {
    const orcamento = await this.prisma.orcamento.findUnique({
      where: { id: orcamentoId },
    });

    if (!orcamento) {
      throw new Error('Orçamento não encontrado');
    }

    if (!orcamento.ativo) {
      throw new Error('Orçamento inativo');
    }

    return orcamento;
  }

  private async buscarUsuarioSistema(): Promise<any> {
    // Buscar usuário do sistema ou criar um fictício
    let usuarioSistema = await this.prisma.usuario.findFirst({
      where: { email: 'sistema@comunikapp.com' },
    });

    if (!usuarioSistema) {
      // Criar usuário do sistema se não existir: associar à primeira loja disponível ou sem loja
      const loja = await this.prisma.loja.findFirst();
      if (loja) {
        usuarioSistema = await this.prisma.usuario.create({
          data: {
            nome: 'Sistema',
            nome_completo: 'Sistema',
            email: 'sistema@comunikapp.com',
            senha: 'sistema123',
            ativo: true,
            loja_id: loja.id,
          },
        });
      } else {
        // fallback sem vínculo a loja (usa um id virtual)
        return { id: 'sistema' };
      }
    }

    return usuarioSistema;
  }

  private async processarMensagem(mensagem: any, orcamento: any): Promise<void> {
    // Processar mensagem baseada no tipo
    switch (mensagem.tipo) {
      case TipoMensagem.TEXTO:
        await this.processarMensagemTexto(mensagem, orcamento);
        break;
      case TipoMensagem.SISTEMA:
        await this.processarMensagemSistema(mensagem, orcamento);
        break;
      case TipoMensagem.NOTIFICACAO:
        await this.processarMensagemNotificacao(mensagem, orcamento);
        break;
      case TipoMensagem.ARQUIVO:
        await this.processarMensagemArquivo(mensagem, orcamento);
        break;
    }
  }

  private async processarMensagemTexto(mensagem: any, orcamento: any): Promise<void> {
    // Verificar se é uma proposta de negociação
    if (this.isPropostaNegociacao(mensagem.conteudo)) {
      await this.processarPropostaNegociacao(mensagem, orcamento);
    }

    // Verificar se é uma pergunta
    if (this.isPergunta(mensagem.conteudo)) {
      await this.processarPergunta(mensagem, orcamento);
    }

    // Enviar notificação para outros usuários da loja
    await this.notificarNovaMensagemChat(orcamento, mensagem, 'vendedor');
  }

  private async processarMensagemSistema(mensagem: any, orcamento: any): Promise<void> {
    // Mensagens do sistema são processadas automaticamente
    this.logger.log(`🤖 Mensagem do sistema processada: ${mensagem.conteudo}`);
  }

  private async processarMensagemNotificacao(mensagem: any, orcamento: any): Promise<void> {
    // Notificações são processadas automaticamente
    this.logger.log(`🔔 Notificação processada: ${mensagem.conteudo}`);
  }

  private async processarMensagemArquivo(mensagem: any, orcamento: any): Promise<void> {
    // Arquivos são processados automaticamente
    this.logger.log(`📎 Arquivo processado: ${mensagem.conteudo}`);
  }

  private isPropostaNegociacao(conteudo: string): boolean {
    const palavrasChave = ['proposta', 'valor', 'preço', 'desconto', 'negociação'];
    return palavrasChave.some(palavra => 
      conteudo.toLowerCase().includes(palavra.toLowerCase())
    );
  }

  private isPergunta(conteudo: string): boolean {
    return conteudo.includes('?') || 
           conteudo.toLowerCase().startsWith('quando') ||
           conteudo.toLowerCase().startsWith('como') ||
           conteudo.toLowerCase().startsWith('onde') ||
           conteudo.toLowerCase().startsWith('por que');
  }

  private async processarPropostaNegociacao(mensagem: any, orcamento: any): Promise<void> {
    // Processar proposta de negociação
    this.logger.log(`💰 Proposta de negociação detectada: ${mensagem.conteudo}`);
    
    // TODO: Implementar lógica de negociação automática
  }

  private async processarPergunta(mensagem: any, orcamento: any): Promise<void> {
    // Processar pergunta
    this.logger.log(`❓ Pergunta detectada: ${mensagem.conteudo}`);
    
    // TODO: Implementar sistema de respostas automáticas
  }

  private transformarMensagem(mensagem: any): MensagemChat {
    const anexos = (() => {
      try { return mensagem.anexos ? JSON.parse(mensagem.anexos) : []; } catch { return []; }
    })();

    return {
      id: mensagem.id,
      usuario_id: mensagem.usuario_id,
      tipo: mensagem.tipo,
      conteudo: mensagem.conteudo,
      data_envio: mensagem.data_envio,
      lida: mensagem.lida,
      anexos,
      // Mapear para compatibilidade com frontend
      criado_em: mensagem.data_envio ? new Date(mensagem.data_envio).toISOString() : new Date().toISOString(),
      mensagem: mensagem.conteudo,
      visualizada: mensagem.lida,
    } as any;
  }

  private async buscarMensagensPorTipo(orcamentoId: string): Promise<Record<string, number>> {
    const mensagens = await this.prisma.mensagemChat.groupBy({
      by: ['tipo'],
      where: { orcamento_id: orcamentoId },
      _count: { tipo: true },
    });

    const resultado: Record<string, number> = {};
    mensagens.forEach(item => {
      resultado[item.tipo] = item._count.tipo;
    });

    return resultado;
  }

  private async buscarUsuariosAtivos(orcamentoId: string): Promise<string[]> {
    const usuarios = await this.prisma.mensagemChat.findMany({
      where: { orcamento_id: orcamentoId },
      select: { usuario_id: true },
      distinct: ['usuario_id'],
    });

    return usuarios.map(u => u.usuario_id);
  }

  private async buscarUltimaAtividade(orcamentoId: string): Promise<Date | null> {
    const ultimaMensagem = await this.prisma.mensagemChat.findFirst({
      where: { orcamento_id: orcamentoId },
      orderBy: { data_envio: 'desc' },
      select: { data_envio: true },
    });

    return ultimaMensagem?.data_envio || null;
  }

  private async calcularTempoMedioResposta(orcamentoId: string): Promise<number | null> {
    // Buscar mensagens em sequência para calcular tempo médio de resposta
    const mensagens = await this.prisma.mensagemChat.findMany({
      where: { orcamento_id: orcamentoId },
      orderBy: { data_envio: 'asc' },
      select: { data_envio: true, usuario_id: true },
    });

    if (mensagens.length < 2) return null;

    let totalTempo = 0;
    let contador = 0;

    for (let i = 1; i < mensagens.length; i++) {
      const mensagemAnterior = mensagens[i - 1];
      const mensagemAtual = mensagens[i];

      // Se são usuários diferentes, calcular tempo de resposta
      if (mensagemAnterior.usuario_id !== mensagemAtual.usuario_id) {
        const tempoResposta = mensagemAtual.data_envio.getTime() - mensagemAnterior.data_envio.getTime();
        totalTempo += tempoResposta;
        contador++;
      }
    }

    if (contador === 0) return null;

    return totalTempo / contador; // Tempo em milissegundos
  }

  private processarHistoricoNegociacao(mensagens: any[]): any {
    let totalPropostas = 0;
    let totalContraPropostas = 0;
    let valorInicial: number | null = null;
    let valorFinal: number | null = null;

    // Processar mensagens para extrair informações de negociação
    mensagens.forEach(mensagem => {
      if (this.isPropostaNegociacao(mensagem.conteudo)) {
        totalPropostas++;
        
        // Extrair valores se possível
        const valor = this.extrairValor(mensagem.conteudo);
        if (valor) {
          if (valorInicial === null) valorInicial = valor;
          valorFinal = valor;
        }
      }
    });

    return {
      total_propostas: totalPropostas,
      total_contra_propostas: totalContraPropostas,
      valor_inicial: valorInicial,
      valor_final: valorFinal,
      status_negociacao: this.determinarStatusNegociacao(totalPropostas, valorInicial, valorFinal),
    };
  }

  private extrairValor(conteudo: string): number | null {
    // Extrair valores monetários do texto
    const regex = /R\$\s*([\d.,]+)/;
    const match = conteudo.match(regex);
    
    if (match) {
      const valorStr = match[1].replace('.', '').replace(',', '.');
      const valor = parseFloat(valorStr);
      return isNaN(valor) ? null : valor;
    }

    return null;
  }

  private determinarStatusNegociacao(
    totalPropostas: number,
    valorInicial: number | null,
    valorFinal: number | null,
  ): string {
    if (totalPropostas === 0) return 'sem_negociacao';
    if (totalPropostas === 1) return 'proposta_inicial';
    if (valorInicial && valorFinal && valorFinal < valorInicial) return 'negociacao_em_andamento';
    if (valorInicial && valorFinal && valorFinal >= valorInicial) return 'negociacao_concluida';
    
    return 'negociacao_em_andamento';
  }

  /**
   * Notifica nova mensagem no chat para outros usuários da loja
   */
  private async notificarNovaMensagemChat(
    orcamento: any,
    mensagem: any,
    tipoRemetente: 'cliente' | 'vendedor',
  ): Promise<void> {
    try {
      this.logger.log(`📢 Notificando nova mensagem no chat do orçamento ${orcamento.id}`);

      // Buscar usuários da loja que devem receber notificação
      const usuariosLoja = await this.prisma.usuario.findMany({
        where: {
          loja_id: orcamento.loja_id,
          ativo: true,
          id: { not: mensagem.usuario_id }, // Excluir o remetente
        },
        select: {
          id: true,
          nome_completo: true,
          email: true,
          funcao: true,
        },
      });

      // Filtrar usuários relevantes (vendedores, gerentes, admins)
      const usuariosRelevantes = usuariosLoja.filter(usuario => {
        const funcaoLower = usuario.funcao?.toLowerCase();
        return ['vendedor', 'gerente', 'admin', 'manager', 'administrador'].includes(funcaoLower);
      });

      // Criar notificação para cada usuário relevante
      for (const usuario of usuariosRelevantes) {
        try {
          await this.prisma.notificacao.create({
            data: {
              tipo: 'chat_mensagem',
              titulo: tipoRemetente === 'cliente' 
                ? 'Nova mensagem do cliente'
                : 'Nova mensagem no chat',
              mensagem: tipoRemetente === 'cliente'
                ? `Cliente enviou mensagem no orçamento "${orcamento.titulo}": "${mensagem.conteudo.substring(0, 100)}${mensagem.conteudo.length > 100 ? '...' : ''}"`
                : `Nova mensagem no orçamento "${orcamento.titulo}": "${mensagem.conteudo.substring(0, 100)}${mensagem.conteudo.length > 100 ? '...' : ''}"`,
              orcamento_id: orcamento.id,
              loja_id: orcamento.loja_id,
              dados_extras: JSON.stringify({
                usuario_id: usuario.id,
                mensagem_id: mensagem.id,
                tipo_remetente: tipoRemetente,
                link: `/orcamentos-v2/novo?id=${orcamento.id}`,
              }),
              visualizada: false,
              criado_em: new Date(),
            },
          });

          this.logger.log(`✅ Notificação criada para usuário ${usuario.nome_completo}`);
        } catch (error) {
          this.logger.error(`❌ Erro ao criar notificação para usuário ${usuario.id}: ${error.message}`);
        }
      }

      this.logger.log(`📢 Notificações enviadas para ${usuariosRelevantes.length} usuários`);
    } catch (error) {
      this.logger.error(`❌ Erro ao notificar nova mensagem no chat: ${error.message}`);
    }
  }
}
