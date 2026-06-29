import {
  Controller,
  Post,
  Body,
  Request,
  HttpException,
  HttpStatus,
  UseGuards,
  Get,
} from '@nestjs/common';
import {
  ArteNotificacaoService,
  NotificacaoArteDto,
} from '../services/arte-notificacao.service';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';

@Controller('arte-aprovacao/notificacoes')
export class ArteNotificacaoController {
  constructor(private readonly notificacaoService: ArteNotificacaoService) {}

  /**
   * Envia notificação de nova versão
   */
  @UseGuards(JwtAuthGuard)
  @Post('nova-versao')
  async notificarNovaVersao(@Body() dto: NotificacaoArteDto, @Request() req) {
    try {
      await this.notificacaoService.notificarNovaVersao(dto);

      return {
        success: true,
        message: 'Notificação de nova versão enviada com sucesso',
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
   * Envia notificação de solicitação de aprovação
   */
  @UseGuards(JwtAuthGuard)
  @Post('aprovacao-solicitada')
  async notificarAprovacaoSolicitada(
    @Body() dto: NotificacaoArteDto,
    @Request() req,
  ) {
    try {
      const resultado =
        await this.notificacaoService.notificarAprovacaoSolicitada(dto);

      return {
        success: true,
        message: 'Notificação de aprovação solicitada enviada com sucesso',
        preview_url: resultado.previewUrl || null,
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
   * Envia notificação de arte aprovada
   */
  @UseGuards(JwtAuthGuard)
  @Post('arte-aprovada')
  async notificarArteAprovada(@Body() dto: NotificacaoArteDto, @Request() req) {
    try {
      await this.notificacaoService.notificarArteAprovada(dto);

      return {
        success: true,
        message: 'Notificação de arte aprovada enviada com sucesso',
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
   * Envia notificação de arte rejeitada
   */
  @UseGuards(JwtAuthGuard)
  @Post('arte-rejeitada')
  async notificarArteRejeitada(
    @Body() dto: NotificacaoArteDto,
    @Request() req,
  ) {
    try {
      await this.notificacaoService.notificarArteRejeitada(dto);

      return {
        success: true,
        message: 'Notificação de arte rejeitada enviada com sucesso',
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
   * Envia notificação de novo comentário
   */
  @UseGuards(JwtAuthGuard)
  @Post('comentario-adicionado')
  async notificarComentarioAdicionado(
    @Body() dto: NotificacaoArteDto,
    @Request() req,
  ) {
    try {
      await this.notificacaoService.notificarComentarioAdicionado(dto);

      return {
        success: true,
        message: 'Notificação de comentário adicionado enviada com sucesso',
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
   * Testa a conexão SMTP
   */
  @UseGuards(JwtAuthGuard)
  @Get('testar-smtp')
  async testarConexaoSMTP(@Request() req) {
    try {
      const sucesso = await this.notificacaoService.testarConexaoSMTP();

      return {
        success: true,
        data: { smtp_funcionando: sucesso },
        message: sucesso ? 'Conexão SMTP funcionando' : 'Erro na conexão SMTP',
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
   * Envia email de teste
   */
  @UseGuards(JwtAuthGuard)
  @Post('testar-email')
  async enviarEmailTeste(
    @Body() body: { destinatario: string },
    @Request() req,
  ) {
    try {
      const sucesso = await this.notificacaoService.enviarEmailTeste(
        body.destinatario,
      );

      return {
        success: true,
        data: { email_enviado: sucesso },
        message: sucesso
          ? 'Email de teste enviado com sucesso'
          : 'Erro ao enviar email de teste',
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
}
