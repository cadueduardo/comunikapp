import { IsArray, IsOptional, IsString } from 'class-validator';

export class GerarOsAditivaDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ocorrencia_ids?: string[];
}
