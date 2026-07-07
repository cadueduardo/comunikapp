import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { AprovacaoTecnicaService } from '../services/aprovacao-tecnica.service';
import {
  AprovarTecnicaDto,
  AgendarInstalacaoDto,
} from '../dto/aprovacao-tecnica.dto';

@Controller('os')
@UseGuards(JwtAuthGuard)
export class AprovacaoTecnicaController {
  constructor(private aprovacaoTecnicaService: AprovacaoTecnicaService) {}

  @Get(':id/aprovacao-tecnica/status')
  async getStatusAprovacao(@Param('id') id: string) {
    return this.aprovacaoTecnicaService.getStatusAprovacao(id);
  }

  @Post(':id/aprovar-tecnica')
  async aprovarTecnica(
    @Param('id') id: string,
    @Body() dto: AprovarTecnicaDto,
    @Request() req: any,
  ) {
    const usuarioId = req.user?.id;
    if (!usuarioId) {
      throw new Error('Usuário não autenticado');
    }

    return this.aprovacaoTecnicaService.aprovarTecnica(id, dto, usuarioId);
  }

  @Post(':id/agendar-instalacao')
  async agendarInstalacao(
    @Param('id') id: string,
    @Body() dto: AgendarInstalacaoDto,
    @Request() req: any,
  ) {
    const usuarioId = req.user?.id;
    if (!usuarioId) {
      throw new Error('Usuário não autenticado');
    }

    return this.aprovacaoTecnicaService.agendarInstalacao(
      id,
      dto,
      req.user.loja_id,
    );
  }
}
