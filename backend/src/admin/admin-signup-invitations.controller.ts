import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { CreateConviteCadastroDto } from '../platform/dto/create-convite-cadastro.dto';
import { AdminAuthGuard } from './admin-auth.guard';
import { AdminBoundaryGuard } from './admin-boundary.guard';
import { AdminPermissionsGuard } from './admin-permissions.guard';
import { CurrentAdmin, RequireAdminPermissions } from './admin.decorators';
import { ADMIN_PERMISSIONS } from './admin.constants';
import { getAdminRequestContext } from './admin-request-context';
import { AuthenticatedAdmin } from './admin.types';
import { AdminSignupInvitationsService } from './admin-signup-invitations.service';

@Controller('admin/v1/signup-invitations')
@UseGuards(AdminAuthGuard, AdminBoundaryGuard, AdminPermissionsGuard)
export class AdminSignupInvitationsController {
  constructor(
    private readonly signupInvitationsService: AdminSignupInvitationsService,
  ) {}

  @Get()
  @RequireAdminPermissions(ADMIN_PERMISSIONS.SIGNUP_INVITE_MANAGE)
  list() {
    return this.signupInvitationsService.list();
  }

  @Post()
  @RequireAdminPermissions(ADMIN_PERMISSIONS.SIGNUP_INVITE_MANAGE)
  create(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Body() dto: CreateConviteCadastroDto,
    @Req() request: Request,
  ) {
    return this.signupInvitationsService.create(
      admin,
      dto,
      getAdminRequestContext(request),
    );
  }

  @Post(':id/resend')
  @RequireAdminPermissions(ADMIN_PERMISSIONS.SIGNUP_INVITE_MANAGE)
  resend(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ) {
    return this.signupInvitationsService.resend(
      admin,
      id,
      getAdminRequestContext(request),
    );
  }

  @Delete(':id')
  @RequireAdminPermissions(ADMIN_PERMISSIONS.SIGNUP_INVITE_MANAGE)
  revoke(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ) {
    return this.signupInvitationsService.revoke(
      admin,
      id,
      getAdminRequestContext(request),
    );
  }
}
