import {
  Controller,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  BadRequestException,
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

@ApiTags('Workflow OS Comercial')
@ApiBearerAuth()
@Controller('os')
@UseGuards(JwtAuthGuard)
export class WorkflowComercialController {
  constructor(private readonly osService: OSService) {}

  @Patch(':id/transicionar-estado')
  @ApiOperation({
    summary: 'Transicionar OS para próximo estado do workflow comercial',
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

  @Patch(':id/aprovar-tecnica')
  @ApiOperation({ summary: 'Aprovar OS técnica (workflow comercial)' })
  @ApiResponse({ status: 200, description: 'OS aprovada tecnicamente' })
  @ApiResponse({
    status: 400,
    description: 'OS não é comercial ou dados inválidos',
  })
  @ApiResponse({
    status: 403,
    description: 'Usuário sem permissão de produção',
  })
  async aprovarTecnica(
    @Param('id') osId: string,
    @Body()
    body: {
      aprovado: boolean;
      observacoes?: string;
      prazos_itens?: Array<{
        item_id: string;
        data_inicio_producao?: string;
        data_prazo_produto?: string;
      }>;
      item_ids?: string[];
    },
    @Request() req: any,
  ) {
    const user = req.user;

    if (!user || !user.id) {
      throw new BadRequestException(
        'Usuário não autenticado ou ID não encontrado',
      );
    }

    const usuarioId = user.id;

    // Converte strings ISO em Date por item. Campos ausentes permanecem
    // undefined (= nao atualizar).
    const prazosItens = body.prazos_itens?.map((p) => ({
      item_id: p.item_id,
      ...(p.data_inicio_producao
        ? { data_inicio_producao: new Date(p.data_inicio_producao) }
        : {}),
      ...(p.data_prazo_produto
        ? { data_prazo_produto: new Date(p.data_prazo_produto) }
        : {}),
    }));

    return await this.osService.aprovarOSTecnica(
      osId,
      usuarioId,
      body.aprovado,
      body.observacoes,
      prazosItens,
      body.item_ids,
    );
  }

  @Post(':id/iniciar-producao')
  @ApiOperation({ summary: 'Iniciar produção da OS (após aprovação técnica)' })
  @ApiResponse({ status: 200, description: 'Produção iniciada com sucesso' })
  @ApiResponse({
    status: 400,
    description: 'OS não está aprovada tecnicamente',
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

  @Post(':id/finalizar-producao')
  @ApiOperation({ summary: 'Finalizar produção e mover para acabamento' })
  @ApiResponse({ status: 200, description: 'Produção finalizada com sucesso' })
  @ApiResponse({ status: 400, description: 'OS não está em produção' })
  async finalizarProducao(
    @Param('id') osId: string,
    @Body() body: { observacoes?: string },
    @Request() req: any,
  ) {
    const user = req['user'] || req.user;
    const usuarioId = user.id;

    return await this.osService.transicionarEstadoOS(
      osId,
      StatusOS.ACABAMENTO,
      usuarioId,
      body.observacoes || 'Produção finalizada',
      user.loja_id,
    );
  }

  @Post(':id/finalizar-os')
  @ApiOperation({ summary: 'Finalizar OS completamente' })
  @ApiResponse({ status: 200, description: 'OS finalizada com sucesso' })
  @ApiResponse({ status: 400, description: 'OS não está em acabamento' })
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
}
