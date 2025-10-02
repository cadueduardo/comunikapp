import { Controller, Get, Param, Query, Res, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ImpressaoOSService, ConfiguracaoImpressao } from '../services/impressao-os.service';

/**
 * Controller para impressão de OS
 * Objetivo: Endpoints para geração de templates de impressão conforme PLANO Fase 1
 */

@Controller('os')
export class ImpressaoOSController {
  
  constructor(private readonly impressaoOSService: ImpressaoOSService) {}
  
  /**
   * GET /os/:id/imprimir
   * Gerar template HTML para impressão da OS
   * 
   * Query params:
   * - formato: 'html' | 'pdf' (default: 'html')
   * - versao: 'simples' | 'completa' (default: 'simples')
   * - incluirQRCode: boolean (default: true)
   * - incluirLogo: boolean (default: true)
   * - incluirDetalhesTecnicos: boolean (default: true)
   */
  @Get(':id/imprimir')
  async imprimirOS(
    @Param('id') osId: string,
    @Query('formato') formato: 'html' | 'pdf' = 'html',
    @Query('versao') versao: 'simples' | 'completa' = 'simples',
    @Query('incluirQRCode') incluirQRCode: string = 'true',
    @Query('incluirLogo') incluirLogo: string = 'true',
    @Query('incluirDetalhesTecnicos') incluirDetalhesTecnicos: string = 'true',
    @Res() res: Response
  ) {
    try {
      const config: ConfiguracaoImpressao = {
        formato,
        versao,
        incluirQRCode: incluirQRCode === 'true',
        incluirLogo: incluirLogo === 'true',
        incluirDetalhesTecnicos: incluirDetalhesTecnicos === 'true'
      };
      
      // Gerar dados da OS
      const dados = await this.impressaoOSService.gerarDadosImpressao(osId, config);
      
      // Gerar template HTML
      const html = await this.impressaoOSService.gerarTemplateHTML(dados, config);
      
      if (formato === 'pdf') {
        // TODO: Implementar geração de PDF com Puppeteer
        // Por enquanto, retorna HTML com CSS otimizado para impressão
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Content-Disposition', `inline; filename="OS-${dados.os.numero}.html"`);
        res.send(html);
      } else {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Content-Disposition', `inline; filename="OS-${dados.os.numero}.html"`);
        res.send(html);
      }
      
    } catch (error) {
      throw new HttpException(
        `Erro ao gerar impressão da OS: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  /**
   * GET /os/:id/imprimir/preview
   * Preview do template antes da impressão
   */
  @Get(':id/imprimir/preview')
  async previewImpressao(
    @Param('id') osId: string,
    @Query('incluirQRCode') incluirQRCode: string = 'true',
    @Query('incluirLogo') incluirLogo: string = 'true',
    @Query('incluirDetalhesTecnicos') incluirDetalhesTecnicos: string = 'true',
    @Res() res: Response
  ) {
    try {
      const config: ConfiguracaoImpressao = {
        formato: 'html',
        versao: 'simples',
        incluirQRCode: incluirQRCode === 'true',
        incluirLogo: incluirLogo === 'true',
        incluirDetalhesTecnicos: incluirDetalhesTecnicos === 'true'
      };
      
      // Gerar dados da OS
      const dados = await this.impressaoOSService.gerarDadosImpressao(osId, config);
      
      // Gerar template HTML com preview mode
      const html = await this.impressaoOSService.gerarTemplateHTML(dados, config);
      
      // Adicionar CSS para preview (sem quebras de página)
      const previewHTML = html.replace(
        '@media print',
        '@media print, .preview-mode'
      ).replace(
        'body {',
        'body { background-color: #f5f5f5; padding: 20px; '
      );
      
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(previewHTML);
      
    } catch (error) {
      throw new HttpException(
        `Erro ao gerar preview da impressão: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  /**
   * GET /os/:id/imprimir/dados
   * Retornar dados estruturados da OS para impressão (JSON)
   */
  @Get(':id/imprimir/dados')
  async obterDadosImpressao(
    @Param('id') osId: string,
    @Query('incluirQRCode') incluirQRCode: string = 'true',
    @Query('incluirLogo') incluirLogo: string = 'true',
    @Query('incluirDetalhesTecnicos') incluirDetalhesTecnicos: string = 'true'
  ) {
    try {
      const config: ConfiguracaoImpressao = {
        formato: 'html',
        versao: 'simples',
        incluirQRCode: incluirQRCode === 'true',
        incluirLogo: incluirLogo === 'true',
        incluirDetalhesTecnicos: incluirDetalhesTecnicos === 'true'
      };
      
      const dados = await this.impressaoOSService.gerarDadosImpressao(osId, config);
      
      return {
        sucesso: true,
        dados: {
          os: {
            id: dados.os.id,
            numero: dados.os.numero,
            data_abertura: dados.os.data_abertura,
            data_prazo: dados.os.data_prazo,
            status: dados.os.status,
            nome_servico: dados.os.nome_servico,
            quantidade: dados.os.quantidade,
            observacoes: dados.os.observacoes,
            aprovacao_tecnica_status: dados.os.aprovacao_tecnica_status,
            aprovacao_tecnica_por: dados.os.aprovacao_tecnica_por,
            aprovacao_tecnica_em: dados.os.aprovacao_tecnica_em,
            data_instalacao_agendada: dados.os.data_instalacao_agendada
          },
          cliente: {
            nome: dados.cliente.nome,
            documento: dados.cliente.documento,
            telefone: dados.cliente.telefone,
            email: dados.cliente.email,
            endereco: dados.cliente.endereco,
            cidade: dados.cliente.cidade,
            estado: dados.cliente.estado,
            cep: dados.cliente.cep
          },
          loja: {
            nome: dados.loja.nome,
            endereco: dados.loja.endereco,
            cidade: dados.loja.cidade,
            estado: dados.loja.estado
          },
          dados_transformados: dados.dadosTransformados,
          materiais: dados.insumos.map(i => ({
            nome: i.insumo?.nome || 'Material',
            quantidade: i.quantidade,
            unidade: i.unidade || i.insumo?.unidade_uso || 'un',
            observacoes: i.observacoes
          })),
          qr_code_disponivel: !!dados.qrCodeDataUrl
        }
      };
      
    } catch (error) {
      throw new HttpException(
        `Erro ao obter dados da OS: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
