import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { PATH_METADATA, METHOD_METADATA } from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../../auth/jwt-auth.guard';
import {
  MetodoHttp,
  ROTAS_PUBLICAS,
  rotaEstaNoCatalogo,
} from './rotas-publicas';

const METODOS_POR_ENUM: Partial<Record<RequestMethod, MetodoHttp>> = {
  [RequestMethod.GET]: 'GET',
  [RequestMethod.POST]: 'POST',
  [RequestMethod.PUT]: 'PUT',
  [RequestMethod.PATCH]: 'PATCH',
  [RequestMethod.DELETE]: 'DELETE',
};

interface RotaRegistrada {
  metodo: MetodoHttp;
  caminho: string;
  handler: string;
  publicaNoHandler: boolean;
}

/**
 * Impede que a fronteira pública volte a divergir (Gate 0S — HS-03).
 *
 * Na inicialização, cruza as rotas registradas no Nest com o catálogo de
 * `rotas-publicas.ts`:
 *
 * - Rota liberada pelo catálogo mas sem `@Public()` no handler é acesso
 *   anônimo não declarado. É a direção perigosa: a aplicação não sobe.
 * - Handler com `@Public()` que o catálogo não libera é declaração inerte —
 *   o middleware já exige autenticação. Não derruba a aplicação, mas é
 *   registrado como erro para ser corrigido.
 */
@Injectable()
export class RotasPublicasValidator implements OnApplicationBootstrap {
  private readonly logger = new Logger(RotasPublicasValidator.name);

  constructor(
    private readonly discovery: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly reflector: Reflector,
  ) {}

  onApplicationBootstrap(): void {
    const rotas = this.coletarRotas();

    const abertasSemDeclaracao = rotas.filter(
      (rota) =>
        !rota.publicaNoHandler && this.catalogoLibera(rota.metodo, rota.caminho),
    );

    const declaracoesInertes = rotas.filter(
      (rota) =>
        rota.publicaNoHandler && !this.catalogoLibera(rota.metodo, rota.caminho),
    );

    if (declaracoesInertes.length > 0) {
      this.logger.error(
        `@Public() sem correspondência no catálogo (rota permanece autenticada): ${declaracoesInertes
          .map((rota) => `${rota.metodo} ${rota.caminho} [${rota.handler}]`)
          .join(', ')}`,
      );
    }

    if (abertasSemDeclaracao.length > 0) {
      const detalhe = abertasSemDeclaracao
        .map((rota) => `${rota.metodo} ${rota.caminho} [${rota.handler}]`)
        .join(', ');
      throw new Error(
        `Rotas liberadas pelo catálogo público sem @Public() no handler: ${detalhe}. ` +
          'Declare o handler como público ou remova a rota de rotas-publicas.ts.',
      );
    }

    this.logger.log(
      `Fronteira pública validada: ${ROTAS_PUBLICAS.length} rotas no catálogo, ${rotas.length} rotas registradas.`,
    );
  }

  private catalogoLibera(metodo: MetodoHttp, caminho: string): boolean {
    const rota = rotaEstaNoCatalogo(metodo, caminho);
    return rota !== null && !rota.dispensaDeclaracaoPublic;
  }

  private coletarRotas(): RotaRegistrada[] {
    const rotas: RotaRegistrada[] = [];

    for (const wrapper of this.discovery.getControllers()) {
      const { instance, metatype } = wrapper;
      if (!instance || !metatype) {
        continue;
      }

      const prefixo = this.normalizarSegmento(
        this.reflector.get<string>(PATH_METADATA, metatype) ?? '',
      );
      const prototipo = Object.getPrototypeOf(instance) as object;

      for (const nomeMetodo of this.metadataScanner.getAllMethodNames(
        prototipo,
      )) {
        const handler = prototipo[nomeMetodo] as (...args: unknown[]) => unknown;
        const metodoEnum = this.reflector.get<RequestMethod>(
          METHOD_METADATA,
          handler,
        );
        const metodo =
          metodoEnum === undefined ? undefined : METODOS_POR_ENUM[metodoEnum];
        if (!metodo) {
          continue;
        }

        const sufixo = this.normalizarSegmento(
          this.reflector.get<string>(PATH_METADATA, handler) ?? '',
        );

        rotas.push({
          metodo,
          caminho: `/${[prefixo, sufixo].filter(Boolean).join('/')}`,
          handler: `${metatype.name}.${nomeMetodo}`,
          publicaNoHandler:
            this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
              handler,
              metatype,
            ]) === true,
        });
      }
    }

    return rotas;
  }

  private normalizarSegmento(valor: string): string {
    return valor.replace(/^\/+/, '').replace(/\/+$/, '');
  }
}
