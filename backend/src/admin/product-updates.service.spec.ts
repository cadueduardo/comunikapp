/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ProductUpdatesService } from './product-updates.service';

describe('ProductUpdatesService', () => {
  const admin = {
    id: 'admin-1',
    sessionId: 'session-1',
    nome: 'Administrador',
    email: 'admin@comunikapp.com.br',
    role: 'SUPER_ADMIN' as const,
  };

  function setup() {
    const audit = { record: jest.fn().mockResolvedValue({}) };
    const productUpdate = {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
    };
    const tx = {
      product_update: productUpdate,
      product_update_revision: {
        create: jest.fn(),
        aggregate: jest.fn(),
      },
    };
    const prisma = {
      product_update: productUpdate,
      product_update_revision: tx.product_update_revision,
      $transaction: jest.fn((callback) =>
        typeof callback === 'function' ? callback(tx) : Promise.all(callback),
      ),
    };
    const config = {
      get: jest.fn((key: string) =>
        key === 'ADMIN_DEPLOY_WEBHOOK_SECRET'
          ? 'segredo-deploy-com-mais-de-32-caracteres'
          : undefined,
      ),
    };
    const service = new ProductUpdatesService(
      prisma as any,
      audit as any,
      config as any,
    );
    return { service, productUpdate, audit, tx };
  }

  const deployDto = {
    commitSha: 'abcdef1234567890',
    environment: 'production',
    version: '1.2.0',
    title: 'Nova versão do ComunikApp',
    summary: 'Resumo seguro para revisão editorial.',
    content: 'Conteúdo detalhado da versão para revisão humana.',
    category: 'IMPROVEMENT' as const,
    modules: ['orçamentos'],
  };

  it('cria um único rascunho por ambiente e commit', async () => {
    const { service, productUpdate } = setup();
    const created = { id: 'update-1', status: 'DRAFT' };
    productUpdate.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(created);
    productUpdate.create.mockResolvedValue(created);

    const first = await service.ingestDeploy(
      deployDto,
      'Bearer segredo-deploy-com-mais-de-32-caracteres',
    );
    const second = await service.ingestDeploy(
      deployDto,
      'Bearer segredo-deploy-com-mais-de-32-caracteres',
    );

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(productUpdate.create).toHaveBeenCalledTimes(1);
    expect(productUpdate.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          idempotency_key: 'production:abcdef1234567890',
          status: 'DRAFT',
          origin: 'DEPLOY_AUTOMATION',
        }),
      }),
    );
  });

  it('nega o webhook quando o segredo não confere', async () => {
    const { service } = setup();
    await expect(
      service.ingestDeploy(deployDto, 'Bearer segredo-incorreto'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('impede publicação sem revisão prévia', async () => {
    const { service, productUpdate } = setup();
    productUpdate.findUnique.mockResolvedValue({
      id: 'update-1',
      status: 'DRAFT',
    });

    await expect(service.publish('update-1', admin, {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(productUpdate.update).not.toHaveBeenCalled();
  });
});
