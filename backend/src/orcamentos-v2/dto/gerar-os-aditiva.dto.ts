import { ArrayMinSize, IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GerarOsAditivaDto {
  @ApiProperty({
    description: 'ID da Ordem de Serviço pai (OS original do pedido)',
    example: 'os-pai-uuid-456',
  })
  @IsString()
  os_pai_id: string;

  @ApiProperty({
    description: 'Lista de IDs das ocorrências precificadas a serem agregadas nesta OS Aditiva',
    example: ['ocorrencia-1', 'ocorrencia-2'],
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  ocorrencia_ids: string[];
}
