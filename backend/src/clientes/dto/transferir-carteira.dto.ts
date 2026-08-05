import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Transferência de responsável comercial (RP §5.2.1). `para_usuario_id` é
 * validado no service contra a MESMA loja e usuário ativo — nunca confiar
 * apenas na presença do campo.
 */
export class TransferirCarteiraDto {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  para_usuario_id: string;

  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MinLength(3, { message: 'Informe o motivo da transferência (mínimo 3 caracteres).' })
  @MaxLength(500)
  motivo: string;

  /**
   * Chave de idempotência gerada pelo cliente (frontend) por tentativa de
   * transferência. Repetir a mesma chave para o MESMO cliente retorna o
   * resultado já processado em vez de duplicar o histórico — cobre duplo
   * clique e retry de rede.
   */
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MinLength(8)
  @MaxLength(200)
  chave_operacao: string;
}
