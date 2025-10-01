/**
 * Controller principal para Ordens de Serviço
 * Limite: ≤ 200 linhas conforme premissas
 * Endpoints: CRUD básico, avanço de etapas, estatísticas
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OSService } from '../services/os.service';
import { OrdemServicoResponseDto } from '../dto/os-response.dto';
import { CreateOSDto } from '../dto/create-os.dto';
import { UpdateOSDto } from '../dto/update-os.dto';
import { OSPermissionsGuard } from '../guards/os-permissions.guard';

@ApiTags('Ordens de Serviço')
@ApiBearerAuth()
@Controller('os')
@UseGuards(OSPermissionsGuard)
export class OSController {
  constructor(private readonly osService: OSService) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova ordem de serviço' })
  @ApiResponse({ status: 201, description: 'OS criada com sucesso', type: OrdemServicoResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async criarOS(@Body() createOSDto: CreateOSDto, @Request() req: any) {
    const user = req['user'] || req.user;
    const loja_id = user.loja_id;
    const resultado = await this.osService.create(loja_id, createOSDto);
      return OrdemServicoResponseDto.fromDomain(resultado);
  }

  @Get()
  @ApiOperation({ summary: 'Listar ordens de serviço' })
  @ApiResponse({ status: 200, description: 'Lista de OS retornada' })
  async listarOS(
    @Request() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: string,
    @Query('cliente_id') cliente_id?: string,
  ) {
    const user = req['user'] || req.user;
    const loja_id = user.loja_id;
    const resultado = await this.osService.findAll(
      loja_id,
      parseInt(page),
      parseInt(limit),
      status,
      cliente_id,
    );

    return {
      ...resultado,
      data: resultado.data.map(item => OrdemServicoResponseDto.fromDomain(item)),
    };
  }

  @Get('estatisticas')
  @ApiOperation({ summary: 'Obter estatísticas das OS' })
  @ApiResponse({ status: 200, description: 'Estatísticas retornadas' })
  async obterEstatisticas(@Request() req: any) {
    const user = req['user'] || req.user;
    const loja_id = user.loja_id;
    return await this.osService.getEstatisticas(loja_id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter OS por ID' })
  @ApiResponse({ status: 200, description: 'OS encontrada', type: OrdemServicoResponseDto })
  @ApiResponse({ status: 404, description: 'OS não encontrada' })
  async obterOS(@Param('id') id: string, @Request() req: any) {
    const user = req['user'] || req.user;
    const loja_id = user.loja_id;
    const resultado = await this.osService.findOne(id, loja_id);
    return OrdemServicoResponseDto.fromDomain(resultado);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar OS' })
  @ApiResponse({ status: 200, description: 'OS atualizada com sucesso', type: OrdemServicoResponseDto })
  @ApiResponse({ status: 404, description: 'OS não encontrada' })
  async atualizarOS(
    @Param('id') id: string,
    @Body() updateOSDto: UpdateOSDto,
    @Request() req: any,
  ) {
    const user = req['user'] || req.user;
    const loja_id = user.loja_id;
    const user_id = user.sub || user.id;
    const resultado = await this.osService.update(id, loja_id, updateOSDto, user_id);
    return OrdemServicoResponseDto.fromDomain(resultado);
  }

  @Patch(':id/avancar-etapa')
  @ApiOperation({ summary: 'Avançar etapa da OS' })
  @ApiResponse({ status: 200, description: 'Etapa avançada com sucesso' })
  @ApiResponse({ status: 400, description: 'Transição inválida' })
  async avancarEtapa(
    @Param('id') id: string,
    @Body() body: { nova_etapa: string; observacoes?: string },
    @Request() req: any,
  ) {
    const user = req['user'] || req.user;
    const loja_id = user.loja_id;
    const user_id = user.sub || user.id;
    const resultado = await this.osService.avancarEtapa(
      id,
      body.nova_etapa,
      loja_id,
      user_id,
    );
    return OrdemServicoResponseDto.fromDomain(resultado);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir OS' })
  @ApiResponse({ status: 200, description: 'OS excluída com sucesso' })
  @ApiResponse({ status: 404, description: 'OS não encontrada' })
  async excluirOS(@Param('id') id: string, @Request() req: any) {
    const user = req['user'] || req.user;
    const loja_id = user.loja_id;
    const user_id = user.sub || user.id;
    return await this.osService.remove(id, loja_id, user_id);
  }
}
