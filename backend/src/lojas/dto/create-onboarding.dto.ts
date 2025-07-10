// @ts-nocheck
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsEnum,
} from 'class-validator';
import { TipoPessoa } from '@prisma/client';

export class CreateOnboardingDto {
  @IsString()
  @IsNotEmpty()
  storeName: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsEnum(TipoPessoa)
  tipoPessoa: TipoPessoa;

  @IsString()
  @IsNotEmpty()
  documento: string;

  @IsString()
  @MinLength(6)
  password: string;
}
