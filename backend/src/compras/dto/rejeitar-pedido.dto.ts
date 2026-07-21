import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RejeitarPedidoDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  motivo?: string;
}
