import { PartialType } from '@nestjs/mapped-types';
import { CreateInsumoDto } from './create-insumo.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateInsumoDto extends PartialType(CreateInsumoDto) {
  @IsOptional()
  @IsString()
  motivo_alteracao_preco?: string;
} 