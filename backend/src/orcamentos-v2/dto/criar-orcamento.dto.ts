import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsIn,
  IsArray,
  IsDateString,
  IsUUID,
  IsInt,
  MinLength,
  MaxLength,
  Min,
  Max,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrcamentoStatus } from '../enums/orcamento-status.enum';
import { OrcamentoTipo } from '../enums/orcamento-tipo.enum';
import { PrioridadeOrcamento } from '../enums/prioridade-orcamento.enum';
import { PersonalizacaoOrcamentoDto } from './personalizacao-orcamento.dto';

/**
 * DTO para criação de orçamento
 * Validação e documentação Swagger
 */
export class CriarOrcamentoDto {
  @ApiProperty({
    description: 'Título do orçamento',
    example: 'Orçamento para reforma da cozinha',
    minLength: 3,
    maxLength: 200,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  titulo: string;

  @ApiPropertyOptional({
    description: 'Descrição detalhada do orçamento',
    example:
      'Reforma completa da cozinha incluindo móveis, eletrodomésticos e acabamentos',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  descricao?: string;

  @ApiProperty({
    description: 'Tipo do orçamento',
    enum: OrcamentoTipo,
    example: OrcamentoTipo.PRODUTO,
  })
  @IsEnum(OrcamentoTipo)
  tipo: OrcamentoTipo;

  @ApiProperty({
    description: 'Status inicial do orçamento',
    enum: OrcamentoStatus,
    example: OrcamentoStatus.RASCUNHO,
  })
  @IsEnum(OrcamentoStatus)
  status: OrcamentoStatus;

  @ApiProperty({
    description: 'Prioridade do orçamento',
    enum: PrioridadeOrcamento,
    example: PrioridadeOrcamento.MEDIA,
  })
  @IsEnum(PrioridadeOrcamento)
  prioridade: PrioridadeOrcamento;

  @ApiPropertyOptional({
    description: 'ID do cliente (opcional em rascunho)',
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
    example: 15000.0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  valor_total?: number;

  @ApiPropertyOptional({
    description: 'Observações adicionais',
    example: 'Cliente solicitou orçamento com urgência',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacoes?: string;

  @ApiPropertyOptional({
    description: 'Tags para categorização',
    example: ['reforma', 'cozinha', 'urgente'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Configurações específicas do orçamento',
    example: {
      margem_lucro: 25,
      desconto_maximo: 10,
      prazo_entrega: 30,
    },
  })
  @IsOptional()
  configuracoes?: Record<string, any>;
}

/**
 * DTO para produto do orçamento
 */
export class ProdutoOrcamentoDto {
  @ApiProperty({
    description: 'Nome do produto',
    example: 'Mesa de jantar 6 lugares',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nome: string;

  @ApiPropertyOptional({
    description: 'Descrição do produto',
    example: 'Mesa de jantar em madeira maciça com 6 cadeiras',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  descricao?: string;

  @ApiPropertyOptional({
    description: 'Código do produto',
    example: 'MESA-001',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  codigo?: string;

  @ApiPropertyOptional({
    description: 'Categoria do produto',
    example: 'Móveis',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  categoria?: string;

  @ApiProperty({
    description: 'Quantidade do produto',
    example: 1,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  quantidade: number;

  @ApiPropertyOptional({
    description: 'Unidade de medida',
    example: 'unidade',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  unidade_medida?: string;

  @ApiPropertyOptional({
    description: 'Valor unitário',
    example: 1200.0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  valor_unitario?: number;

  @ApiPropertyOptional({
    description: 'Perímetro do produto em milímetros',
    example: 3000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  perimetro_produto?: number;

  // Fase 11: profundidade opcional para produtos 3D (totens, letras caixa, displays).
  // Segue a mesma 'unidade_geometria' do produto. Quando null/undefined, o produto e tratado como 2D.
  @ApiPropertyOptional({
    description:
      'Profundidade do produto (para produtos 3D como totens, letras caixa, displays). Segue a mesma unidade_geometria. Quando ausente, o produto e tratado como 2D.',
    example: 50,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  profundidade?: number;

  @ApiPropertyOptional({
    description: 'Unidade usada para informar a geometria',
    enum: ['mm', 'cm', 'm'],
    example: 'mm',
  })
  @IsOptional()
  @IsIn(['mm', 'cm', 'm'])
  unidade_geometria?: 'mm' | 'cm' | 'm';

  @ApiPropertyOptional({
    description: 'Origem da geometria do produto',
    enum: ['MANUAL', 'IMAGEM', 'PDF', 'DXF'],
    example: 'MANUAL',
  })
  @IsOptional()
  @IsIn(['MANUAL', 'IMAGEM', 'PDF', 'DXF'])
  geometria_origem?: 'MANUAL' | 'IMAGEM' | 'PDF' | 'DXF';

  @ApiPropertyOptional({
    description: 'URL do arquivo de geometria associado ao produto',
    example: '/uploads/geometrias/arquivo.png',
    maxLength: 512,
  })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  arquivo_geometria_url?: string;

  @ApiPropertyOptional({
    description: 'Metadados JSON do arquivo de geometria',
  })
  @IsOptional()
  @IsString()
  arquivo_geometria_metadados?: string;

  @ApiPropertyOptional({
    description: 'Ordem de exibição',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  ordem?: number;

  @ApiPropertyOptional({
    description: 'Tipo do item no orçamento',
    enum: ['SOB_DEMANDA', 'PRODUTO_FINITO'],
    example: 'SOB_DEMANDA',
  })
  @IsOptional()
  @IsIn(['SOB_DEMANDA', 'PRODUTO_FINITO'])
  tipo_item?: 'SOB_DEMANDA' | 'PRODUTO_FINITO';

  @ApiPropertyOptional({
    description: 'ID do produto de prateleira vinculado',
  })
  @IsOptional()
  @IsString()
  produto_finito_id?: string;

  @ApiPropertyOptional({
    description: 'Destino operacional do item',
    enum: ['PICK', 'MAKE', 'HIBRIDO', 'OUTSOURCE'],
  })
  @IsOptional()
  @IsIn(['PICK', 'MAKE', 'HIBRIDO', 'OUTSOURCE'])
  modo_fulfillment?: 'PICK' | 'MAKE' | 'HIBRIDO' | 'OUTSOURCE';

  @ApiPropertyOptional({ description: 'Parceiro escolhido para terceirização' })
  @IsOptional()
  @IsString()
  fornecedor_terceirizado_id?: string;

  @ApiPropertyOptional({
    description: 'Forma como o parceiro informou o custo',
    enum: ['DETALHADO', 'PRECO_FECHADO'],
  })
  @IsOptional()
  @IsIn(['DETALHADO', 'PRECO_FECHADO'])
  terceirizacao_modelo_custo?: 'DETALHADO' | 'PRECO_FECHADO';

  @ApiPropertyOptional({
    description: 'Quantidade considerada na cotação de preço fechado',
  })
  @IsOptional()
  @IsNumber()
  @Min(0.001)
  terceirizacao_quantidade_cotada?: number;

  @ApiPropertyOptional({ description: 'Custo unitário cotado pelo parceiro' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  terceirizacao_custo_unitario?: number;

  @ApiPropertyOptional({ description: 'Custo de preparação/setup do parceiro' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  terceirizacao_custo_setup?: number;

  @ApiPropertyOptional({ description: 'Frete previsto da terceirização' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  terceirizacao_custo_frete?: number;

  @ApiPropertyOptional({ description: 'Custo total terceirizado congelado no orçamento' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  terceirizacao_custo_total?: number;

  @ApiPropertyOptional({ description: 'Prazo informado pelo parceiro, em dias' })
  @IsOptional()
  @IsInt()
  @Min(0)
  terceirizacao_prazo_dias?: number;

  @ApiPropertyOptional({ description: 'Observações internas da terceirização' })
  @IsOptional()
  @IsString()
  @MaxLength(50000)
  terceirizacao_observacoes?: string;

  @ApiPropertyOptional({
    description: 'Responsável pela instalação do produto',
    enum: ['EQUIPE_INTERNA', 'PARCEIRO_PRODUCAO', 'OUTRO_PARCEIRO'],
  })
  @IsOptional()
  @IsIn(['EQUIPE_INTERNA', 'PARCEIRO_PRODUCAO', 'OUTRO_PARCEIRO'])
  instalacao_executor_tipo?:
    | 'EQUIPE_INTERNA'
    | 'PARCEIRO_PRODUCAO'
    | 'OUTRO_PARCEIRO';

  @ApiPropertyOptional({ description: 'Parceiro responsável pela instalação' })
  @IsOptional()
  @IsString()
  instalacao_fornecedor_id?: string;

  @ApiPropertyOptional({
    description: 'Indica que a instalação já está incluída na cotação do parceiro',
  })
  @IsOptional()
  @IsBoolean()
  instalacao_incluida_cotacao?: boolean;

  @ApiPropertyOptional({
    enum: ['ENDERECO_UNICO', 'MULTIPLOS_ENDERECOS', 'A_DEFINIR'],
    description: 'Previsão comercial de distribuição da instalação; os lotes são definidos no módulo de Instalação',
  })
  @IsOptional()
  @IsIn(['ENDERECO_UNICO', 'MULTIPLOS_ENDERECOS', 'A_DEFINIR'])
  instalacao_distribuicao?:
    | 'ENDERECO_UNICO'
    | 'MULTIPLOS_ENDERECOS'
    | 'A_DEFINIR';

  @ApiPropertyOptional({
    description: 'Como o produto chegará ao cliente',
    enum: [
      'RETIRADA_CLIENTE',
      'ENTREGA_EMPRESA',
      'EQUIPE_INSTALACAO',
      'ENTREGA_ANTES_INSTALACAO',
      'PARCEIRO_DIRETO',
    ],
  })
  @IsOptional()
  @IsIn([
    'RETIRADA_CLIENTE',
    'ENTREGA_EMPRESA',
    'EQUIPE_INSTALACAO',
    'ENTREGA_ANTES_INSTALACAO',
    'PARCEIRO_DIRETO',
  ])
  logistica_modo?: string;

  @IsOptional()
  @IsString()
  entrega_produto_modalidade_id?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  entrega_produto_prazo_dias?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  entrega_produto_valor_cobrado?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  entrega_produto_custo_estimado?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50000)
  entrega_produto_observacoes?: string;

  @ApiPropertyOptional({
    description: 'SKU snapshot do produto de prateleira',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  sku_snapshot?: string;

  @ApiPropertyOptional({
    description: 'Personalização do item (estampa, VDP, grade)',
    type: PersonalizacaoOrcamentoDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PersonalizacaoOrcamentoDto)
  personalizacao?: PersonalizacaoOrcamentoDto;
}

/**
 * DTO para criação de orçamento com produtos
 */
export class CriarOrcamentoComProdutosDto extends CriarOrcamentoDto {
  @ApiPropertyOptional({
    description: 'Lista de produtos do orçamento',
    type: [ProdutoOrcamentoDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProdutoOrcamentoDto)
  produtos?: ProdutoOrcamentoDto[];
}
