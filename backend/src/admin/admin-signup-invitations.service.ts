import { Injectable } from '@nestjs/common';
import { CreateConviteCadastroDto } from '../platform/dto/create-convite-cadastro.dto';
import { PlatformService } from '../platform/platform.service';
import { AdminAuditService } from './admin-audit.service';
import { AdminRequestContext } from './admin-request-context';
import { AuthenticatedAdmin } from './admin.types';

@Injectable()
export class AdminSignupInvitationsService {
  constructor(
    private readonly platformService: PlatformService,
    private readonly auditService: AdminAuditService,
  ) {}

  list() {
    return this.platformService.listInvites();
  }

  async create(
    admin: AuthenticatedAdmin,
    dto: CreateConviteCadastroDto,
    context: AdminRequestContext,
  ) {
    const invite = await this.platformService.createInvite(dto, admin.email);

    await this.auditService.record({
      ...context,
      adminUserId: admin.id,
      adminRole: admin.role,
      action: 'SIGNUP_INVITE_CREATE',
      resourceType: 'signup_invitation',
      resourceId: invite.id,
      newState: {
        email: invite.email,
        nome: invite.nome,
        validade_dias: dto.validade_dias ?? null,
        email_enviado: invite.email_enviado,
      },
    });

    return invite;
  }

  async resend(
    admin: AuthenticatedAdmin,
    id: string,
    context: AdminRequestContext,
  ) {
    const invite = await this.platformService.resendInvite(id);

    await this.auditService.record({
      ...context,
      adminUserId: admin.id,
      adminRole: admin.role,
      action: 'SIGNUP_INVITE_RESEND',
      resourceType: 'signup_invitation',
      resourceId: invite.id,
      metadata: {
        email: invite.email,
        email_enviado: invite.email_enviado,
      },
    });

    return invite;
  }

  async revoke(
    admin: AuthenticatedAdmin,
    id: string,
    context: AdminRequestContext,
  ) {
    const result = await this.platformService.revokeInvite(id);

    await this.auditService.record({
      ...context,
      adminUserId: admin.id,
      adminRole: admin.role,
      action: 'SIGNUP_INVITE_REVOKE',
      resourceType: 'signup_invitation',
      resourceId: id,
    });

    return result;
  }
}
