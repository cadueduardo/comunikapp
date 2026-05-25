import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelarCobrancaDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  motivo?: string;
}
