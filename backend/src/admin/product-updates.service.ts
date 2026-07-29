import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, timingSafeEqual } from 'crypto';
import {
  Prisma,
  product_update_category,
  product_update_status,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdminAuditService } from './admin-audit.service';
import { AdminRequestContext } from './admin-request-context';
import { AuthenticatedAdmin } from './admin.types';
import {
  DeployProductUpdateDto,
  ListProductUpdatesDto,
  UpsertProductUpdateDto,
} from './dto/product-update.dto';

const EDITABLE_STATUSES: product_update_status[] = ['DRAFT', 'IN_REVIEW'];

function cleanText(value: string) {
  return value.split('\0').join('').trim();
}

function snapshot(update: {
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: product_update_category;
  version?: string | null;
  modules?: unknown;
  audience?: unknown;
  changelog_enabled: boolean;
  in_app_enabled: boolean;
  email_enabled: boolean;
}) {
  return {
    title: update.title,
    slug: update.slug,
    summary: update.summary,
    content: update.content,
    category: update.category,
    version: update.version,
    modules: Array.isArray(update.modules) ? update.modules.map(String) : [],
    audience: Array.isArray(update.audience) ? update.audience.map(String) : [],
    changelogEnabled: update.changelog_enabled,
    inAppEnabled: update.in_app_enabled,
    emailEnabled: update.email_enabled,
  };
}

