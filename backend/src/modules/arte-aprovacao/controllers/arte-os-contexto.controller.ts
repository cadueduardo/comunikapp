import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  BadRequestException,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { ArteFilaService } from '../services/arte-fila.service';
import { AtualizarPrazoArteDto } from '../dto/atualizar-prazo-arte.dto';

@ApiTags('Arte & Aprovação — Contexto OS')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('arte-aprovacao/os')
export class ArteOsContextoController {
  constructor(private readonly arteFilaService: ArteFilaService) {}

  @Get(':osId/itens-contexto')
  @ApiOperation({
    summary: 'Contexto de arte dos itens da OS (referências do orçamento)',
  })
  async listarItensContexto(
    @Request() req: any,
    @Param('osId') osId: string,
  ) {
    const lojaId = req.user.loja_id;
    const data = await this.arteFilaService.listarContextoPorOs(lojaId, osId);
    return { success: true, data };
  }

  @Patch(':osId/itens/:itemId/prazo-arte')
  @ApiOperation({ summary: 'Definir prazo de entrega da arte do item' })
  async atualizarPrazoArte(
    @Request() req: any,
    @Param('osId') osId: string,
    @Param('itemId') itemId: string,
    @Body() dto: AtualizarPrazoArteDto,
  ) {
    const lojaId = req.user.loja_id;
    const dataPrazo =
      dto.data_prazo_arte === undefined || dto.data_prazo_arte === null
        ? null
        : new Date(dto.data_prazo_arte);

    if (dataPrazo && Number.isNaN(dataPrazo.getTime())) {
      throw new BadRequestException('Data de prazo inválida');
    }

    const data = await this.arteFilaService.atualizarPrazoArteItem(
      lojaId,
      osId,
      itemId,
      dataPrazo,
    );

    return {
      success: true,
      data: {
        item_id: data.id,
        data_prazo_arte: data.data_prazo_arte?.toISOString?.() ?? null,
        status_arte: data.status_arte,
      },
    };
  }
}
