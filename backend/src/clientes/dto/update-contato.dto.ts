import { PartialType } from '@nestjs/mapped-types';
import { CreateContatoDto } from './create-contato.dto';

/** `ativo` não entra aqui de propósito: inativação é sempre via DELETE (soft). */
export class UpdateContatoDto extends PartialType(CreateContatoDto) {}
