import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNotEmpty } from 'class-validator';
import { ArteStatus } from '@prisma/client';

export class CreateArteVersaoDto {
  @ApiProperty({
    description: 'ID da Ordem de Serviço',
    example: 'cmgcbwu3x0002jazo4uotdi8i',
  })
  @IsString()
  @IsNotEmpty()
  os_id: string;

  @ApiProperty({
    description: 'ID do serviço específico (opcional)',
    example: 'cmgjtbm770001japkfygbyztr',
    required: false,
  })
  @IsOptional()
  @IsString()
  servico_id?: string;

  @ApiProperty({
    description: 'Versão da arte',
    example: 'v1',
  })
  @IsString()
  @IsNotEmpty()
  versao: string;

  @ApiProperty({
    description: 'Status da arte',
    enum: ArteStatus,
    example: ArteStatus.RASCUNHO,
  })
  @IsEnum(ArteStatus)
  status: ArteStatus;

  @ApiProperty({
    description: 'Descrição da versão',
    example: 'Primeira versão da arte para fachada',
    required: false,
  })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiProperty({
    description: 'Observações adicionais',
    example: 'Aguardando feedback do cliente',
    required: false,
  })
  @IsOptional()
  @IsString()
  observacoes?: string;
}
