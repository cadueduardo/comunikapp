import { loja_status } from '@prisma/client';
import {
  IsEnum,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export enum AdminStoreStatusCategory {
  SECURITY = 'SECURITY',
  COMMERCIAL = 'COMMERCIAL',
  FINANCIAL = 'FINANCIAL',
  POLICY = 'POLICY',
  ONBOARDING = 'ONBOARDING',
  OTHER = 'OTHER',
}

export class UpdateAdminStoreStatusDto {
  @IsEnum(loja_status)
  status: loja_status;

  @IsEnum(AdminStoreStatusCategory)
  category: AdminStoreStatusCategory;

  @IsString()
  @MinLength(10, {
    message: 'A justificativa deve ter no mínimo 10 caracteres.',
  })
  @MaxLength(1000)
  reason: string;
}

