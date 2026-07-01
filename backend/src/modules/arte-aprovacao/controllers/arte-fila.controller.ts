import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { ArteFilaService } from '../services/arte-fila.service';
import { ArteFilaTransicaoService } from '../services/arte-fila-transicao.service';
import { ArteVersaoService } from '../services/arte-versao.service';
import { FilaArteQueryDto } from '../dto/fila-arte-query.dto';
import { AtualizarStatusArteDto } from '../dto/atualizar-status-arte.dto';

@ApiTags('Arte & Aprovação — Fila')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('arte-aprovacao/fila')
export class ArteFilaController {
  constructor(
    private readonly arteFilaService: ArteFilaService,
    private readonly arteFilaTransicaoService: ArteFilaTransicaoService,
    private readonly arteVersaoService: ArteVersaoService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar fila de arte da loja' })
  async listar(@Request() req: any, @Query() query: FilaArteQueryDto) {
    const lojaId = req.user.loja_id;
    const usuarioId = req.user.sub ?? req.user.id;
    const resultado = await this.arteFilaService.listar(
      lojaId,
      query,
      usuarioId,
    );
    return { success: true, ...resultado };
  }

  @Get('contagem')
  @ApiOperation({ summary: 'Contagem de itens pendentes na fila' })
  async contagem(@Request() req: any) {
    const lojaId = req.user.loja_id;
    const total = await this.arteFilaService.contarPendentes(lojaId);
    return { success: true, data: { total } };
  }

  @Post(':itemOsId/assumir')
  @ApiOperation({ summary: 'Assumir item da fila de arte' })
  async assumir(@Request() req: any, @Param('itemOsId') itemOsId: string) {
    const lojaId = req.user.loja_id;
    const usuarioId = req.user.sub ?? req.user.id;
    const data = await this.arteFilaTransicaoService.assumir(
      itemOsId,
      lojaId,
      usuarioId,
    );
    return { success: true, data };
  }

  @Patch(':itemOsId/status')
  @ApiOperation({ summary: 'Atualizar status de arte do item' })
  async atualizarStatus(
    @Request() req: any,
    @Param('itemOsId') itemOsId: string,
    @Body() dto: AtualizarStatusArteDto,
  ) {
    const lojaId = req.user.loja_id;
    const data = await this.arteFilaTransicaoService.atualizarStatus(
      itemOsId,
      lojaId,
      dto,
    );
    return { success: true, data };
  }

  @Post(':itemOsId/liberar-pcp')
  @ApiOperation({
    summary: 'Liberar arte aprovada do item para produção (PCP)',
  })
  async liberarParaPcp(
    @Request() req: any,
    @Param('itemOsId') itemOsId: string,
  ) {
    const lojaId = req.user.loja_id;
    const usuarioId = req.user.sub ?? req.user.id;
    const versaoId =
      await this.arteFilaTransicaoService.obterVersaoAprovadaParaLiberacao(
        itemOsId,
        lojaId,
      );
    const data = await this.arteVersaoService.liberarParaPCP(
      versaoId,
      usuarioId,
      lojaId,
    );
    return { success: true, data };
  }
}
