import { Controller, Get, Post, Body, Param, Query, HttpException, HttpStatus } from '@nestjs/common';
import { DocumentCodeService, TipoOS } from './document-code.service';

/**
 * Controller para funcionalidades de numeração de documentos
 * Objetivo: Endpoints para geração e validação de códigos conforme PLANO Fase 1
 */

@Controller('documentos')
export class DocumentCodeController {
  
  constructor(private readonly documentCodeService: DocumentCodeService) {}
  
  /**
   * POST /documentos/os/gerar
   * Gerar código para OS baseado no tipo
   */
  @Post('os/gerar')
  async gerarCodigoOS(
    @Body() body: { lojaId: string; tipoOS: TipoOS; ano?: number }
  ) {
    try {
      const { lojaId, tipoOS, ano } = body;
      
      if (!lojaId) {
        throw new HttpException('lojaId é obrigatório', HttpStatus.BAD_REQUEST);
      }
      
      if (!tipoOS || !Object.values(TipoOS).includes(tipoOS)) {
        throw new HttpException('tipoOS deve ser COMERCIAL ou INTERNA', HttpStatus.BAD_REQUEST);
      }
      
      const codigo = await this.documentCodeService.gerarCodigoOSPorTipo(lojaId, tipoOS, ano);
      
      return {
        sucesso: true,
        codigo,
        tipo: tipoOS,
        lojaId,
        ano: ano || new Date().getFullYear()
      };
      
    } catch (error) {
      throw new HttpException(
        `Erro ao gerar código: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  /**
   * GET /documentos/os/validar/:codigo
   * Validar formato de código de OS
   */
  @Get('os/validar/:codigo')
  async validarCodigoOS(@Param('codigo') codigo: string) {
    try {
      const validacao = this.documentCodeService.validarCodigoOS(codigo);
      
      return {
        sucesso: true,
        codigo,
        valido: validacao.valido,
        tipo: validacao.tipo,
        erro: validacao.erro
      };
      
    } catch (error) {
      throw new HttpException(
        `Erro ao validar código: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  /**
   * GET /documentos/os/info/:codigo
   * Extrair informações de um código de OS
   */
  @Get('os/info/:codigo')
  async obterInformacoesCodigo(@Param('codigo') codigo: string) {
    try {
      const informacoes = this.documentCodeService.extrairInformacoesCodigo(codigo);
      
      if (!informacoes) {
        throw new HttpException('Código inválido', HttpStatus.BAD_REQUEST);
      }
      
      return {
        sucesso: true,
        codigo,
        informacoes
      };
      
    } catch (error) {
      throw new HttpException(
        `Erro ao obter informações: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  /**
   * GET /documentos/os/existe/:codigo/:lojaId
   * Verificar se código já existe no banco
   */
  @Get('os/existe/:codigo/:lojaId')
  async verificarCodigoExistente(
    @Param('codigo') codigo: string,
    @Param('lojaId') lojaId: string
  ) {
    try {
      const existe = await this.documentCodeService.verificarCodigoExistente(codigo, lojaId);
      
      return {
        sucesso: true,
        codigo,
        lojaId,
        existe
      };
      
    } catch (error) {
      throw new HttpException(
        `Erro ao verificar código: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  /**
   * GET /documentos/os/estatisticas/:lojaId
   * Obter estatísticas de numeração por tipo
   */
  @Get('os/estatisticas/:lojaId')
  async obterEstatisticas(
    @Param('lojaId') lojaId: string,
    @Query('ano') ano?: number
  ) {
    try {
      const estatisticas = await this.documentCodeService.obterEstatisticasNumeracao(lojaId, ano);
      
      return {
        sucesso: true,
        lojaId,
        ano: ano || new Date().getFullYear(),
        estatisticas
      };
      
    } catch (error) {
      throw new HttpException(
        `Erro ao obter estatísticas: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  /**
   * GET /documentos/os/proximo/:lojaId/:tipoOS
   * Obter próximo número disponível para um tipo
   */
  @Get('os/proximo/:lojaId/:tipoOS')
  async obterProximoNumero(
    @Param('lojaId') lojaId: string,
    @Param('tipoOS') tipoOS: string,
    @Query('ano') ano?: number
  ) {
    try {
      if (!Object.values(TipoOS).includes(tipoOS as TipoOS)) {
        throw new HttpException('tipoOS deve ser COMERCIAL ou INTERNA', HttpStatus.BAD_REQUEST);
      }
      
      const proximoNumero = await this.documentCodeService.obterProximoNumero(
        lojaId, 
        tipoOS as TipoOS, 
        ano
      );
      
      return {
        sucesso: true,
        lojaId,
        tipoOS,
        ano: ano || new Date().getFullYear(),
        proximoNumero
      };
      
    } catch (error) {
      throw new HttpException(
        `Erro ao obter próximo número: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  /**
   * GET /documentos/tipos
   * Listar tipos de OS disponíveis
   */
  @Get('tipos')
  async listarTiposOS() {
    return {
      sucesso: true,
      tipos: Object.values(TipoOS).map(tipo => ({
        valor: tipo,
        label: tipo === TipoOS.COMERCIAL ? 'Comercial' : 'Interna',
        prefixo: tipo === TipoOS.COMERCIAL ? 'OS' : 'OSI',
        formato: tipo === TipoOS.COMERCIAL ? 'OS-AAAA-NNN' : 'OSI-AAAA-NNN'
      }))
    };
  }
}