@Injectable()
export class ProductUpdatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
    private readonly config: ConfigService,
  ) {}

  async list(dto: ListProductUpdatesDto) {
    const search = dto.search?.trim();
    const where: Prisma.product_updateWhereInput = {
      status: dto.status,
      ...(search
        ? {
            OR: [
              { title: { contains: search } },
              { summary: { contains: search } },
              { version: { contains: search } },
            ],
          }
        : {}),
    };
    const [total, data] = await this.prisma.$transaction([
      this.prisma.product_update.count({ where }),
      this.prisma.product_update.findMany({
        where,
        orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
        skip: (dto.page - 1) * dto.limit,
        take: dto.limit,
        include: {
          author: { select: { id: true, nome: true } },
          reviewer: { select: { id: true, nome: true } },
          publisher: { select: { id: true, nome: true } },
        },
      }),
    ]);
    return {
      data,
      pagination: {
        page: dto.page,
        limit: dto.limit,
        total,
        totalPages: Math.ceil(total / dto.limit),
      },
    };
  }

  async detail(id: string) {
    const update = await this.prisma.product_update.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, nome: true } },
        reviewer: { select: { id: true, nome: true } },
        publisher: { select: { id: true, nome: true } },
        revisions: {
          orderBy: { revision_number: 'desc' },
          select: {
            id: true,
            revision_number: true,
            change_reason: true,
            created_at: true,
            created_by: { select: { id: true, nome: true } },
          },
        },
      },
    });
    if (!update) throw new NotFoundException('Novidade não encontrada.');
    return update;
  }

  async create(
    dto: UpsertProductUpdateDto,
    admin: AuthenticatedAdmin,
    context: AdminRequestContext,
  ) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const update = await tx.product_update.create({
          data: this.writeData(dto, { author_id: admin.id }),
        });
        await tx.product_update_revision.create({
          data: {
            product_update_id: update.id,
            revision_number: 1,
            snapshot: snapshot(update),
            change_reason: dto.changeReason || 'Criação do rascunho',
            created_by_id: admin.id,
          },
        });
        await this.audit.record(
          {
            ...context,
            adminUserId: admin.id,
            adminRole: admin.role,
            action: 'product_update.created',
            resourceType: 'product_update',
            resourceId: update.id,
            newState: snapshot(update),
          },
          tx,
        );
        return update;
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Já existe uma novidade com este slug.');
      }
      throw error;
    }
  }

  async update(
    id: string,
    dto: UpsertProductUpdateDto,
    admin: AuthenticatedAdmin,
    context: AdminRequestContext,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.product_update.findUnique({ where: { id } });
      if (!current) throw new NotFoundException('Novidade não encontrada.');
      if (!EDITABLE_STATUSES.includes(current.status)) {
        throw new BadRequestException(
          'Somente rascunhos ou conteúdos em revisão podem ser editados.',
        );
      }
      const lastRevision = await tx.product_update_revision.aggregate({
        where: { product_update_id: id },
        _max: { revision_number: true },
      });
      const updated = await tx.product_update.update({
        where: { id },
        data: this.writeData(dto, {
          status: 'DRAFT',
          reviewer_id: null,
        }),
      });
      await tx.product_update_revision.create({
        data: {
          product_update_id: id,
          revision_number: (lastRevision._max.revision_number || 0) + 1,
          snapshot: snapshot(updated),
          change_reason: dto.changeReason,
          created_by_id: admin.id,
        },
      });
      await this.audit.record(
        {
          ...context,
          adminUserId: admin.id,
          adminRole: admin.role,
          action: 'product_update.updated',
          resourceType: 'product_update',
          resourceId: id,
          previousState: snapshot(current),
          newState: snapshot(updated),
          reason: dto.changeReason,
        },
        tx,
      );
      return updated;
    });
  }

  async requestReview(
    id: string,
    admin: AuthenticatedAdmin,
    context: AdminRequestContext,
  ) {
    return this.transition(id, 'DRAFT', 'IN_REVIEW', admin, context);
  }

  async publish(
    id: string,
    admin: AuthenticatedAdmin,
    context: AdminRequestContext,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.product_update.findUnique({ where: { id } });
      if (!current) throw new NotFoundException('Novidade não encontrada.');
      if (current.status !== 'IN_REVIEW') {
        throw new BadRequestException(
          'A novidade precisa estar em revisão antes da publicação.',
        );
      }
      const updated = await tx.product_update.update({
        where: { id },
        data: {
          status: 'PUBLISHED',
          reviewer_id: admin.id,
          publisher_id: admin.id,
          published_at: new Date(),
        },
      });
      await this.audit.record(
        {
          ...context,
          adminUserId: admin.id,
          adminRole: admin.role,
          action: 'product_update.published',
          resourceType: 'product_update',
          resourceId: id,
          previousState: { status: current.status },
          newState: {
            status: updated.status,
            publishedAt: updated.published_at,
          },
        },
        tx,
      );
      return updated;
    });
  }

  async ingestDeploy(dto: DeployProductUpdateDto, authorization?: string) {
    this.assertDeploySecret(authorization);
    const environment = dto.environment.toLowerCase();
    const commitSha = dto.commitSha.toLowerCase();
    const idempotencyKey = `${environment}:${commitSha}`;
    const existing = await this.prisma.product_update.findUnique({
      where: { idempotency_key: idempotencyKey },
    });
    if (existing) return { created: false, update: existing };

    try {
      const update = await this.prisma.product_update.create({
        data: {
          title: cleanText(dto.title),
          slug: `${dto.version || 'deploy'}-${commitSha.slice(0, 10)}`
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 191),
          summary: cleanText(dto.summary),
          content: cleanText(dto.content),
          category: dto.category,
          version: dto.version?.trim() || null,
          commit_sha: commitSha,
          environment,
          modules: dto.modules || [],
          audience: [],
          origin: 'DEPLOY_AUTOMATION',
          idempotency_key: idempotencyKey,
          status: 'DRAFT',
          revisions: {
            create: {
              revision_number: 1,
              snapshot: {
                title: cleanText(dto.title),
                summary: cleanText(dto.summary),
                content: cleanText(dto.content),
                category: dto.category,
              },
              change_reason: 'Rascunho gerado automaticamente após deploy',
            },
          },
        },
      });
      return { created: true, update };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const duplicate = await this.prisma.product_update.findUnique({
          where: { idempotency_key: idempotencyKey },
        });
        if (duplicate) return { created: false, update: duplicate };
      }
      throw error;
    }
  }

  async publicList(limit = 20) {
    return this.prisma.product_update.findMany({
      where: {
        status: 'PUBLISHED',
        changelog_enabled: true,
        published_at: { lte: new Date() },
      },
      orderBy: [{ published_at: 'desc' }, { id: 'desc' }],
      take: Math.min(Math.max(limit, 1), 50),
      select: this.publicSelect(),
    });
  }

  async publicDetail(slug: string) {
    const update = await this.prisma.product_update.findFirst({
      where: {
        slug,
        status: 'PUBLISHED',
        changelog_enabled: true,
        published_at: { lte: new Date() },
      },
      select: this.publicSelect(),
    });
    if (!update) throw new NotFoundException('Novidade não encontrada.');
    return update;
  }

  private writeData(
    dto: UpsertProductUpdateDto,
    extra: Prisma.product_updateUncheckedCreateInput | Record<string, unknown>,
  ) {
    return {
      title: cleanText(dto.title),
      slug: dto.slug,
      summary: cleanText(dto.summary),
      content: cleanText(dto.content),
      category: dto.category,
      version: dto.version?.trim() || null,
      modules: dto.modules || [],
      audience: dto.audience || [],
      changelog_enabled: dto.changelogEnabled ?? true,
      in_app_enabled: dto.inAppEnabled ?? false,
      email_enabled: dto.emailEnabled ?? false,
      ...extra,
    };
  }

  private async transition(
    id: string,
    expected: product_update_status,
    next: product_update_status,
    admin: AuthenticatedAdmin,
    context: AdminRequestContext,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.product_update.findUnique({ where: { id } });
      if (!current) throw new NotFoundException('Novidade não encontrada.');
      if (current.status !== expected) {
        throw new BadRequestException('Transição editorial inválida.');
      }
      const updated = await tx.product_update.update({
        where: { id },
        data: { status: next, reviewer_id: admin.id },
      });
      await this.audit.record(
        {
          ...context,
          adminUserId: admin.id,
          adminRole: admin.role,
          action: `product_update.${next.toLowerCase()}`,
          resourceType: 'product_update',
          resourceId: id,
          previousState: { status: expected },
          newState: { status: next },
        },
        tx,
      );
      return updated;
    });
  }

  private assertDeploySecret(authorization?: string) {
    const expected = this.config.get<string>('ADMIN_DEPLOY_WEBHOOK_SECRET');
    const supplied = authorization?.startsWith('Bearer ')
      ? authorization.slice(7)
      : '';
    if (!expected || !supplied) {
      throw new UnauthorizedException('Credencial de deploy inválida.');
    }
    const expectedHash = createHash('sha256').update(expected).digest();
    const suppliedHash = createHash('sha256').update(supplied).digest();
    if (!timingSafeEqual(expectedHash, suppliedHash)) {
      throw new UnauthorizedException('Credencial de deploy inválida.');
    }
  }

  private publicSelect() {
    return {
      id: true,
      title: true,
      slug: true,
      summary: true,
      content: true,
      version: true,
      category: true,
      modules: true,
      published_at: true,
    } satisfies Prisma.product_updateSelect;
  }
}
