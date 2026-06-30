import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentLojaId, CurrentUser } from '../auth/decorators';
import { AuthenticatedUser } from '../auth/auth.service';
import { CobrancasService } from './services/cobrancas.service';
import { RegistrarRecebimentoDto } from './dto/registrar-recebimento.dto';
import { CancelarCobrancaDto } from './dto/cancelar-cobranca.dto';

/**
 * Endpoints do financeiro minimo (Fase 6).
 *
 * Todos exigem JWT valido. As permissoes finas (ex.: `financeiro.registrar_recebimento`,
 * `financeiro.forcar_recebimento_total`) sao validadas no metodo correspondente
 * via consulta ao `perfil_permissao` (helper interno).
 *
 * Quando a permissao falhar, retornamos 403 com mensagem clara para o usuario
 * entender que falta acesso (regra do princpio "Permissao visivel").
 */
@Controller('financeiro')
@UseGuards(JwtAuthGuard)
export class FinanceiroController {
  constructor(private readonly cobrancasService: CobrancasService) {}

  @Get('cobrancas')
  async listarCobrancas(
    @CurrentLojaId() lojaId: string,
    @Query('status') status?: string,
    @Query('cliente_id') clienteId?: string,
    @Query('data_inicio') dataInicio?: string,
    @Query('data_fim') dataFim?: string,
    @Query('pagina') paginaRaw?: string,
    @Query('por_pagina') porPaginaRaw?: string,
  ) {
    const pagina = paginaRaw ? Number(paginaRaw) : 1;
    const porPagina = porPaginaRaw ? Number(porPaginaRaw) : 25;
    return this.cobrancasService.listar(lojaId, {
      status,
      cliente_id: clienteId,
      data_inicio: this.parseDataOpcional(dataInicio, 'data_inicio'),
      data_fim: this.parseDataOpcional(dataFim, 'data_fim'),
      pagina,
      por_pagina: porPagina,
    });
  }

  /**
   * Export CSV (Fase 6.D).
   * Os filtros aceitos sao os mesmos do `GET /financeiro/cobrancas` (sem paginacao).
   * Limitado a 5000 linhas para evitar estourar memoria.
   *
   * Nome do arquivo inclui timestamp UTC para evitar colisao no download.
   */
  @Get('cobrancas/export.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async exportarCobrancasCsv(
    @CurrentLojaId() lojaId: string,
    @Res() res: Response,
    @Query('status') status?: string,
    @Query('cliente_id') clienteId?: string,
    @Query('data_inicio') dataInicio?: string,
    @Query('data_fim') dataFim?: string,
  ) {
    const csv = await this.cobrancasService.exportarCsv(lojaId, {
      status,
      cliente_id: clienteId,
      data_inicio: this.parseDataOpcional(dataInicio, 'data_inicio'),
      data_fim: this.parseDataOpcional(dataFim, 'data_fim'),
    });
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="cobrancas-${ts}.csv"`,
    );
    res.send(csv);
  }

  @Get('cobrancas/:id')
  async obterCobranca(
    @CurrentLojaId() lojaId: string,
    @Param('id') id: string,
  ) {
    return this.cobrancasService.obterDetalhe(id, lojaId);
  }

  @Post('cobrancas/:id/recebimentos')
  async registrarRecebimento(
    @CurrentLojaId() lojaId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RegistrarRecebimentoDto,
    @Req() req: Request,
  ) {
    return this.cobrancasService.registrarRecebimento(
      id,
      lojaId,
      dto,
      user?.id ?? null,
      {
        ip_origem: this.extrairIp(req),
        user_agent: req.headers['user-agent'] ?? undefined,
      },
    );
  }

  @Post('cobrancas/:id/cancelar')
  async cancelarCobranca(
    @CurrentLojaId() lojaId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CancelarCobrancaDto,
    @Req() req: Request,
  ) {
    return this.cobrancasService.cancelar(
      id,
      lojaId,
      dto.motivo ?? null,
      user?.id ?? null,
      {
        ip_origem: this.extrairIp(req),
        user_agent: req.headers['user-agent'] ?? undefined,
      },
    );
  }

  private parseDataOpcional(
    valor: string | undefined,
    campo: string,
  ): Date | undefined {
    if (!valor) return undefined;
    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) {
      throw new BadRequestException(`${campo} invalido (use ISO 8601)`);
    }
    return data;
  }

  private extrairIp(req: Request): string | undefined {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
    return req.ip;
  }
}
