import { 
  IsString, 
  IsOptional, 
  IsNumber, 
  IsEnum, 
  IsArray, 
  IsDateString, 
  IsUUID,
  MinLength,
  MaxLength,
  Min,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrcamentoStatus } from '../enums/orcamento-status.enum';
import { OrcamentoTipo } from '../enums/orcamento-tipo.enum';
import { PrioridadeOrcamento } from '../enums/prioridade-orcamento.enum';

/**
 * DTO para atualização de orçamento
 * Todos os campos são opcionais para permitir atualizações parciais
 */
export class AtualizarOrcamentoDto {
  @ApiPropertyOptional({
    description: 'Título do orçamento',
    example: 'Orçamento para reforma da cozinha - Atualizado',
    minLength: 3,
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  titulo?: string;

  @ApiPropertyOptional({
    description: 'Descrição detalhada do orçamento',
    example: 'Reforma completa da cozinha incluindo móveis, eletrodomésticos, acabamentos e iluminação',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  descricao?: string;

  @ApiPropertyOptional({
    description: 'Tipo do orçamento',
    enum: OrcamentoTipo,
    example: OrcamentoTipo.PRODUTO,
  })
  @IsOptional()
  @IsEnum(OrcamentoTipo)
  tipo?: OrcamentoTipo;

  @ApiPropertyOptional({
    description: 'Status do orçamento',
    enum: OrcamentoStatus,
    example: OrcamentoStatus.EM_ANALISE,
  })
  @IsOptional()
  @IsEnum(OrcamentoStatus)
  status?: OrcamentoStatus;

  @ApiPropertyOptional({
    description: 'Prioridade do orçamento',
    enum: PrioridadeOrcamento,
    example: PrioridadeOrcamento.ALTA,
  })
  @IsOptional()
  @IsEnum(PrioridadeOrcamento)
  prioridade?: PrioridadeOrcamento;

  @ApiPropertyOptional({
    description: 'ID do cliente',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  cliente_id?: string;

  @ApiPropertyOptional({
    description: 'ID do responsável pelo orçamento',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  responsavel_id?: string;

  @ApiPropertyOptional({
    description: 'Data de entrega prevista',
    example: '2024-12-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsDateString()
  data_entrega_prevista?: string;

  @ApiPropertyOptional({
    description: 'Valor total estimado',
    example: 18000.00,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  valor_total?: number;

  @ApiPropertyOptional({
    description: 'Observações adicionais',
    example: 'Cliente solicitou orçamento com urgência máxima',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacoes?: string;

  @ApiPropertyOptional({
    description: 'Tags para categorização',
    example: ['reforma', 'cozinha', 'urgente', 'luxo'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Configurações específicas do orçamento',
    example: {
      margem_lucro: 30,
      desconto_maximo: 15,
      prazo_entrega: 25,
      incluir_garantia: true,
    },
  })
  @IsOptional()
  configuracoes?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Indica se o orçamento está ativo',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @ApiPropertyOptional({
    description: 'Tipo de orçamento (legado)',
    example: 'produto_servico',
  })
  @IsOptional()
  @IsString()
  tipo_orcamento?: string;

  @ApiPropertyOptional({
    description: 'Custo total calculado',
    example: 15000.00,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  custo_total?: number;

  @ApiPropertyOptional({
    description: 'Margem de lucro calculada',
    example: 4500.00,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  margem_lucro?: number;

  @ApiPropertyOptional({
    description: 'Impostos calculados',
    example: 3750.00,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  impostos?: number;

  @ApiPropertyOptional({
    description: 'Produtos do orçamento',
    type: 'array',
    items: { type: 'object' },
  })
  @IsOptional()
  @IsArray()
  produtos?: any[];
}

/**
 * DTO para alteração de status
 */
export class AlterarStatusDto {
  @ApiProperty({
    description: 'Novo status do orçamento',
    enum: OrcamentoStatus,
    example: OrcamentoStatus.APROVADO,
  })
  @IsEnum(OrcamentoStatus)
  status: OrcamentoStatus;

  @ApiPropertyOptional({
    description: 'Observação sobre a mudança de status',
    example: 'Orçamento aprovado pelo cliente após revisão dos valores',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacao?: string;

  @ApiPropertyOptional({
    description: 'Data da mudança de status',
    example: '2024-01-15T10:30:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  data_mudanca?: string;
}

/**
 * DTO para filtros de busca
 */
export class FiltrosOrcamentoDto {
  @ApiPropertyOptional({
    description: 'Status dos orçamentos',
    enum: OrcamentoStatus,
    isArray: true,
    example: [OrcamentoStatus.EM_ANALISE, OrcamentoStatus.APROVADO],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(OrcamentoStatus, { each: true })
  status?: OrcamentoStatus[];

  @ApiPropertyOptional({
    description: 'Tipos dos orçamentos',
    enum: OrcamentoTipo,
    isArray: true,
    example: [OrcamentoTipo.PRODUTO, OrcamentoTipo.SERVICO],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(OrcamentoTipo, { each: true })
  tipo?: OrcamentoTipo[];

  @ApiPropertyOptional({
    description: 'Prioridades dos orçamentos',
    enum: PrioridadeOrcamento,
    isArray: true,
    example: [PrioridadeOrcamento.ALTA, PrioridadeOrcamento.MEDIA],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(PrioridadeOrcamento, { each: true })
  prioridade?: PrioridadeOrcamento[];

  @ApiPropertyOptional({
    description: 'ID do cliente',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  cliente_id?: string;

  @ApiPropertyOptional({
    description: 'ID do responsável',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  responsavel_id?: string;

  @ApiPropertyOptional({
    description: 'Data de início para filtro',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  data_inicio?: string;

  @ApiPropertyOptional({
    description: 'Data de fim para filtro',
    example: '2024-12-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsDateString()
  data_fim?: string;

  @ApiPropertyOptional({
    description: 'Valor mínimo',
    example: 1000.00,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  valor_min?: number;

  @ApiPropertyOptional({
    description: 'Valor máximo',
    example: 50000.00,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  valor_max?: number;

  @ApiPropertyOptional({
    description: 'Termo de busca',
    example: 'cozinha',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  busca?: string;
}

/**
 * DTO para paginação
 */
export class PaginacaoDto {
  @ApiPropertyOptional({
    description: 'Número da página',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  pagina?: number = 1;

  @ApiPropertyOptional({
    description: 'Itens por página',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  por_pagina?: number = 20;
}
