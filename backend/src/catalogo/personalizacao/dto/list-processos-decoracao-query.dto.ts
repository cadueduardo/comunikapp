import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class ListProcessosDecoracaoQueryDto {
  @ApiPropertyOptional({ description: 'Filtrar por ativo (default: todos)' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  ativo?: boolean;
}
