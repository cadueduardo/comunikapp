import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Transferência do responsável do orçamento. `para_usuario_id` é revalidado
 * no service contra a mesma loja e usuário comercial ativo — nunca confiar
 * só na presença do campo.
 */
export class TransferirOrcamentoDto {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  para_usuario_id: string;

  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MinLength(3, {
    message: 'Informe o motivo da transferência (mínimo 3 caracteres).',
  })
  @MaxLength(500)
  motivo: string;

  /**
   * Chave de idempotência gerada pelo cliente por tentativa. Repetir a mesma
   * chave no mesmo orçamento devolve o resultado já processado.
   */
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MinLength(8)
  @MaxLength(200)
  chave_operacao: string;
}
