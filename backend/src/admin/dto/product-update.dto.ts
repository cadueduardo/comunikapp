import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { product_update_category, product_update_status } from '@prisma/client';

export class ListProductUpdatesDto {
  @IsOptional()
  @IsString()
  @MaxLength(180)
  search?: string;

  @IsOptional()
  @IsEnum(product_update_status)
  status?: product_update_status;

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
  limit = 20;
}

export class UpsertProductUpdateDto {
  @IsString()
  @MinLength(3)
  @MaxLength(180)
  title!: string;

  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MaxLength(191)
  slug!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  summary!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(50000)
  content!: string;

  @IsEnum(product_update_category)
  category!: product_update_category;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  version?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(64, { each: true })
  modules?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(64, { each: true })
  audience?: string[];

  @IsOptional()
  @IsBoolean()
  changelogEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  inAppEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  changeReason?: string;
}

export class DeployProductUpdateDto {
  @IsString()
  @MinLength(7)
  @MaxLength(64)
  @Matches(/^[a-fA-F0-9]+$/)
  commitSha!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(32)
  @Matches(/^[a-zA-Z0-9_-]+$/)
  environment!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  version?: string;

  @IsString()
  @MinLength(3)
  @MaxLength(180)
  title!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  summary!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(50000)
  content!: string;

  @IsEnum(product_update_category)
  category!: product_update_category;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(64, { each: true })
  modules?: string[];
}
