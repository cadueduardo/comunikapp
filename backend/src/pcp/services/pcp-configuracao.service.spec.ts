import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { PCPConfiguracaoService } from './pcp-configuracao.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NivelPCP } from '../dto/pcp-configuracao.dto';

describe('PCPConfiguracaoService', () => {
  let service: PCPConfiguracaoService;
  let prisma: { loja: { findUnique: jest.Mock; update: jest.Mock } };

  beforeEach(async () => {
    prisma = {
      loja: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PCPConfiguracaoService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(PCPConfiguracaoService);
    jest.clearAllMocks();
  });

  it('deve aplicar padrao Organizado', async () => {
    prisma.loja.update.mockResolvedValueOnce({
      pcp_nivel: NivelPCP.ORGANIZADO,
    });

    const resultado = await service.aplicarPadrao('loja-1', {
      id: 'admin-1',
      funcao: 'ADMINISTRADOR',
    } as any);

    expect(prisma.loja.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'loja-1' },
        data: expect.objectContaining({ pcp_nivel: NivelPCP.ORGANIZADO }),
      }),
    );
    expect(resultado.nivel).toBe(NivelPCP.ORGANIZADO);
    expect(resultado.definido).toBe(true);
  });

  it('deve bloquear aplicar padrao para nao administrador', async () => {
    await expect(
      service.aplicarPadrao('loja-1', {
        id: 'user-1',
        funcao: 'PRODUCAO',
      } as any),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
