import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CancelarPedidoDto {
  @IsString()
  @IsNotEmpty({ message: 'motivo é obrigatório para cancelar o pedido' })
  @MaxLength(2000)
  motivo: string;
}
