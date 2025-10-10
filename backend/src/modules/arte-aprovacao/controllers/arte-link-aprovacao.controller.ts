import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  Request, 
  HttpException, 
  HttpStatus,
  UseGuards 
} from '@nestjs/common';
import { ArteLinkAprovacaoService, CreateLinkAprovacaoDto, AprovarArteDto } from '../services/arte-link-aprovacao.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';

@Controller('arte-aprovacao/links')
export class ArteLinkAprovacaoController {
  constructor(private readonly linkAprovacaoService: ArteLinkAprovacaoService) {}

  /**
   * Cria um novo link de aprovação para uma versão
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  async createLink(@Body() dto: CreateLinkAprovacaoDto, @Request() req) {
    try {
      const loja_id = req.user.loja_id;
      
      const link = await this.linkAprovacaoService.createLinkAprovacao({
        ...dto,
        loja_id,
      });

      return {
        success: true,
        data: link,
        message: 'Link de aprovação criado com sucesso',
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

  /**
   * Busca dados da versão pelo token público (endpoint público)
   */
  @Get('public/:token')
  async getVersaoByToken(@Param('token') token: string) {
    try {
      const data = await this.linkAprovacaoService.getVersaoByToken(token);
      
      return {
        success: true,
        data: {
          versao: data.versao,
          os: data.os,
          cliente: data.cliente,
          arquivos: data.arquivos,
          comentarios: data.comentarios,
          autor: data.autor,
          link: {
            id: data.link.id,
            expira_em: data.link.expira_em,
            aprovado: data.link.aprovado,
          },
        },
        message: 'Dados da versão carregados com sucesso',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  /**
   * Processa aprovação ou rejeição da arte (endpoint público)
   */
  @Post('public/:token/approve')
  async processarAprovacao(
    @Param('token') token: string,
    @Body() dto: Omit<AprovarArteDto, 'token_publico'>,
    @Request() req,
  ) {
    try {
      const ip_address = req.ip || req.connection.remoteAddress;
      const user_agent = req.headers['user-agent'];

      const resultado = await this.linkAprovacaoService.processarAprovacao({
        ...dto,
        token_publico: token,
        ip_address,
        user_agent,
      });

      return {
        success: true,
        data: resultado,
        message: resultado.mensagem,
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

  /**
   * Lista links de aprovação de uma versão
   */
  @UseGuards(JwtAuthGuard)
  @Get('versao/:versao_id')
  async listarLinksVersao(@Param('versao_id') versao_id: string, @Request() req) {
    try {
      const loja_id = req.user.loja_id;
      
      const links = await this.linkAprovacaoService.listarLinksVersao(versao_id, loja_id);

      return {
        success: true,
        data: links,
        message: 'Links listados com sucesso',
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

  /**
   * Desativa um link de aprovação
   */
  @UseGuards(JwtAuthGuard)
  @Post(':link_id/desativar')
  async desativarLink(@Param('link_id') link_id: string, @Request() req) {
    try {
      const loja_id = req.user.loja_id;
      
      await this.linkAprovacaoService.desativarLink(link_id, loja_id);

      return {
        success: true,
        message: 'Link desativado com sucesso',
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

  /**
   * Valida se um token é válido
   */
  @Get('public/:token/validate')
  async validarToken(@Param('token') token: string) {
    try {
      const isValid = await this.linkAprovacaoService.validarToken(token);

      return {
        success: true,
        data: { valid: isValid },
        message: isValid ? 'Token válido' : 'Token inválido',
      };
    } catch (error) {
      return {
        success: false,
        data: { valid: false },
        message: 'Token inválido',
      };
    }
  }
}
