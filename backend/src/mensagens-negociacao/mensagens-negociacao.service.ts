import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMensagemNegociacaoDto } from './dto/create-mensagem-negociacao.dto';
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
    private readonly websocketsService: WebsocketsService,
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
  async createPublicoComAnexo(
    orcamentoId: string,
    dto: CreateMensagemNegociacaoDto,
    file?: Express.Multer.File,
  ) {
    // Validar tipo de mensagem
    const tiposValidos = ['CLIENTE', 'VENDEDOR', 'SISTEMA'];
    if (!tiposValidos.includes(dto.tipo)) {
      throw new BadRequestException(
        `Tipo de mensagem inválido. Tipos permitidos: ${tiposValidos.join(', ')}`,
      );
    }

    // Verificar se o orçamento existe
    const orcamento = await this.prisma.orcamento.findUnique({
      where: { id: orcamentoId },
      include: { cliente: true },
    });

    if (!orcamento) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    let anexoInfo: any = null;

    // Processar arquivo se existir
    if (file) {
      // Validar tipo de arquivo
      const tiposPermitidos = [
        'image/jpeg',
        'image/png',
        'image/jpg',
        'application/pdf',
        'application/zip',
        'application/x-zip-compressed',
      ];
      if (!tiposPermitidos.includes(file.mimetype)) {
        throw new BadRequestException(
          'Tipo de arquivo não permitido. Use apenas JPG, PNG, PDF ou ZIP.',
        );
      }

      // Validar tamanho (5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new BadRequestException(
          'Arquivo muito grande. Tamanho máximo: 5MB.',
        );
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
    const mensagem = await this.prisma.mensagemnegociacao.create({
      data: {
        orcamento_id: orcamentoId,
        mensagem: dto.mensagem,
        tipo: dto.tipo,
        autor_nome: dto.autor_nome,
        autor_email: dto.autor_email,
        anexos: anexoInfo ? JSON.stringify(anexoInfo) : null,
      },
    });

    console.log('📨 Mensagem criada:', mensagem.id);

    // Notificar via WebSocket (desabilitado por enquanto)
    try {
      console.log('📡 WebSocket notification disabled for now');
    } catch (error) {
      console.error('❌ Erro ao notificar via WebSocket:', error);
    }

    // Notificar via email (se configurado)
    try {
      if (orcamento.cliente?.email) {
        console.log('📧 Notificação por email desabilitada por enquanto');
      }
    } catch (error) {
      console.error('❌ Erro ao enviar notificação por email:', error);
    }

    return mensagem;
  }

  /**
   * Criar uma nova mensagem (autenticado)
   */
  async create(
    orcamentoId: string,
    dto: CreateMensagemNegociacaoDto,
    lojaId: string,
  ) {
    // Validar tipo de mensagem
    const tiposValidos = ['CLIENTE', 'VENDEDOR', 'SISTEMA'];
    if (!tiposValidos.includes(dto.tipo)) {
      throw new BadRequestException(
        `Tipo de mensagem inválido. Tipos permitidos: ${tiposValidos.join(', ')}`,
      );
    }

    // Verificar se o orçamento existe e pertence à loja
    const orcamento = await this.prisma.orcamento.findFirst({
      where: { id: orcamentoId, loja_id: lojaId },
    });

    if (!orcamento) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    // Criar a mensagem (sem loja_id pois não existe no schema)
    const mensagem = await this.prisma.mensagemnegociacao.create({
      data: {
        orcamento_id: orcamentoId,
        mensagem: dto.mensagem,
        tipo: dto.tipo,
        autor_nome: dto.autor_nome,
        autor_email: dto.autor_email,
      },
    });

    console.log('📨 Mensagem criada (autenticada):', mensagem.id);

    // Notificar via WebSocket (desabilitado por enquanto)
    try {
      console.log('📡 WebSocket notification disabled for now');
    } catch (error) {
      console.error('❌ Erro ao notificar via WebSocket:', error);
    }

    return mensagem;
  }

  /**
   * Listar todas as mensagens de um orçamento (público)
   */
  async findAllPublico(orcamentoId: string) {
    // Verificar se o orçamento existe
    const orcamento = await this.prisma.orcamento.findUnique({
      where: { id: orcamentoId },
    });

    if (!orcamento) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    // Buscar mensagens ordenadas por data de criação
    const mensagens = await this.prisma.mensagemnegociacao.findMany({
      where: {
        orcamento_id: orcamentoId,
      },
      orderBy: {
        criado_em: 'asc',
      },
    });

    // Mapear para o formato de resposta
    return mensagens.map((mensagem) => ({
      id: mensagem.id,
      mensagem: mensagem.mensagem,
      tipo: mensagem.tipo,
      autor_nome: mensagem.autor_nome,
      autor_email: mensagem.autor_email,
      anexos: mensagem.anexos ? JSON.parse(mensagem.anexos) : null,
      visualizada: mensagem.visualizada,
      criado_em: mensagem.criado_em,
    }));
  }

  /**
   * Listar todas as mensagens de um orçamento (autenticado)
   */
  async findAll(orcamentoId: string, lojaId: string) {
    // Verificar se o orçamento existe e pertence à loja
    const orcamento = await this.prisma.orcamento.findFirst({
      where: { id: orcamentoId, loja_id: lojaId },
    });

    if (!orcamento) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    // Buscar mensagens ordenadas por data de criação
    const mensagens = await this.prisma.mensagemnegociacao.findMany({
      where: {
        orcamento_id: orcamentoId,
      },
      orderBy: {
        criado_em: 'asc',
      },
    });

    // Mapear para o formato de resposta
    return mensagens.map((mensagem) => ({
      id: mensagem.id,
      mensagem: mensagem.mensagem,
      tipo: mensagem.tipo,
      autor_nome: mensagem.autor_nome,
      autor_email: mensagem.autor_email,
      anexos: mensagem.anexos ? JSON.parse(mensagem.anexos) : null,
      visualizada: mensagem.visualizada,
      criado_em: mensagem.criado_em,
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

    // Verificar se a mensagem existe
    const mensagem = await this.prisma.mensagemnegociacao.findFirst({
      where: {
        id: mensagemId,
        orcamento_id: orcamentoId,
      },
    });

    if (!mensagem) {
      throw new NotFoundException('Mensagem não encontrada');
    }

    // Marcar como visualizada
    const mensagemAtualizada = await this.prisma.mensagemnegociacao.update({
      where: { id: mensagemId },
      data: { visualizada: true },
    });

    console.log('👁️ Mensagem marcada como visualizada:', mensagemId);

    return mensagemAtualizada;
  }

  /**
   * Marcar mensagem como visualizada (autenticado)
   */
  async marcarComoVisualizada(
    orcamentoId: string,
    mensagemId: string,
    lojaId?: string,
  ) {
    // Verificar se o orçamento existe
    const orcamento = await this.prisma.orcamento.findUnique({
      where: { id: orcamentoId },
    });

    if (!orcamento) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    // Verificar se a mensagem existe
    const mensagem = await this.prisma.mensagemnegociacao.findFirst({
      where: {
        id: mensagemId,
        orcamento_id: orcamentoId,
      },
    });

    if (!mensagem) {
      throw new NotFoundException('Mensagem não encontrada');
    }

    // Marcar como visualizada
    const mensagemAtualizada = await this.prisma.mensagemnegociacao.update({
      where: { id: mensagemId },
      data: { visualizada: true },
    });

    console.log('👁️ Mensagem marcada como visualizada:', mensagemId);

    return mensagemAtualizada;
  }

  /**
   * Buscar mensagens não visualizadas de um orçamento
   */
  async findNaoVisualizadas(orcamentoId: string, lojaId: string) {
    const mensagens = await this.prisma.mensagemnegociacao.findMany({
      where: {
        orcamento_id: orcamentoId,
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
    const count = await this.prisma.mensagemnegociacao.count({
      where: {
        orcamento_id: orcamentoId,
        visualizada: false,
      },
    });

    return count;
  }

  /**
   * Upload de anexo para uma mensagem existente
   */
  async uploadAnexo(
    orcamentoId: string,
    mensagemId: string,
    file: Express.Multer.File,
    lojaId?: string,
  ) {
    // Verificar se o orçamento existe
    const orcamento = await this.prisma.orcamento.findUnique({
      where: { id: orcamentoId },
    });

    if (!orcamento) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    // Verificar se a mensagem existe
    const mensagem = await this.prisma.mensagemnegociacao.findFirst({
      where: {
        id: mensagemId,
        orcamento_id: orcamentoId,
      },
    });

    if (!mensagem) {
      throw new NotFoundException('Mensagem não encontrada');
    }

    // Validar tipo de arquivo
    const tiposPermitidos = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/pdf',
      'application/zip',
      'application/x-zip-compressed',
    ];
    if (!tiposPermitidos.includes(file.mimetype)) {
      throw new BadRequestException(
        'Tipo de arquivo não permitido. Use apenas JPG, PNG, PDF ou ZIP.',
      );
    }

    // Validar tamanho (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException(
        'Arquivo muito grande. Tamanho máximo: 5MB.',
      );
    }

    // Salvar arquivo
    const uploadDir = path.join(process.cwd(), 'uploads', 'anexos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const extensao = path.extname(file.originalname);
    const nomeArquivo = `${uuidv4()}${extensao}`;
    const caminhoArquivo = path.join(uploadDir, nomeArquivo);

    console.log('📎 Tentando salvar anexo em:', caminhoArquivo);
    fs.writeFileSync(caminhoArquivo, file.buffer);
    console.log('📎 Anexo salvo com sucesso!');

    const anexoInfo = {
      nome_arquivo: file.originalname,
      url_arquivo: `/uploads/anexos/${nomeArquivo}`,
      tipo_arquivo: file.mimetype,
      tamanho: file.size,
    };

    // Atualizar a mensagem com o anexo
    const mensagemAtualizada = await this.prisma.mensagemnegociacao.update({
      where: { id: mensagemId },
      data: {
        anexos: JSON.stringify(anexoInfo),
      },
    });

    console.log('📎 Anexo adicionado à mensagem:', mensagemId);

    return mensagemAtualizada;
  }
}
