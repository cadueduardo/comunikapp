import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ArteArquivoResponseDto } from '../dto/arte-response.dto';
import { normalizeMultipartFilename } from '../../../common/utils/multipart-filename.util';
import { ArteStorageService } from './arte-storage.service';
import {
  ResponsabilidadeArte,
  StatusArte,
} from '../constants/arte.enums';

@Injectable()
export class ArteArquivoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly arteStorageService: ArteStorageService,
  ) {}

  /**
   * Lista todos os arquivos de uma versão
   */
  async findArquivosByVersao(
    versaoId: string,
    lojaId: string,
  ): Promise<ArteArquivoResponseDto[]> {
    console.log('📁 Buscando arquivos da versão:', { versaoId, lojaId });

    // Verificar se a versão existe e pertence à loja
    const versao = await this.prisma.arteVersao.findFirst({
      where: {
        id: versaoId,
        loja_id: lojaId,
      },
    });

    if (!versao) {
      throw new NotFoundException('Versão não encontrada');
    }

    const arquivos = await this.prisma.arteArquivo.findMany({
      where: {
        versao_id: versaoId,
        loja_id: lojaId,
      },
      orderBy: {
        data_upload: 'desc',
      },
    });

    console.log(`📋 Encontrados ${arquivos.length} arquivos`);

    return arquivos.map((arquivo) => this.formatArquivoResponse(arquivo));
  }

  /**
   * Busca um arquivo específico
   */
  async findArquivoById(
    arquivoId: string,
    lojaId: string,
  ): Promise<ArteArquivoResponseDto> {
    console.log('🔍 Buscando arquivo:', { arquivoId, lojaId });

    const arquivo = await this.prisma.arteArquivo.findFirst({
      where: {
        id: arquivoId,
        loja_id: lojaId,
      },
    });

    if (!arquivo) {
      throw new NotFoundException('Arquivo não encontrado');
    }

    return this.formatArquivoResponse(arquivo);
  }

  /**
   * Adiciona um arquivo a uma versão
   */
  async addArquivo(
    versaoId: string,
    arquivoData: {
      nome_arquivo: string;
      nome_original: string;
      tipo_arquivo: string;
      tamanho: bigint;
      url_arquivo: string;
      url_thumbnail?: string;
      storage_provider: string;
      storage_path: string;
    },
    lojaId: string,
  ): Promise<ArteArquivoResponseDto> {
    console.log('📤 Adicionando arquivo à versão:', {
      versaoId,
      arquivoData,
      lojaId,
    });

    // Verificar se a versão existe e pertence à loja
    const versao = await this.prisma.arteVersao.findFirst({
      where: {
        id: versaoId,
        loja_id: lojaId,
      },
      select: { id: true, servico_id: true, os_id: true },
    });

    if (!versao) {
      throw new NotFoundException('Versão não encontrada');
    }

    // Validar tipo de arquivo
    const tiposPermitidos = [
      'pdf',
      'jpg',
      'jpeg',
      'png',
      'ai',
      'psd',
      'eps',
      'link',
    ];
    const extensao = arquivoData.tipo_arquivo.toLowerCase();

    if (!tiposPermitidos.includes(extensao)) {
      throw new BadRequestException(
        `Tipo de arquivo não permitido. Tipos aceitos: ${tiposPermitidos.join(', ')}`,
      );
    }

    // Validar tamanho (máximo 50MB) — links externos não têm tamanho
    const maxSize = 50 * 1024 * 1024; // 50MB em bytes
    if (
      extensao !== 'link' &&
      Number(arquivoData.tamanho) > maxSize
    ) {
      throw new BadRequestException(
        'Arquivo muito grande. Tamanho máximo: 50MB',
      );
    }

    // Criar o arquivo
    const arquivo = await this.prisma.arteArquivo.create({
      data: {
        versao_id: versaoId,
        nome_arquivo: arquivoData.nome_arquivo,
        nome_original: arquivoData.nome_original,
        tipo_arquivo: arquivoData.tipo_arquivo,
        tamanho: arquivoData.tamanho,
        url_arquivo: arquivoData.url_arquivo,
        url_thumbnail: arquivoData.url_thumbnail,
        storage_provider: arquivoData.storage_provider,
        storage_path: arquivoData.storage_path,
        loja_id: lojaId,
      },
    });

    console.log('✅ Arquivo adicionado com sucesso:', arquivo.id);

    await this.sincronizarStatusAposUploadArquivo(
      lojaId,
      versao.servico_id,
      versao.os_id,
    );

    return this.formatArquivoResponse(arquivo);
  }

  private async sincronizarStatusAposUploadArquivo(
    lojaId: string,
    itemOsId: string | null | undefined,
    osId: string,
  ) {
    if (!itemOsId) return;

    const item = await this.prisma.itemOS.findFirst({
      where: {
        id: itemOsId,
        os_id: osId,
        os: { loja_id: lojaId, ativo: true },
      },
      select: {
        id: true,
        responsabilidade_arte: true,
        status_arte: true,
      },
    });

    if (
      !item ||
      item.responsabilidade_arte !== ResponsabilidadeArte.CLIENTE_FORNECE
    ) {
      return;
    }

    if (item.status_arte === StatusArte.AGUARDANDO_ARQUIVO_CLIENTE) {
      await this.prisma.itemOS.update({
        where: { id: item.id },
        data: { status_arte: StatusArte.ARQUIVO_RECEBIDO },
      });
    }
  }

  async findArquivoByVersaoFilename(
    versaoId: string,
    nomeArquivo: string,
    lojaId: string,
  ) {
    return this.prisma.arteArquivo.findFirst({
      where: {
        versao_id: versaoId,
        nome_arquivo: nomeArquivo,
        loja_id: lojaId,
      },
    });
  }

  /**
   * Remove um arquivo
   */
  async removeArquivo(arquivoId: string, lojaId: string): Promise<void> {
    console.log('🗑️ Removendo arquivo:', { arquivoId, lojaId });

    // Verificar se o arquivo existe
    const arquivoExistente = await this.prisma.arteArquivo.findFirst({
      where: {
        id: arquivoId,
        loja_id: lojaId,
      },
    });

    if (!arquivoExistente) {
      throw new NotFoundException('Arquivo não encontrado');
    }

    await this.arteStorageService.deleteArteFile(
      lojaId,
      arquivoExistente.storage_provider,
      arquivoExistente.storage_path,
    );

    await this.prisma.arteArquivo.delete({
      where: {
        id: arquivoId,
      },
    });

    console.log('✅ Arquivo removido com sucesso');
  }

  /**
   * Gera URL pública para download (temporária)
   */
  async generatePublicUrl(arquivoId: string, lojaId: string): Promise<string> {
    console.log('🔗 Gerando URL pública:', { arquivoId, lojaId });

    const arquivo = await this.findArquivoById(arquivoId, lojaId);
    if (arquivo.storage_provider === 'google_drive') {
      return arquivo.url_arquivo;
    }
    return arquivo.url_arquivo;
  }

  /**
   * Formata a resposta do arquivo
   */
  private formatArquivoResponse(arquivo: any): ArteArquivoResponseDto {
    return {
      id: arquivo.id,
      nome_arquivo: arquivo.nome_arquivo,
      nome_original: normalizeMultipartFilename(arquivo.nome_original),
      tipo_arquivo: arquivo.tipo_arquivo,
      tamanho: Number(arquivo.tamanho), // Converter BigInt para Number
      url_arquivo: arquivo.url_arquivo,
      url_thumbnail: arquivo.url_thumbnail,
      storage_provider: arquivo.storage_provider,
      data_upload: arquivo.data_upload,
    };
  }
}
