import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { AprovacaoAlcadaService, NivelAlcada } from '../services/aprovacao-alcada.service';
import { OSPermissionsGuard } from '../guards/os-permissions.guard';

interface AprovarOSRequest {
  observacoes?: string;
}

interface RejeitarOSRequest {
  motivoRejeicao: string;
}

interface EstatisticasQuery {
  periodoInicio?: string;
  periodoFim?: string;
}

@ApiTags('Aprovação por Alçada - OS Interna')
@ApiBearerAuth()
@Controller('os/aprovacao-alcada')
@UseGuards(OSPermissionsGuard)
export class AprovacaoAlcadaController {
  constructor(private readonly aprovacaoAlcadaService: AprovacaoAlcadaService) {}

  @Post(':id/aprovar')
  @ApiOperation({ summary: 'Aprovar OS Interna por alçada' })
  @ApiResponse({ status: 200, description: 'OS aprovada com sucesso.' })
  @ApiResponse({ status: 400, description: 'Erro na validação ou permissões insuficientes.' })
  @ApiResponse({ status: 404, description: 'OS não encontrada.' })
  @ApiParam({ name: 'id', description: 'ID da OS Interna' })
  async aprovarOSInterna(
    @Param('id') osId: string,
    @Body() body: AprovarOSRequest,
    @Request() req: any,
  ) {
    try {
      const user = req['user'] || req.user;
      const aprovadorId = user.id;
      const aprovadorCargo = user.funcao || 'USUARIO';

      await this.aprovacaoAlcadaService.aprovarOSInterna(
        osId,
        aprovadorId,
        aprovadorCargo,
        body.observacoes,
      );

      return {
        success: true,
        message: 'OS Interna aprovada com sucesso',
        osId,
        aprovador: aprovadorId,
        data: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post(':id/rejeitar')
  @ApiOperation({ summary: 'Rejeitar OS Interna por alçada' })
  @ApiResponse({ status: 200, description: 'OS rejeitada com sucesso.' })
  @ApiResponse({ status: 400, description: 'Erro na validação ou permissões insuficientes.' })
  @ApiResponse({ status: 404, description: 'OS não encontrada.' })
  @ApiParam({ name: 'id', description: 'ID da OS Interna' })
  async rejeitarOSInterna(
    @Param('id') osId: string,
    @Body() body: RejeitarOSRequest,
    @Request() req: any,
  ) {
    try {
      const user = req['user'] || req.user;
      const aprovadorId = user.id;

      await this.aprovacaoAlcadaService.rejeitarOSInterna(
        osId,
        aprovadorId,
        body.motivoRejeicao,
      );

      return {
        success: true,
        message: 'OS Interna rejeitada com sucesso',
        osId,
        aprovador: aprovadorId,
        motivo: body.motivoRejeicao,
        data: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('pendentes')
  @ApiOperation({ summary: 'Listar OS Internas pendentes de aprovação por alçada' })
  @ApiResponse({ status: 200, description: 'Lista de OS pendentes de aprovação.' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limite por página' })
  async listarOSPendentesAprovacao(
    @Request() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    try {
      const user = req['user'] || req.user;
      const lojaId = user.loja_id;
      const aprovadorCargo = user.funcao || 'USUARIO';

      const resultado = await this.aprovacaoAlcadaService.listarOSPendentesAprovacao(
        lojaId,
        aprovadorCargo,
        parseInt(page),
        parseInt(limit),
      );

      return {
        success: true,
        data: resultado.data,
        pagination: {
          page: resultado.page,
          limit: resultado.limit,
          total: resultado.total,
          totalPages: resultado.totalPages,
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('estatisticas')
  @ApiOperation({ summary: 'Obter estatísticas de aprovação por alçada' })
  @ApiResponse({ status: 200, description: 'Estatísticas de aprovação.' })
  @ApiQuery({ name: 'periodoInicio', required: false, type: String, description: 'Data de início (YYYY-MM-DD)' })
  @ApiQuery({ name: 'periodoFim', required: false, type: String, description: 'Data de fim (YYYY-MM-DD)' })
  async obterEstatisticasAprovacao(
    @Request() req: any,
    @Query() query: EstatisticasQuery,
  ) {
    try {
      const user = req['user'] || req.user;
      const lojaId = user.loja_id;

      const periodoInicio = query.periodoInicio ? new Date(query.periodoInicio) : undefined;
      const periodoFim = query.periodoFim ? new Date(query.periodoFim) : undefined;

      const estatisticas = await this.aprovacaoAlcadaService.obterEstatisticasAprovacao(
        lojaId,
        periodoInicio,
        periodoFim,
      );

      return {
        success: true,
        data: estatisticas,
        periodo: {
          inicio: periodoInicio?.toISOString(),
          fim: periodoFim?.toISOString(),
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('validar/:osId')
  @ApiOperation({ summary: 'Validar aprovação por alçada para uma OS específica' })
  @ApiResponse({ status: 200, description: 'Resultado da validação de alçada.' })
  @ApiResponse({ status: 404, description: 'OS não encontrada.' })
  @ApiParam({ name: 'osId', description: 'ID da OS Interna' })
  async validarAprovacaoAlcada(
    @Param('osId') osId: string,
    @Request() req: any,
  ) {
    try {
      const user = req['user'] || req.user;
      const lojaId = user.loja_id;

      // Buscar dados da OS
      const os = await this.aprovacaoAlcadaService['prisma'].ordemServico.findUnique({
        where: { id: osId },
        select: {
          id: true,
          valor_orcado: true,
          centro_custo: true,
          departamento_solicitante: true,
          loja_id: true,
          tipo_os: true,
        },
      });

      if (!os) {
        throw new HttpException('OS não encontrada', HttpStatus.NOT_FOUND);
      }

      if (os.tipo_os !== 'INTERNA') {
        throw new HttpException('Validação de alçada só é válida para OS Interna', HttpStatus.BAD_REQUEST);
      }

      const valorEstimado = Number(os.valor_orcado || 0);
      const validacao = await this.aprovacaoAlcadaService.validarAprovacaoAlcada(
        valorEstimado,
        os.centro_custo || '',
        os.departamento_solicitante || '',
        os.loja_id,
      );

      return {
        success: true,
        data: {
          osId: os.id,
          valorEstimado: validacao.valorEstimado,
          centroCusto: validacao.centroCusto,
          nivelRequerido: validacao.nivelRequerido,
          aprovadorRequerido: validacao.aprovadorRequerido,
          orcamentoDisponivel: validacao.orcamentoDisponivel,
          podeAprovar: validacao.podeAprovar,
          motivoBloqueio: validacao.motivoBloqueio,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('niveis-alcada')
  @ApiOperation({ summary: 'Listar níveis de alçada configurados' })
  @ApiResponse({ status: 200, description: 'Lista de níveis de alçada.' })
  async listarNiveisAlcada() {
    return {
      success: true,
      data: [
        {
          nivel: NivelAlcada.AUTOMATICA,
          descricao: 'Aprovação Automática',
          valorMinimo: 0,
          valorMaximo: 500,
          cargoAprovador: 'SISTEMA',
        },
        {
          nivel: NivelAlcada.GERENTE_DEPARTAMENTO,
          descricao: 'Gerente de Departamento',
          valorMinimo: 500,
          valorMaximo: 2000,
          cargoAprovador: 'GERENTE_DEPARTAMENTO',
        },
        {
          nivel: NivelAlcada.DIRETORIA,
          descricao: 'Diretoria',
          valorMinimo: 2000,
          cargoAprovador: 'DIRETORIA',
        },
      ],
    };
  }
}
