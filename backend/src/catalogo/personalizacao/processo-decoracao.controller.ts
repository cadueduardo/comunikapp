import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentLojaId } from '../../auth/decorators';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CreateProcessoDecoracaoDto } from './dto/create-processo-decoracao.dto';
import { ListProcessosDecoracaoQueryDto } from './dto/list-processos-decoracao-query.dto';
import { UpdateProcessoDecoracaoDto } from './dto/update-processo-decoracao.dto';
import { ProcessoDecoracaoService } from './processo-decoracao.service';

@ApiTags('Catálogo — Personalização')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('catalogo/personalizacao')
export class ProcessoDecoracaoController {
  constructor(
    private readonly processoDecoracaoService: ProcessoDecoracaoService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Cadastra processo de decoração' })
  create(
    @Body() dto: CreateProcessoDecoracaoDto,
    @CurrentLojaId() lojaId: string,
  ) {
    return this.processoDecoracaoService.create(lojaId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista processos de decoração da loja' })
  findAll(
    @CurrentLojaId() lojaId: string,
    @Query() query: ListProcessosDecoracaoQueryDto,
  ) {
    return this.processoDecoracaoService.findAll(lojaId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtém processo por ID (tenant-scoped)' })
  findOne(@Param('id') id: string, @CurrentLojaId() lojaId: string) {
    return this.processoDecoracaoService.findOne(id, lojaId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza processo de decoração' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProcessoDecoracaoDto,
    @CurrentLojaId() lojaId: string,
  ) {
    return this.processoDecoracaoService.update(id, lojaId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Inativa processo (soft delete)' })
  remove(@Param('id') id: string, @CurrentLojaId() lojaId: string) {
    return this.processoDecoracaoService.remove(id, lojaId);
  }
}
