import { IsString, IsOptional, IsNumber, IsDateString, IsBoolean, IsObject, Min, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { TipoOS, OrigemOS, PrioridadeOS, StatusAprovacao } from '../interfaces/os-direta-interna.interface';

export class CreateOSDto {
  @ApiProperty({
    description: 'Tipo da OS',
    example: 'COMERCIAL',
    enum: TipoOS,
  })
  @IsEnum(TipoOS)
  tipo_os: TipoOS;

  @ApiPropertyOptional({
    description: 'Origem da OS',
    example: 'ORCAMENTO',
    enum: OrigemOS,
  })
  @IsOptional()
  @IsEnum(OrigemOS)
  origem_os?: OrigemOS;

  @ApiPropertyOptional({
    description: 'Prioridade da OS',
    example: 'NORMAL',
    enum: PrioridadeOS,
    default: 'NORMAL',
  })
  @IsOptional()
  @IsEnum(PrioridadeOS)
  prioridade?: PrioridadeOS;

  @ApiPropertyOptional({
    description: 'ID do cliente (obrigatório para OS Comercial)',
    example: 'cuid_cliente_123',
  })
  @IsOptional()
  @IsString()
  cliente_id?: string;

  @ApiPropertyOptional({
    description: 'ID do orcamento de origem (se criada automaticamente)',
    example: 'cuid_orcamento_123',
  })
  @IsOptional()
  @IsString()
  orcamento_id?: string;

  @ApiProperty({
    description: 'Nome do produto/servico',
    example: 'Banner 3x2m - Lona 440g',
  })
  @IsString()
  nome_servico: string;

  @ApiPropertyOptional({
    description: 'Descricao detalhada do produto/servico',
    example: 'Banner promocional com impressao digital full color',
  })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiProperty({
    description: 'Quantidade a ser produzida',
    example: 2,
    minimum: 0.001,
  })
  @IsNumber()
  @Min(0.001)
  @Transform(({ value }) => parseFloat(value))
  quantidade: number;

  @ApiPropertyOptional({
    description: 'Parametros tecnicos do produto (JSON)',
    example: {
      largura: 3.0,
      altura: 2.0,
      area: 6.0,
      unidade_medida: 'm2',
      cores: ['#FF0000', '#00FF00'],
      acabamento: 'corte reto',
    },
  })
  @IsOptional()
  @IsObject()
  parametros_tecnicos?: {
    largura?: number;
    altura?: number;
    area?: number;
    unidade_medida?: string;
    cores?: string[];
    acabamento?: string;
    material?: string;
    observacoes_tecnicas?: string;
    [key: string]: any;
  };

  @ApiPropertyOptional({
    description: 'Data limite para entrega',
    example: '2025-10-15T10:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  data_prazo?: string;

  @ApiPropertyOptional({
    description: 'ID do responsavel pela OS',
    example: 'cuid_usuario_123',
  })
  @IsOptional()
  @IsString()
  responsavel_id?: string;

  @ApiPropertyOptional({
    description: 'Observacoes gerais da OS',
    example: 'Cliente solicitou entrega urgente',
  })
  @IsOptional()
  @IsString()
  observacoes?: string;

  @ApiPropertyOptional({
    description: 'Insumos ja calculados (JSON do motor de calculo)',
    example: [
      {
        insumo_id: 'cuid_insumo_123',
        nome: 'Lona 440g',
        quantidade_necessaria: 6.5,
        unidade: 'm2',
        custo_unitario: 15.50,
        custo_total: 100.75,
      },
    ],
  })
  @IsOptional()
  insumos_calculados?: string | Array<{
    insumo_id: string;
    nome: string;
    quantidade_necessaria: number;
    unidade: string;
    custo_unitario: number;
    custo_total: number;
  }>;

  // Campos específicos de OS Interna
  @ApiPropertyOptional({
    description: 'Departamento solicitante (obrigatório para OS Interna)',
    example: 'TI',
  })
  @IsOptional()
  @IsString()
  departamento_solicitante?: string;

  @ApiPropertyOptional({
    description: 'Centro de custo (obrigatório para OS Interna)',
    example: 'CC-001',
  })
  @IsOptional()
  @IsString()
  centro_custo?: string;

  @ApiPropertyOptional({
    description: 'Projeto interno',
    example: 'PROJ-2024-001',
  })
  @IsOptional()
  @IsString()
  projeto_interno?: string;

  @ApiPropertyOptional({
    description: 'Status de aprovação gerencial',
    example: 'PENDENTE',
    enum: StatusAprovacao,
    default: 'PENDENTE',
  })
  @IsOptional()
  @IsEnum(StatusAprovacao)
  aprovacao_gerencial?: StatusAprovacao;

  @ApiPropertyOptional({
    description: 'Aprovado por (usuário)',
    example: 'cuid_usuario_123',
  })
  @IsOptional()
  @IsString()
  aprovacao_gerencial_por?: string;

  @ApiPropertyOptional({
    description: 'Data da aprovação gerencial',
    example: '2025-10-01T10:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  aprovacao_gerencial_em?: string;

  @ApiPropertyOptional({
    description: 'Observações da aprovação gerencial',
    example: 'Aprovado com ressalvas',
  })
  @IsOptional()
  @IsString()
  aprovacao_gerencial_obs?: string;

  // Campos específicos de OS Comercial
  @ApiPropertyOptional({
    description: 'Valor orçado (para OS Comercial)',
    example: 1500.00,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  valor_orcado?: number;

  @ApiPropertyOptional({
    description: 'Valor realizado (para OS Comercial)',
    example: 1450.00,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  valor_realizado?: number;

  @ApiPropertyOptional({
    description: 'Margem de lucro real (para OS Comercial)',
    example: 0.15,
  })
  @IsOptional()
  @IsNumber()
  margem_lucro_real?: number;

  @ApiPropertyOptional({
    description: 'Data de entrega ao cliente',
    example: '2025-10-15T10:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  data_entrega_cliente?: string;

  @ApiPropertyOptional({
    description: 'Satisfação do cliente (1-5)',
    example: 4,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  satisfacao_cliente?: number;

  @ApiPropertyOptional({
    description: 'Observações do cliente',
    example: 'Produto entregue conforme esperado',
  })
  @IsOptional()
  @IsString()
  observacoes_cliente?: string;

  // Campos de auditoria
  @ApiPropertyOptional({
    description: 'Usuário que criou a OS',
    example: 'cuid_usuario_123',
  })
  @IsOptional()
  @IsString()
  criado_por?: string;

  @ApiPropertyOptional({
    description: 'Usuário que modificou a OS',
    example: 'cuid_usuario_456',
  })
  @IsOptional()
  @IsString()
  modificado_por?: string;

  @ApiPropertyOptional({
    description: 'Motivo da modificação',
    example: 'Ajuste de prazo solicitado pelo cliente',
  })
  @IsOptional()
  @IsString()
  motivo_modificacao?: string;

  @ApiPropertyOptional({
    description: 'Versão da OS',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  versao?: number;
}
