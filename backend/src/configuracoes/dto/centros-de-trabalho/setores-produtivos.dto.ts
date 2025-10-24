import { IsString, IsOptional, IsBoolean, IsInt, IsHexColor, Min, Max, Length } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateSetorProdutivoDto {
  @IsString()
  @Length(1, 100)
  nome: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  descricao?: string;

  @IsOptional()
  @IsHexColor()
  @Transform(({ value }) => value || '#3B82F6')
  cor?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value ?? true)
  ativo?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(999)
  @Transform(({ value }) => value ?? 0)
  ordem?: number;
}

export class UpdateSetorProdutivoDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  nome?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  descricao?: string;

  @IsOptional()
  @IsHexColor()
  cor?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(999)
  ordem?: number;
}

export class SetorProdutivoQueryDto {
  @IsOptional()
  @IsString()
  lojaId?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  ativo?: boolean;

  @IsOptional()
  @IsString()
  search?: string;
}

