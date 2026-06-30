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
import { ConjuntosCamposService } from './conjuntos-campos.service';
import { CreateConjuntoCamposDto } from './dto/create-conjunto-campos.dto';
import { ListConjuntosCamposQueryDto } from './dto/list-conjuntos-campos-query.dto';
import { UpdateConjuntoCamposDto } from './dto/update-conjunto-campos.dto';

@ApiTags('Catálogo — Conjuntos de campos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('catalogo/conjuntos-campos')
export class ConjuntosCamposController {
  constructor(
    private readonly conjuntosCamposService: ConjuntosCamposService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Cadastra conjunto de campos com definições' })
  create(
    @Body() dto: CreateConjuntoCamposDto,
    @CurrentLojaId() lojaId: string,
  ) {
    return this.conjuntosCamposService.create(lojaId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista conjuntos de campos da loja' })
  findAll(
    @CurrentLojaId() lojaId: string,
    @Query() query: ListConjuntosCamposQueryDto,
  ) {
    return this.conjuntosCamposService.findAll(lojaId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtém conjunto por ID (tenant-scoped)' })
  findOne(@Param('id') id: string, @CurrentLojaId() lojaId: string) {
    return this.conjuntosCamposService.findOne(id, lojaId);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualiza conjunto e opcionalmente substitui campos',
  })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateConjuntoCamposDto,
    @CurrentLojaId() lojaId: string,
  ) {
    return this.conjuntosCamposService.update(id, lojaId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Inativa conjunto (soft delete)' })
  remove(@Param('id') id: string, @CurrentLojaId() lojaId: string) {
    return this.conjuntosCamposService.remove(id, lojaId);
  }
}
