import {
  Controller,
  Get,
  Param,
  Query,
  Request,
  Res,
  UseGuards,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  ImpressaoOSService,
  ConfiguracaoImpressao,
} from '../services/impressao-os.service';
import { OSPermissionsGuard } from '../guards/os-permissions.guard';

/**
 * Endpoints de impressão da OS.
 * A UI principal usa GET :id/imprimir/dados (JSON) + timbrado React no frontend.
 * GET :id/imprimir ainda devolve HTML legado para compatibilidade.
 */
@ApiTags('OS — Impressão')
@ApiBearerAuth()
@Controller('os')
@UseGuards(OSPermissionsGuard)
export class ImpressaoOSController {
  constructor(private readonly impressaoOSService: ImpressaoOSService) {}

  private extrairLojaId(req: any): string {
    const user = req['user'] || req.user;
    const lojaId = user?.loja_id;
    if (!lojaId) {
      throw new HttpException(
        'Loja não identificada na sessão',
        HttpStatus.UNAUTHORIZED,
      );
    }
    return lojaId;
  }

  private montarConfig(
    formato: 'html' | 'pdf' = 'html',
    versao: 'simples' | 'completa' = 'simples',
    incluirQRCode = 'true',
    incluirLogo = 'true',
    incluirDetalhesTecnicos = 'true',
  ): ConfiguracaoImpressao {
    return {
      formato,
      versao,
      incluirQRCode: incluirQRCode === 'true',
      incluirLogo: incluirLogo === 'true',
      incluirDetalhesTecnicos: incluirDetalhesTecnicos === 'true',
    };
  }

