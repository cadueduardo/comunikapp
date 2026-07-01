import { IsBoolean } from 'class-validator';

export class AtualizarOsAditivaConfigDto {
  @IsBoolean()
  habilitada: boolean;
}
