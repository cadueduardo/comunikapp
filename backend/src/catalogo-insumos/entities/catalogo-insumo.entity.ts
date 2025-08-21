import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LogicaConsumoInsumo } from '../interfaces';

export class CatalogoInsumoEntity {
  @ApiProperty({ description: 'ID único do insumo' })
  id: string;

  @ApiProperty({ description: 'Código único do insumo no catálogo' })
  codigo_catalogo: string;

  @ApiProperty({ description: 'Nome do insumo' })
  nome: string;

  @ApiPropertyOptional({ description: 'Descrição técnica do insumo' })
  descricao_tecnica?: string;

  @ApiPropertyOptional({ description: 'ID da categoria global' })
  categoria_global_id?: string;

  @ApiPropertyOptional({ description: 'Marca do insumo' })
  marca?: string;

  @ApiPropertyOptional({ description: 'Especificações técnicas em JSON' })
  especificacoes?: Record<string, any>;

  @ApiProperty({ description: 'Unidade de compra (ex: bobina, caixa)' })
  unidade_compra: string;

  @ApiProperty({ description: 'Unidade de uso (ex: metro, cm²)' })
  unidade_uso: string;

  @ApiProperty({ description: 'Fator de conversão entre unidades' })
  fator_conversao: number;

  @ApiPropertyOptional({ description: 'Largura do material' })
  largura?: number;

  @ApiPropertyOptional({ description: 'Altura do material' })
  altura?: number;

  @ApiPropertyOptional({ description: 'Gramatura do material' })
  gramatura?: number;

  @ApiPropertyOptional({ description: 'Unidade da dimensão' })
  unidade_dimensao?: string;

  @ApiPropertyOptional({ description: 'Tipo de cálculo para consumo' })
  tipo_calculo?: string;

  @ApiProperty({ 
    description: 'Lógica de consumo do insumo',
    enum: LogicaConsumoInsumo
  })
  logica_consumo: LogicaConsumoInsumo;

  @ApiProperty({ description: 'Disponibilidade do insumo' })
  disponibilidade: boolean;

  @ApiPropertyOptional({ description: 'Fonte de coleta dos dados' })
  fonte_coleta?: string;

  @ApiProperty({ description: 'Data de coleta dos dados' })
  data_coleta: Date;

  @ApiProperty({ description: 'Data da última atualização' })
  data_atualizacao: Date;

  @ApiProperty({ description: 'Status ativo do insumo' })
  ativo: boolean;

  @ApiProperty({ description: 'Data de criação' })
  created_at: Date;

  @ApiProperty({ description: 'Data da última atualização' })
  updated_at: Date;
}

export class PaginatedResultEntity<T> {
  @ApiProperty({ description: 'Lista de dados' })
  data: T[];

  @ApiProperty({ description: 'Total de registros' })
  total: number;

  @ApiProperty({ description: 'Página atual' })
  page: number;

  @ApiProperty({ description: 'Itens por página' })
  limit: number;

  @ApiProperty({ description: 'Total de páginas' })
  totalPages: number;
}
