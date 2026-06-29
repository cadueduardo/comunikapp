import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ModoPersonalizacao } from '@prisma/client';
import { IsEnum, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

export class PersonalizacaoOrcamentoDto {
  @ApiProperty({
    enum: ModoPersonalizacao,
    example: ModoPersonalizacao.ESTAMPA,
  })
  @IsEnum(ModoPersonalizacao)
  modo: ModoPersonalizacao;

  @ApiPropertyOptional({ description: 'ID da estampa selecionada (modo ESTAMPA)' })
  @IsOptional()
  @IsUUID()
  estampa_id?: string | null;

  @ApiPropertyOptional({
    description: 'ID do processo de decoração (modo IMPRINT_LIVRE ou derivado da estampa)',
  })
  @IsOptional()
  @IsUUID()
  processo_id?: string | null;

  @ApiPropertyOptional({
    description:
      'Valores dos campos variáveis: objeto (qty=1 ou inline lote) ou array (VDP)',
  })
  @IsOptional()
  @IsObject()
  valores_campos?: Record<string, string> | Array<Record<string, string>>;

  @ApiPropertyOptional({
    description: 'Distribuição por grade de atributos (cor/tamanho etc.)',
  })
  @IsOptional()
  grade_distribuicao?: unknown;
}
