import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class PermissaoPerfilDto {
  @IsString()
  @MinLength(2)
  @MaxLength(64)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Módulo de permissão inválido.',
  })
  modulo!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  @Matches(/^[a-z0-9._-]+$/, {
    message: 'Ação de permissão inválida.',
  })
  acao!: string;

  @IsBoolean()
  permitido!: boolean;
}

export class CreatePerfilAcessoDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  nome!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  descricao?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => PermissaoPerfilDto)
  permissoes?: PermissaoPerfilDto[];
}

export class UpdatePerfilAcessoDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  nome?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  descricao?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  versao?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => PermissaoPerfilDto)
  permissoes?: PermissaoPerfilDto[];
}
