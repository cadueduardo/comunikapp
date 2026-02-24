import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsObject,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateWorkflowDto {
  @ApiProperty({
    description: 'Nome do workflow',
    example: 'Producao de Banners',
  })
  @IsString()
  nome: string;

  @ApiPropertyOptional({
    description: 'Descricao do workflow',
    example: 'Workflow padrao para producao de banners e lonas',
  })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiProperty({
    description:
      'Se o workflow e sequencial (true) ou permite etapas paralelas (false)',
    example: true,
  })
  @IsBoolean()
  sequencial: boolean;

  @ApiProperty({
    description: 'Etapas do workflow',
    example: [
      {
        nome: 'FILA',
        descricao: 'OS aguardando inicio da producao',
        ordem: 1,
        obrigatoria: true,
        tempo_estimado: 0,
      },
      {
        nome: 'PRODUCAO',
        descricao: 'Processo de impressao e producao',
        ordem: 2,
        obrigatoria: true,
        tempo_estimado: 240, // 4 horas
      },
    ],
  })
  @IsArray()
  etapas: EtapaWorkflowDto[];
}

export class EtapaWorkflowDto {
  @ApiProperty({
    description: 'Nome da etapa',
    example: 'PRODUCAO',
  })
  @IsString()
  nome: string;

  @ApiPropertyOptional({
    description: 'Descricao da etapa',
    example: 'Processo de impressao digital',
  })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiProperty({
    description: 'Ordem da etapa no workflow',
    example: 1,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  ordem: number;

  @ApiProperty({
    description: 'Se a etapa e obrigatoria',
    example: true,
  })
  @IsBoolean()
  obrigatoria: boolean;

  @ApiPropertyOptional({
    description: 'Tempo estimado da etapa em minutos',
    example: 240,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tempo_estimado?: number;

  @ApiPropertyOptional({
    description: 'IDs dos usuarios/funcoes permitidos nesta etapa',
    example: ['ADMINISTRADOR', 'PRODUCAO'],
  })
  @IsOptional()
  @IsArray()
  responsaveis_permitidos?: string[];

  @ApiPropertyOptional({
    description: 'Checklist obrigatorio da etapa',
    example: [
      {
        descricao: 'Verificar qualidade da impressao',
        obrigatorio: true,
        ordem: 1,
      },
    ],
  })
  @IsOptional()
  @IsArray()
  checklist?: ChecklistItemDto[];

  @ApiPropertyOptional({
    description: 'Acoes automaticas ao entrar na etapa',
    example: [
      {
        tipo: 'BAIXAR_ESTOQUE',
        configuracao: { percentual: 100 },
      },
    ],
  })
  @IsOptional()
  @IsArray()
  acoes_automaticas?: AcaoAutomaticaDto[];
}

export class ChecklistItemDto {
  @ApiProperty({
    description: 'Descricao do item do checklist',
    example: 'Verificar qualidade da impressao',
  })
  @IsString()
  descricao: string;

  @ApiProperty({
    description: 'Se o item e obrigatorio',
    example: true,
  })
  @IsBoolean()
  obrigatorio: boolean;

  @ApiProperty({
    description: 'Ordem do item no checklist',
    example: 1,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  ordem: number;
}

export class AcaoAutomaticaDto {
  @ApiProperty({
    description: 'Tipo da acao automatica',
    enum: [
      'NOTIFICAR',
      'RESERVAR_ESTOQUE',
      'BAIXAR_ESTOQUE',
      'ATRIBUIR_RESPONSAVEL',
    ],
    example: 'BAIXAR_ESTOQUE',
  })
  @IsString()
  tipo:
    | 'NOTIFICAR'
    | 'RESERVAR_ESTOQUE'
    | 'BAIXAR_ESTOQUE'
    | 'ATRIBUIR_RESPONSAVEL';

  @ApiProperty({
    description: 'Configuracao especifica da acao (JSON)',
    example: { percentual: 100 },
  })
  @IsObject()
  configuracao: any;
}

export class UpdateWorkflowDto {
  @ApiPropertyOptional({
    description: 'Nome do workflow',
    example: 'Producao de Banners Atualizado',
  })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional({
    description: 'Descricao do workflow',
    example: 'Workflow atualizado para producao de banners',
  })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiPropertyOptional({
    description: 'Se o workflow esta ativo',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @ApiPropertyOptional({
    description: 'Se o workflow e sequencial',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  sequencial?: boolean;

  @ApiPropertyOptional({
    description: 'Etapas atualizadas do workflow',
  })
  @IsOptional()
  @IsArray()
  etapas?: EtapaWorkflowDto[];
}
