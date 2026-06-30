import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { InstalacaoGestaoPermissionsGuard } from '../guards/instalacao-gestao-permissions.guard';
import { InstalacaoRelatorioPdfService } from '../services/instalacao-relatorio-pdf.service';

@ApiTags('Instalações - Relatórios PDF')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, InstalacaoGestaoPermissionsGuard)
@Controller('instalacao/relatorios')
export class InstalacaoRelatorioController {
  constructor(private readonly relatorioPdfService: InstalacaoRelatorioPdfService) {}

  @Get(':token')
  @ApiOperation({ summary: 'Download do Relatório Técnico Final em PDF' })
  async baixarPdf(
    @Param('token') token: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const lojaId = this.lojaIdFromJwt(req);
    const buffer = await this.relatorioPdfService.lerPdf(token, lojaId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="relatorio-tecnico-${token}.pdf"`,
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
}
