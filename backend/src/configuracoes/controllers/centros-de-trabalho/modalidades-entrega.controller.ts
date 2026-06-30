import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { LojaId } from '../../../auth/loja-id.decorator';
import {
  CreateModalidadeEntregaDto,
  UpdateModalidadeEntregaDto,
} from '../../dto/centros-de-trabalho/modalidades-entrega.dto';
import { ModalidadesEntregaService } from '../../services/centros-de-trabalho/modalidades-entrega.service';

@ApiTags('Centros de Trabalho - Modalidades de Entrega')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('centros-de-trabalho/modalidades-entrega')
export class ModalidadesEntregaController {
  constructor(private readonly service: ModalidadesEntregaService) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma modalidade de entrega' })
  @ApiResponse({ status: 201, description: 'Modalidade criada com sucesso.' })
  async criar(
    @LojaId() lojaId: string,
    @Body() dto: CreateModalidadeEntregaDto,
  ) {
    return this.service.criar(lojaId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista modalidades de entrega da loja' })
  async listar(@LojaId() lojaId: string, @Query('ativo') ativo?: string) {
    const ativoBoolean = ativo ? ativo === 'true' : undefined;
    return this.service.listar(lojaId, ativoBoolean);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtem uma modalidade de entrega pelo ID' })
  async obter(@Param('id') id: string, @LojaId() lojaId: string) {
    return this.service.obterPorId(id, lojaId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza uma modalidade de entrega' })
  async atualizar(
    @Param('id') id: string,
    @LojaId() lojaId: string,
    @Body() dto: UpdateModalidadeEntregaDto,
  ) {
    return this.service.atualizar(id, lojaId, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary:
      'Remove ou inativa uma modalidade de entrega sem quebrar historico',
  })
  async remover(@Param('id') id: string, @LojaId() lojaId: string) {
    return this.service.remover(id, lojaId);
  }
}
