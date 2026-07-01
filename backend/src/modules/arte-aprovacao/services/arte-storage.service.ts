import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Readable } from 'stream';
import { GoogleDriveStorageService } from '../../../conexoes/services/google-drive-storage.service';
import { LojaConexaoService } from '../../../conexoes/services/loja-conexao.service';
import { ArteDriveFolderService } from './arte-drive-folder.service';
import { GoogleDriveUploadResult } from '../../../conexoes/interfaces/google-drive-config.interface';

export interface ArteStorageUploadInput {
  lojaId: string;
  versaoId: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}

export interface ArteStorageUploadOutput {
  storage_provider: 'google_drive';
  storage_path: string;
  url_arquivo: string;
  nome_arquivo: string;
  drive_file_id: string;
  web_view_link: string;
}

@Injectable()
export class ArteStorageService {
  private readonly logger = new Logger(ArteStorageService.name);

  constructor(
    private readonly lojaConexaoService: LojaConexaoService,
    private readonly driveStorage: GoogleDriveStorageService,
    private readonly arteDriveFolderService: ArteDriveFolderService,
  ) {}

  async isGoogleDriveConnected(lojaId: string): Promise<boolean> {
    const config = await this.lojaConexaoService.obterGoogleDriveConfig(lojaId);
    return Boolean(config?.refresh_token_encrypted);
  }

  async uploadArteVersao(
    input: ArteStorageUploadInput,
  ): Promise<ArteStorageUploadOutput> {
    const config = await this.lojaConexaoService.obterGoogleDriveConfig(
      input.lojaId,
    );
    if (!config) {
      throw new BadRequestException(
        'Google Drive não conectado. Acesse Configurações → Conexões para vincular a conta da loja.',
      );
    }

    const refreshToken = this.lojaConexaoService.getRefreshToken(config);
    const parentFolderId =
      await this.arteDriveFolderService.resolverPastaItemVersao(
        input.lojaId,
        input.versaoId,
      );

    const uniqueName = `${Date.now()}-${input.fileName}`;
    const result = await this.driveStorage.uploadBuffer({
      refreshToken,
      parentFolderId,
      fileName: uniqueName,
      mimeType: input.mimeType,
      buffer: input.buffer,
    });

    return this.mapUploadResult(input.versaoId, uniqueName, result);
  }

  async getDownloadStream(
    lojaId: string,
    storageProvider: string,
    storagePath: string,
  ): Promise<{ stream: Readable; mimeType: string; name: string }> {
    if (storageProvider === 'google_drive') {
      const config = await this.lojaConexaoService.obterGoogleDriveConfig(lojaId);
      if (!config) {
        throw new NotFoundException('Google Drive não conectado para esta loja');
      }
      const refreshToken = this.lojaConexaoService.getRefreshToken(config);
      return this.driveStorage.getFileStream(refreshToken, storagePath);
    }

    throw new BadRequestException(
      `Provider de storage não suportado: ${storageProvider}`,
    );
  }

  async deleteArteFile(
    lojaId: string,
    storageProvider: string,
    storagePath: string,
  ): Promise<void> {
    if (storageProvider !== 'google_drive') {
      return;
    }
    const config = await this.lojaConexaoService.obterGoogleDriveConfig(lojaId);
    if (!config) {
      return;
    }
    try {
      const refreshToken = this.lojaConexaoService.getRefreshToken(config);
      await this.driveStorage.deleteFile(refreshToken, storagePath);
    } catch (error) {
      this.logger.warn(
        `Falha ao remover arquivo do Drive (${storagePath}): ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  private mapUploadResult(
    versaoId: string,
    storedFileName: string,
    result: GoogleDriveUploadResult,
  ): ArteStorageUploadOutput {
    return {
      storage_provider: 'google_drive',
      storage_path: result.fileId,
      url_arquivo: result.webViewLink,
      nome_arquivo: storedFileName,
      drive_file_id: result.fileId,
      web_view_link: result.webViewLink,
    };
  }
}
