import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ADMIN_PERMISSIONS } from './admin.constants';
import {
  CurrentAdmin,
  RequireAdminPermissions,
} from './admin.decorators';
import { AdminAuditService } from './admin-audit.service';
import { AdminPermissionsGuard } from './admin-permissions.guard';
import { AuthenticatedAdmin } from './admin.types';
import { ListAdminAuditDto } from './dto/list-admin-audit.dto';

@Controller('admin/v1/audit')
@UseGuards(AdminPermissionsGuard)
export class AdminAuditController {
  constructor(private readonly auditService: AdminAuditService) {}

  @Get()
  @RequireAdminPermissions(ADMIN_PERMISSIONS.AUDIT_READ)
  list(
    @Query() query: ListAdminAuditDto,
    @CurrentAdmin() admin: AuthenticatedAdmin,
  ) {
    return this.auditService.list(query, admin);
  }
}
