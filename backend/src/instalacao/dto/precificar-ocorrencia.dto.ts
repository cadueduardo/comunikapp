import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class PrecificarOcorrenciaDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  custo_interno: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  preco_cliente: number;

  @IsInt()
  @Min(0)
  versao: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observacao_gestor?: string;
}
