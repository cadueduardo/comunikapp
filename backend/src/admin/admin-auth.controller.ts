import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { AdminAuthService } from './admin-auth.service';
import { AdminPublic, CurrentAdmin } from './admin.decorators';
import { getAdminRequestContext } from './admin-request-context';
import {
  clearAdminSessionCookie,
  setAdminSessionCookie,
} from './admin-session-cookie';
import { AuthenticatedAdmin } from './admin.types';
import { AcceptAdminInvitationDto } from './dto/accept-admin-invitation.dto';
import { AdminLoginDto } from './dto/admin-login.dto';
import { ConfirmAdminTwoFactorDto } from './dto/confirm-admin-two-factor.dto';
import { ValidateAdminInvitationDto } from './dto/validate-admin-invitation.dto';

@Controller('admin/v1/auth')
export class AdminAuthController {
  constructor(
    private readonly authService: AdminAuthService,
    private readonly configService: ConfigService,
  ) {}

  private writeSession(
    response: Response,
    session: {
      token: string;
      expiresAt: Date;
      admin: AuthenticatedAdmin;
    },
  ) {
    setAdminSessionCookie(
      response,
      session.token,
      session.expiresAt,
      this.configService,
    );
    return {
      admin: session.admin,
      expiresAt: session.expiresAt,
    };
  }

  @Post('login')
  @AdminPublic()
  async login(
    @Body() dto: AdminLoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.authService.login(
      dto,
      getAdminRequestContext(request),
    );
    return this.writeSession(response, session);
  }

  @Get('invitation')
  @AdminPublic()
  validateInvitation(@Query() query: ValidateAdminInvitationDto) {
    return this.authService.validateInvitation(query.token);
  }

  @Post('invitation/accept')
  @AdminPublic()
  async acceptInvitation(
    @Body() dto: AcceptAdminInvitationDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.acceptInvitation(
      dto,
      getAdminRequestContext(request),
    );
    if (!result.requiresTwoFactorSetup && result.session) {
      return {
        requiresTwoFactorSetup: false,
        ...this.writeSession(response, result.session),
      };
    }
    return result;
  }

  @Post('2fa/confirm')
  @AdminPublic()
  async confirmTwoFactor(
    @Body() dto: ConfirmAdminTwoFactorDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.authService.confirmTwoFactor(
      dto,
      getAdminRequestContext(request),
    );
    return this.writeSession(response, session);
  }

  @Get('me')
  me(@CurrentAdmin() admin: AuthenticatedAdmin) {
    return { admin };
  }

  @Post('logout')
  async logout(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.logout(
      admin,
      getAdminRequestContext(request),
    );
    clearAdminSessionCookie(response, this.configService);
    return { success: true };
  }
}
