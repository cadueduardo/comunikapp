import { Test, TestingModule } from '@nestjs/testing';
import { LojasService } from './lojas.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { AuthService } from '../auth/auth.service';
import { TwoFactorService } from '../auth/two-factor.service';
import { PendingSignupService } from './pending-signup.service';

jest.mock('../auth/two-factor.service', () => ({
  TwoFactorService: class TwoFactorService {},
}));

describe('LojasService', () => {
  let service: LojasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LojasService,
        {
          provide: PrismaService,
          useValue: {
            usuario: { findUnique: jest.fn() },
            loja: { findUnique: jest.fn() },
            $transaction: jest.fn(
              async (fn: any) =>
                await fn({
                  loja: { create: jest.fn() },
                  usuario: { create: jest.fn() },
                }),
            ),
          },
        },
        {
          provide: MailService,
          useValue: { sendVerificationEmail: jest.fn() },
        },
        {
          provide: AuthService,
          useValue: { generateToken: jest.fn().mockResolvedValue('token') },
        },
        {
          provide: TwoFactorService,
          useValue: {},
        },
        {
          provide: PendingSignupService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<LojasService>(LojasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
