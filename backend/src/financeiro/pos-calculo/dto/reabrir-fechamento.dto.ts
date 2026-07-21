import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ReabrirFechamentoDto {
  @IsString()
  @IsNotEmpty({ message: 'motivo é obrigatório para reabertura' })
  @MaxLength(2000)
  motivo!: string;
}
