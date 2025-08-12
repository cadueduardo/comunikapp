import { PartialType } from '@nestjs/mapped-types';
import { CreateMaquinaDto } from './create-maquina.dto';

export class UpdateMaquinaDto extends PartialType(CreateMaquinaDto) {}
