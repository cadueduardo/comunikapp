/**
 * Controller para OS Direta e Interna
 * Objetivo: Endpoints específicos para funcionalidades diferenciadas conforme PLANO Fase 1
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { OSService } from '../services/os.service';
import { OrdemServicoResponseDto } from '../dto/os-response.dto';
import { CreateOSDto } from '../dto/create-os.dto';
import { OSPermissionsGuard } from '../guards/os-permissions.guard';
import { TipoOS } from '../interfaces/os-direta-interna.interface';

@ApiTags('OS Direta/Interna')
@ApiBearerAuth()
@Controller('os')
@UseGuards(OSPermissionsGuard)
export class OSDiretaInternaController {
  constructor(private readonly osService: OSService) {}

  @Post('comercial')
  @ApiOperation({ summary: 'Criar OS Comercial' })
  @ApiResponse({ status: 201, description: 'OS Comercial criada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async criarOSComercial(
    @Body() createOSDto: CreateOSDto,
    @Request() req: any,
  ) {
    const user = req['user'] || req.user;
    const lojaId = user.loja_id;
    const usuarioId = user.id;

    const resultado = await this.osService.criarOSComercial(
      lojaId,
      createOSDto,
      usuarioId,
    );
    return OrdemServicoResponseDto.fromDomain(resultado);
  }

  @Post('interna')
  @ApiOperation({ summary: 'Criar OS Interna' })
  @ApiResponse({ status: 201, description: 'OS Interna criada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async criarOSInterna(@Body() createOSDto: CreateOSDto, @Request() req: any) {
    const user = req['user'] || req.user;
    const lojaId = user.loja_id;
    const usuarioId = user.id;

    const resultado = await this.osService.criarOSInterna(
      lojaId,
      createOSDto,
      usuarioId,
    );
    return OrdemServicoResponseDto.fromDomain(resultado);
  }

  @Get('comercial')
  @ApiOperation({ summary: 'Listar OS Comerciais' })
  @ApiResponse({ status: 200, description: 'Lista de OS Comerciais retornada' })
  async listarOSComerciais(
    @Request() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: string,
  ) {
    const user = req['user'] || req.user;
    const lojaId = user.loja_id;

    const resultado = await this.osService.listarOSPorTipo(
      lojaId,
      TipoOS.COMERCIAL,
      parseInt(page),
      parseInt(limit),
      status,
    );

    return {
      ...resultado,
      data: resultado.data.map((item) =>
        OrdemServicoResponseDto.fromDomain(item),
      ),
    };
  }

  @Get('interna')
  @ApiOperation({ summary: 'Listar OS Internas' })
  @ApiResponse({ status: 200, description: 'Lista de OS Internas retornada' })
  async listarOSInternas(
    @Request() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: string,
  ) {
    const user = req['user'] || req.user;
    const lojaId = user.loja_id;

    const resultado = await this.osService.listarOSPorTipo(
      lojaId,
      TipoOS.INTERNA,
      parseInt(page),
      parseInt(limit),
      status,
    );

    return {
      ...resultado,
      data: resultado.data.map((item) =>
        OrdemServicoResponseDto.fromDomain(item),
      ),
    };
  }

  @Patch(':id/aprovar-tecnica')
  @ApiOperation({ summary: 'Aprovar OS Técnica (OS Comercial)' })
  @ApiResponse({ status: 200, description: 'OS aprovada tecnicamente' })
  @ApiResponse({
    status: 400,
    description: 'OS não é comercial ou dados inválidos',
  })
  async aprovarOSTecnica(
    @Param('id') osId: string,
    @Body()
    body: {
      aprovado: boolean;
      observacoes?: string;
      prazos_itens?: Array<{
        item_id: string;
        data_inicio_producao?: string;
        data_prazo_produto?: string;
      }>;
      item_ids?: string[];
    },
    @Request() req: any,
  ) {
    const user = req['user'] || req.user;

    if (!user || (!user.id && !user.sub)) {
      throw new BadRequestException(
        'Usuário não autenticado ou ID não encontrado',
      );
    }

    const usuarioId = user.sub || user.id;

    const prazosItens = body.prazos_itens?.map((p) => ({
      item_id: p.item_id,
      ...(p.data_inicio_producao
        ? { data_inicio_producao: new Date(p.data_inicio_producao) }
        : {}),
      ...(p.data_prazo_produto
        ? { data_prazo_produto: new Date(p.data_prazo_produto) }
        : {}),
    }));

    const resultado = await this.osService.aprovarOSTecnica(
      osId,
      usuarioId,
      body.aprovado,
      body.observacoes,
      prazosItens,
      body.item_ids,
    );

    return OrdemServicoResponseDto.fromDomain(resultado);
  }

  @Patch(':id/aprovar-gerencial')
  @ApiOperation({ summary: 'Aprovar OS Gerencial (OS Interna)' })
  @ApiResponse({ status: 200, description: 'OS aprovada gerencialmente' })
  @ApiResponse({
    status: 400,
    description: 'OS não é interna ou dados inválidos',
  })
  async aprovarOSGerencial(
    @Param('id') osId: string,
    @Body() body: { aprovado: boolean; observacoes?: string },
    @Request() req: any,
  ) {
    const user = req['user'] || req.user;
    const usuarioId = user.id;

    const resultado = await this.osService.aprovarOSGerencial(
      osId,
      usuarioId,
      body.aprovado,
      body.observacoes,
    );

    return OrdemServicoResponseDto.fromDomain(resultado);
  }

  @Patch(':id/agendar-instalacao')
  @ApiOperation({ summary: 'Agendar instalação (OS Comercial)' })
  @ApiResponse({ status: 200, description: 'Instalação agendada' })
  @ApiResponse({
    status: 400,
    description: 'OS não é comercial ou dados inválidos',
  })
  async agendarInstalacao(
    @Param('id') osId: string,
    @Body() body: { dataInstalacao: string; observacoes?: string },
    @Request() req: any,
  ) {
    const user = req['user'] || req.user;
    const usuarioId = user.id;

    const resultado = await this.osService.agendarInstalacao(
      osId,
      new Date(body.dataInstalacao),
      body.observacoes,
      usuarioId,
    );

    return OrdemServicoResponseDto.fromDomain(resultado);
  }

  @Get('estatisticas/tipo')
  @ApiOperation({ summary: 'Obter estatísticas por tipo de OS' })
  @ApiResponse({ status: 200, description: 'Estatísticas por tipo retornadas' })
  async obterEstatisticasPorTipo(
    @Request() req: any,
    @Query('ano') ano?: string,
  ) {
    const user = req['user'] || req.user;
    const lojaId = user.loja_id;

    const anoReferencia = ano ? parseInt(ano) : undefined;
    const resultado = await this.osService.obterEstatisticasPorTipo(
      lojaId,
      anoReferencia,
    );

    return {
      sucesso: true,
      lojaId,
      ano: anoReferencia || new Date().getFullYear(),
      estatisticas: resultado,
    };
  }

  @Get('pendentes/aprovacao-tecnica')
  @ApiOperation({
    summary: 'Listar OS Comerciais pendentes de aprovação técnica',
  })
  @ApiResponse({ status: 200, description: 'Lista de OS pendentes retornada' })
  async listarOSPendentesAprovacaoTecnica(
    @Request() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const user = req['user'] || req.user;
    const lojaId = user.loja_id;

    // Buscar OS comerciais com aprovação técnica pendente
    const resultado = await this.osService.listarOSPorTipo(
      lojaId,
      TipoOS.COMERCIAL,
      parseInt(page),
      parseInt(limit),
      'FILA', // Status inicial
    );

    // Filtrar apenas as que estão pendentes de aprovação técnica
    const osPendentes = resultado.data.filter(
      (os) =>
        os.aprovacao_tecnica_status === 'PENDENTE' ||
        !os.aprovacao_tecnica_status,
    );

    return {
      ...resultado,
      data: osPendentes.map((item) => OrdemServicoResponseDto.fromDomain(item)),
      total: osPendentes.length,
    };
  }

  @Get('pendentes/aprovacao-gerencial')
  @ApiOperation({
    summary: 'Listar OS Internas pendentes de aprovação gerencial',
  })
  @ApiResponse({ status: 200, description: 'Lista de OS pendentes retornada' })
  async listarOSPendentesAprovacaoGerencial(
    @Request() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const user = req['user'] || req.user;
    const lojaId = user.loja_id;

    // Buscar OS internas com aprovação gerencial pendente
    const resultado = await this.osService.listarOSPorTipo(
      lojaId,
      TipoOS.INTERNA,
      parseInt(page),
      parseInt(limit),
      'FILA', // Status inicial
    );

    // Filtrar apenas as que estão pendentes de aprovação gerencial
    const osPendentes = resultado.data.filter(
      (os) => os.aprovacao_gerencial === 'PENDENTE' || !os.aprovacao_gerencial,
    );

    return {
      ...resultado,
      data: osPendentes.map((item) => OrdemServicoResponseDto.fromDomain(item)),
      total: osPendentes.length,
    };
  }

  @Get('instalacoes/agendadas')
  @ApiOperation({ summary: 'Listar instalações agendadas (OS Comerciais)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de instalações agendadas retornada',
  })
  async listarInstalacoesAgendadas(
    @Request() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    const user = req['user'] || req.user;
    const lojaId = user.loja_id;

    // Buscar OS comerciais com instalação agendada
    const resultado = await this.osService.listarOSPorTipo(
      lojaId,
      TipoOS.COMERCIAL,
      parseInt(page),
      parseInt(limit),
    );

    // Filtrar apenas as que têm instalação agendada
    let osComInstalacao = resultado.data.filter(
      (os) => os.data_instalacao_agendada,
    );

    // Filtrar por período se especificado
    if (dataInicio && dataFim) {
      const inicio = new Date(dataInicio);
      const fim = new Date(dataFim);
      osComInstalacao = osComInstalacao.filter((os) => {
        const dataInstalacao = new Date(os.data_instalacao_agendada);
        return dataInstalacao >= inicio && dataInstalacao <= fim;
      });
    }

    return {
      ...resultado,
      data: osComInstalacao.map((item) =>
        OrdemServicoResponseDto.fromDomain(item),
      ),
      total: osComInstalacao.length,
    };
  }

  @Get(':id/validar-sincronizacao')
  @ApiOperation({ summary: 'Validar sincronização OS-Orçamento' })
  @ApiResponse({ status: 200, description: 'Validação realizada com sucesso' })
  @ApiResponse({ status: 404, description: 'OS não encontrada' })
  async validarSincronizacao(@Param('id') osId: string, @Request() req: any) {
    const user = req['user'] || req.user;
    const lojaId = user.loja_id;

    return await this.osService.validarSincronizacaoOSOrcamento(osId);
  }

  @Patch(':id/sincronizar-orcamento')
  @ApiOperation({ summary: 'Sincronizar OS com orçamento' })
  @ApiResponse({
    status: 200,
    description: 'Sincronização realizada com sucesso',
  })
  @ApiResponse({ status: 404, description: 'OS não encontrada' })
  @ApiResponse({ status: 400, description: 'OS sem orçamento vinculado' })
  async sincronizarComOrcamento(
    @Param('id') osId: string,
    @Request() req: any,
  ) {
    const user = req['user'] || req.user;
    const lojaId = user.loja_id;

    return await this.osService.sincronizarComOrcamento(osId, lojaId);
  }
}
