import {
  Body,
  Controller,
  Get,
  Headers,
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
import { AuthenticatedAdmin } from './admin.types';
import {
  DeployProductUpdateDto,
  ListProductUpdatesDto,
  UpsertProductUpdateDto,
} from './dto/product-update.dto';
import { ProductUpdatesService } from './product-updates.service';

@Controller('admin/v1/product-updates')
@UseGuards(AdminPermissionsGuard)
export class ProductUpdatesController {
  constructor(private readonly service: ProductUpdatesService) {}

  @Get()
  @RequireAdminPermissions(ADMIN_PERMISSIONS.PRODUCT_UPDATE_READ)
  list(@Query() query: ListProductUpdatesDto) {
    return this.service.list(query);
  }

  @Get(':id')
  @RequireAdminPermissions(ADMIN_PERMISSIONS.PRODUCT_UPDATE_READ)
  detail(@Param('id') id: string) {
    return this.service.detail(id);
  }

  @Post()
  @RequireAdminPermissions(ADMIN_PERMISSIONS.PRODUCT_UPDATE_WRITE)
  create(
    @Body() dto: UpsertProductUpdateDto,
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Req() request: Request,
  ) {
    return this.service.create(dto, admin, getAdminRequestContext(request));
  }

  @Patch(':id')
  @RequireAdminPermissions(ADMIN_PERMISSIONS.PRODUCT_UPDATE_WRITE)
  update(
    @Param('id') id: string,
    @Body() dto: UpsertProductUpdateDto,
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Req() request: Request,
  ) {
    return this.service.update(id, dto, admin, getAdminRequestContext(request));
  }

  @Post(':id/request-review')
  @RequireAdminPermissions(ADMIN_PERMISSIONS.PRODUCT_UPDATE_WRITE)
  requestReview(
    @Param('id') id: string,
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Req() request: Request,
  ) {
    return this.service.requestReview(
      id,
      admin,
      getAdminRequestContext(request),
    );
  }

  @Post(':id/publish')
  @RequireAdminPermissions(ADMIN_PERMISSIONS.PRODUCT_UPDATE_PUBLISH)
  publish(
    @Param('id') id: string,
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Req() request: Request,
  ) {
    return this.service.publish(id, admin, getAdminRequestContext(request));
  }
}

@Controller('admin/v1/internal/deploy-product-updates')
export class DeployProductUpdatesController {
  constructor(private readonly service: ProductUpdatesService) {}

  @Post()
  @AdminPublic()
  ingest(
    @Body() dto: DeployProductUpdateDto,
    @Headers('authorization') authorization?: string,
  ) {
    return this.service.ingestDeploy(dto, authorization);
  }
}

@Controller('public/v1/product-updates')
export class PublicProductUpdatesController {
  constructor(private readonly service: ProductUpdatesService) {}

  @Get()
  list(@Query('limit') limit?: string) {
    const parsed = Number.parseInt(limit || '20', 10);
    return this.service.publicList(Number.isFinite(parsed) ? parsed : 20);
  }

  @Get(':slug')
  detail(@Param('slug') slug: string) {
    return this.service.publicDetail(slug);
  }
}
