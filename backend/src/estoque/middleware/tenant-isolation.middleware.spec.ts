import { Test, TestingModule } from '@nestjs/testing';
import {
  TenantIsolationMiddleware,
  EstoqueRequest,
} from './tenant-isolation.middleware';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

describe('TenantIsolationMiddleware', () => {
  let middleware: TenantIsolationMiddleware;
  let configService: ConfigService;
  let mockRequest: EstoqueRequest;
  let mockResponse: Response;
  let mockNext: NextFunction;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantIsolationMiddleware,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn().mockReturnValue({
              loja_id: 'loja-123',
              sub: 'user-456',
              funcao: 'ADMINISTRADOR',
            }),
          },
        },
      ],
    }).compile();

    middleware = module.get<TenantIsolationMiddleware>(
      TenantIsolationMiddleware,
    );
    configService = module.get<ConfigService>(ConfigService);

    // Setup default mocks
    mockRequest = {
      headers: {},
    } as EstoqueRequest;

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;

    mockNext = jest.fn();

    // Default config values
    mockConfigService.get.mockImplementation(
      (key: string, defaultValue?: string) => {
        switch (key) {
          case 'ESTOQUE_INTERNAL_API_TOKEN':
            return 'internal-token-123';
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
    expect(middleware).toBeDefined();
  });

  describe('internal token validation', () => {
    it('should allow access with valid internal token', () => {
      mockRequest.headers = {
        'x-internal-token': 'internal-token-123',
        'x-loja-id': 'loja-123',
        'x-usuario-id': 'user-456',
      };

      middleware.use(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.estoque).toEqual({
        lojaId: 'loja-123',
        usuarioId: 'user-456',
      });
    });

    it('should reject invalid internal token', () => {
      mockRequest.headers = {
        'x-internal-token': 'invalid-token',
        'x-loja-id': 'loja-123',
        'x-usuario-id': 'user-456',
      };

      middleware.use(mockRequest, mockResponse, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Token de autenticação requerido'),
          module: 'estoque',
        }),
      );
    });
  });

  describe('JWT authentication validation', () => {
    it('should reject request without authorization header', () => {
      mockRequest.headers = {
        'x-loja-id': 'loja-123',
        'x-usuario-id': 'user-456',
      };

      middleware.use(mockRequest, mockResponse, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Token de autenticação requerido'),
          module: 'estoque',
        }),
      );
    });

    it('should reject request with invalid authorization format', () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat token123',
        'x-loja-id': 'loja-123',
        'x-usuario-id': 'user-456',
      };

      middleware.use(mockRequest, mockResponse, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Token de autenticação requerido'),
          module: 'estoque',
        }),
      );
    });
  });

  describe('tenant validation', () => {
    it('should reject request without lojaId', () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-token',
        'x-usuario-id': 'user-456',
        'x-user-roles': 'admin,manager',
      };

      middleware.use(mockRequest, mockResponse, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('lojaId é obrigatório'),
          module: 'estoque',
        }),
      );
    });

    it('should accept request with valid lojaId', () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-token',
        'x-loja-id': 'loja-123',
        'x-usuario-id': 'user-456',
        'x-user-roles': 'admin,manager',
      };

      middleware.use(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.estoque).toEqual({
        lojaId: 'loja-123',
        usuarioId: 'user-456',
        roles: ['admin', 'manager'],
      });
    });
  });

  describe('role validation', () => {
    it('should accept request with allowed role', () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-token',
        'x-loja-id': 'loja-123',
        'x-usuario-id': 'user-456',
        'x-user-roles': 'admin',
      };

      middleware.use(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.estoque).toEqual({
        lojaId: 'loja-123',
        usuarioId: 'user-456',
        roles: ['admin'],
      });
    });

    it('should accept request with multiple roles including allowed role', () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-token',
        'x-loja-id': 'loja-123',
        'x-usuario-id': 'user-456',
        'x-user-roles': 'user,manager,viewer',
      };

      middleware.use(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.estoque).toEqual({
        lojaId: 'loja-123',
        usuarioId: 'user-456',
        roles: ['user', 'manager', 'viewer'],
      });
    });

    it('should reject request without allowed roles', () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-token',
        'x-loja-id': 'loja-123',
        'x-usuario-id': 'user-456',
        'x-user-roles': 'user,viewer',
      };

      middleware.use(mockRequest, mockResponse, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Permissão insuficiente'),
          module: 'estoque',
        }),
      );
    });

    it('should handle empty roles array', () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-token',
        'x-loja-id': 'loja-123',
        'x-usuario-id': 'user-456',
      };

      middleware.use(mockRequest, mockResponse, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Permissão insuficiente'),
          module: 'estoque',
        }),
      );
    });
  });

  describe('error handling', () => {
    it('should handle unexpected errors gracefully', () => {
      // Mock configService to throw an error
      mockConfigService.get.mockImplementation(() => {
        throw new Error('Config error');
      });

      mockRequest.headers = {
        authorization: 'Bearer valid-token',
        'x-loja-id': 'loja-123',
        'x-usuario-id': 'user-456',
        'x-user-roles': 'admin',
      };

      middleware.use(mockRequest, mockResponse, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String),
          module: 'estoque',
          timestamp: expect.any(String),
        }),
      );
    });

    it('should handle BadRequestException', () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-token',
        // Missing lojaId to trigger BadRequestException
      };

      middleware.use(mockRequest, mockResponse, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('lojaId é obrigatório'),
          module: 'estoque',
        }),
      );
    });

    it('should handle UnauthorizedException', () => {
      mockRequest.headers = {
        // Missing authorization header to trigger UnauthorizedException
        'x-loja-id': 'loja-123',
        'x-usuario-id': 'user-456',
      };

      middleware.use(mockRequest, mockResponse, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Token de autenticação requerido'),
          module: 'estoque',
        }),
      );
    });
  });

  describe('configuration', () => {
    it('should use custom allowed roles from config', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'ESTOQUE_ALLOWED_ROLES') {
          return 'admin,supervisor';
        }
        return 'default-value';
      });

      mockRequest.headers = {
        authorization: 'Bearer valid-token',
        'x-loja-id': 'loja-123',
        'x-usuario-id': 'user-456',
        'x-user-roles': 'manager', // Role not in custom allowed list
      };

      middleware.use(mockRequest, mockResponse, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('admin,supervisor'),
          module: 'estoque',
        }),
      );
    });

    it('should use custom internal token from config', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'ESTOQUE_INTERNAL_API_TOKEN') {
          return 'custom-internal-token';
        }
        return 'default-value';
      });

      mockRequest.headers = {
        'x-internal-token': 'custom-internal-token',
        'x-loja-id': 'loja-123',
        'x-usuario-id': 'user-456',
      };

      middleware.use(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.estoque).toEqual({
        lojaId: 'loja-123',
        usuarioId: 'user-456',
      });
    });
  });
});
