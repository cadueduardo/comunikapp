import { Controller, Post, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OSValidacoesService } from '../services/os-validacoes.service';

@ApiTags('Test - OS Validações')
@Controller('test-os-validacoes')
export class TestOSValidacoesController {
  constructor(private readonly osValidacoesService: OSValidacoesService) {}

  @Post(':id/executar')
  @ApiOperation({ summary: 'Teste - Executar validações sem autenticação' })
  async executarValidacoes(@Param('id') osId: string) {
    // Usar loja padrão para teste
    const lojaId = 'ts11cln0o'; // ID da loja "Corte Total"
    return await this.osValidacoesService.validarOS(osId, lojaId);
  }

  @Get(':id/historico')
  @ApiOperation({ summary: 'Teste - Obter histórico sem autenticação' })
  async obterHistorico(@Param('id') osId: string) {
    return await this.osValidacoesService.obterHistoricoValidacoes(osId);
  }
}








