import { IsString, IsNotEmpty } from 'class-validator';

export class CreateFornecedoreDto {
  @IsString()
  @IsNotEmpty()
  nome: string;
} 