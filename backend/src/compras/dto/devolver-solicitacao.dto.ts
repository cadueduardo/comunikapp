import { IsOptional, IsString, MaxLength } from 'class-validator';

export class DevolverSolicitacaoDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  motivo?: string;
}
