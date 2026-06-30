import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { LojaId } from '../../auth/loja-id.decorator';
import { CurrentUser } from '../../auth/decorators';
import { AuthenticatedUser } from '../../auth/auth.service';
import { InstalacaoGestaoPermissionsGuard } from '../guards/instalacao-gestao-permissions.guard';
import { CepIntegrationService } from '../services/cep-integration.service';
import { InstalacaoPosCalculoService } from '../services/instalacao-pos-calculo.service';

@ApiTags('Instalações')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('instalacao')
export class InstalacaoController {
  constructor(
    private readonly cepService: CepIntegrationService,
    private readonly posCalculoService: InstalacaoPosCalculoService,
  ) {}

  @Get('cep/:cep')
  @ApiOperation({ summary: 'Consulta endereço por CEP (ViaCEP)' })
  async buscarCep(@Param('cep') cep: string) {
    return this.cepService.buscarEnderecoPorCep(cep);
  }

  @Get('os/:osId/margem-real')
  @UseGuards(InstalacaoGestaoPermissionsGuard)
  @ApiOperation({ summary: 'Margem líquida real da OS (visão gerencial)' })
  async margemReal(@LojaId() lojaId: string, @Param('osId') osId: string) {
    return this.posCalculoService.calcularMargemRealOs(osId, lojaId);
  }

  @Post('os/:osId/relatorio-tecnico')
  @UseGuards(InstalacaoGestaoPermissionsGuard)
  @ApiOperation({
    summary: 'Gera relatório técnico final e libera saldo / cobranças extras',
  })
  async gerarRelatorioTecnico(
    @LojaId() lojaId: string,
    @Param('osId') osId: string,
    @CurrentUser() usuario: AuthenticatedUser,
  ) {
    return this.posCalculoService.gerarRelatorioTecnicoFinal(
      osId,
      lojaId,
      usuario.id,
    );
  }
}
