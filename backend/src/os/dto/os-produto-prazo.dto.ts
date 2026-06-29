/**
 * DTOs para gerenciamento de prazo de produtos da OS
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsBoolean,
  MaxLength,
  IsEnum,
} from 'class-validator';

export class DefinirPrazoProdutoDTO {
  @ApiProperty({
    description: 'Data de início da produção',
    example: '2025-12-01T00:00:00.000Z',
    type: 'string',
    format: 'date-time',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  data_inicio_producao?: string;

  @ApiProperty({
    description: 'Data do prazo de produção do produto',
    example: '2025-12-10T00:00:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  @IsDateString()
  data_prazo_produto: string;

  @ApiProperty({
    description: 'Prioridade do produto',
    example: 'NORMAL',
    enum: ['URGENTE', 'ALTA', 'NORMAL', 'BAIXA'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['URGENTE', 'ALTA', 'NORMAL', 'BAIXA'])
  prioridade_produto?: string;

  @ApiProperty({
    description: 'Ordem de produção',
    example: 1,
    required: false,
  })
  @IsOptional()
  ordem_producao?: number;

  @ApiProperty({
    description: 'Motivo da definição/alteração do prazo',
    example: 'Produto prioritário para entrega',
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

export class LiberarProdutoPCPDTO {
  @ApiProperty({
    description: 'Motivo da liberação',
    example: 'Materiais disponíveis e arte aprovada',
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  motivo?: string;
}

export class StatusPrazoProdutoResponse {
  @ApiProperty({
    description: 'ID do produto',
    example: 'item_123',
  })
  item_id: string;

  @ApiProperty({
    description: 'ID original do produto no orçamento (para API de detalhes)',
    example: 'produto_123',
    required: false,
  })
  produto_id?: string;

  @ApiProperty({
    description: 'Nome do produto/serviço',
    example: 'Fachada ACM',
  })
  produto_servico: string;

  @ApiProperty({
    description: 'Data de início da produção',
    example: '2025-12-01T00:00:00.000Z',
    required: false,
  })
  data_inicio_producao?: Date;

  @ApiProperty({
    description: 'Data do prazo do produto',
    example: '2025-12-10T00:00:00.000Z',
    required: false,
  })
  data_prazo_produto?: Date;

  @ApiProperty({
    description: 'Status de liberação para PCP',
    example: 'PENDENTE',
    enum: ['PENDENTE', 'LIBERADO', 'EM_PRODUCAO', 'CONCLUIDO'],
  })
  status_liberacao_pcp: string;

  @ApiProperty({
    description: 'Prioridade do produto',
    example: 'NORMAL',
    enum: ['URGENTE', 'ALTA', 'NORMAL', 'BAIXA'],
  })
  prioridade_produto: string;

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
    example: 'Produto aguardando liberação para PCP',
  })
  mensagem: string;

  @ApiProperty({
    description: 'Se o prazo do produto excede o prazo final da OS',
    example: false,
  })
  excede_prazo_final: boolean;

  @ApiProperty({ required: false })
  responsabilidade_arte?: string;

  @ApiProperty({ required: false })
  status_arte?: string;

  @ApiProperty({ required: false })
  data_prazo_arte?: Date | null;

  @ApiProperty({ required: false })
  designer_atribuido?: { id: string; nome: string } | null;
}

export class ValidarPrazoProdutoResponse {
  @ApiProperty({
    description: 'Se o prazo é válido',
    example: true,
  })
  valido: boolean;

  @ApiProperty({
    description: 'Mensagem de validação',
    example: 'Prazo do produto está dentro do prazo final da OS',
  })
  mensagem: string;

  @ApiProperty({
    description: 'Avisos (não bloqueiam, mas alertam)',
    example: ['Prazo apertado: menos de 3 dias'],
    required: false,
  })
  avisos?: string[];

  @ApiProperty({
    description: 'Erros (bloqueiam a operação)',
    example: [],
    required: false,
  })
  erros?: string[];
}
