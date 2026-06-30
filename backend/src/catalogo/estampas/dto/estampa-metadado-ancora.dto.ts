import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsString, Min, MinLength } from 'class-validator';

export class EstampaMetadadoAncoraDto {
  @ApiProperty({ description: 'ID do CampoVariavelDef vinculado à âncora' })
  @IsString()
  @MinLength(1)
  campoDefId: string;

  @ApiProperty({ example: 0.1 })
  @Type(() => Number)
  @IsNumber()
  x: number;

  @ApiProperty({ example: 0.2 })
  @Type(() => Number)
  @IsNumber()
  y: number;

  @ApiProperty({ example: 0.5 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.0001)
  width: number;

  @ApiProperty({ example: 0.3 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.0001)
  height: number;
}
