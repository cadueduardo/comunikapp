import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminAuditService } from './admin-audit.service';
import { AdminBoundaryGuard } from './admin-boundary.guard';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthGuard } from './admin-auth.guard';
import { AdminAuthService } from './admin-auth.service';
import { AdminJwtStrategy } from './admin-jwt.strategy';
import { getRequiredAdminJwtSecret } from './admin-jwt-secret';
import { AdminInvitationsController } from './admin-invitations.controller';
import { AdminInvitationsService } from './admin-invitations.service';
import { AdminPermissionsGuard } from './admin-permissions.guard';
import { AdminStoresController } from './admin-stores.controller';
import { AdminStoresService } from './admin-stores.service';
import { AdminTwoFactorService } from './admin-two-factor.service';
import { MailModule } from '../mail/mail.module';
import {
  DeployProductUpdatesController,
  ProductUpdatesController,
  PublicProductUpdatesController,
} from './product-updates.controller';
import { ProductUpdatesService } from './product-updates.service';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    MailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: getRequiredAdminJwtSecret(configService),
      }),
    }),
  ],
  controllers: [
    AdminAuthController,
    AdminInvitationsController,
    AdminStoresController,
    ProductUpdatesController,
    DeployProductUpdatesController,
    PublicProductUpdatesController,
  ],
  providers: [
    AdminAuditService,
    AdminAuthGuard,
    AdminAuthService,
    AdminJwtStrategy,
    AdminInvitationsService,
    AdminPermissionsGuard,
    AdminStoresService,
    AdminTwoFactorService,
    ProductUpdatesService,
    {
      provide: APP_GUARD,
      useClass: AdminBoundaryGuard,
    },
  ],
  exports: [AdminAuditService, AdminAuthGuard, AdminPermissionsGuard],
})
export class AdminModule {}
