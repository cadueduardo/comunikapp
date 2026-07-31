import { SetMetadata } from '@nestjs/common';
import { VendasPermissao } from './vendas-permissoes';

export const REQUER_PERMISSAO_VENDAS = 'requer_permissao_vendas';

/**
 * Declara qual permissão comercial o endpoint exige. Várias permissões são
 * avaliadas como "qualquer uma".
 *
 * Diferente de `@Roles`, esta metadata é efetivamente consumida pelo
 * `VendasPermissionsGuard`. Endpoint sem esta declaração e sem `@Public()` é
 * negado.
 */
export const RequerPermissaoVendas = (...permissoes: VendasPermissao[]) =>
  SetMetadata(REQUER_PERMISSAO_VENDAS, permissoes);
