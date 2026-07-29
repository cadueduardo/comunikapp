import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { admin_role, admin_user_status } from '@prisma/client';

export class ListAdminUsersDto {
  @IsOptional()
  @IsEnum(admin_user_status)
  status?: admin_user_status;

  @IsOptional()
  @IsEnum(admin_role)
  role?: admin_role;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 50;
}

export class UpdateAdminUserDto {
  @IsOptional()
  @IsEnum(admin_role)
  role?: admin_role;

  @IsOptional()
  @IsEnum(admin_user_status)
  status?: admin_user_status;

  @ValidateIf(
    (dto: UpdateAdminUserDto) =>
      dto.role === 'SUPER_ADMIN' || dto.status === 'ACTIVE',
  )
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  currentPassword?: string;

  @IsString()
  @MinLength(8)
  @MaxLength(1000)
  reason!: string;
}
