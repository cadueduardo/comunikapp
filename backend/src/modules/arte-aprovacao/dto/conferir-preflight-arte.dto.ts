import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ConferirPreflightArteDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observacao?: string;
}
