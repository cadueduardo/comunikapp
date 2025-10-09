/**
 * Controller para gerenciamento de prazo da OS
 * Expõe endpoints para definir, atualizar e consultar prazo
 */

import { Controller, Post, Put, Get, Param, Body, Request, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiBody, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { OSPrazoService } from '../services/os-prazo.service';
import { DefinirPrazoDTO, LogPrazoRetroativoDTO } from '../dto/os-prazo.dto';

@ApiTags('OS - Gerenciamento de Prazo')
@ApiBearerAuth()
@Controller('os/prazo')
@UseGuards(JwtAuthGuard)
export class OSPrazoController {
  constructor(private readonly osPrazoService: OSPrazoService) {}

  @Post(':id/definir')
  @ApiOperation({ summary: 'Definir prazo para uma OS' })
  @ApiParam({ name: 'id', description: 'ID da OS' })
  @ApiBody({ type: DefinirPrazoDTO })
  @ApiResponse({ status: 200, description: 'Prazo definido com sucesso' })
  @ApiResponse({ status: 400, description: 'Data inválida ou OS não encontrada' })
  @ApiResponse({ status: 403, description: 'Usuário sem permissão' })
  async definirPrazo(
    @Param('id') osId: string,
    @Body() definirPrazoDTO: DefinirPrazoDTO,
    @Request() req: any
  ) {
    try {
      const lojaId = req.user.loja_id;
      const usuarioId = req.user.id;
      const ipOrigem = req.ip;
      const userAgent = req.get('User-Agent');

      const resultado = await this.osPrazoService.definirPrazo({
        osId,
        lojaId,
        usuarioId,
        dataPrazo: new Date(definirPrazoDTO.data_prazo),
        motivo: definirPrazoDTO.motivo,
        ipOrigem,
        userAgent,
        confirmarRetroativa: definirPrazoDTO.confirmar_retroativa || false
      });

      return {
        success: true,
        message: 'Prazo definido com sucesso',
        data: resultado
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao definir prazo',
          error: error.name || 'InternalServerError'
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put(':id/atualizar')
  @ApiOperation({ summary: 'Atualizar prazo de uma OS' })
  @ApiParam({ name: 'id', description: 'ID da OS' })
  @ApiBody({ type: DefinirPrazoDTO })
  @ApiResponse({ status: 200, description: 'Prazo atualizado com sucesso' })
  async atualizarPrazo(
    @Param('id') osId: string,
    @Body() definirPrazoDTO: DefinirPrazoDTO,
    @Request() req: any
  ) {
    try {
      const lojaId = req.user.loja_id;
      const usuarioId = req.user.id;
      const ipOrigem = req.ip;
      const userAgent = req.get('User-Agent');

      const resultado = await this.osPrazoService.definirPrazo({
        osId,
        lojaId,
        usuarioId,
        dataPrazo: new Date(definirPrazoDTO.data_prazo),
        motivo: definirPrazoDTO.motivo,
        ipOrigem,
        userAgent,
        confirmarRetroativa: definirPrazoDTO.confirmar_retroativa || false,
        isUpdate: true
      });

      return {
        success: true,
        message: 'Prazo atualizado com sucesso',
        data: resultado
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao atualizar prazo',
          error: error.name || 'InternalServerError'
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Consultar status do prazo de uma OS' })
  @ApiParam({ name: 'id', description: 'ID da OS' })
  @ApiResponse({ status: 200, description: 'Status do prazo consultado com sucesso' })
  async consultarStatusPrazo(@Param('id') osId: string, @Request() req: any) {
    try {
      const lojaId = req.user.loja_id;
      const status = await this.osPrazoService.consultarStatusPrazo(osId, lojaId);
      
      return {
        success: true,
        data: status
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao consultar status do prazo',
          error: error.name || 'InternalServerError'
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id/logs')
  @ApiOperation({ summary: 'Consultar logs de alteração de prazo de uma OS' })
  @ApiParam({ name: 'id', description: 'ID da OS' })
  @ApiResponse({ status: 200, description: 'Logs consultados com sucesso' })
  async consultarLogsPrazo(@Param('id') osId: string, @Request() req: any) {
    try {
      const lojaId = req.user.loja_id;
      const logs = await this.osPrazoService.consultarLogsPrazo(osId, lojaId);
      
      return {
        success: true,
        data: logs
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao consultar logs de prazo',
          error: error.name || 'InternalServerError'
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}


