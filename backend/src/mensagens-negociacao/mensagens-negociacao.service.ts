import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMensagemNegociacaoDto } from '../orcamentos/dto/create-mensagem-negociacao.dto';
import { NotificacoesService } from '../notificacoes/notificacoes.service';
import { WebsocketsService } from '../websockets/websockets.service';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MensagensNegociacaoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificacoesService: NotificacoesService,
    private readonly websocketsService: WebsocketsService
  ) {}

  /**
   * Criar uma nova mensagem (público)
   */
  async createPublico(orcamentoId: string, dto: CreateMensagemNegociacaoDto) {
    return this.createPublicoComAnexo(orcamentoId, dto, undefined);
  }

  /**
   * Criar uma nova mensagem (público) com suporte a anexo
   */
  async createPublicoComAnexo(orcamentoId: string, dto: CreateMensagemNegociacaoDto, file?: Express.Multer.File) {
    // Verificar se o orçamento existe
    const orcamento = await this.prisma.orcamento.findUnique({
      where: { id: orcamentoId },
    });

    if (!orcamento) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    let anexoInfo: any = null;

    // Processar arquivo se existir
    if (file) {
      // Validar tipo de arquivo
      const tiposPermitidos = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 'application/zip', 'application/x-zip-compressed'];
      if (!tiposPermitidos.includes(file.mimetype)) {
        throw new BadRequestException('Tipo de arquivo não permitido. Use apenas JPG, PNG, PDF ou ZIP.');
      }

      // Validar tamanho (5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new BadRequestException('Arquivo muito grande. Tamanho máximo: 5MB.');
      }

      // Salvar arquivo (em produção seria para um serviço de storage)
      const uploadDir = path.join(process.cwd(), 'uploads', 'anexos');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const extensao = path.extname(file.originalname);
      const nomeArquivo = `${uuidv4()}${extensao}`;
      const caminhoArquivo = path.join(uploadDir, nomeArquivo);
      
      console.log('📎 Tentando salvar arquivo em:', caminhoArquivo);
      fs.writeFileSync(caminhoArquivo, file.buffer);
      console.log('📎 Arquivo salvo com sucesso!');

      anexoInfo = {
        nome_arquivo: file.originalname,
        url_arquivo: `/uploads/anexos/${nomeArquivo}`,
        tipo_arquivo: file.mimetype,
        tamanho: file.size,
      };

      console.log('📎 Arquivo salvo:', anexoInfo);
    }

    // Criar a mensagem
    const mensagem = await this.prisma.mensagemNegociacao.create({
      data: {
        orcamento_id: orcamentoId,
        mensagem: dto.mensagem || (file ? `Arquivo enviado: ${file.originalname}` : ''),
        tipo: dto.tipo,
        autor_nome: dto.autor_nome,
        autor_email: dto.autor_email,
        visualizada: false,
        anexos: anexoInfo ? JSON.stringify([anexoInfo]) : (dto.anexos ? JSON.stringify(dto.anexos) : undefined),
      },
    });

    // Emitir evento via WebSocket
    this.websocketsService.emitToLoja(orcamento.loja_id, 'nova_mensagem', {
      orcamento_id: orcamentoId,
      mensagem: {
        id: mensagem.id,
        mensagem: mensagem.mensagem,
        tipo: mensagem.tipo,
        autor_nome: mensagem.autor_nome,
        visualizada: mensagem.visualizada,
        criado_em: mensagem.criado_em,
        anexos: anexoInfo ? [anexoInfo] : [],
      },
    });

    return mensagem;
  }

  /**
   * Criar uma nova mensagem (autenticado)
   */
  async create(orcamentoId: string, dto: CreateMensagemNegociacaoDto, lojaId: string) {
    // Verificar se o orçamento existe e pertence à loja
    const orcamento = await this.prisma.orcamento.findFirst({
      where: {
        id: orcamentoId,
        loja_id: lojaId,
      },
    });

    if (!orcamento) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    // Criar a mensagem
    const mensagem = await this.prisma.mensagemNegociacao.create({
      data: {
        orcamento_id: orcamentoId,
        mensagem: dto.mensagem,
        tipo: dto.tipo,
        autor_nome: dto.autor_nome,
        autor_email: dto.autor_email,
        visualizada: dto.visualizada || false,
        anexos: dto.anexos ? JSON.stringify(dto.anexos) : undefined,
      },
      include: {
        anexos_mensagem: true,
      },
    });

    // Criar notificação para nova mensagem
    if (dto.tipo === 'CLIENTE') {
      await this.notificacoesService.notificarNovaMensagem(
        orcamentoId,
        lojaId,
        dto.autor_nome || 'Cliente'
      );
    }

    // Emitir evento WebSocket para nova mensagem
    await this.websocketsService.emitToOrcamento(orcamentoId, 'new_message', {
      message: mensagem,
      timestamp: new Date().toISOString(),
    });

    return mensagem;
  }

  /**
   * Listar todas as mensagens de um orçamento (público)
   */
  async findAllPublico(orcamentoId: string) {
    // Verificar se o orçamento existe
    const orcamento = await this.prisma.orcamento.findUnique({
      where: {
        id: orcamentoId,
      },
    });

    if (!orcamento) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    // Buscar mensagens ordenadas por data de criação
    const mensagens = await this.prisma.mensagemNegociacao.findMany({
      where: {
        orcamento_id: orcamentoId,
      },
      include: {
        anexos_mensagem: {
          orderBy: {
            criado_em: 'asc',
          },
        },
      },
      orderBy: {
        criado_em: 'asc',
      },
    });

    return mensagens.map(mensagem => ({
      ...mensagem,
      anexos: mensagem.anexos ? JSON.parse(mensagem.anexos as string) : [],
    }));
  }

  /**
   * Listar todas as mensagens de um orçamento (autenticado)
   */
  async findAll(orcamentoId: string, lojaId: string) {
    // Verificar se o orçamento existe e pertence à loja
    const orcamento = await this.prisma.orcamento.findFirst({
      where: {
        id: orcamentoId,
        loja_id: lojaId,
      },
    });

    if (!orcamento) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    // Buscar mensagens ordenadas por data de criação
    const mensagens = await this.prisma.mensagemNegociacao.findMany({
      where: {
        orcamento_id: orcamentoId,
      },
      include: {
        anexos_mensagem: {
          orderBy: {
            criado_em: 'asc',
          },
        },
      },
      orderBy: {
        criado_em: 'asc',
      },
    });

    return mensagens.map(mensagem => ({
      ...mensagem,
      anexos: mensagem.anexos ? JSON.parse(mensagem.anexos as string) : [],
    }));
  }

  /**
   * Marcar mensagem como visualizada (público)
   */
  async marcarComoVisualizadaPublico(orcamentoId: string, mensagemId: string) {
    // Verificar se o orçamento existe
    const orcamento = await this.prisma.orcamento.findUnique({
      where: { id: orcamentoId },
    });

    if (!orcamento) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    // Verificar se a mensagem existe e pertence ao orçamento
    const mensagem = await this.prisma.mensagemNegociacao.findFirst({
      where: {
        id: mensagemId,
        orcamento_id: orcamentoId,
      },
    });

    if (!mensagem) {
      throw new NotFoundException('Mensagem não encontrada');
    }

    // Marcar como visualizada
    const mensagemAtualizada = await this.prisma.mensagemNegociacao.update({
      where: { id: mensagemId },
      data: { visualizada: true },
    });

    return mensagemAtualizada;
  }

  /**
   * Marcar mensagem como visualizada (autenticado)
   */
  async marcarComoVisualizada(mensagemId: string, lojaId: string) {
    // Verificar se a mensagem existe e pertence a um orçamento da loja
    const mensagem = await this.prisma.mensagemNegociacao.findFirst({
      where: {
        id: mensagemId,
        orcamento: {
          loja_id: lojaId,
        },
      },
    });

    if (!mensagem) {
      throw new NotFoundException('Mensagem não encontrada');
    }

    // Marcar como visualizada
    const mensagemAtualizada = await this.prisma.mensagemNegociacao.update({
      where: {
        id: mensagemId,
      },
      data: {
        visualizada: true,
      },
    });

    // Emitir evento WebSocket para mensagem lida
    await this.websocketsService.emitToOrcamento(mensagem.orcamento_id, 'message_read', {
      messageId: mensagemId,
      timestamp: new Date().toISOString(),
    });

    return mensagemAtualizada;
  }

  /**
   * Upload de anexo para uma mensagem
   */
  async uploadAnexo(mensagemId: string, file: Express.Multer.File, lojaId: string) {
    // Verificar se a mensagem existe e pertence a um orçamento da loja
    const mensagem = await this.prisma.mensagemNegociacao.findFirst({
      where: {
        id: mensagemId,
        orcamento: {
          loja_id: lojaId,
        },
      },
    });

    if (!mensagem) {
      throw new NotFoundException('Mensagem não encontrada');
    }

    // Validar tipo de arquivo
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!tiposPermitidos.includes(file.mimetype)) {
      throw new BadRequestException('Tipo de arquivo não permitido. Use apenas JPG, PNG ou PDF.');
    }

    // Validar tamanho (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('Arquivo muito grande. Tamanho máximo: 5MB.');
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const extensao = file.originalname.split('.').pop();
    const nomeArquivo = `${timestamp}_${file.originalname}`;
    
    // Em produção, aqui seria feito upload para um serviço de storage
    // Por enquanto, vamos simular salvando apenas o nome
    const urlArquivo = `/uploads/anexos/${nomeArquivo}`;

    // Criar registro do anexo
    const anexo = await this.prisma.anexoMensagem.create({
      data: {
        mensagem_id: mensagemId,
        nome_arquivo: file.originalname,
        url_arquivo: urlArquivo,
        tipo_arquivo: file.mimetype,
        tamanho: file.size,
      },
    });

    return anexo;
  }

  /**
   * Buscar mensagens não visualizadas de um orçamento
   */
  async findNaoVisualizadas(orcamentoId: string, lojaId: string) {
    const mensagens = await this.prisma.mensagemNegociacao.findMany({
      where: {
        orcamento_id: orcamentoId,
        orcamento: {
          loja_id: lojaId,
        },
        visualizada: false,
      },
      orderBy: {
        criado_em: 'desc',
      },
    });

    return mensagens;
  }

  /**
   * Contar mensagens não visualizadas de um orçamento
   */
  async countNaoVisualizadas(orcamentoId: string, lojaId: string) {
    return this.prisma.mensagemNegociacao.count({
      where: {
        orcamento_id: orcamentoId,
        orcamento: {
          loja_id: lojaId,
        },
        visualizada: false,
      },
    });
  }
} 