import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentLojaId } from '../../auth/decorators';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ArteProducaoService } from './arte-producao.service';

@ApiTags('Catálogo — Arte de produção VDP')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('catalogo/item-os')
export class ArteProducaoController {
  constructor(private readonly arteProducaoService: ArteProducaoService) {}

  @Get(':id/arte-producao')
  @ApiOperation({
    summary:
      'Download autenticado da arte de produção consolidada (VDP print-ready)',
  })
  async downloadArteProducao(
    @Param('id') itemOsId: string,
    @CurrentLojaId() lojaId: string,
    @Res() res: Response,
  ) {
    await this.arteProducaoService.servirArteProducaoItemOS(
      itemOsId,
      lojaId,
      res,
    );
  }
}
