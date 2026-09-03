import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { OrcamentoStatus } from '../enums/orcamento-status.enum';
import { OrcamentoTipo } from '../enums/orcamento-tipo.enum';
import { PrioridadeOrcamento } from '../enums/prioridade-orcamento.enum';
import { ProdutoOrcamentoBodyDto } from './produto-orcamento-body.dto';

/**
 * Body tipado de criação/atualização do formulário V2.
 *
 * IDs da loja são `cuid`, não UUID. Campos comerciais e de produto além do
 * DTO canônico antigo são opcionais e explícitos para passar na validação
 * soft (sem forbidNonWhitelisted da pipe global).
 */
export class CriarOrcamentoBodyDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  titulo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  nome_servico?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50000)
  descricao?: string;

  @IsOptional()
  @IsEnum(OrcamentoTipo)
  tipo?: OrcamentoTipo;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  tipo_orcamento?: string;

  @IsOptional()
  @IsEnum(OrcamentoStatus)
  status?: OrcamentoStatus;

  @IsOptional()
  @IsEnum(PrioridadeOrcamento)
  prioridade?: PrioridadeOrcamento;

  /** cuid do cliente (não UUID). */
  @IsOptional()
  @IsString()
  @MaxLength(64)
  cliente_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  contato_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  /** Ignorado na criação: o backend grava o usuário autenticado. */
  responsavel_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50000)
  condicoes_comerciais?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  prazo_entrega?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  validade_proposta?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  condicao_pagamento_tipo?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  condicao_pagamento_entrada_pct?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  condicao_pagamento_parcelas?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50000)
  condicao_pagamento_descricao?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  /** Ignorado na escrita: o backend copia o nome do responsável. */
  atendente?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  comissao_percentual?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  horas_producao?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  custo_material?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  custo_mao_obra?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  custo_indireto?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  custo_total?: number;

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
  preco_final?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  margem_lucro_customizada?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  impostos_customizados?: number;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  tipo_margem_lucro?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  entrega_modalidade_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  entrega_modalidade_nome?: string;

  @IsOptional()
  @IsBoolean()
  entrega_usar_endereco_cliente?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(50000)
  entrega_endereco_snapshot?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  entrega_cep?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  entrega_logradouro?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  entrega_numero?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  entrega_complemento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  entrega_bairro?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  entrega_cidade?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  entrega_estado?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  entrega_prazo_dias?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  entrega_valor_cobrado?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  entrega_custo_estimado?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50000)
  entrega_observacoes?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  largura_produto?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  altura_produto?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  area_produto?: number;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  unidade_medida_produto?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  quantidade_produto?: number;

  @IsOptional()
  configuracoes?: Record<string, unknown>;

  @ApiPropertyOptional({ type: [ProdutoOrcamentoBodyDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProdutoOrcamentoBodyDto)
  produtos?: ProdutoOrcamentoBodyDto[];
}

/** Mesmo contrato do create — update aceita subset. */
export class AtualizarOrcamentoBodyDto extends CriarOrcamentoBodyDto {}
