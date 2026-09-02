import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export const FAVORITOS_MAXIMO = 6;
export const FAVORITO_ID_REGEX = /^[a-z0-9-]+:[a-z0-9-]+$/;

export class AtualizarUsuarioPreferenciasDto {
  @ApiPropertyOptional({
    description: 'Ordem dos itens do menu lateral (ids estáveis)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sidebar_menu_order?: string[];

  @ApiPropertyOptional({
    description:
      'Atalhos favoritos no formato modulo:item (máximo 6). Ex.: vendas:clientes',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(FAVORITOS_MAXIMO)
  @IsString({ each: true })
  @Matches(FAVORITO_ID_REGEX, { each: true })
  favoritos?: string[];
}

export interface UsuarioPreferenciasJson {
  sidebar_menu_order?: string[];
  favoritos?: string[];
}

export function sanitizarFavoritos(ids: string[]): string[] {
  const vistos = new Set<string>();
  const saida: string[] = [];
  for (const id of ids) {
    if (!FAVORITO_ID_REGEX.test(id)) continue;
    if (vistos.has(id)) continue;
    vistos.add(id);
    saida.push(id);
    if (saida.length >= FAVORITOS_MAXIMO) break;
  }
  return saida;
}

export function favoritosComAcesso(
  ids: string[],
  acesso: Record<string, boolean>,
): string[] {
  return ids.filter((id) => acesso[id.split(':')[0]] === true);
}
