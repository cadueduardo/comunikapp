import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class InativarOSDto {
  @ApiProperty({
    description: 'Motivo da inativação (ex.: teste, duplicada)',
    example: 'OS de teste — limpeza solicitada pelo cliente',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  motivo: string;
}
