/**
 * Controller de Parâmetros Gerais
 * Placeholder para futuras implementações
 */

import { 
  Controller, 
  Get, 
  Put, 
  Body, 
  Request, 
  UseGuards 
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth 
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ParametrosService } from '../services/parametros.service';

@ApiTags('Configurações - Parâmetros Gerais')
@ApiBearerAuth()
@Controller('configuracoes/parametros')
@UseGuards(JwtAuthGuard)
export class ParametrosController {
  constructor(
    private readonly parametrosService: ParametrosService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Obter parâmetros gerais' })
  @ApiResponse({ 
    status: 200, 
    description: 'Parâmetros obtidos com sucesso'
  })
  async obterParametros() {
    return await this.parametrosService.obterParametros();
  }

  @Put()
  @ApiOperation({ summary: 'Atualizar parâmetros gerais' })
  @ApiResponse({ 
    status: 200, 
    description: 'Parâmetros atualizados com sucesso'
  })
  async atualizarParametros(
    @Body() parametros: Record<string, any>,
    @Request() req: any
  ) {
    return await this.parametrosService.atualizarParametros(parametros);
  }
}
