import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { multerInstalacaoAnexoConfig } from '../../config/multer-instalacao-anexo.config';
import { InstaladorPermissionsGuard } from '../guards/instalador-permissions.guard';
import { InstalacaoGestaoPermissionsGuard } from '../guards/instalacao-gestao-permissions.guard';
import { InstalacaoAnexoService } from '../services/instalacao-anexo.service';

@ApiTags('Instalador - Anexos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, InstaladorPermissionsGuard)
@Controller('instalador/anexos')
export class InstaladorAnexoController {
  constructor(private readonly anexoService: InstalacaoAnexoService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('arquivo', multerInstalacaoAnexoConfig))
  @ApiOperation({
    summary: 'Upload de evidência ou assinatura (PNG/JPEG/WebP)',
  })
  @ApiConsumes('multipart/form-data')
  async upload(
    @UploadedFile() arquivo: Express.Multer.File,
    @Req() req: Request,
  ): Promise<{ url: string; token: string }> {
    if (!arquivo) {
      throw new BadRequestException('Nenhum arquivo recebido');
    }

    const lojaId = this.lojaIdFromJwt(req);
    const usuarioId = this.usuarioIdFromJwt(req);

    const resultado = await this.anexoService.salvar({
      arquivo,
      lojaId,
      usuarioId,
    });

    return { url: resultado.url, token: resultado.token };
  }

  private lojaIdFromJwt(req: Request): string {
    const user = (req as Request & { user?: { loja_id?: string } }).user;
    const lojaId = user?.loja_id;
    if (!lojaId) {
      throw new BadRequestException('Token sem loja_id');
    }
    return lojaId;
  }

  private usuarioIdFromJwt(req: Request): string {
    const user = (req as Request & { user?: { id?: string; sub?: string } })
      .user;
    return user?.id || user?.sub || 'desconhecido';
  }
}

@ApiTags('Instalações - Anexos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('instalacao/anexos')
export class InstalacaoAnexoController {
  constructor(private readonly anexoService: InstalacaoAnexoService) {}

  @Post('upload')
  @UseGuards(InstalacaoGestaoPermissionsGuard)
  @UseInterceptors(FileInterceptor('arquivo', multerInstalacaoAnexoConfig))
  @ApiOperation({ summary: 'Upload de evidência (gestão/broker)' })
  @ApiConsumes('multipart/form-data')
  async uploadGestao(
    @UploadedFile() arquivo: Express.Multer.File,
    @Req() req: Request,
  ): Promise<{ url: string; token: string }> {
    if (!arquivo) {
      throw new BadRequestException('Nenhum arquivo recebido');
    }

    const resultado = await this.anexoService.salvar({
      arquivo,
      lojaId: this.lojaIdFromJwt(req),
      usuarioId: this.usuarioIdFromJwt(req),
    });

    return { url: resultado.url, token: resultado.token };
  }

  @Get(':token')
  @ApiOperation({ summary: 'Download autenticado de anexo de instalação' })
  async baixar(
    @Param('token') token: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const lojaId = this.lojaIdFromJwt(req);
    const { buffer, mimeType, nomeOriginal } = await this.anexoService.ler({
      token,
      lojaId,
    });

    res.setHeader('Content-Type', mimeType || 'image/png');
    const nomeSanitizado = nomeOriginal.replace(/["\r\n]/g, '_');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${nomeSanitizado}"`,
    );
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.end(buffer);
  }

  private lojaIdFromJwt(req: Request): string {
    const user = (req as Request & { user?: { loja_id?: string } }).user;
    const lojaId = user?.loja_id;
    if (!lojaId) {
      throw new BadRequestException('Token sem loja_id');
    }
    return lojaId;
  }

  private usuarioIdFromJwt(req: Request): string {
    const user = (req as Request & { user?: { id?: string; sub?: string } })
      .user;
    return user?.id || user?.sub || 'desconhecido';
  }
}
