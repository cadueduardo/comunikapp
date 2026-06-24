import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCategoriaProdutoFinitoDto {
  @ApiProperty({ example: 'Displays' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nome: string;
}
