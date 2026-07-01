import {
  Controller,
  Delete,
  Get,
  Query,
  Request,
  Res,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { LojaConexaoService } from './services/loja-conexao.service';
import { GoogleOAuthService } from './services/google-oauth.service';
import { LojaConexaoTipo } from './constants/conexao-tipos.enum';
import { googleOAuthCallbackQuerySchema } from './schemas/conexao.schemas';

@ApiTags('Conexões')
@Controller('conexoes')
export class ConexoesController {
  private readonly logger = new Logger(ConexoesController.name);

  constructor(
    private readonly lojaConexaoService: LojaConexaoService,
    private readonly googleOAuthService: GoogleOAuthService,
  ) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar integrações da loja (sem segredos)' })
  async listar(@Request() req: { user: { loja_id: string } }) {
    const data = await this.lojaConexaoService.listarPublicas(req.user.loja_id);
    return { data };
  }

  @Get('google/auth')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Iniciar OAuth Google Drive — retorna URL de autorização',
  })
  async iniciarGoogleAuth(
    @Request() req: { user: { loja_id: string; sub: string } },
  ) {
    const url = this.googleOAuthService.buildAuthorizationUrl(
      req.user.loja_id,
      req.user.sub,
    );
    return { data: { url } };
  }

  @Get('google/callback')
  @ApiOperation({ summary: 'Callback OAuth Google (público)' })
  async googleCallback(
    @Query() query: Record<string, string>,
    @Res() res: Response,
  ) {
    const parsed = googleOAuthCallbackQuerySchema.safeParse(query);
    if (!parsed.success) {
      const redirect = this.googleOAuthService.getFrontendRedirectUrl({
        success: false,
        error: 'Parâmetros OAuth inválidos',
      });
      return res.redirect(redirect);
    }

    if (parsed.data.error) {
      const redirect = this.googleOAuthService.getFrontendRedirectUrl({
        success: false,
        error: parsed.data.error,
      });
      return res.redirect(redirect);
    }

    try {
      await this.googleOAuthService.handleCallback(
        parsed.data.code,
        parsed.data.state,
      );
      return res.redirect(
        this.googleOAuthService.getFrontendRedirectUrl({ success: true }),
      );
    } catch (error) {
      this.logger.warn(
        `Falha no callback Google: ${error instanceof Error ? error.message : error}`,
      );
      const mensagem =
        error instanceof BadRequestException
          ? (error.message as string)
          : error instanceof Error
            ? error.message
            : 'Não foi possível conectar o Google Drive';
      return res.redirect(
        this.googleOAuthService.getFrontendRedirectUrl({
          success: false,
          error: mensagem,
        }),
      );
    }
  }

  @Delete('google')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Desconectar Google Drive da loja' })
  async desconectarGoogle(@Request() req: { user: { loja_id: string } }) {
    await this.lojaConexaoService.desconectar(
      req.user.loja_id,
      LojaConexaoTipo.GOOGLE_DRIVE,
    );
    return { data: { desconectado: true } };
  }
}
