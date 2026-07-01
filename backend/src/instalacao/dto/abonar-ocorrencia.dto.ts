import { IsInt, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class AbonarOcorrenciaDto {
  @IsInt()
  @Min(0)
  versao: number;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  observacao_gestor: string;
}
