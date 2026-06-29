import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class FaixaPrecoDto {
  @ApiProperty({ example: 1, description: 'Quantidade mínima da faixa' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  min: number;

  @ApiPropertyOptional({
    example: 10,
    nullable: true,
    description: 'Quantidade máxima; omitir ou null = sem teto',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  max?: number | null;

  @ApiProperty({ example: 5.0, description: 'Preço unitário da personalização na faixa' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  preco: number;
}
