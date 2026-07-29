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
import { ADMIN_PERMISSIONS } from './admin.constants';
import {
  CurrentAdmin,
  RequireAdminPermissions,
} from './admin.decorators';
import { AdminPermissionsGuard } from './admin-permissions.guard';
import { getAdminRequestContext } from './admin-request-context';
import { AdminUsersService } from './admin-users.service';
import { AuthenticatedAdmin } from './admin.types';
import {
  ListAdminUsersDto,
  UpdateAdminUserDto,
} from './dto/admin-users.dto';

@Controller('admin/v1/administrators')
@UseGuards(AdminPermissionsGuard)
@RequireAdminPermissions(ADMIN_PERMISSIONS.ADMIN_MANAGE)
export class AdminUsersController {
  constructor(private readonly usersService: AdminUsersService) {}

  @Get()
  list(@Query() query: ListAdminUsersDto) {
    return this.usersService.list(query);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAdminUserDto,
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Req() request: Request,
  ) {
    return this.usersService.update(
      id,
      dto,
      admin,
      getAdminRequestContext(request),
    );
  }
}
