import {
  OrigemNecessidadeCompra,
  PrioridadeCompra,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { SolicitacaoItemDto } from './solicitacao-item.dto';

export class CreateSolicitacaoDto {
  @IsOptional()
  @IsEnum(PrioridadeCompra, {
    message: 'prioridade inválida',
  })
  prioridade?: PrioridadeCompra;

  @IsOptional()
  @IsEnum(OrigemNecessidadeCompra, {
    message: 'origem_tipo inválida',
  })
  origem_tipo?: OrigemNecessidadeCompra;

  @IsOptional()
  @IsString()
  origem_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  justificativa?: string;

  @IsOptional()
  @IsDateString({}, { message: 'data_necessaria deve ser uma data válida' })
  data_necessaria?: string;

  @IsArray({ message: 'itens deve ser uma lista' })
  @ArrayMinSize(1, { message: 'Informe ao menos um item na solicitação' })
  @ValidateNested({ each: true })
  @Type(() => SolicitacaoItemDto)
  itens: SolicitacaoItemDto[];
}
