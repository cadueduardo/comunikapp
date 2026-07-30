import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { createReadStream, existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { basename, extname, join } from 'path';
import { Readable } from 'stream';
import { GoogleDriveStorageService } from '../../../conexoes/services/google-drive-storage.service';
import { LojaConexaoService } from '../../../conexoes/services/loja-conexao.service';
import { ArteDriveFolderService } from './arte-drive-folder.service';
import { GoogleDriveUploadResult } from '../../../conexoes/interfaces/google-drive-config.interface';
import { buildArteVersaoDownloadPath } from '../utils/arte-arquivo-url.util';

export interface ArteStorageUploadInput {
  lojaId: string;
  versaoId: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}

export interface ArteStorageUploadOutput {
  storage_provider: 'google_drive' | 'local';
  storage_path: string;
  url_arquivo: string;
  nome_arquivo: string;
  drive_file_id?: string;
  web_view_link?: string;
}

@Injectable()
export class ArteStorageService {
  private readonly logger = new Logger(ArteStorageService.name);
  private readonly localBaseDir: string;

  constructor(
    private readonly lojaConexaoService: LojaConexaoService,
    private readonly driveStorage: GoogleDriveStorageService,
    private readonly arteDriveFolderService: ArteDriveFolderService,
  ) {
    const anexosRoot =
      process.env.COMUNIKAPP_ANEXOS_DIR || join(process.cwd(), 'uploads');
    this.localBaseDir = join(anexosRoot, 'arte');
    if (!existsSync(this.localBaseDir)) {
      mkdirSync(this.localBaseDir, { recursive: true });
    }
  }

  async isGoogleDriveConnected(lojaId: string): Promise<boolean> {
    const config = await this.lojaConexaoService.obterGoogleDriveConfig(lojaId);
    return Boolean(config?.refresh_token_encrypted);
  }

  /**
   * Drive quando conectado; se ausente ou falhar, grava em disco local.
   */
  async uploadArteVersao(
    input: ArteStorageUploadInput,
  ): Promise<ArteStorageUploadOutput> {
    const connected = await this.isGoogleDriveConnected(input.lojaId);
    if (connected) {
      try {
        return await this.uploadToDrive(input);
      } catch (error) {
        const detalhe = this.extrairMensagemDrive(error);
        this.logger.warn(
          `Drive indisponível para versao=${input.versaoId}; salvando local. Motivo: ${detalhe}`,
        );
        return this.uploadToLocal(input);
      }
    }

    this.logger.log(
      `Google Drive não conectado (loja=${input.lojaId}); upload local versao=${input.versaoId}`,
    );
    return this.uploadToLocal(input);
  }

  private async uploadToDrive(
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

    const uniqueName = this.montarNomeUnico(input.fileName);
    const result = await this.driveStorage.uploadBuffer({
      refreshToken,
      parentFolderId,
      fileName: uniqueName,
      mimeType: input.mimeType,
      buffer: input.buffer,
    });

    return this.mapDriveUploadResult(input.versaoId, uniqueName, result);
  }

  private uploadToLocal(
    input: ArteStorageUploadInput,
  ): ArteStorageUploadOutput {
    if (!input.buffer?.length) {
      throw new BadRequestException('Arquivo vazio');
    }

    const uniqueName = this.montarNomeUnico(input.fileName);
    const destDir = join(
      this.localBaseDir,
      input.lojaId,
      input.versaoId,
    );
    if (!existsSync(destDir)) {
      mkdirSync(destDir, { recursive: true });
    }

    const absolutePath = join(destDir, uniqueName);
    writeFileSync(absolutePath, input.buffer);

    return {
      storage_provider: 'local',
      storage_path: absolutePath,
      url_arquivo: buildArteVersaoDownloadPath(input.versaoId, uniqueName),
      nome_arquivo: uniqueName,
    };
  }

  private montarNomeUnico(fileName: string): string {
    const ext = extname(fileName);
    const base = basename(fileName, ext)
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .slice(0, 80);
    const safeBase = base || 'arquivo';
    const safeExt = ext.slice(0, 20);
    return `${Date.now()}-${safeBase}${safeExt}`;
  }

  private extrairMensagemDrive(error: unknown): string {
    if (!error || typeof error !== 'object') {
      return error instanceof Error ? error.message : String(error);
    }
    const anyErr = error as {
      message?: string;
      response?: { status?: number; data?: { error?: { message?: string } } };
      errors?: Array<{ message?: string }>;
    };
    const apiMsg =
      anyErr.response?.data?.error?.message ||
      anyErr.errors?.[0]?.message ||
      anyErr.message;
    if (apiMsg?.trim()) return apiMsg.trim();
    return 'erro desconhecido no Google Drive';
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

    if (storageProvider === 'local') {
      const path = this.resolverCaminhoLocal(storagePath);
      if (!existsSync(path)) {
        throw new NotFoundException('Arquivo local não encontrado');
      }
      return {
        stream: createReadStream(path),
        mimeType: 'application/octet-stream',
        name: basename(path),
      };
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
    if (storageProvider === 'local') {
      try {
        const path = this.resolverCaminhoLocal(storagePath);
        if (existsSync(path)) {
          unlinkSync(path);
        }
      } catch (error) {
        this.logger.warn(
          `Falha ao remover arquivo local (${storagePath}): ${
            error instanceof Error ? error.message : error
          }`,
        );
      }
      return;
    }

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

  private resolverCaminhoLocal(storagePath: string): string {
    if (existsSync(storagePath)) {
      return storagePath;
    }
    const legacy = join(process.cwd(), 'uploads', 'arte', storagePath);
    if (existsSync(legacy)) {
      return legacy;
    }
    return storagePath;
  }

  private mapDriveUploadResult(
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
