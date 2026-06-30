import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { LojaId } from '../../auth/loja-id.decorator';
import {
  ConcluirLoteInstaladorDto,
  RegistrarOcorrenciaInstaladorDto,
} from '../dto/instalador.dto';
import { InstaladorPermissionsGuard } from '../guards/instalador-permissions.guard';
import { InstalacaoService } from '../services/instalacao.service';

@ApiTags('Instalador (Campo)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, InstaladorPermissionsGuard)
@Controller('instalador')
export class InstaladorController {
  constructor(private readonly instalacaoService: InstalacaoService) {}

  @Get('lotes')
  @ApiOperation({ summary: 'Fila de lotes pendentes para o instalador' })
  async listarLotes(@LojaId() lojaId: string) {
    return this.instalacaoService.listarLotesPendentesInstalador(lojaId);
  }

  @Get('lotes/:id')
  @ApiOperation({ summary: 'Detalhe do lote (sem dados financeiros)' })
  async obterLote(@LojaId() lojaId: string, @Param('id') id: string) {
    return this.instalacaoService.obterLoteInstalador(lojaId, id);
  }

  @Patch('lotes/:id/iniciar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Inicia trabalho no local' })
  async iniciarLote(@LojaId() lojaId: string, @Param('id') id: string) {
    return this.instalacaoService.iniciarLote(lojaId, id);
  }

  @Patch('lotes/:id/concluir')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Conclui lote com evidências e assinatura' })
  async concluirLote(
    @LojaId() lojaId: string,
    @Param('id') id: string,
    @Body() dto: ConcluirLoteInstaladorDto,
  ) {
    return this.instalacaoService.concluirLote(lojaId, id, dto);
  }

  @Post('ocorrencias')
  @ApiOperation({
    summary:
      'Registra ocorrência de campo (custos calculados automaticamente no servidor)',
  })
  async registrarOcorrencia(
    @LojaId() lojaId: string,
    @Body() dto: RegistrarOcorrenciaInstaladorDto,
  ) {
    return this.instalacaoService.registrarOcorrenciaObra({
      lojaId,
      osId: dto.os_id,
      itemInstalacaoId: dto.item_instalacao_id,
      tipo: dto.tipo,
      categoria: dto.categoria ?? undefined,
      quantidade: dto.quantidade,
      descricao: dto.descricao,
    });
  }
}
