import { IsString, IsOptional, IsNumber, IsDateString, IsBoolean, IsObject, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateOSDto {
  @ApiProperty({
    description: 'ID do cliente',
    example: 'cuid_cliente_123',
  })
  @IsString()
  cliente_id: string;

  @ApiPropertyOptional({
    description: 'ID do orçamento de origem (se criada automaticamente)',
    example: 'cuid_orcamento_123',
  })
  @IsOptional()
  @IsString()
  orcamento_id?: string;

  @ApiProperty({
    description: 'Nome do produto/serviço',
    example: 'Banner 3x2m - Lona 440g',
  })
  @IsString()
  nome_servico: string;

  @ApiPropertyOptional({
    description: 'Descrição detalhada do produto/serviço',
    example: 'Banner promocional com impressão digital full color',
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
    description: 'Parâmetros técnicos do produto (JSON)',
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
    description: 'ID do responsável pela OS',
    example: 'cuid_usuario_123',
  })
  @IsOptional()
  @IsString()
  responsavel_id?: string;

  @ApiPropertyOptional({
    description: 'Observações gerais da OS',
    example: 'Cliente solicitou entrega urgente',
  })
  @IsOptional()
  @IsString()
  observacoes?: string;

  @ApiPropertyOptional({
    description: 'Insumos já calculados (JSON do motor de cálculo)',
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
  @IsObject()
  insumos_calculados?: Array<{
    insumo_id: string;
    nome: string;
    quantidade_necessaria: number;
    unidade: string;
    custo_unitario: number;
    custo_total: number;
  }>;
}
