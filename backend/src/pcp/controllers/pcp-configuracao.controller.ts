import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators';
import { AuthenticatedUser } from '../../auth/auth.service';
import { LojaId } from '../../auth/loja-id.decorator';
import { AtualizarConfiguracaoPCPDto } from '../dto/pcp-configuracao.dto';
import { PCPConfiguracaoService } from '../services/pcp-configuracao.service';

@ApiTags('PCP - Configuração')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('pcp/configuracao')
export class PCPConfiguracaoController {
  constructor(private readonly service: PCPConfiguracaoService) {}

  @Get()
  @ApiOperation({ summary: 'Obtém a configuração progressiva do PCP da loja' })
  obter(@LojaId() lojaId: string) {
    return this.service.obter(lojaId);
  }

  @Put()
  @ApiOperation({ summary: 'Define o nível progressivo do PCP da loja' })
  atualizar(
    @LojaId() lojaId: string,
    @CurrentUser() usuario: AuthenticatedUser,
    @Body() dto: AtualizarConfiguracaoPCPDto,
  ) {
    return this.service.atualizar(lojaId, dto.nivel, usuario);
  }

  @Post('aplicar-padrao')
  @ApiOperation({
    summary: 'Aplica o nível Organizado como padrão recomendado do PCP',
  })
  aplicarPadrao(
    @LojaId() lojaId: string,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.service.aplicarPadrao(lojaId, usuario);
  }
}
