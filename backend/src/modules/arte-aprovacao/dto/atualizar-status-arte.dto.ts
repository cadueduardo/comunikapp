import { IsEnum } from 'class-validator';
import { StatusArte } from '../constants/arte.enums';

export class AtualizarStatusArteDto {
  @IsEnum(StatusArte)
  status_arte: StatusArte;
}