  @Get(':id/imprimir')
  @ApiOperation({
    summary: 'HTML legado de impressão (preferir /imprimir/dados + UI React)',
  })
  async imprimirOS(
    @Param('id') osId: string,
    @Request() req: any,
    @Query('formato') formato: 'html' | 'pdf' = 'html',
    @Query('versao') versao: 'simples' | 'completa' = 'simples',
    @Query('incluirQRCode') incluirQRCode: string = 'true',
    @Query('incluirLogo') incluirLogo: string = 'true',
    @Query('incluirDetalhesTecnicos') incluirDetalhesTecnicos: string = 'true',
    @Res() res: Response,
  ) {
    try {
      const lojaId = this.extrairLojaId(req);
      const config = this.montarConfig(
        formato,
        versao,
        incluirQRCode,
        incluirLogo,
        incluirDetalhesTecnicos,
      );

      const dados = await this.impressaoOSService.gerarDadosImpressao(
        osId,
        config,
        lojaId,
      );
      const html = await this.impressaoOSService.gerarTemplateHTML(
        dados,
        config,
      );

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `inline; filename="OS-${dados.os.numero}.html"`,
      );
      res.send(html);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      const message =
        error instanceof Error ? error.message : 'Erro ao gerar impressão';
      if (message.includes('não encontrada')) {
        throw new NotFoundException(message);
      }
      throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id/imprimir/preview')
  async previewImpressao(
    @Param('id') osId: string,
    @Request() req: any,
    @Query('incluirQRCode') incluirQRCode: string = 'true',
    @Query('incluirLogo') incluirLogo: string = 'true',
    @Query('incluirDetalhesTecnicos') incluirDetalhesTecnicos: string = 'true',
    @Res() res: Response,
  ) {
    try {
      const lojaId = this.extrairLojaId(req);
      const config = this.montarConfig(
        'html',
        'simples',
        incluirQRCode,
        incluirLogo,
        incluirDetalhesTecnicos,
      );

      const dados = await this.impressaoOSService.gerarDadosImpressao(
        osId,
        config,
        lojaId,
      );
      const html = await this.impressaoOSService.gerarTemplateHTML(
        dados,
        config,
      );

      const previewHTML = html
        .replace('@media print', '@media print, .preview-mode')
        .replace('body {', 'body { background-color: #f5f5f5; padding: 20px; ');

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(previewHTML);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      const message =
        error instanceof Error ? error.message : 'Erro ao gerar preview';
      throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id/imprimir/dados')
  @ApiOperation({
    summary: 'Dados JSON da OS para impressão com timbrado no frontend',
  })
  async obterDadosImpressao(
    @Param('id') osId: string,
    @Request() req: any,
    @Query('versao') versao: 'simples' | 'completa' = 'simples',
    @Query('incluirQRCode') incluirQRCode: string = 'true',
    @Query('incluirLogo') incluirLogo: string = 'true',
    @Query('incluirDetalhesTecnicos') incluirDetalhesTecnicos: string = 'true',
  ) {
    try {
      const lojaId = this.extrairLojaId(req);
      const config = this.montarConfig(
        'html',
        versao,
        incluirQRCode,
        incluirLogo,
        incluirDetalhesTecnicos,
      );

      const dados = await this.impressaoOSService.gerarDadosImpressao(
        osId,
        config,
        lojaId,
      );
      const loja = dados.loja ?? {};
      const cliente = dados.cliente ?? {};

      return {
        sucesso: true,
        versao,
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
            data_instalacao_agendada: dados.os.data_instalacao_agendada,
            observacoes_instalacao: dados.os.observacoes_instalacao,
            prioridade: dados.os.prioridade,
          },
          cliente: {
            nome: cliente.nome ?? null,
            documento: cliente.documento ?? cliente.cpf_cnpj ?? null,
            telefone: cliente.telefone ?? null,
            email: cliente.email ?? null,
            endereco: cliente.endereco ?? cliente.logradouro ?? null,
            cidade: cliente.cidade ?? null,
            estado: cliente.estado ?? cliente.uf ?? null,
            cep: cliente.cep ?? null,
          },
          loja: {
            nome: loja.nome ?? null,
            nome_fantasia: loja.nome_fantasia ?? null,
            razao_social: loja.razao_social ?? null,
            logo_url: loja.logo_url ?? null,
            cnpj: loja.cnpj ?? null,
            cpf: loja.cpf ?? null,
            inscricao_estadual: loja.inscricao_estadual ?? null,
            inscricao_municipal: loja.inscricao_municipal ?? null,
            cep: loja.cep ?? null,
            logradouro: loja.logradouro ?? null,
            numero: loja.numero ?? null,
            complemento: loja.complemento ?? null,
            bairro: loja.bairro ?? null,
            cidade: loja.cidade ?? null,
            uf: loja.uf ?? loja.estado ?? null,
            telefone: loja.telefone ?? null,
            email: loja.email ?? null,
            site_url: loja.site_url ?? null,
            instagram_url: loja.instagram_url ?? null,
            facebook_url: loja.facebook_url ?? null,
            linkedin_url: loja.linkedin_url ?? null,
          },
          produtos: (dados.produtos ?? []).map((p: any) => ({
            id: p.id,
            nome: p.nome ?? p.produto_servico ?? 'Item',
            quantidade: p.quantidade ?? null,
            unidade_medida: p.unidade_medida ?? null,
            largura: p.largura ?? null,
            altura: p.altura ?? null,
            profundidade: p.profundidade ?? null,
            area: p.area ?? null,
            observacoes: p.observacoes ?? null,
          })),
          materiais: (dados.insumos ?? []).map((i: any) => ({
            nome: i.insumo?.nome || i.nome || 'Material',
            quantidade: i.quantidade ?? i.quantidade_necessaria ?? null,
            unidade: i.unidade || i.insumo?.unidade_uso || 'un',
            observacoes: i.observacoes ?? null,
          })),
          dados_transformados: dados.dadosTransformados,
          qr_code_data_url: dados.qrCodeDataUrl || null,
          qr_code_url: dados.os.id
            ? `/os/${dados.os.id}`
            : null,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      const message =
        error instanceof Error ? error.message : 'Erro ao obter dados da OS';
      if (message.includes('não encontrada')) {
        throw new NotFoundException(message);
      }
      throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
