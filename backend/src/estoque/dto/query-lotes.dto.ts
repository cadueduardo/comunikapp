import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class QueryLotesDto {
  @ApiPropertyOptional({ description: 'Filtrar por status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Filtrar por item de estoque' })
  @IsOptional()
  @IsString()
  estoqueId?: string;
}
