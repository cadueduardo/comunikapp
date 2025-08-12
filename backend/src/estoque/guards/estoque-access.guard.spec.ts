import { Test, TestingModule } from '@nestjs/testing';
import { EstoqueAccessGuard } from './estoque-access.guard';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { EstoqueRequest } from '../middleware/tenant-isolation.middleware';

describe('EstoqueAccessGuard', () => {
  let guard: EstoqueAccessGuard;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EstoqueAccessGuard,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    guard = module.get<EstoqueAccessGuard>(EstoqueAccessGuard);
    configService = module.get<ConfigService>(ConfigService);

    // Default config values
    mockConfigService.get.mockImplementation(
      (key: string, defaultValue?: string) => {
        switch (key) {
          case 'ESTOQUE_MODULE_ENABLED':
            return 'true';
          case 'ESTOQUE_ALLOWED_ROLES':
            return 'admin,manager,estoque';
          default:
            return defaultValue;
        }
      },
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('context validation', () => {
    it('should throw UnauthorizedException when estoque context is missing', () => {
      const mockRequest = {} as EstoqueRequest;
      const mockContext = {
        switchToHttp: () => ({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(mockContext)).toThrow(
        UnauthorizedException,
      );
      expect(() => guard.canActivate(mockContext)).toThrow(
        'Contexto de estoque não encontrado',
      );
    });

    it('should accept request with valid estoque context', () => {
      const mockRequest: EstoqueRequest = {
        estoque: {
          lojaId: 'loja-123',
          usuarioId: 'user-456',
          roles: ['admin'],
        },
      } as any;

      const mockContext = {
        switchToHttp: () => ({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });
  });

  describe('lojaId validation', () => {
    it('should throw UnauthorizedException when lojaId is missing', () => {
      const mockRequest: EstoqueRequest = {
        estoque: {
          usuarioId: 'user-456',
          roles: ['admin'],
        },
      } as any;

      const mockContext = {
        switchToHttp: () => ({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(mockContext)).toThrow(
        UnauthorizedException,
      );
      expect(() => guard.canActivate(mockContext)).toThrow(
        'lojaId é obrigatório',
      );
    });

    it('should accept request with valid lojaId', () => {
      const mockRequest: EstoqueRequest = {
        estoque: {
          lojaId: 'loja-123',
          usuarioId: 'user-456',
          roles: ['admin'],
        },
      } as any;

      const mockContext = {
        switchToHttp: () => ({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });
  });

  describe('usuarioId validation', () => {
    it('should throw UnauthorizedException when usuarioId is missing', () => {
      const mockRequest: EstoqueRequest = {
        estoque: {
          lojaId: 'loja-123',
          roles: ['admin'],
        },
      } as any;

      const mockContext = {
        switchToHttp: () => ({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(mockContext)).toThrow(
        UnauthorizedException,
      );
      expect(() => guard.canActivate(mockContext)).toThrow(
        'usuarioId é obrigatório',
      );
    });

    it('should accept request with valid usuarioId', () => {
      const mockRequest: EstoqueRequest = {
        estoque: {
          lojaId: 'loja-123',
          usuarioId: 'user-456',
          roles: ['admin'],
        },
      } as any;

      const mockContext = {
        switchToHttp: () => ({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });
  });

  describe('module enabled validation', () => {
    it('should throw ForbiddenException when module is disabled', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'ESTOQUE_MODULE_ENABLED') {
          return 'false';
        }
        return 'default-value';
      });

      const mockRequest: EstoqueRequest = {
        estoque: {
          lojaId: 'loja-123',
          usuarioId: 'user-456',
          roles: ['admin'],
        },
      } as any;

      const mockContext = {
        switchToHttp: () => ({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(mockContext)).toThrow(
        'Módulo de estoque está desabilitado',
      );
    });

    it('should accept request when module is enabled', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'ESTOQUE_MODULE_ENABLED') {
          return 'true';
        }
        if (key === 'ESTOQUE_ALLOWED_ROLES') {
          return 'admin,manager,estoque';
        }
        return 'default-value';
      });

      const mockRequest: EstoqueRequest = {
        estoque: {
          lojaId: 'loja-123',
          usuarioId: 'user-456',
          roles: ['admin'],
        },
      } as any;

      const mockContext = {
        switchToHttp: () => ({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });
  });

  describe('role validation', () => {
    it('should accept request with allowed role', () => {
      const mockRequest: EstoqueRequest = {
        estoque: {
          lojaId: 'loja-123',
          usuarioId: 'user-456',
          roles: ['admin'],
        },
      } as any;

      const mockContext = {
        switchToHttp: () => ({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should accept request with multiple roles including allowed role', () => {
      const mockRequest: EstoqueRequest = {
        estoque: {
          lojaId: 'loja-123',
          usuarioId: 'user-456',
          roles: ['user', 'manager', 'viewer'],
        },
      } as any;

      const mockContext = {
        switchToHttp: () => ({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user has no allowed roles', () => {
      const mockRequest: EstoqueRequest = {
        estoque: {
          lojaId: 'loja-123',
          usuarioId: 'user-456',
          roles: ['user', 'viewer'],
        },
      } as any;

      const mockContext = {
        switchToHttp: () => ({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(mockContext)).toThrow('Acesso negado');
    });

    it('should throw ForbiddenException when user has no roles', () => {
      const mockRequest: EstoqueRequest = {
        estoque: {
          lojaId: 'loja-123',
          usuarioId: 'user-456',
          roles: [],
        },
      } as any;

      const mockContext = {
        switchToHttp: () => ({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(mockContext)).toThrow('Acesso negado');
    });

    it('should handle roles with whitespace', () => {
      const mockRequest: EstoqueRequest = {
        estoque: {
          lojaId: 'loja-123',
          usuarioId: 'user-456',
          roles: [' admin ', ' manager '],
        },
      } as any;

      const mockContext = {
        switchToHttp: () => ({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });
  });

  describe('custom configuration', () => {
    it('should use custom allowed roles from config', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'ESTOQUE_ALLOWED_ROLES') {
          return 'admin,supervisor';
        }
        return 'true';
      });

      const mockRequest: EstoqueRequest = {
        estoque: {
          lojaId: 'loja-123',
          usuarioId: 'user-456',
          roles: ['manager'], // Role not in custom allowed list
        },
      } as any;

      const mockContext = {
        switchToHttp: () => ({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(mockContext)).toThrow('admin,supervisor');
    });

    it('should accept request with custom allowed role', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'ESTOQUE_ALLOWED_ROLES') {
          return 'admin,supervisor';
        }
        return 'true';
      });

      const mockRequest: EstoqueRequest = {
        estoque: {
          lojaId: 'loja-123',
          usuarioId: 'user-456',
          roles: ['supervisor'],
        },
      } as any;

      const mockContext = {
        switchToHttp: () => ({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });
  });

  describe('error messages', () => {
    it('should include user roles in forbidden error message', () => {
      const mockRequest: EstoqueRequest = {
        estoque: {
          lojaId: 'loja-123',
          usuarioId: 'user-456',
          roles: ['user', 'viewer'],
        },
      } as any;

      const mockContext = {
        switchToHttp: () => ({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(mockContext)).toThrow('user, viewer');
    });

    it('should include required roles in forbidden error message', () => {
      const mockRequest: EstoqueRequest = {
        estoque: {
          lojaId: 'loja-123',
          usuarioId: 'user-456',
          roles: ['user', 'viewer'],
        },
      } as any;

      const mockContext = {
        switchToHttp: () => ({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(mockContext)).toThrow(
        'admin,manager,estoque',
      );
    });
  });

  describe('complete validation flow', () => {
    it('should pass all validations with complete valid request', () => {
      const mockRequest: EstoqueRequest = {
        estoque: {
          lojaId: 'loja-123',
          usuarioId: 'user-456',
          roles: ['admin'],
        },
      } as any;

      const mockContext = {
        switchToHttp: () => ({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should fail with incomplete request', () => {
      const mockRequest: EstoqueRequest = {
        estoque: {
          lojaId: 'loja-123',
          // Missing usuarioId
          roles: ['admin'],
        },
      } as any;

      const mockContext = {
        switchToHttp: () => ({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(mockContext)).toThrow(
        UnauthorizedException,
      );
      expect(() => guard.canActivate(mockContext)).toThrow(
        'usuarioId é obrigatório',
      );
    });
  });
});
