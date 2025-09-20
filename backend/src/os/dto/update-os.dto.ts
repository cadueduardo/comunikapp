import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateOSDto } from './create-os.dto';
import { StatusOS } from '../interfaces/os.interfaces';

export class UpdateOSDto extends PartialType(CreateOSDto) {
  @ApiPropertyOptional({
    description: 'Status da OS',
    enum: StatusOS,
    example: StatusOS.PRODUCAO,
  })
  @IsOptional()
  @IsEnum(StatusOS)
  status?: StatusOS;
}

export class AvancarEtapaDto {
  @ApiPropertyOptional({
    description: 'Nova etapa da OS',
    example: 'PRODUCAO',
  })
  @IsString()
  nova_etapa: string;

  @ApiPropertyOptional({
    description: 'Observações sobre o avanço da etapa',
    example: 'Iniciando processo de impressão',
  })
  @IsOptional()
  @IsString()
  observacoes?: string;

  @ApiPropertyOptional({
    description: 'ID do usuário responsável pelo avanço',
    example: 'cuid_usuario_123',
  })
  @IsOptional()
  @IsString()
  usuario_id?: string;
}
