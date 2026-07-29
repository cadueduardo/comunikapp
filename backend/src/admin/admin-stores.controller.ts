import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ADMIN_PERMISSIONS,
} from './admin.constants';
import {
  CurrentAdmin,
  RequireAdminPermissions,
} from './admin.decorators';
import { AdminPermissionsGuard } from './admin-permissions.guard';
import { getAdminRequestContext } from './admin-request-context';
import { AdminStoresService } from './admin-stores.service';
import { AuthenticatedAdmin } from './admin.types';
import { ListAdminStoresDto } from './dto/list-admin-stores.dto';
import { UpdateAdminStoreStatusDto } from './dto/update-admin-store-status.dto';

@Controller('admin/v1/stores')
@UseGuards(AdminPermissionsGuard)
export class AdminStoresController {
  constructor(private readonly storesService: AdminStoresService) {}

  @Get()
  @RequireAdminPermissions(ADMIN_PERMISSIONS.STORE_READ)
  list(
    @Query() query: ListAdminStoresDto,
    @CurrentAdmin() admin: AuthenticatedAdmin,
  ) {
    return this.storesService.list(query, admin);
  }

  @Get(':id')
  @RequireAdminPermissions(ADMIN_PERMISSIONS.STORE_READ)
  detail(
    @Param('id') id: string,
    @CurrentAdmin() admin: AuthenticatedAdmin,
  ) {
    return this.storesService.detail(id, admin);
  }

  @Patch(':id/status')
  @RequireAdminPermissions(ADMIN_PERMISSIONS.STORE_STATUS_CHANGE)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateAdminStoreStatusDto,
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Req() request: Request,
  ) {
    return this.storesService.updateStatus(
      id,
      dto,
      admin,
      getAdminRequestContext(request),
    );
  }
}
