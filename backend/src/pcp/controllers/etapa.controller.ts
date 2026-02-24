import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { EtapaService } from '../services/etapa.service';
import {
  CreateEtapaInstanciaDto,
  UpdateEtapaInstanciaDto,
} from '../interfaces/pcp.interfaces';

@Controller('pcp/etapas')
@UseGuards(JwtAuthGuard)
export class EtapaController {
  constructor(private etapaService: EtapaService) {}

  @Post()
  async criarEtapa(@Body() dto: CreateEtapaInstanciaDto) {
    return this.etapaService.criarEtapa(dto);
  }

  @Get(':id')
  async buscarPorId(@Param('id') id: string) {
    return this.etapaService.buscarPorId(id);
  }

  @Get('workflow/:workflowInstanciaId')
  async buscarPorWorkflow(
    @Param('workflowInstanciaId') workflowInstanciaId: string,
  ) {
    return this.etapaService.buscarPorWorkflow(workflowInstanciaId);
  }

  @Put(':id')
  async atualizarEtapa(
    @Param('id') id: string,
    @Body() dto: UpdateEtapaInstanciaDto,
  ) {
    return this.etapaService.atualizarEtapa(id, dto);
  }

  @Put(':id/iniciar')
  async iniciarEtapa(
    @Param('id') id: string,
    @Body() body: { responsavel_id: string },
  ) {
    return this.etapaService.iniciarEtapa(id, body.responsavel_id);
  }

  @Put(':id/concluir')
  async concluirEtapa(
    @Param('id') id: string,
    @Body() body: { observacoes?: string },
  ) {
    return this.etapaService.concluirEtapa(id, body.observacoes);
  }

  @Delete(':id')
  async deletarEtapa(@Param('id') id: string) {
    await this.etapaService.deletarEtapa(id);
    return { message: 'Etapa removida com sucesso' };
  }

  @Get(':id/status')
  async getStatus(@Param('id') id: string) {
    const etapa = await this.etapaService.buscarPorId(id);
    return {
      status: etapa?.status || 'NAO_ENCONTRADA',
      progresso: this.calcularProgressoEtapa(etapa),
    };
  }

  private calcularProgressoEtapa(etapa: any): number {
    if (!etapa?.checklists) return 0;

    const totalChecklists = etapa.checklists.length;
    const checklistsConcluidos = etapa.checklists.filter(
      (c) => c.concluido,
    ).length;

    return totalChecklists > 0
      ? Math.round((checklistsConcluidos / totalChecklists) * 100)
      : 0;
  }
}
