import { IsBoolean, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import {
  ModeloPrecificacaoArte,
  PoliticaCobrancaArte,
} from '../constants/arte.enums';

export class UpsertConfiguracaoArteDto {
  @IsBoolean()
  ativo: boolean;

  @IsEnum(ModeloPrecificacaoArte)
  modelo_precificacao: ModeloPrecificacaoArte;

  @IsEnum(PoliticaCobrancaArte)
  cobranca_padrao: PoliticaCobrancaArte;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  horas_padrao_criacao: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  horas_padrao_adaptacao: number;

  @IsBoolean()
  exibir_linha_pdf: boolean;

  @IsBoolean()
  permitir_edicao_orcamentista: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  custo_hora_servico?: number;
}
