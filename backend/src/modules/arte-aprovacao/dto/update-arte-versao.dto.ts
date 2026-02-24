import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ArteStatus } from '@prisma/client';

export class UpdateArteVersaoDto {
  @ApiProperty({
    description: 'Versão da arte',
    example: 'v2',
    required: false,
  })
  @IsOptional()
  @IsString()
  versao?: string;

  @ApiProperty({
    description: 'Status da arte',
    enum: ArteStatus,
    example: ArteStatus.ENVIADA_CLIENTE,
    required: false,
  })
  @IsOptional()
  @IsEnum(ArteStatus)
  status?: ArteStatus;

  @ApiProperty({
    description: 'Descrição da versão',
    example: 'Segunda versão com ajustes solicitados',
    required: false,
  })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiProperty({
    description: 'Observações adicionais',
    example: 'Enviado para aprovação do cliente',
    required: false,
  })
  @IsOptional()
  @IsString()
  observacoes?: string;

  @ApiProperty({
    description: 'Indica se foi aprovado pelo cliente',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  aprovado_por_cliente?: boolean;

  @ApiProperty({
    description: 'Indica se foi liberado para PCP',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  liberado_para_pcp?: boolean;

  @ApiProperty({
    description: 'Data em que foi liberado para PCP',
    example: new Date(),
    required: false,
  })
  @IsOptional()
  liberado_em?: Date;

  @ApiProperty({
    description: 'ID do usuário que liberou para PCP',
    example: 'user123',
    required: false,
  })
  @IsOptional()
  @IsString()
  liberado_por?: string;
}
