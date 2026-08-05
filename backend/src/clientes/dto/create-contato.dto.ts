import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/** Papéis de contato do cliente (RP §5.2.4 / Fase 4). */
export const PAPEIS_CONTATO_CLIENTE = [
  'solicitante',
  'aprovador',
  'financeiro',
  'entrega',
  'local',
] as const;

export type PapelContatoCliente = (typeof PAPEIS_CONTATO_CLIENTE)[number];

export class CreateContatoDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(150)
  nome: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  whatsapp?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  cargo?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsIn(PAPEIS_CONTATO_CLIENTE, { each: true })
  papeis?: PapelContatoCliente[];

  @IsOptional()
  @IsBoolean()
  principal?: boolean;
}
