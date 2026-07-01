import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  BadRequestException,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { ArteFilaService } from '../services/arte-fila.service';
import { ArteClienteArquivoService } from '../services/arte-cliente-arquivo.service';
import { AtualizarPrazoArteDto } from '../dto/atualizar-prazo-arte.dto';
import { RegistrarLinkArteDto } from '../dto/registrar-link-arte.dto';
import { SolicitarArteClienteDto } from '../dto/solicitar-arte-cliente.dto';

@ApiTags('Arte & Aprovação — Contexto OS')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('arte-aprovacao/os')
export class ArteOsContextoController {
  constructor(
    private readonly arteFilaService: ArteFilaService,
    private readonly arteClienteArquivoService: ArteClienteArquivoService,
  ) {}

  @Get(':osId/itens-contexto')
  @ApiOperation({
    summary: 'Contexto de arte dos itens da OS (referências do orçamento)',
  })
  async listarItensContexto(@Request() req: any, @Param('osId') osId: string) {
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

  @Post(':osId/itens/:itemId/registrar-link')
  @ApiOperation({
    summary: 'Registrar link externo (Drive ou URL) como arquivo do cliente',
  })
  async registrarLink(
    @Request() req: any,
    @Param('osId') osId: string,
    @Param('itemId') itemId: string,
    @Body() dto: RegistrarLinkArteDto,
  ) {
    const lojaId = req.user.loja_id;
    const usuarioId = req.user.sub ?? req.user.id;
    const data = await this.arteClienteArquivoService.registrarLink(
      lojaId,
      osId,
      itemId,
      usuarioId,
      dto,
    );
    return { success: true, data };
  }

  @Post(':osId/itens/:itemId/solicitar-arte')
  @ApiOperation({
    summary: 'Enviar e-mail manual solicitando arte ao cliente',
  })
  async solicitarArte(
    @Request() req: any,
    @Param('osId') osId: string,
    @Param('itemId') itemId: string,
    @Body() dto: SolicitarArteClienteDto,
  ) {
    const lojaId = req.user.loja_id;
    const data = await this.arteClienteArquivoService.solicitarArte(
      lojaId,
      osId,
      itemId,
      dto,
    );
    return { success: true, data };
  }
}
