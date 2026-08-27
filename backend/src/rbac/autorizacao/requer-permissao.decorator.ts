import { SetMetadata } from '@nestjs/common';

export const REQUER_PERMISSAO_KEY = 'requer_permissao_catalogo';

export const RequerPermissao = (...permissoes: string[]) =>
  SetMetadata(REQUER_PERMISSAO_KEY, permissoes);
