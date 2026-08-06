import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PrecificarOcorrenciaDto {
  @ApiProperty({
    description: 'ID da ocorrência operacional registrada na instalação/operação',
    example: 'ocorrencia-uuid-123',
  })
  @IsString()
  ocorrencia_id: string;

  @ApiProperty({
    description: 'Valor cobrado comercialmente para o aditivo em Reais (BRL)',
    example: 150.0,
  })
  @IsNumber()
  @Min(0)
  valor_cobrado: number;

  @ApiPropertyOptional({
    description: 'Justificativa da precificação comercial ou motivo de abono',
    example: 'Deslocamento extra acordado com cliente',
  })
  @IsOptional()
  @IsString()
  justificativa?: string;
}
