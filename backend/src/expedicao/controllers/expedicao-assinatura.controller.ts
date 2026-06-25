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
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { multerExpedicaoAssinaturaConfig } from '../../config/multer-expedicao-assinatura.config';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ExpedicaoPermissionsGuard } from '../guards/expedicao-permissions.guard';
import { ExpedicaoAssinaturaService } from '../services/expedicao-assinatura.service';

@ApiTags('Expedição - Assinaturas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ExpedicaoPermissionsGuard)
@Controller('expedicao/assinaturas')
export class ExpedicaoAssinaturaController {
  constructor(private readonly assinaturaService: ExpedicaoAssinaturaService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('arquivo', multerExpedicaoAssinaturaConfig),
  )
  @ApiOperation({ summary: 'Upload de assinatura PNG/WebP (máx. 500 KB)' })
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

    const resultado = await this.assinaturaService.salvar({
      arquivo,
      lojaId,
      usuarioId,
    });

    return {
      url: resultado.url,
      token: resultado.token,
    };
  }

  @Get(':token')
  @ApiOperation({ summary: 'Download autenticado da assinatura pelo token' })
  async baixar(
    @Param('token') token: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const lojaId = this.lojaIdFromJwt(req);
    const { buffer, mimeType, nomeOriginal } = await this.assinaturaService.ler({
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
