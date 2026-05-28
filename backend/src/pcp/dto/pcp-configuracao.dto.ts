import { IsEnum } from 'class-validator';

export enum NivelPCP {
  ESSENCIAL = 'ESSENCIAL',
  ORGANIZADO = 'ORGANIZADO',
  COMPLETO = 'COMPLETO',
}

export class AtualizarConfiguracaoPCPDto {
  @IsEnum(NivelPCP)
  nivel: NivelPCP;
}
