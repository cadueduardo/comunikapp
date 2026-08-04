import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { CriarOrcamentoComProdutosDto } from './criar-orcamento.dto';
import { AtualizarOrcamentoDto } from './atualizar-orcamento.dto';

/**
 * Body tipado de criação (Fase 1).
 *
 * Estende o DTO canônico em modo parcial: o formulário atual envia campos
 * além do contrato mínimo (ex.: `nome_servico`, custos). A ValidationPipe
 * destes endpoints usa `whitelist: false` para não descartar propriedades
 * ainda não declaradas — mas deixa de ser `@Body() any`.
 */
export class CriarOrcamentoBodyDto extends PartialType(
  CriarOrcamentoComProdutosDto,
) {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  nome_servico?: string;
}

/**
 * Body tipado de atualização (Fase 1). Mesma estratégia do create.
 */
export class AtualizarOrcamentoBodyDto extends PartialType(
  AtualizarOrcamentoDto,
) {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  nome_servico?: string;
}
