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
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { extrairIdentidadeAutenticada } from '../../auth/decorators';
import { AtividadesService } from './atividades.service';
import {
  AtualizarAtividadeDto,
  CriarAtividadeDto,
  ListarAtividadesQueryDto,
} from './dto/atividade.dto';

@ApiTags('Vendas — Atividades')
@ApiBearerAuth()
@Controller('vendas/atividades')
@UseGuards(JwtAuthGuard)
export class AtividadesController {
  constructor(private readonly atividades: AtividadesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar atividades comerciais' })
  listar(@Request() req: unknown, @Query() query: ListarAtividadesQueryDto) {
    return this.atividades.listar(extrairIdentidadeAutenticada(req), query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter atividade' })
  obter(@Request() req: unknown, @Param('id') id: string) {
    return this.atividades.obter(extrairIdentidadeAutenticada(req), id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar atividade' })
  criar(@Request() req: unknown, @Body() dto: CriarAtividadeDto) {
    return this.atividades.criar(extrairIdentidadeAutenticada(req), dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar atividade' })
  atualizar(
    @Request() req: unknown,
    @Param('id') id: string,
    @Body() dto: AtualizarAtividadeDto,
  ) {
    return this.atividades.atualizar(
      extrairIdentidadeAutenticada(req),
      id,
      dto,
    );
  }

  @Post(':id/concluir')
  @ApiOperation({ summary: 'Concluir atividade (idempotente)' })
  concluir(@Request() req: unknown, @Param('id') id: string) {
    return this.atividades.concluir(extrairIdentidadeAutenticada(req), id);
  }
}
