import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { LogicaConsumoInsumo } from '@prisma/client';

export class CreateTipoMaterialDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsEnum(LogicaConsumoInsumo)
  logica_consumo: LogicaConsumoInsumo;

  @IsOptional()
  parametros_padrao?: any;
}
