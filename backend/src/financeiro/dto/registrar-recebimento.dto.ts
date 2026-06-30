import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MaxLength,
} from 'class-validator';
import { RecebimentoMetodo } from '../enums/cobranca-status.enum';

/**
 * DTO para registrar um recebimento manual contra uma cobranca/parcela.
 *
 * Regras:
 * - `valor` precisa ser positivo e nunca exceder o `valor_saldo` da parcela
 *   (validacao em servico, nao no DTO, porque depende do banco).
 * - Se nao passar `parcela_id`, o servico aplica na proxima parcela em aberto
 *   (PARCIAL_PAGO ou PREVISTO mais antiga).
 */
export class RegistrarRecebimentoDto {
  @IsOptional()
  @IsString()
  parcela_id?: string;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'valor deve ter no maximo 2 casas decimais' },
  )
  @Min(0.01, { message: 'valor deve ser maior que zero' })
  @Type(() => Number)
  valor!: number;

  @IsDateString({}, { message: 'data_recebimento deve ser data ISO 8601' })
  data_recebimento!: string;

  @IsEnum(RecebimentoMetodo, { message: 'metodo invalido' })
  metodo!: RecebimentoMetodo;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacoes?: string;

  /**
   * Acao sensivel: marca recebimento mesmo sem comprovacao real.
   * Requer permissao `financeiro.forcar_recebimento_total`.
   */
  @IsOptional()
  @IsBoolean()
  forcado?: boolean;
}
