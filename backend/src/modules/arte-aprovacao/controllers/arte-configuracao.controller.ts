import { Body, Controller, Get, Put, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { ConfiguracaoArteService } from '../services/configuracao-arte.service';
import { UpsertConfiguracaoArteDto } from '../dto/upsert-configuracao-arte.dto';

@ApiTags('Arte & Aprovação — Configuração')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('arte-aprovacao/configuracao')
export class ArteConfiguracaoController {
  constructor(
    private readonly configuracaoArteService: ConfiguracaoArteService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Obter configuração de Arte & Aprovação da loja' })
  async obter(@Request() req: any) {
    const lojaId = req.user.loja_id;
    const data = await this.configuracaoArteService.obter(lojaId);
    return { success: true, data };
  }

  @Get('status')
  @ApiOperation({ summary: 'Status da configuração (alerta se custo zerado)' })
  async obterStatus(@Request() req: any) {
    const lojaId = req.user.loja_id;
    const data = await this.configuracaoArteService.obterStatus(lojaId);
    return { success: true, data };
  }

  @Put()
  @ApiOperation({ summary: 'Salvar configuração de Arte & Aprovação' })
  async upsert(@Request() req: any, @Body() dto: UpsertConfiguracaoArteDto) {
    const lojaId = req.user.loja_id;
    const data = await this.configuracaoArteService.upsert(
      lojaId,
      dto,
      req.user,
    );
    return { success: true, data };
  }
}
