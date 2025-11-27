import { Test, TestingModule } from '@nestjs/testing';
import { LojasController } from './lojas.controller';
import { LojasService } from './lojas.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { AuthService } from '../auth/auth.service';

describe('LojasController', () => {
  let controller: LojasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LojasController],
      providers: [
        LojasService,
        { provide: PrismaService, useValue: { loja: { findMany: jest.fn(), findUnique: jest.fn() } } },
        { provide: MailService, useValue: { sendVerificationEmail: jest.fn() } },
        { provide: AuthService, useValue: { generateToken: jest.fn().mockResolvedValue('token') } },
      ],
    }).compile();

    controller = module.get<LojasController>(LojasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
