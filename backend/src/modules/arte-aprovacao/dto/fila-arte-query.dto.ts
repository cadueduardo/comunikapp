import { IsEnum, IsIn, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { StatusArte } from '../constants/arte.enums';

export class FilaArteQueryDto {
  @IsOptional()
  @IsEnum(StatusArte)
  status?: StatusArte;

  @IsOptional()
  @IsUUID()
  designer_id?: string;

  @IsOptional()
  @IsIn(['me'])
  modo?: 'me';

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 50;
}
