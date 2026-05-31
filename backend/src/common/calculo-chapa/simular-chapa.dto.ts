import {
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MetodoCobrancaChapa } from './calculo-chapa.types';

export class SimularChapaDto {
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  larguraPeca: number;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  alturaPeca: number;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  quantidade: number;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  larguraChapa: number;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  alturaChapa: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  perdaPercent?: number;

  @IsEnum(MetodoCobrancaChapa)
  metodoCobranca: MetodoCobrancaChapa;

  @IsOptional()
  @IsIn(['mm', 'cm', 'm'])
  unidadeDimensao?: 'mm' | 'cm' | 'm';

  @IsOptional()
  @IsIn(['mm', 'cm', 'm'])
  unidadeDimensaoPeca?: 'mm' | 'cm' | 'm';

  @IsOptional()
  @IsIn(['mm', 'cm', 'm'])
  unidadeDimensaoChapa?: 'mm' | 'cm' | 'm';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  custoM2?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  areaManual?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valorManual?: number;
}
