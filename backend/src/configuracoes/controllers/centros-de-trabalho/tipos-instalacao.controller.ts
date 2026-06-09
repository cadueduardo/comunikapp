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
  CreateTipoInstalacaoDto,
  UpdateTipoInstalacaoDto,
} from '../../dto/centros-de-trabalho/tipos-instalacao.dto';
import { TiposInstalacaoService } from '../../services/centros-de-trabalho/tipos-instalacao.service';

@ApiTags('Centros de Trabalho - Tipos de Instalacao')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('centros-de-trabalho/tipos-instalacao')
export class TiposInstalacaoController {
  constructor(private readonly service: TiposInstalacaoService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um tipo de instalacao' })
  @ApiResponse({ status: 201, description: 'Tipo criado com sucesso.' })
  async criar(@LojaId() lojaId: string, @Body() dto: CreateTipoInstalacaoDto) {
    return this.service.criar(lojaId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista tipos de instalacao da loja' })
  async listar(@LojaId() lojaId: string, @Query('ativo') ativo?: string) {
    const ativoBoolean = ativo ? ativo === 'true' : undefined;
    return this.service.listar(lojaId, ativoBoolean);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtem um tipo de instalacao pelo ID' })
  async obter(@Param('id') id: string, @LojaId() lojaId: string) {
    return this.service.obterPorId(id, lojaId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza um tipo de instalacao' })
  async atualizar(
    @Param('id') id: string,
    @LojaId() lojaId: string,
    @Body() dto: UpdateTipoInstalacaoDto,
  ) {
    return this.service.atualizar(id, lojaId, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remove ou inativa um tipo de instalacao sem quebrar historico',
  })
  async remover(@Param('id') id: string, @LojaId() lojaId: string) {
    return this.service.remover(id, lojaId);
  }
}
