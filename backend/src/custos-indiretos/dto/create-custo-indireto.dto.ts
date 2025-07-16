import { IsString, IsNumber, IsBoolean, IsOptional, IsEnum } from 'class-validator';

export enum RegraRateio {
  PROPORCIONAL_TEMPO = 'PROPORCIONAL_TEMPO',
  PROPORCIONAL_VALOR = 'PROPORCIONAL_VALOR',
  FIXO = 'FIXO',
}

export enum CategoriaCustoIndireto {
  LOCACAO = 'LOCACAO',
  SERVICOS = 'SERVICOS',
  MANUTENCAO = 'MANUTENCAO',
  OUTROS = 'OUTROS',
}

export class CreateCustoIndiretoDto {
  @IsString()
  nome: string;

  @IsNumber()
  valor_mensal: number;

  @IsEnum(CategoriaCustoIndireto)
  categoria: CategoriaCustoIndireto;

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;

  @IsEnum(RegraRateio)
  @IsOptional()
  regra_rateio?: RegraRateio;

  @IsString()
  @IsOptional()
  observacoes?: string;
} 