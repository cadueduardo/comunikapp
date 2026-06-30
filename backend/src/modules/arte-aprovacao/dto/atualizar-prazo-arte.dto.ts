import { IsISO8601, IsOptional, ValidateIf } from 'class-validator';

export class AtualizarPrazoArteDto {
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsISO8601()
  data_prazo_arte?: string | null;
}
