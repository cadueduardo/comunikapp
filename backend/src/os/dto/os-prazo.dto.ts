/**
 * DTOs para gerenciamento de prazo da OS
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsBoolean,
  MaxLength,
} from 'class-validator';

export class DefinirPrazoDTO {
  @ApiProperty({
    description: 'Data do prazo de produção',
    example: '2025-12-15T00:00:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  @IsDateString()
  data_prazo: string;

  @ApiProperty({
    description: 'Motivo da definição/alteração do prazo',
    example: 'Cliente solicitou antecipação da entrega',
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  motivo?: string;

  @ApiProperty({
    description: 'Confirmação para datas retroativas',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  confirmar_retroativa?: boolean;
}

export class LogPrazoRetroativoDTO {
  @ApiProperty({
    description: 'ID da OS',
    example: 'cmgcbwu3x0002jazo4uotdi8i',
  })
  @IsString()
  os_id: string;

  @ApiProperty({
    description: 'ID do usuário que definiu o prazo',
    example: 'wzutso1xj',
  })
  @IsString()
  usuario_id: string;

  @ApiProperty({
    description: 'Data definida pelo usuário',
    example: '2025-10-01T00:00:00.000Z',
  })
  @IsDateString()
  data_definida: string;

  @ApiProperty({
    description: 'Data atual quando o prazo foi definido',
    example: '2025-10-09T12:00:00.000Z',
  })
  @IsDateString()
  data_atual: string;

  @ApiProperty({
    description: 'Motivo informado pelo usuário',
    example: 'Correção de data após erro de digitação',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  motivo?: string;

  @ApiProperty({
    description: 'IP de origem da requisição',
    example: '192.168.1.100',
  })
  @IsOptional()
  @IsString()
  ip_origem?: string;

  @ApiProperty({
    description: 'User Agent do navegador',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  })
  @IsOptional()
  @IsString()
  user_agent?: string;
}

export class StatusPrazoResponse {
  @ApiProperty({
    description: 'ID da OS',
    example: 'cmgcbwu3x0002jazo4uotdi8i',
  })
  os_id: string;

  @ApiProperty({
    description: 'Data do prazo definida',
    example: '2025-12-15T00:00:00.000Z',
    required: false,
  })
  data_prazo?: Date;

  @ApiProperty({
    description: 'Status do prazo',
    example: 'SEM_PRAZO',
    enum: ['SEM_PRAZO', 'AGUARDANDO_INICIO', 'PRONTA_PRODUCAO', 'EM_PRODUCAO'],
  })
  status: 'SEM_PRAZO' | 'AGUARDANDO_INICIO' | 'PRONTA_PRODUCAO' | 'EM_PRODUCAO';

  @ApiProperty({
    description: 'Dias restantes até o prazo',
    example: 5,
    required: false,
  })
  dias_restantes?: number;

  @ApiProperty({
    description: 'Se o prazo é retroativo',
    example: false,
  })
  is_retroativo: boolean;

  @ApiProperty({
    description: 'Mensagem descritiva do status',
    example: 'OS aguardando início da produção',
  })
  mensagem: string;
}
