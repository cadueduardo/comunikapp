import { IsOptional, IsString, MaxLength } from 'class-validator';

export class FecharFechamentoDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observacao?: string;
}
