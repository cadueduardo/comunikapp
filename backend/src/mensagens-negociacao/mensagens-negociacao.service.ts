import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMensagemNegociacaoDto } from '../orcamentos/dto/create-mensagem-negociacao.dto';
import { NotificacoesService } from '../notificacoes/notificacoes.service';

@Injectable()
export class MensagensNegociacaoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificacoesService: NotificacoesService
  ) {}

  /**
   * Criar uma nova mensagem de negociação
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

    return mensagem;
  }

  /**
   * Listar todas as mensagens de um orçamento
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
   * Marcar mensagem como visualizada
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
    return this.prisma.mensagemNegociacao.update({
      where: {
        id: mensagemId,
      },
      data: {
        visualizada: true,
      },
    });
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