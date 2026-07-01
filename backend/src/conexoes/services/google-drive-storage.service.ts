import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';
import { google, drive_v3 } from 'googleapis';
import { GoogleDriveUploadResult } from '../interfaces/google-drive-config.interface';

@Injectable()
export class GoogleDriveStorageService {
  private readonly logger = new Logger(GoogleDriveStorageService.name);

  constructor(private readonly configService: ConfigService) {}

  createDriveClient(refreshToken: string): drive_v3.Drive {
    const oauth2 = new google.auth.OAuth2(
      this.configService.get<string>('GOOGLE_OAUTH_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_OAUTH_CLIENT_SECRET'),
      this.configService.get<string>('GOOGLE_OAUTH_REDIRECT_URI'),
    );
    oauth2.setCredentials({ refresh_token: refreshToken });
    return google.drive({ version: 'v3', auth: oauth2 });
  }

  async ensureRootFolder(
    refreshToken: string,
    folderName: string,
  ): Promise<string> {
    const drive = this.createDriveClient(refreshToken);
    const existing = await this.findFolderByNameSafe(drive, folderName, 'root');
    if (existing) {
      return existing;
    }
    return this.createFolder(drive, folderName, 'root');
  }

  async ensureFolderPath(
    refreshToken: string,
    rootFolderId: string,
    segments: string[],
  ): Promise<string> {
    const drive = this.createDriveClient(refreshToken);
    let parentId = rootFolderId;

    for (const segment of segments) {
      const nome = this.sanitizeFolderName(segment);
      const existing = await this.findFolderByNameSafe(drive, nome, parentId);
      parentId = existing ?? (await this.createFolder(drive, nome, parentId));
    }

    return parentId;
  }

  async uploadStream(params: {
    refreshToken: string;
    parentFolderId: string;
    fileName: string;
    mimeType: string;
    stream: Readable;
    size?: number;
  }): Promise<GoogleDriveUploadResult> {
    const drive = this.createDriveClient(params.refreshToken);
    const nomeSeguro = this.sanitizeFileName(params.fileName);

    const response = await drive.files.create({
      requestBody: {
        name: nomeSeguro,
        parents: [params.parentFolderId],
      },
      media: {
        mimeType: params.mimeType,
        body: params.stream,
      },
      fields: 'id, name, mimeType, webViewLink, webContentLink',
    });

    const fileId = response.data.id;
    if (!fileId) {
      throw new Error('Google Drive não retornou ID do arquivo');
    }

    await drive.permissions.create({
      fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    const links = await drive.files.get({
      fileId,
      fields: 'webViewLink, webContentLink',
    });

    this.logger.debug(`Arquivo enviado ao Drive: ${fileId} (${nomeSeguro})`);

    return {
      fileId,
      name: response.data.name ?? nomeSeguro,
      mimeType: response.data.mimeType ?? params.mimeType,
      webViewLink: links.data.webViewLink ?? `https://drive.google.com/file/d/${fileId}/view`,
      webContentLink: links.data.webContentLink ?? undefined,
    };
  }

  async uploadBuffer(params: {
    refreshToken: string;
    parentFolderId: string;
    fileName: string;
    mimeType: string;
    buffer: Buffer;
  }): Promise<GoogleDriveUploadResult> {
    return this.uploadStream({
      ...params,
      stream: Readable.from(params.buffer),
      size: params.buffer.length,
    });
  }

  async getFileStream(
    refreshToken: string,
    fileId: string,
  ): Promise<{ stream: Readable; mimeType: string; name: string }> {
    const drive = this.createDriveClient(refreshToken);
    const meta = await drive.files.get({
      fileId,
      fields: 'name, mimeType',
    });

    const response = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' },
    );

    return {
      stream: response.data as Readable,
      mimeType: meta.data.mimeType ?? 'application/octet-stream',
      name: meta.data.name ?? fileId,
    };
  }

  async deleteFile(refreshToken: string, fileId: string): Promise<void> {
    const drive = this.createDriveClient(refreshToken);
    await drive.files.delete({ fileId });
  }

  async resolveFileIdFromUrl(url: string): Promise<string | null> {
    const patterns = [
      /\/file\/d\/([a-zA-Z0-9_-]+)/,
      /id=([a-zA-Z0-9_-]+)/,
      /\/folders\/([a-zA-Z0-9_-]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match?.[1]) {
        return match[1];
      }
    }
    return null;
  }

  private async findFolderByNameSafe(
    drive: drive_v3.Drive,
    name: string,
    parentId: string,
  ): Promise<string | null> {
    try {
      return await this.findFolderByName(drive, name, parentId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.toLowerCase().includes('insufficient')) {
        this.logger.warn(
          `Listagem Drive indisponível para "${name}" (escopo); será criada nova pasta se necessário`,
        );
        return null;
      }
      throw error;
    }
  }

  private async findFolderByName(
    drive: drive_v3.Drive,
    name: string,
    parentId: string,
  ): Promise<string | null> {
    const escaped = name.replace(/'/g, "\\'");
    const query = [
      `mimeType='application/vnd.google-apps.folder'`,
      `name='${escaped}'`,
      `'${parentId}' in parents`,
      'trashed=false',
    ].join(' and ');

    const result = await drive.files.list({
      q: query,
      fields: 'files(id, name)',
      pageSize: 1,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    return result.data.files?.[0]?.id ?? null;
  }

  private async createFolder(
    drive: drive_v3.Drive,
    name: string,
    parentId: string,
  ): Promise<string> {
    const response = await drive.files.create({
      requestBody: {
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentId === 'root' ? undefined : [parentId],
      },
      fields: 'id',
    });
    const id = response.data.id;
    if (!id) {
      throw new Error(`Falha ao criar pasta "${name}" no Drive`);
    }
    return id;
  }

  private sanitizeFolderName(value: string): string {
    return value
      .replace(/[\\/:*?"<>|]/g, '_')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 120) || 'Sem nome';
  }

  private sanitizeFileName(value: string): string {
    const base = value.replace(/[\\/:*?"<>|]/g, '_').trim();
    return base.slice(0, 240) || `arquivo-${Date.now()}`;
  }
}
