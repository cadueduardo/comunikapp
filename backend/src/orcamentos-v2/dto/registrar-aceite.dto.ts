import { IsBoolean, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegistrarAceiteDto {
  @ApiProperty({
    description: 'Nome completo do responsável que está registrando o aceite',
    example: 'João da Silva',
  })
  @IsString()
  @MinLength(2)
  cliente_nome: string;

  @ApiProperty({
    description: 'E-mail do responsável pelo aceite para envio de confirmação',
    example: 'joao.silva@empresa.com.br',
  })
  @IsEmail()
  cliente_email: string;

  @ApiPropertyOptional({
    description: 'CPF ou CNPJ do responsável/empresa contratante',
    example: '12.345.678/0001-90',
  })
  @IsOptional()
  @IsString()
  cpf_cnpj?: string;

  @ApiPropertyOptional({
    description: 'Código numérico de aprovação recebido por e-mail (se aplicável)',
    example: '839201',
  })
  @IsOptional()
  @IsString()
  codigo_aprovacao?: string;

  @ApiPropertyOptional({
    description: 'Confirmação de aceite dos termos comerciais e de serviço',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  aceito_termos?: boolean;
}
