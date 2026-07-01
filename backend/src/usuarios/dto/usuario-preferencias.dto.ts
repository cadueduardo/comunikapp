import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class AtualizarUsuarioPreferenciasDto {
  @ApiPropertyOptional({
    description: 'Ordem dos itens do menu lateral (ids estáveis)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sidebar_menu_order?: string[];
}

export interface UsuarioPreferenciasJson {
  sidebar_menu_order?: string[];
}
