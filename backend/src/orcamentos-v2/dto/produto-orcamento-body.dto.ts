import { OmitType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min, MinLength, ValidateNested } from 'class-validator';
import { ProdutoOrcamentoDto } from './criar-orcamento.dto';
import { FinalidadeAnexo, OrigemItemServicoManual, PoliticaCobrancaArte, ResponsabilidadeArte } from '../../modules/arte-aprovacao/constants/arte.enums';

export class InsumoOrcamentoBodyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  insumo_id: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  item_insumo_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  fornecedor_previsto_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  fornecedor_nome_snapshot?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  codigo_ref_snapshot?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  unidade?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  unidade_medida_material?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  quantidade?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  preco_compra_snapshot?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  preco_unitario?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  preco_total?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  largura_material?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  altura_material?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  profundidade_material?: number;

  @IsOptional()
  @IsBoolean()
  material_do_cliente?: boolean;

  @IsOptional()
  @IsBoolean()
  usa_medida_propria?: boolean;
}

export class TempoOrcamentoBodyDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  tempo_horas?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  custo_hora?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  custo_total?: number;
}

export class MaquinaOrcamentoBodyDto extends TempoOrcamentoBodyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  maquina_id: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  horas_utilizadas?: number;
}

export class FuncaoOrcamentoBodyDto extends TempoOrcamentoBodyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  funcao_id: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  horas_trabalhadas?: number;
}

export class ServicoOrcamentoBodyDto extends TempoOrcamentoBodyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  servico_id: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  horas_trabalhadas?: number;

  @IsOptional()
  @IsEnum(OrigemItemServicoManual)
  origem?: OrigemItemServicoManual;

  @IsOptional()
  @IsBoolean()
  exibir_no_pdf?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(50000)
  descricao?: string;
}

export class CustoIndiretoOrcamentoBodyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  custo_id: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  percentual?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  valor_fixo?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  custo_total?: number;
}

export class ProdutoOrcamentoBodyDto extends OmitType(ProdutoOrcamentoDto, ['descricao'] as const) {
  @IsOptional()
  @IsString()
  @MaxLength(50000)
  descricao?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  nome_servico?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  unidade?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50000)
  observacoes?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  largura?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  altura?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  area?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  area_produto?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  custo_total_producao?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  preco_unitario?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  preco_total?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  margem_lucro?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  impostos?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  horas_producao?: number;

  @IsOptional()
  @IsEnum(ResponsabilidadeArte)
  responsabilidade_arte?: ResponsabilidadeArte;

  @IsOptional()
  @IsEnum(PoliticaCobrancaArte)
  politica_cobranca_arte?: PoliticaCobrancaArte;

  @IsOptional()
  @IsEnum(FinalidadeAnexo)
  finalidade_anexo?: FinalidadeAnexo;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  complexidade_arte?: string;

  @IsOptional()
  @IsBoolean()
  arte_custo_automatico?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  arte_referencia_servico_id?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  arte_horas_calculadas?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  arte_custo_calculado?: number;

  @IsOptional()
  @IsBoolean()
  instalacao_necessaria?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  instalacao_tipo_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  instalacao_regra_cobranca?: string;

  @IsOptional()
  @IsBoolean()
  instalacao_usar_endereco_entrega?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(50000)
  instalacao_endereco_snapshot?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  instalacao_cep?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  instalacao_logradouro?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  instalacao_numero?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  instalacao_complemento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  instalacao_bairro?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  instalacao_cidade?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  instalacao_estado?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50000)
  instalacao_observacoes?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  instalacao_valor_unitario?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  instalacao_preco_cobrado?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  instalacao_custo_mao_obra?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  instalacao_custo_deslocamento?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  instalacao_tempo_estimado_min?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  instalacao_quantidade_pessoas?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InsumoOrcamentoBodyDto)
  insumos?: InsumoOrcamentoBodyDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MaquinaOrcamentoBodyDto)
  maquinas?: MaquinaOrcamentoBodyDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FuncaoOrcamentoBodyDto)
  funcoes?: FuncaoOrcamentoBodyDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServicoOrcamentoBodyDto)
  servicos_manuais?: ServicoOrcamentoBodyDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustoIndiretoOrcamentoBodyDto)
  custos_indiretos?: CustoIndiretoOrcamentoBodyDto[];
}

