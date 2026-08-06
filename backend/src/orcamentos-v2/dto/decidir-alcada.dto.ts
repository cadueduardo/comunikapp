import { IsBoolean, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DecidirAlcadaDto {
  @ApiProperty({
    description: 'Decisão do gestor comercial (true = aprovar, false = rejeitar)',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  aprovar: boolean;

  @ApiProperty({
    description: 'Justificativa comercial obrigatória da decisão',
    example: 'Desconto aprovado devido ao alto volume do contrato',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  justificativa: string;
}
