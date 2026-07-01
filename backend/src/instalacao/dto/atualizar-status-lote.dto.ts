import { IsEnum } from 'class-validator';
import { StatusInstalacao } from '@prisma/client';

export class AtualizarStatusLoteDto {
  @IsEnum(StatusInstalacao, {
    message: 'status_instalacao inválido.',
  })
  status_instalacao: StatusInstalacao;
}
