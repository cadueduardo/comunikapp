import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ADMIN_PERMISSIONS } from './admin.constants';
import { RequireAdminPermissions } from './admin.decorators';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminPermissionsGuard } from './admin-permissions.guard';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';

@Controller('admin/v1/dashboard')
@UseGuards(AdminPermissionsGuard)
export class AdminDashboardController {
  constructor(private readonly dashboardService: AdminDashboardService) {}

  @Get('summary')
  @RequireAdminPermissions(ADMIN_PERMISSIONS.STORE_READ)
  summary(@Query() query: DashboardSummaryDto) {
    return this.dashboardService.getSummary(query.days);
  }
}
