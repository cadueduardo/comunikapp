import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { MotivoSemAssinaturaLote } from '@prisma/client';
import { REFERENCIA_ANEXO_INSTALACAO_REGEX } from '../utils/anexo-url.util';

export class AprovarConclusaoLoteGestaoDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Matches(REFERENCIA_ANEXO_INSTALACAO_REGEX, {
    each: true,
    message:
      'cada valor em fotos_evidencia deve ser uma URL absoluta ou referência /instalacao/anexos/{token}',
  })
  fotos_evidencia?: string[];

  @ValidateIf((dto: AprovarConclusaoLoteGestaoDto) => !dto.assinatura_url)
  @IsEnum(MotivoSemAssinaturaLote, {
    message: 'motivo_sem_assinatura é obrigatório quando não há assinatura',
  })
  motivo_sem_assinatura?: MotivoSemAssinaturaLote;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observacao_conclusao_gestao?: string;

  @IsOptional()
  @IsString()
  @Matches(REFERENCIA_ANEXO_INSTALACAO_REGEX, {
    message:
      'assinatura_url deve ser uma URL absoluta ou referência /instalacao/anexos/{token}',
  })
  assinatura_url?: string;
}
