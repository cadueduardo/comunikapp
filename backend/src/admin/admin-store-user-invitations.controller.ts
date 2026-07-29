import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ADMIN_PERMISSIONS } from './admin.constants';
import {
  AdminPublic,
  CurrentAdmin,
  RequireAdminPermissions,
} from './admin.decorators';
import { AdminPermissionsGuard } from './admin-permissions.guard';
import { getAdminRequestContext } from './admin-request-context';
import { AdminStoreUserInvitationsService } from './admin-store-user-invitations.service';
import { AuthenticatedAdmin } from './admin.types';
import {
  AcceptStoreUserInvitationDto,
  CreateStoreUserInvitationDto,
  UpdateStoreUserInvitationDto,
  ValidateStoreUserInvitationDto,
} from './dto/store-user-invitation.dto';

@Controller('admin/v1/stores/:storeId')
@UseGuards(AdminPermissionsGuard)
export class AdminStoreUserInvitationsController {
  constructor(
    private readonly invitationsService: AdminStoreUserInvitationsService,
  ) {}

  @Get('users')
  @RequireAdminPermissions(ADMIN_PERMISSIONS.STORE_READ)
  listUsers(
    @Param('storeId') storeId: string,
    @CurrentAdmin() admin: AuthenticatedAdmin,
  ) {
    return this.invitationsService.listUsers(storeId, admin);
  }

  @Get('user-invitations')
  @RequireAdminPermissions(ADMIN_PERMISSIONS.STORE_READ)
  list(@Param('storeId') storeId: string) {
    return this.invitationsService.list(storeId);
  }

  @Post('user-invitations')
  @RequireAdminPermissions(ADMIN_PERMISSIONS.STORE_USER_INVITE)
  create(
    @Param('storeId') storeId: string,
    @Body() dto: CreateStoreUserInvitationDto,
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Req() request: Request,
  ) {
    return this.invitationsService.create(
      storeId,
      dto,
      admin,
      getAdminRequestContext(request),
    );
  }

  @Patch('user-invitations/:invitationId')
  @RequireAdminPermissions(ADMIN_PERMISSIONS.STORE_USER_INVITE)
  update(
    @Param('storeId') storeId: string,
    @Param('invitationId') invitationId: string,
    @Body() dto: UpdateStoreUserInvitationDto,
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Req() request: Request,
  ) {
    return this.invitationsService.update(
      storeId,
      invitationId,
      dto,
      admin,
      getAdminRequestContext(request),
    );
  }

  @Post('user-invitations/:invitationId/resend')
  @RequireAdminPermissions(ADMIN_PERMISSIONS.STORE_USER_INVITE)
  resend(
    @Param('storeId') storeId: string,
    @Param('invitationId') invitationId: string,
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Req() request: Request,
  ) {
    return this.invitationsService.resend(
      storeId,
      invitationId,
      admin,
      getAdminRequestContext(request),
    );
  }

  @Delete('user-invitations/:invitationId')
  @RequireAdminPermissions(ADMIN_PERMISSIONS.STORE_USER_INVITE)
  cancel(
    @Param('storeId') storeId: string,
    @Param('invitationId') invitationId: string,
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Req() request: Request,
  ) {
    return this.invitationsService.cancel(
      storeId,
      invitationId,
      admin,
      getAdminRequestContext(request),
    );
  }
}

@Controller('admin/v1/store-user-invitations')
export class AdminStoreUserInvitationAcceptController {
  constructor(
    private readonly invitationsService: AdminStoreUserInvitationsService,
  ) {}

  @Get('validate')
  @AdminPublic()
  validate(@Query() query: ValidateStoreUserInvitationDto) {
    return this.invitationsService.validateToken(query.token);
  }

  @Post('accept')
  @AdminPublic()
  accept(
    @Body() dto: AcceptStoreUserInvitationDto,
    @Req() request: Request,
  ) {
    return this.invitationsService.accept(
      dto,
      getAdminRequestContext(request),
    );
  }
}
