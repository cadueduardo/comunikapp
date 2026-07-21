import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RejeitarSolicitacaoDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  motivo?: string;
}
