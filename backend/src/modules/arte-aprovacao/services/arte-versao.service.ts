import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateArteVersaoDto } from '../dto/create-arte-versao.dto';
import { UpdateArteVersaoDto } from '../dto/update-arte-versao.dto';
import { ArteVersaoResponseDto } from '../dto/arte-response.dto';
import { ArteStatus } from '@prisma/client';

import { ArteFilaTransicaoService } from './arte-fila-transicao.service';
import { ResponsabilidadeArte, StatusArte } from '../constants/arte.enums';
import { normalizeMultipartFilename } from '../../../common/utils/multipart-filename.util';

@Injectable()
export class ArteVersaoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly arteFilaTransicaoService: ArteFilaTransicaoService,
  ) {}

  /**
   * Cria uma nova versão de arte
   */
  async createVersao(
    createDto: CreateArteVersaoDto,
    usuarioId: string,
    lojaId: string,
  ): Promise<ArteVersaoResponseDto> {
    console.log('🎨 Criando nova versão de arte:', {
      osId: createDto.os_id,
      versao: createDto.versao,
      autorId: usuarioId,
      lojaId,
    });

    // Verificar se a OS existe e pertence à loja
    const os = await this.prisma.ordemServico.findFirst({
      where: {
        id: createDto.os_id,
        loja_id: lojaId,
      },
    });

    if (!os) {
      throw new NotFoundException('Ordem de Serviço não encontrada');
    }

    // Verificar se já existe uma versão com o mesmo número PARA O MESMO SERVIÇO (não deletada)
    const versaoExistente = await this.prisma.arteVersao.findFirst({
      where: {
        os_id: createDto.os_id,
        versao: createDto.versao,
        servico_id: createDto.servico_id || null, // Importante: considerar null se não tiver servico_id
        loja_id: lojaId,
        deletado: false, // Não considerar versões deletadas
      },
    });

    if (versaoExistente) {
      throw new ForbiddenException(
        `Versão ${createDto.versao} já existe para este produto/serviço`,
      );
    }

    // Criar a versão (transação com sincronização de status na fila)
    const versao = await this.prisma.$transaction(async (tx) => {
      const criada = await tx.arteVersao.create({
        data: {
          os_id: createDto.os_id,
          servico_id: createDto.servico_id,
          versao: createDto.versao,
          status: createDto.status,
          autor_id: usuarioId,
          descricao: createDto.descricao,
          observacoes: createDto.observacoes,
          loja_id: lojaId,
        },
        include: {
          autor: {
            select: {
              id: true,
              nome_completo: true,
            },
          },
          aprovador: {
            select: {
              id: true,
              nome_completo: true,
            },
          },
          arquivos: true,
          comentarios: {
            include: {
              usuario: {
                select: {
                  id: true,
                  nome_completo: true,
                },
              },
            },
            orderBy: {
              data_comentario: 'desc',
            },
          },
        },
      });

      if (createDto.servico_id) {
        const item = await tx.itemOS.findFirst({
          where: {
            id: createDto.servico_id,
            os: { loja_id: lojaId, id: createDto.os_id },
          },
          select: { id: true, status_arte: true },
        });
        if (item && item.status_arte !== 'EM_CRIACAO') {
          await tx.itemOS.update({
            where: { id: createDto.servico_id },
            data: { status_arte: 'EM_CRIACAO' },
          });
        }
      }

      return criada;
    });

    console.log('✅ Versão criada com sucesso:', versao.id);

    return this.formatVersaoResponse(versao);
  }

  /**
   * Lista todas as versões de uma OS
   */
  async findVersoesByOS(
    osId: string,
    lojaId: string,
  ): Promise<ArteVersaoResponseDto[]> {
    try {
      console.log('🔍 Buscando versões da OS:', { osId, lojaId });

      const versoes = await this.prisma.arteVersao.findMany({
        where: {
          os_id: osId,
          loja_id: lojaId,
          deletado: false, // Não mostrar versões deletadas
        },
        include: {
          autor: {
            select: {
              id: true,
              nome_completo: true,
            },
          },
          aprovador: {
            select: {
              id: true,
              nome_completo: true,
            },
          },
          arquivos: true,
          comentarios: {
            include: {
              usuario: {
                select: {
                  id: true,
                  nome_completo: true,
                },
              },
            },
            orderBy: {
              data_comentario: 'desc',
            },
          },
        },
        orderBy: {
          data_criacao: 'desc',
        },
      });

      console.log(`📋 Encontradas ${versoes.length} versões`);

      return versoes.map((versao) => this.formatVersaoResponse(versao));
    } catch (error) {
      console.error('❌ Erro ao buscar versões:', error);
      throw error;
    }
  }

  /**
   * Lista todas as versões de um produto específico
   */
  async findVersoesByProduto(
    produtoId: string,
    lojaId: string,
  ): Promise<ArteVersaoResponseDto[]> {
    try {
      console.log('🔍 Buscando versões do produto:', { produtoId, lojaId });

      const versoes = await this.prisma.arteVersao.findMany({
        where: {
          servico_id: produtoId,
          loja_id: lojaId,
          deletado: false, // Não mostrar versões deletadas
        },
        include: {
          autor: {
            select: {
              id: true,
              nome_completo: true,
            },
          },
          aprovador: {
            select: {
              id: true,
              nome_completo: true,
            },
          },
          arquivos: true,
          comentarios: {
            include: {
              usuario: {
                select: {
                  id: true,
                  nome_completo: true,
                },
              },
            },
            orderBy: {
              data_comentario: 'desc',
            },
          },
        },
        orderBy: {
          data_criacao: 'desc',
        },
      });

      console.log(
        `📋 Encontradas ${versoes.length} versões para o produto ${produtoId}`,
      );

      return versoes.map((versao) => this.formatVersaoResponse(versao));
    } catch (error) {
      console.error('❌ Erro ao buscar versões do produto:', error);
      throw error;
    }
  }

  /**
   * Busca uma versão específica
   */
  async findVersaoById(
    versaoId: string,
    lojaId: string,
  ): Promise<ArteVersaoResponseDto> {
    console.log('🔍 Buscando versão:', { versaoId, lojaId });

    const versao = await this.prisma.arteVersao.findFirst({
      where: {
        id: versaoId,
        loja_id: lojaId,
      },
      include: {
        autor: {
          select: {
            id: true,
            nome_completo: true,
          },
        },
        aprovador: {
          select: {
            id: true,
            nome_completo: true,
          },
        },
        arquivos: true,
        comentarios: {
          include: {
            usuario: {
              select: {
                id: true,
                nome_completo: true,
              },
            },
          },
          orderBy: {
            data_comentario: 'desc',
          },
        },
      },
    });

    if (!versao) {
      throw new NotFoundException('Versão não encontrada');
    }

    return this.formatVersaoResponse(versao);
  }

  /**
   * Atualiza uma versão
   */
  async updateVersao(
    versaoId: string,
    updateDto: UpdateArteVersaoDto,
    lojaId: string,
  ): Promise<ArteVersaoResponseDto> {
    console.log('✏️ Atualizando versão:', { versaoId, updateDto, lojaId });

    // Verificar se a versão existe
    const versaoExistente = await this.prisma.arteVersao.findFirst({
      where: {
        id: versaoId,
        loja_id: lojaId,
      },
    });

    if (!versaoExistente) {
      throw new NotFoundException('Versão não encontrada');
    }

    // Atualizar a versão
    const versao = await this.prisma.arteVersao.update({
      where: {
        id: versaoId,
      },
      data: {
        ...updateDto,
        // Se mudou para APROVADA, registrar data de aprovação
        ...(updateDto.status === ArteStatus.APROVADA && {
          data_aprovacao: new Date(),
        }),
      },
      include: {
        autor: {
          select: {
            id: true,
            nome_completo: true,
          },
        },
        aprovador: {
          select: {
            id: true,
            nome_completo: true,
          },
        },
        arquivos: true,
        comentarios: {
          include: {
            usuario: {
              select: {
                id: true,
                nome_completo: true,
              },
            },
          },
          orderBy: {
            data_comentario: 'desc',
          },
        },
      },
    });

    console.log('✅ Versão atualizada com sucesso');

    await this.sincronizarItemOsAposUpdateVersao(
      versao,
      updateDto,
      lojaId,
    );

    return this.formatVersaoResponse(versao);
  }

  /**
   * Conferência interna (preflight) — arte fornecida pelo cliente.
   * Não envia link ao cliente; aprova e libera para PCP em um passo.
   */
  async conferirPreflightCliente(
    versaoId: string,
    usuarioId: string,
    lojaId: string,
    observacao?: string,
  ): Promise<ArteVersaoResponseDto> {
    const versao = await this.prisma.arteVersao.findFirst({
      where: { id: versaoId, loja_id: lojaId, deletado: false },
      include: {
        arquivos: { take: 1 },
        autor: { select: { id: true, nome_completo: true } },
      },
    });

    if (!versao) {
      throw new NotFoundException('Versão não encontrada');
    }

    if (!versao.servico_id) {
      throw new BadRequestException('Versão sem item da OS associado');
    }

    const item = await this.prisma.itemOS.findFirst({
      where: {
        id: versao.servico_id,
        os: { loja_id: lojaId, ativo: true },
      },
      select: { responsabilidade_arte: true },
    });

    if (item?.responsabilidade_arte !== ResponsabilidadeArte.CLIENTE_FORNECE) {
      throw new BadRequestException(
        'Conferência de preflight disponível apenas para arte enviada pelo cliente',
      );
    }

    if (!versao.arquivos?.length) {
      throw new BadRequestException(
        'Adicione o arquivo do cliente antes de conferir e liberar',
      );
    }

    if (versao.liberado_para_pcp) {
      throw new BadRequestException('Arte já liberada para produção');
    }

    const obsExtra = observacao?.trim()
      ? `\n\n[CONFERÊNCIA ARTE CLIENTE - ${new Date().toLocaleString('pt-BR')}]\n${observacao.trim()}`
      : `\n\n[CONFERÊNCIA ARTE CLIENTE - ${new Date().toLocaleString('pt-BR')}]`;

    const versaoAtualizada = await this.prisma.arteVersao.update({
      where: { id: versaoId },
      data: {
        status: ArteStatus.APROVADA,
        data_aprovacao: new Date(),
        aprovado_por_cliente: true,
        liberado_para_pcp: true,
        liberado_em: new Date(),
        liberado_por: usuarioId,
        observacoes: `${versao.observacoes || ''}${obsExtra}`.trim(),
      },
      include: this.versaoIncludeRelations(),
    });

    await this.arteFilaTransicaoService.sincronizarStatusAposVersao(
      versao.servico_id,
      lojaId,
      StatusArte.LIBERADA_PCP,
    );

    return this.formatVersaoResponse(versaoAtualizada);
  }

  private async sincronizarItemOsAposUpdateVersao(
    versao: { servico_id: string | null; status: string },
    updateDto: UpdateArteVersaoDto,
    lojaId: string,
  ) {
    if (!versao.servico_id) return;

    let statusItem: string | null = null;
    if (updateDto.liberado_para_pcp) {
      statusItem = StatusArte.LIBERADA_PCP;
    } else if (updateDto.status) {
      statusItem = updateDto.status;
    }

    if (!statusItem) return;

    await this.arteFilaTransicaoService.sincronizarStatusAposVersao(
      versao.servico_id,
      lojaId,
      statusItem,
    );
  }

  private versaoIncludeRelations() {
    return {
      autor: { select: { id: true, nome_completo: true } },
      aprovador: { select: { id: true, nome_completo: true } },
      liberador: { select: { id: true, nome_completo: true } },
      arquivos: true,
      comentarios: {
        include: {
          usuario: { select: { id: true, nome_completo: true } },
        },
        orderBy: { data_comentario: 'desc' as const },
      },
    };
  }

  /**
   * Remove uma versão (Soft Delete)
   */
  async removeVersao(
    versaoId: string,
    lojaId: string,
    usuarioId: string,
  ): Promise<void> {
    console.log('🗑️ Removendo versão (soft delete):', {
      versaoId,
      lojaId,
      usuarioId,
    });

    // Verificar se a versão existe
    const versaoExistente = await this.prisma.arteVersao.findFirst({
      where: {
        id: versaoId,
        loja_id: lojaId,
        deletado: false,
      },
    });

    if (!versaoExistente) {
      throw new NotFoundException('Versão não encontrada');
    }

    // Soft Delete - marcar como deletado
    await this.prisma.arteVersao.update({
      where: {
        id: versaoId,
      },
      data: {
        deletado: true,
        data_exclusao: new Date(),
        excluido_por: usuarioId,
      },
    });

    console.log('✅ Versão marcada como deletada (soft delete)');
  }

  /**
   * Restaura uma versão deletada
   */
  async restoreVersao(
    versaoId: string,
    lojaId: string,
  ): Promise<ArteVersaoResponseDto> {
    console.log('♻️ Restaurando versão:', { versaoId, lojaId });

    // Verificar se a versão existe e está deletada
    const versaoExistente = await this.prisma.arteVersao.findFirst({
      where: {
        id: versaoId,
        loja_id: lojaId,
        deletado: true,
      },
    });

    if (!versaoExistente) {
      throw new NotFoundException('Versão deletada não encontrada');
    }

    // Restaurar versão
    const versao = await this.prisma.arteVersao.update({
      where: {
        id: versaoId,
      },
      data: {
        deletado: false,
        data_exclusao: null,
        excluido_por: null,
      },
      include: {
        autor: {
          select: {
            id: true,
            nome_completo: true,
          },
        },
        aprovador: {
          select: {
            id: true,
            nome_completo: true,
          },
        },
        arquivos: true,
        comentarios: {
          include: {
            usuario: {
              select: {
                id: true,
                nome_completo: true,
              },
            },
          },
          orderBy: {
            data_comentario: 'desc',
          },
        },
      },
    });

    console.log('✅ Versão restaurada com sucesso');

    return this.formatVersaoResponse(versao);
  }

  /**
   * Liberar arte para PCP após verificação do designer
   */
  async liberarParaPCP(
    versaoId: string,
    usuarioId: string,
    lojaId: string,
  ): Promise<ArteVersaoResponseDto> {
    console.log('🎨 Liberando arte para PCP:', {
      versaoId,
      usuarioId,
      lojaId,
    });

    // Buscar a versão
    const versao = await this.prisma.arteVersao.findFirst({
      where: {
        id: versaoId,
        loja_id: lojaId,
        deletado: false,
      },
      include: {
        autor: {
          select: {
            id: true,
            nome_completo: true,
          },
        },
        aprovador: {
          select: {
            id: true,
            nome_completo: true,
          },
        },
        liberador: {
          select: {
            id: true,
            nome_completo: true,
          },
        },
        arquivos: true,
        comentarios: {
          include: {
            usuario: {
              select: {
                id: true,
                nome_completo: true,
              },
            },
          },
        },
      },
    });

    if (!versao) {
      throw new NotFoundException('Versão de arte não encontrada');
    }

    const itemOs = versao.servico_id
      ? await this.prisma.itemOS.findFirst({
          where: {
            id: versao.servico_id,
            os: { loja_id: lojaId, ativo: true },
          },
          select: { responsabilidade_arte: true },
        })
      : null;

    const arteCliente =
      itemOs?.responsabilidade_arte === ResponsabilidadeArte.CLIENTE_FORNECE;

    if (!versao.aprovado_por_cliente && !arteCliente) {
      throw new ForbiddenException('Arte ainda não foi aprovada pelo cliente');
    }

    if (
      arteCliente &&
      versao.status !== ArteStatus.APROVADA &&
      !versao.aprovado_por_cliente
    ) {
      throw new ForbiddenException(
        'Conferência interna pendente antes de liberar para PCP',
      );
    }

    // Verificar se já foi liberada
    if (versao.liberado_para_pcp) {
      throw new ForbiddenException('Arte já foi liberada para PCP');
    }

    // Verificar se há arquivos
    const versaoComArquivos = versao as any;
    if (
      !versaoComArquivos.arquivos ||
      versaoComArquivos.arquivos.length === 0
    ) {
      throw new ForbiddenException(
        'Arte não possui arquivos. Adicione arquivos antes de liberar.',
      );
    }

    // Liberar para PCP
    const versaoAtualizada = await this.prisma.arteVersao.update({
      where: { id: versaoId },
      data: {
        liberado_para_pcp: true,
        liberado_em: new Date(),
        liberado_por: usuarioId,
      },
      include: {
        autor: {
          select: {
            id: true,
            nome_completo: true,
          },
        },
        aprovador: {
          select: {
            id: true,
            nome_completo: true,
          },
        },
        liberador: {
          select: {
            id: true,
            nome_completo: true,
          },
        },
        arquivos: true,
        comentarios: {
          include: {
            usuario: {
              select: {
                id: true,
                nome_completo: true,
              },
            },
          },
        },
      },
    });

    console.log('✅ Arte liberada para PCP com sucesso');

    if (versao.servico_id) {
      await this.arteFilaTransicaoService.sincronizarStatusAposVersao(
        versao.servico_id,
        lojaId,
        StatusArte.LIBERADA_PCP,
      );
    }

    return this.formatVersaoResponse(versaoAtualizada);
  }

  /**
   * Formata a resposta da versão
   */
  private formatVersaoResponse(versao: any): ArteVersaoResponseDto {
    return {
      id: versao.id,
      os_id: versao.os_id,
      servico_id: versao.servico_id,
      versao: versao.versao,
      status: versao.status,
      autor_id: versao.autor_id,
      autor_nome: versao.autor.nome_completo,
      descricao: versao.descricao,
      observacoes: versao.observacoes,
      data_criacao: versao.data_criacao,
      data_aprovacao: versao.data_aprovacao,
      aprovado_por: versao.aprovado_por,
      aprovador_nome: versao.aprovador?.nome_completo,
      aprovado_por_cliente: versao.aprovado_por_cliente,
      liberado_para_pcp: versao.liberado_para_pcp || false,
      liberado_em: versao.liberado_em,
      liberado_por: versao.liberado_por,
      liberador_nome: versao.liberador?.nome_completo,
      arquivos: versao.arquivos.map((arquivo: any) => ({
        id: arquivo.id,
        nome_arquivo: arquivo.nome_arquivo,
        nome_original: normalizeMultipartFilename(arquivo.nome_original),
        tipo_arquivo: arquivo.tipo_arquivo,
        tamanho: Number(arquivo.tamanho), // Converter BigInt para Number
        url_arquivo: arquivo.url_arquivo,
        url_thumbnail: arquivo.url_thumbnail,
        storage_provider: arquivo.storage_provider,
        data_upload: arquivo.data_upload,
      })),
      comentarios: versao.comentarios.map((comentario: any) => ({
        id: comentario.id,
        usuario_id: comentario.usuario_id,
        usuario_nome: comentario.usuario.nome_completo,
        comentario: comentario.comentario,
        tipo: comentario.tipo,
        data_comentario: comentario.data_comentario,
      })),
    };
  }
}
