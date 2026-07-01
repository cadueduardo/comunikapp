import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SolicitarArteClienteDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  mensagem?: string;
}
