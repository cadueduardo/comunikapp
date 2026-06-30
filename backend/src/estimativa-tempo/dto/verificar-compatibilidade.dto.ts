import { IsString } from 'class-validator';

export class VerificarCompatibilidadeDto {
  @IsString()
  insumo_id!: string;

  @IsString()
  maquina_id!: string;
}
