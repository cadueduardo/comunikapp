import { IsBoolean, IsOptional } from 'class-validator';

export class AplicarConfiguracaoRecomendadaDto {
  /**
   * Reservado para uma confirmacao explicita do front. Hoje aceitamos
   * `true` como sinalizacao de que o usuario revisou o modal de
   * confirmacao. Default true para nao bloquear scripts internos.
   */
  @IsOptional()
  @IsBoolean()
  confirmar?: boolean;

  /**
   * Quando `true`, sobrescreve valores ja preenchidos na loja (margem,
   * imposto, condicao de pagamento). Default `false`.
   */
  @IsOptional()
  @IsBoolean()
  sobrescrever_existentes?: boolean;
}
