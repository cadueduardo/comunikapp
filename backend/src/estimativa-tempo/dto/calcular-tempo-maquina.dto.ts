import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CalcularTempoMaquinaDto {
  @IsString()
  maquina_id!: string;

  @IsNumber()
  @Min(0.001)
  quantidade!: number;

  /** Área em m² de UMA peça. Necessária quando modo = M2_H. */
  @IsOptional()
  @IsNumber()
  @Min(0)
  area_m2?: number;

  /** Perímetro em milímetros de UMA peça. Necessário quando modo = ML_H. */
  @IsOptional()
  @IsNumber()
  @Min(0)
  perimetro_mm?: number;
}
