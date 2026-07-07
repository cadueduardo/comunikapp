import {
  Controller,
  Post,
  Patch,
  Get,
  Param,
  Body,
  UseGuards,
  Request,
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

@ApiTags('Workflow OS Interna')
@ApiBearerAuth()
@Controller('os')
@UseGuards(JwtAuthGuard)
export class WorkflowInternoController {
  constructor(private readonly osService: OSService) {}

  @Patch(':id/transicionar-estado')
  @ApiOperation({
    summary: 'Transicionar OS para próximo estado do workflow interno',
  })
  @ApiResponse({ status: 200, description: 'OS transicionada com sucesso' })
  @ApiResponse({
    status: 400,
    description: 'Transição inválida ou dados incorretos',
  })
  @ApiResponse({
    status: 403,
    description: 'Usuário sem permissão para transição',
  })
  async transicionarEstado(
    @Param('id') osId: string,
    @Body() body: { novo_status: StatusOS; observacoes?: string },
    @Request() req: any,
  ) {
    const user = req['user'] || req.user;
    const usuarioId = user.id;

    return await this.osService.transicionarEstadoOS(
      osId,
      body.novo_status,
      usuarioId,
      body.observacoes,
      user.loja_id,
    );
  }

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

  @Post(':id/iniciar-producao')
  @ApiOperation({
    summary: 'Iniciar produção da OS (após aprovação orçamentária)',
  })
  @ApiResponse({ status: 200, description: 'Produção iniciada com sucesso' })
  @ApiResponse({
    status: 400,
    description: 'OS não está aprovada orçamentariamente',
  })
  async iniciarProducao(
    @Param('id') osId: string,
    @Body() body: { observacoes?: string },
    @Request() req: any,
  ) {
    const user = req['user'] || req.user;
    const usuarioId = user.id;

    return await this.osService.transicionarEstadoOS(
      osId,
      StatusOS.PRODUCAO,
      usuarioId,
      body.observacoes || 'Produção iniciada',
      user.loja_id,
    );
  }

  @Post(':id/finalizar-os')
  @ApiOperation({ summary: 'Finalizar OS interna (sem acabamento)' })
  @ApiResponse({ status: 200, description: 'OS finalizada com sucesso' })
  @ApiResponse({ status: 400, description: 'OS não está em produção' })
  async finalizarOS(
    @Param('id') osId: string,
    @Body() body: { observacoes?: string },
    @Request() req: any,
  ) {
    const user = req['user'] || req.user;
    const usuarioId = user.id;

    return await this.osService.transicionarEstadoOS(
      osId,
      StatusOS.FINALIZADA,
      usuarioId,
      body.observacoes || 'OS finalizada',
      user.loja_id,
    );
  }

  @Get(':id/validar-alcada')
  @ApiOperation({ summary: 'Validar alçada do usuário para aprovação' })
  @ApiResponse({ status: 200, description: 'Validação de alçada realizada' })
  async validarAlcada(@Param('id') osId: string, @Request() req: any) {
    const user = req['user'] || req.user;
    const usuarioId = user.id;

    // TODO: Implementar validação de alçada
    return {
      usuario_id: usuarioId,
      funcao: user.funcao,
      pode_aprovar: true,
      limite_maximo: 2000,
      valor_os: 0,
    };
  }
}
