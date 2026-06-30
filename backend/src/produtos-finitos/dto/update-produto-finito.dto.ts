import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { FulfillmentPadrao, ModoPersonalizacao } from '@prisma/client';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { CreateProdutoFinitoDto } from './create-produto-finito.dto';

export class UpdateProdutoFinitoDto extends PartialType(
  CreateProdutoFinitoDto,
) {
  @ApiPropertyOptional({
    description: 'Habilita personalização na venda deste SKU',
  })
  @IsOptional()
  @IsBoolean()
  personalizavel?: boolean;

  @ApiPropertyOptional({ enum: FulfillmentPadrao })
  @IsOptional()
  @IsEnum(FulfillmentPadrao)
  fulfillment_padrao?: FulfillmentPadrao;

  @ApiPropertyOptional({
    enum: ModoPersonalizacao,
    isArray: true,
    example: [ModoPersonalizacao.ESTAMPA, ModoPersonalizacao.IMPRINT_LIVRE],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsEnum(ModoPersonalizacao, { each: true })
  modos_personalizacao?: ModoPersonalizacao[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Estampas compatíveis com este produto (mesma loja)',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @MinLength(1, { each: true })
  estampa_ids?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Processos de decoração livres permitidos (mesma loja)',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @MinLength(1, { each: true })
  processo_ids?: string[];
}
