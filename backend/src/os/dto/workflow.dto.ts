import { IsString, IsOptional, IsBoolean, IsArray, IsObject, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateWorkflowDto {
  @ApiProperty({
    description: 'Nome do workflow',
    example: 'Produção de Banners',
  })
  @IsString()
  nome: string;

  @ApiPropertyOptional({
    description: 'Descrição do workflow',
    example: 'Workflow padrão para produção de banners e lonas',
  })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiProperty({
    description: 'Se o workflow é sequencial (true) ou permite etapas paralelas (false)',
    example: true,
  })
  @IsBoolean()
  sequencial: boolean;

  @ApiProperty({
    description: 'Etapas do workflow',
    example: [
      {
        nome: 'FILA',
        descricao: 'OS aguardando início da produção',
        ordem: 1,
        obrigatoria: true,
        tempo_estimado: 0,
      },
      {
        nome: 'PRODUCAO',
        descricao: 'Processo de impressão e produção',
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
    description: 'Descrição da etapa',
    example: 'Processo de impressão digital',
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
    description: 'Se a etapa é obrigatória',
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
    description: 'IDs dos usuários/funções permitidos nesta etapa',
    example: ['ADMINISTRADOR', 'PRODUCAO'],
  })
  @IsOptional()
  @IsArray()
  responsaveis_permitidos?: string[];

  @ApiPropertyOptional({
    description: 'Checklist obrigatório da etapa',
    example: [
      {
        descricao: 'Verificar qualidade da impressão',
        obrigatorio: true,
        ordem: 1,
      },
    ],
  })
  @IsOptional()
  @IsArray()
  checklist?: ChecklistItemDto[];

  @ApiPropertyOptional({
    description: 'Ações automáticas ao entrar na etapa',
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
    description: 'Descrição do item do checklist',
    example: 'Verificar qualidade da impressão',
  })
  @IsString()
  descricao: string;

  @ApiProperty({
    description: 'Se o item é obrigatório',
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
    description: 'Tipo da ação automática',
    enum: ['NOTIFICAR', 'RESERVAR_ESTOQUE', 'BAIXAR_ESTOQUE', 'ATRIBUIR_RESPONSAVEL'],
    example: 'BAIXAR_ESTOQUE',
  })
  @IsString()
  tipo: 'NOTIFICAR' | 'RESERVAR_ESTOQUE' | 'BAIXAR_ESTOQUE' | 'ATRIBUIR_RESPONSAVEL';

  @ApiProperty({
    description: 'Configuração específica da ação (JSON)',
    example: { percentual: 100 },
  })
  @IsObject()
  configuracao: any;
}

export class UpdateWorkflowDto {
  @ApiPropertyOptional({
    description: 'Nome do workflow',
    example: 'Produção de Banners Atualizado',
  })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional({
    description: 'Descrição do workflow',
    example: 'Workflow atualizado para produção de banners',
  })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiPropertyOptional({
    description: 'Se o workflow está ativo',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @ApiPropertyOptional({
    description: 'Se o workflow é sequencial',
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
