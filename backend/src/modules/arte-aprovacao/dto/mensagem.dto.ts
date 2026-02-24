import {
  IsString,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
} from 'class-validator';
import { AutorTipo } from '@prisma/client';

export class CreateMensagemDto {
  @IsString()
  @IsNotEmpty()
  os_id: string; // Pode ser UUID ou CUID

  @IsString()
  @IsNotEmpty()
  produto_id: string; // Pode ser UUID, CUID ou identificador lógico

  @IsString()
  mensagem: string;

  @IsEnum(AutorTipo)
  autor_tipo: AutorTipo;

  @IsOptional()
  @IsString()
  autor_nome?: string;

  @IsOptional()
  @IsString()
  autor_email?: string;

  @IsOptional()
  @IsString()
  versao_id?: string; // Pode ser UUID ou CUID

  @IsOptional()
  @IsBoolean()
  lida?: boolean;
}

export class UpdateMensagemDto {
  @IsOptional()
  @IsString()
  mensagem?: string;

  @IsOptional()
  @IsBoolean()
  lida?: boolean;
}
