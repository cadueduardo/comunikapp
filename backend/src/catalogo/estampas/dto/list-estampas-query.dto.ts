import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class ListEstampasQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  ativo?: boolean;

  @ApiPropertyOptional({
    description: 'Filtra estampas vinculadas ao produto finito informado',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  produto_finito_id?: string;
}
