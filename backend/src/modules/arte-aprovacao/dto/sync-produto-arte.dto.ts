import { IsEnum, IsOptional, IsArray, IsString } from 'class-validator';
import {
  FinalidadeAnexo,
  PoliticaCobrancaArte,
  ResponsabilidadeArte,
} from '../constants/arte.enums';

export class SyncProdutoArteDto {
  @IsOptional()
  @IsEnum(ResponsabilidadeArte)
  responsabilidade_arte?: ResponsabilidadeArte;

  @IsOptional()
  @IsEnum(PoliticaCobrancaArte)
  politica_cobranca_arte?: PoliticaCobrancaArte;

  @IsOptional()
  @IsEnum(FinalidadeAnexo)
  finalidade_anexo?: FinalidadeAnexo;

  @IsOptional()
  @IsString()
  complexidade_arte?: string;

  @IsOptional()
  @IsArray()
  servicos?: Record<string, unknown>[];

  @IsOptional()
  @IsArray()
  servicos_manuais?: Record<string, unknown>[];
}
