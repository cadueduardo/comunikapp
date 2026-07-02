import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Matches,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import {
  CategoriaOcorrencia,
  TipoOcorrencia,
  TurnoPrevisaoInstalacao,
} from '@prisma/client';
import { REFERENCIA_ANEXO_INSTALACAO_REGEX } from '../utils/anexo-url.util';

export class CriarLoteInstalacaoDto {
  @IsString()
  @IsNotEmpty({ message: 'Informe o item da OS.' })
  item_os_id: string;

  @IsInt({ message: 'Quantidade alocada deve ser um número inteiro.' })
  @Min(1, { message: 'Quantidade alocada deve ser no mínimo 1.' })
  quantidade_alocada: number;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  cep?: string;

  @IsString()
  @IsNotEmpty({ message: 'Informe o logradouro do endereço de instalação.' })
  @MaxLength(255)
  logradouro: string;

  @IsString()
  @IsNotEmpty({ message: 'Informe o número do endereço (use "S/N" se não houver).' })
  @MaxLength(32)
  numero: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  complemento?: string;

  @IsString()
  @IsNotEmpty({ message: 'Informe o bairro do endereço de instalação.' })
  @MaxLength(120)
  bairro: string;

  @IsString()
  @IsNotEmpty({ message: 'Informe a cidade do endereço de instalação.' })
  @MaxLength(120)
  cidade: string;

  @IsString()
  @IsNotEmpty({ message: 'Informe a UF do endereço de instalação.' })
  @MaxLength(2)
  uf: string;

  @IsOptional()
  @IsDateString()
  data_previsao?: string;

  @IsOptional()
  @IsEnum(TurnoPrevisaoInstalacao)
  turno_previsao?: TurnoPrevisaoInstalacao;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  equipe_instalacao?: string;
}

export class AtualizarEnderecoLoteDto {
  @IsOptional()
  @IsString()
  @MaxLength(16)
  cep?: string;

  @IsString()
  @IsNotEmpty({ message: 'Informe o logradouro do endereço de instalação.' })
  @MaxLength(255)
  logradouro: string;

  @IsString()
  @IsNotEmpty({ message: 'Informe o número do endereço (use "S/N" se não houver).' })
  @MaxLength(32)
  numero: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  complemento?: string;

  @IsString()
  @IsNotEmpty({ message: 'Informe o bairro do endereço de instalação.' })
  @MaxLength(120)
  bairro: string;

  @IsString()
  @IsNotEmpty({ message: 'Informe a cidade do endereço de instalação.' })
  @MaxLength(120)
  cidade: string;

  @IsString()
  @IsNotEmpty({ message: 'Informe a UF do endereço de instalação.' })
  @MaxLength(2)
  uf: string;

  @IsOptional()
  @IsInt({ message: 'Quantidade alocada deve ser um número inteiro.' })
  @Min(1, { message: 'Quantidade alocada deve ser no mínimo 1.' })
  quantidade_alocada?: number;

  @ValidateIf((_, valor) => valor !== null)
  @IsOptional()
  @IsDateString()
  data_previsao?: string | null;

  @ValidateIf((_, valor) => valor !== null)
  @IsOptional()
  @IsEnum(TurnoPrevisaoInstalacao)
  turno_previsao?: TurnoPrevisaoInstalacao | null;

  @ValidateIf((_, valor) => valor !== null)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  equipe_instalacao?: string | null;
}

export class RegistrarOcorrenciaGestaoDto {
  @IsString()
  @IsNotEmpty()
  os_id: string;

  @IsOptional()
  @IsString()
  item_instalacao_id?: string;

  @IsEnum(TipoOcorrencia)
  tipo: TipoOcorrencia;

  @IsOptional()
  @IsEnum(CategoriaOcorrencia)
  categoria?: CategoriaOcorrencia;

  @IsOptional()
  @Min(0.01)
  quantidade?: number;

  @IsString()
  @MinLength(3)
  @MaxLength(5000)
  descricao: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Matches(REFERENCIA_ANEXO_INSTALACAO_REGEX, {
    each: true,
    message:
      'cada valor em fotos_evidencia deve ser uma URL absoluta ou referência /instalacao/anexos/{token}',
  })
  fotos_evidencia?: string[];
}
