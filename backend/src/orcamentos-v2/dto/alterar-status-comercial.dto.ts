import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

const STATUS_ACEITOS = [
  'rascunho',
  'pendente',
  'aguardando_alcada',
  'enviada',
  'enviado',
  'em_negociacao',
  'negociando',
  'revisao_solicitada',
  'expirada',
  'aceita',
  'aprovado',
  'pedido_confirmado',
  'perdida',
  'rejeitado',
  'cancelada',
  'cancelado',
] as const;

export class AlterarStatusComercialDto {
  @ApiProperty({ enum: STATUS_ACEITOS })
  @IsString()
  @IsIn(STATUS_ACEITOS)
  status!: string;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observacoes?: string;
}
