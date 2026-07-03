import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { CategoriaOcorrencia, TipoOcorrencia, TurnoPrevisaoInstalacao } from '@prisma/client';
import { REFERENCIA_ANEXO_INSTALACAO_REGEX, REFERENCIA_ASSINATURA_LOTE_REGEX } from '../utils/anexo-url.util';

export class ConcluirLoteInstaladorDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Matches(REFERENCIA_ANEXO_INSTALACAO_REGEX, {
    each: true,
    message:
      'cada valor em fotos_evidencia deve ser uma URL absoluta ou referência /instalacao/anexos/{token}',
  })
  fotos_evidencia?: string[];

  @IsOptional()
  @IsString()
  @Matches(REFERENCIA_ASSINATURA_LOTE_REGEX, {
    message:
      'assinatura_url deve ser uma URL absoluta ou referência interna de anexo/assinatura',
  })
  assinatura_url?: string;
}

export class RegistrarOcorrenciaInstaladorDto {
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
  @IsNumber()
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

  @IsOptional()
  @IsDateString()
  data_retorno_previsao?: string;

  @IsOptional()
  @IsEnum(TurnoPrevisaoInstalacao)
  turno_retorno_previsao?: TurnoPrevisaoInstalacao;
}
