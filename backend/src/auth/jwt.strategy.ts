import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService, JwtPayload, AuthenticatedUser } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'your-secret-key',
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    console.log('🔑 JWT Strategy: Validando payload:', payload);
    
    const user = await this.authService.validateUser(payload);
    console.log('🔑 JWT Strategy: Usuário encontrado:', !!user);
    console.log('🔑 JWT Strategy: Dados do usuário:', user ? { id: user.id, email: user.email, status: user.status, email_verificado: user.email_verificado } : null);
    
    if (!user) {
      console.log('❌ JWT Strategy: Usuário não encontrado');
      throw new UnauthorizedException('Token inválido ou usuário inativo');
    }
    
    console.log('✅ JWT Strategy: Usuário validado com sucesso');
    return user;
  }
} 