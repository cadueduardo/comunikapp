import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';
import { existsSync } from 'fs';
import { join, extname, basename } from 'path';

@Injectable()
export class ArteThumbnailService {
  private readonly logger = new Logger(ArteThumbnailService.name);

  /**
   * Gera thumbnail de uma imagem
   */
  async generateThumbnail(
    filePath: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
    } = {}
  ): Promise<string | null> {
    try {
      // Verificar se o arquivo existe
      if (!existsSync(filePath)) {
        this.logger.warn(`Arquivo não encontrado: ${filePath}`);
        return null;
      }

      // Verificar se é uma imagem
      const ext = extname(filePath).toLowerCase();
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
      
      if (!imageExtensions.includes(ext)) {
        this.logger.debug(`Arquivo não é uma imagem: ${ext}`);
        return null;
      }

      // Configurações padrão
      const width = options.width || 300;
      const height = options.height || 300;
      const quality = options.quality || 80;

      // Gerar nome do thumbnail
      const dir = filePath.substring(0, Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\')));
      const fileName = basename(filePath, ext);
      const thumbnailPath = join(dir, `thumb_${fileName}.jpg`);

      // Gerar thumbnail
      await sharp(filePath)
        .resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality })
        .toFile(thumbnailPath);

      this.logger.log(`✅ Thumbnail gerado: ${thumbnailPath}`);
      return thumbnailPath;
    } catch (error) {
      this.logger.error(`❌ Erro ao gerar thumbnail: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Gera múltiplos thumbnails (diferentes tamanhos)
   */
  async generateMultipleThumbnails(
    filePath: string,
    sizes: Array<{ name: string; width: number; height: number }>
  ): Promise<Record<string, string>> {
    const thumbnails: Record<string, string> = {};

    for (const size of sizes) {
      const thumbnail = await this.generateThumbnail(filePath, {
        width: size.width,
        height: size.height,
      });

      if (thumbnail) {
        thumbnails[size.name] = thumbnail;
      }
    }

    return thumbnails;
  }

  /**
   * Verifica se um arquivo é uma imagem
   */
  isImage(filePath: string): boolean {
    const ext = extname(filePath).toLowerCase();
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    return imageExtensions.includes(ext);
  }

  /**
   * Obtém informações da imagem
   */
  async getImageInfo(filePath: string): Promise<{
    width: number;
    height: number;
    format: string;
    size: number;
  } | null> {
    try {
      if (!existsSync(filePath)) {
        return null;
      }

      const metadata = await sharp(filePath).metadata();
      const stats = await sharp(filePath).stats();

      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'unknown',
        size: metadata.size || 0,
      };
    } catch (error) {
      this.logger.error(`Erro ao obter info da imagem: ${error.message}`);
      return null;
    }
  }
}

