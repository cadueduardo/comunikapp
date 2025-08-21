import { Test, TestingModule } from '@nestjs/testing';
import { OrcamentosService } from './orcamentos.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificacoesService } from '../notificacoes/notificacoes.service';
import { MailService } from '../mail/mail.service';

describe('OrcamentosService', () => {
  let service: OrcamentosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrcamentosService,
        {
          provide: PrismaService,
          useValue: {
            orcamento: {
              create: jest.fn(),
              findMany: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            itemorcamento: {
              createMany: jest.fn(),
            },
            maquinaorcamento: {
              createMany: jest.fn(),
            },
            funcaoorcamento: {
              createMany: jest.fn(),
            },
          },
        },
        {
          provide: NotificacoesService,
          useValue: {
            criarNotificacao: jest.fn(),
          },
        },
        {
          provide: MailService,
          useValue: {
            enviarEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OrcamentosService>(OrcamentosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
