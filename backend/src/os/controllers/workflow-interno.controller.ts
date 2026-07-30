import {
  Controller,
  Post,
  Patch,
  Get,
  Param,
  Body,
  UseGuards,
  Request,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { OSService } from '../services/os.service';
import { StatusOS } from '../interfaces/os.interfaces';

/**
 * Rotas exclusivas do workflow de OS interna.
 * Transições compartilhadas (transicionar-estado, iniciar-producao,
 * finalizar-os) ficam apenas em WorkflowComercialController para evitar
 * rotas duplicadas no mesmo @Controller('os').
 */
@ApiTags('Workflow OS Interna')
@ApiBearerAuth()
@Controller('os')
@UseGuards(JwtAuthGuard)
export class WorkflowInternoController {
  constructor(private readonly osService: OSService) {}

  @Patch(':id/aprovar-orcamentaria')
  @ApiOperation({ summary: 'Aprovar OS orçamentária (workflow interno)' })
  @ApiResponse({ status: 200, description: 'OS aprovada orçamentariamente' })
  @ApiResponse({
    status: 400,
    description: 'OS não é interna ou dados inválidos',
  })
  @ApiResponse({ status: 403, description: 'Usuário sem alçada suficiente' })
  async aprovarOrcamentaria(
    @Param('id') osId: string,
    @Body() body: { aprovado: boolean; observacoes?: string },
    @Request() req: any,
  ) {
    const user = req['user'] || req.user;
    const usuarioId = user.id;

    return await this.osService.aprovarOSOrcamentaria(
      osId,
      usuarioId,
      body.aprovado,
      body.observacoes,
    );
  }

  @Get(':id/validar-alcada')
  @ApiOperation({
    summary:
      'Validar alçada do usuário para aprovação (orçamento de centro de custo ainda não persistido)',
  })
  @ApiResponse({ status: 200, description: 'Validação de alçada realizada' })
  @ApiResponse({
    status: 503,
    description: 'Validação orçamentária de centro de custo indisponível',
  })
  async validarAlcada(@Param('id') osId: string, @Request() req: any) {
    const user = req['user'] || req.user;

    // P1-2: não devolver "pode_aprovar: true" com limites inventados.
    // Orçamento por centro de custo ainda não tem persistência real.
    throw new ServiceUnavailableException({
      message:
        'Validação orçamentária por centro de custo ainda não está disponível. A aprovação de OS interna deve usar o fluxo de aprovação gerencial/orçamentária, sem saldo fictício.',
      usuario_id: user.id,
      os_id: osId,
      pode_aprovar: false,
      motivo:
        'Centro de custo orçamentário não configurado (feature desativada até P1-2 completo).',
    });
  }
}
