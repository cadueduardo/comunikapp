import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ADMIN_PERMISSIONS } from './admin.constants';
import {
  CurrentAdmin,
  RequireAdminPermissions,
} from './admin.decorators';
import { AdminInvitationsService } from './admin-invitations.service';
import { AdminPermissionsGuard } from './admin-permissions.guard';
import { getAdminRequestContext } from './admin-request-context';
import { AuthenticatedAdmin } from './admin.types';
import { CreateAdminInvitationDto } from './dto/create-admin-invitation.dto';

@Controller('admin/v1/administrator-invitations')
@UseGuards(AdminPermissionsGuard)
@RequireAdminPermissions(ADMIN_PERMISSIONS.ADMIN_MANAGE)
export class AdminInvitationsController {
  constructor(
    private readonly invitationsService: AdminInvitationsService,
  ) {}

  @Get()
  list() {
    return this.invitationsService.list();
  }

  @Post()
  create(
    @Body() dto: CreateAdminInvitationDto,
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Req() request: Request,
  ) {
    return this.invitationsService.create(
      dto,
      admin,
      getAdminRequestContext(request),
    );
  }

  @Post(':id/resend')
  resend(
    @Param('id') id: string,
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Req() request: Request,
  ) {
    return this.invitationsService.resend(
      id,
      admin,
      getAdminRequestContext(request),
    );
  }

  @Delete(':id')
  cancel(
    @Param('id') id: string,
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Req() request: Request,
  ) {
    return this.invitationsService.cancel(
      id,
      admin,
      getAdminRequestContext(request),
    );
  }
}
