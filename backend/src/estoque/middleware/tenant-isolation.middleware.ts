/**
 * Middleware de isolamento de tenant para módulo de estoque
 * Garante que todas as operações sejam filtradas por lojaId
 * Implementa segurança obrigatória conforme premissas
 */

import { Injectable, NestMiddleware, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

export interface EstoqueRequest extends Request {
  estoque?: {
    lojaId: string;
    usuarioId?: string;
    roles?: string[];
  };
}

@Injectable()
export class TenantIsolationMiddleware implements NestMiddleware {
  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {}

  use(req: EstoqueRequest, res: Response, next: NextFunction) {
    console.log('🔒 Middleware de isolamento de tenant executado');
    console.log('📍 URL:', req.url);
    console.log('🔑 Headers:', req.headers);
    
    try {
      // 1. VALIDAÇÃO DE TOKEN INTERNO (comunicação entre módulos)
      const internalToken = req.headers['x-internal-token'];
      const expectedToken = this.configService.get('ESTOQUE_INTERNAL_API_TOKEN');
      
      if (internalToken && internalToken === expectedToken) {
        // Token interno válido - bypass para comunicação entre módulos
        req.estoque = {
          lojaId: req.headers['x-loja-id'] as string,
          usuarioId: req.headers['x-usuario-id'] as string,
        };
        return next();
      }

      // 2. VALIDAÇÃO DE AUTENTICAÇÃO JWT (usuários normais)
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('Token de autenticação requerido para acesso ao estoque');
      }

      // 3. EXTRAÇÃO E VALIDAÇÃO DO TOKEN JWT
      const token = authHeader.substring(7); // Remove 'Bearer '
      
      try {
        console.log('🔍 Validando token JWT...');
        console.log('🔑 Token recebido:', token.substring(0, 50) + '...');
        
        const secret = this.configService.get('JWT_SECRET') || 'your-secret-key';
        console.log('🔐 Secret usado:', secret);
        
        const payload = this.jwtService.verify(token, {
          secret: secret,
        });

        console.log('📋 Payload JWT:', JSON.stringify(payload, null, 2));

        // 4. EXTRAÇÃO DE DADOS DO PAYLOAD JWT
        const lojaId = payload.loja_id;
        const usuarioId = payload.sub; // user id
        const funcao = payload.funcao; // função do usuário

        console.log('🏪 LojaId:', lojaId);
        console.log('👤 UsuarioId:', usuarioId);
        console.log('🔧 Função:', funcao);

        // 5. VALIDAÇÃO DE TENANT (lojaId obrigatório)
        if (!lojaId) {
          console.error('❌ LojaId não encontrado no token');
          throw new BadRequestException('lojaId é obrigatório para operações de estoque');
        }

        // 6. MAPEAMENTO DE FUNÇÃO PARA ROLES E VALIDAÇÃO DE PERMISSÕES
        const roles = this.mapearFuncaoParaRoles(funcao);
        const allowedRoles = this.configService.get('ESTOQUE_ALLOWED_ROLES', 'ADMINISTRADOR,FINANCEIRO,ESTOQUE').split(',');
        const hasPermission = roles.some(role => allowedRoles.includes(role.trim()));
        
        if (!hasPermission) {
          throw new UnauthorizedException(`Permissão insuficiente. Funções necessárias: ${allowedRoles.join(', ')}`);
        }

        // 7. CONFIGURAÇÃO DO CONTEXTO DE ESTOQUE
        req.estoque = {
          lojaId,
          usuarioId,
          roles,
        };

        // 8. LOG DE AUDITORIA (logs completos e rastreáveis)
        console.log(`🔒 Acesso ao estoque: Usuário ${usuarioId} | Loja ${lojaId} | Função ${funcao} | Roles ${roles.join(',')}`);

        next();
      } catch (jwtError) {
        console.error('❌ Erro na validação do JWT:', jwtError.message);
        throw new UnauthorizedException('Token JWT inválido ou expirado');
      }
    } catch (error) {
      // 9. TRATAMENTO DE ERROS DE SEGURANÇA
      console.error(`❌ Erro de isolamento de tenant: ${error.message}`);
      res.status(error.status || 500).json({
        message: error.message,
        module: 'estoque',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Mapeia a função do usuário para roles de acesso
   * ADMINISTRADOR tem acesso total
   * FINANCEIRO tem acesso administrativo
   * ESTOQUE tem acesso específico ao módulo
   * PRODUCAO e VENDAS podem ter acesso limitado
   */
  private mapearFuncaoParaRoles(funcao: string): string[] {
    const mapeamento: Record<string, string[]> = {
      'ADMINISTRADOR': ['ADMINISTRADOR', 'FINANCEIRO', 'ESTOQUE', 'PRODUCAO', 'VENDAS'],
      'FINANCEIRO': ['FINANCEIRO', 'ESTOQUE'],
      'ESTOQUE': ['ESTOQUE'],
      'PRODUCAO': ['PRODUCAO', 'ESTOQUE'], // Produção pode acessar estoque para verificar materiais
      'VENDAS': ['VENDAS'], // Vendas tem acesso limitado
    };

    return mapeamento[funcao] || [funcao];
  }
}
