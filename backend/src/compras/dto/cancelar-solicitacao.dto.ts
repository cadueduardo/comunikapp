import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CancelarSolicitacaoDto {
  @IsString()
  @IsNotEmpty({
    message: 'motivo é obrigatório para cancelar a solicitação',
  })
  @MaxLength(2000)
  motivo: string;
}
