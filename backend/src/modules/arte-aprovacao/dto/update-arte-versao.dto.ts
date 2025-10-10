import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ArteStatus } from '@prisma/client';

export class UpdateArteVersaoDto {
  @ApiProperty({
    description: 'Versão da arte',
    example: 'v2',
    required: false
  })
  @IsOptional()
  @IsString()
  versao?: string;

  @ApiProperty({
    description: 'Status da arte',
    enum: ArteStatus,
    example: ArteStatus.ENVIADA_CLIENTE,
    required: false
  })
  @IsOptional()
  @IsEnum(ArteStatus)
  status?: ArteStatus;

  @ApiProperty({
    description: 'Descrição da versão',
    example: 'Segunda versão com ajustes solicitados',
    required: false
  })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiProperty({
    description: 'Observações adicionais',
    example: 'Enviado para aprovação do cliente',
    required: false
  })
  @IsOptional()
  @IsString()
  observacoes?: string;
}

