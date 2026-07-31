import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../auth/jwt-auth.guard';
import { extrairIdentidadeAutenticada } from '../../auth/decorators';
import { REQUER_PERMISSAO_VENDAS } from './requer-permissao-vendas.decorator';
import { VendasPermissionsService } from './vendas-permissions.service';
import { VendasPermissao } from './vendas-permissoes';
import {
  pseudonimizar,
  registrarEventoDeSeguranca,
} from '../../common/security/eventos-seguranca';

/**
 * Aplica autorização comercial no limite HTTP, com negação por padrão: dentro
 * de um controller protegido por este guard, endpoint sem
 * `@RequerPermissaoVendas` e sem `@Public()` é recusado.
 *
 * O guard garante cobertura completa da superfície HTTP. As mutações mais
 * sensíveis também chamam `assertPode` dentro do service, para que chamadas
 * internas não contornem a autorização.
 */
@Injectable()
export class VendasPermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissoes: VendasPermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const alvos = [context.getHandler(), context.getClass()];

    const publico = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      alvos,
    );
    if (publico) {
      return true;
    }

    const exigidas = this.reflector.getAllAndOverride<VendasPermissao[]>(
      REQUER_PERMISSAO_VENDAS,
      alvos,
    );

    const requisicao = context.switchToHttp().getRequest();
    const rota = `${context.getClass().name}.${context.getHandler().name}`;

    if (!exigidas?.length) {
      // Endpoint sem permissão declarada dentro de um controller protegido.
      // É defeito de configuração, não tentativa de invasão — por isso o evento
      // separa o motivo: um pico daqui indica código novo mal anotado.
      registrarEventoDeSeguranca({
        tipo: 'AUTORIZACAO_NEGADA',
        rota,
        motivo: 'permissao_nao_declarada',
      });
      throw new ForbiddenException(
        'Você não tem permissão para executar esta ação.',
      );
    }

    const { usuarioId, lojaId } = extrairIdentidadeAutenticada(requisicao);

    try {
      await this.permissoes.assertPodeQualquer(usuarioId, lojaId, exigidas);
    } catch (erro) {
      // Gate 0S / HS-06: o usuário entra pseudonimizado. O ID cru em log de
      // negação, agregado ao longo do tempo, vira um mapa de quem tenta o quê.
      registrarEventoDeSeguranca({
        tipo: 'AUTORIZACAO_NEGADA',
        rota,
        origem: pseudonimizar(usuarioId ?? 'sem-usuario'),
        motivo: 'permissao_insuficiente',
      });
      throw erro;
    }

    return true;
  }
}
