import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { google } from 'googleapis';
import {
  DRIVE_ROOT_FOLDER_NAME,
  GOOGLE_DRIVE_SCOPES,
} from '../constants/conexao-tipos.enum';
import { googleOAuthStatePayloadSchema } from '../schemas/conexao.schemas';
import { LojaConexaoService } from './loja-conexao.service';
import { GoogleDriveStorageService } from './google-drive-storage.service';

@Injectable()
export class GoogleOAuthService {
  private readonly logger = new Logger(GoogleOAuthService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly lojaConexaoService: LojaConexaoService,
    private readonly driveStorage: GoogleDriveStorageService,
  ) {}

  isConfigured(): boolean {
    return Boolean(
      this.configService.get<string>('GOOGLE_OAUTH_CLIENT_ID') &&
        this.configService.get<string>('GOOGLE_OAUTH_CLIENT_SECRET') &&
        this.configService.get<string>('GOOGLE_OAUTH_REDIRECT_URI'),
    );
  }

  buildAuthorizationUrl(lojaId: string, userId: string): string {
    if (!this.isConfigured()) {
      throw new BadRequestException(
        'Integração Google não configurada no servidor. Defina GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET e GOOGLE_OAUTH_REDIRECT_URI.',
      );
    }

    const state = this.jwtService.sign(
      {
        loja_id: lojaId,
        user_id: userId,
        purpose: 'google_drive_oauth',
      },
      { expiresIn: '15m' },
    );

    const oauth2 = this.createOAuthClient();
    return oauth2.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [...GOOGLE_DRIVE_SCOPES],
      state,
    });
  }

  async handleCallback(
    code: string,
    state: string,
  ): Promise<{ lojaId: string; email?: string }> {
    let payload: { loja_id: string; user_id: string };
    try {
      const decoded = this.jwtService.verify(state) as Record<string, unknown>;
      payload = googleOAuthStatePayloadSchema.parse({
        loja_id: decoded.loja_id,
        user_id: decoded.user_id,
        exp: decoded.exp,
      });
    } catch {
      throw new BadRequestException('State OAuth inválido ou expirado');
    }

    const oauth2 = this.createOAuthClient();
    const { tokens } = await oauth2.getToken(code);

    if (!tokens.refresh_token) {
      throw new BadRequestException(
        'Google não retornou refresh_token. Revogue o acesso em myaccount.google.com/permissions e tente novamente.',
      );
    }

    oauth2.setCredentials(tokens);
    const oauth2Api = google.oauth2({ version: 'v2', auth: oauth2 });
    const userInfo = await oauth2Api.userinfo.get();

    const rootFolderId = await this.driveStorage.ensureRootFolder(
      tokens.refresh_token,
      DRIVE_ROOT_FOLDER_NAME,
    );

    await this.lojaConexaoService.salvarGoogleDriveConexao(payload.loja_id, {
      refreshToken: tokens.refresh_token,
      googleEmail: userInfo.data.email ?? undefined,
      googleName: userInfo.data.name ?? undefined,
      rootFolderId,
      userId: payload.user_id,
    });

    this.logger.log(
      `Google Drive conectado para loja ${payload.loja_id} (${userInfo.data.email ?? 'sem email'})`,
    );

    return {
      lojaId: payload.loja_id,
      email: userInfo.data.email ?? undefined,
    };
  }

  getFrontendRedirectUrl(params: { success: boolean; error?: string }): string {
    const base =
      this.configService.get<string>('FRONTEND_URL') ||
      'http://localhost:3000';
    const url = new URL('/configuracoes/conexoes', base);
    if (params.success) {
      url.searchParams.set('google', 'connected');
    } else if (params.error) {
      url.searchParams.set('google', 'error');
      url.searchParams.set('mensagem', params.error.slice(0, 200));
    }
    return url.toString();
  }

  private createOAuthClient() {
    const clientId = this.configService.get<string>('GOOGLE_OAUTH_CLIENT_ID');
    const clientSecret = this.configService.get<string>(
      'GOOGLE_OAUTH_CLIENT_SECRET',
    );
    const redirectUri = this.configService.get<string>(
      'GOOGLE_OAUTH_REDIRECT_URI',
    );

    if (!clientId || !clientSecret || !redirectUri) {
      throw new InternalServerErrorException(
        'Credenciais Google OAuth incompletas',
      );
    }

    return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  }
}
