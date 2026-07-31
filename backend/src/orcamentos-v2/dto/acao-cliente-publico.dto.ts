import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CODIGO_APROVACAO_TAMANHO_MAXIMO } from '../../common/security/codigo-aprovacao';

/**
 * Gate 0S / HS-03 - Contrato de entrada da ação do cliente no link público.
 *
 * Este endpoint é anônimo, então o DTO é a primeira fronteira: sem ele o
 * `@Body()` era `any`, a `ValidationPipe` global não rodava e qualquer campo
 * extra chegava ao service.
 *
 * `cliente_nome` e `cliente_email` continuam aceitos por compatibilidade com o
 * frontend atual, mas são **puramente informativos**: nada no backend usa esses
 * valores para identificar quem está agindo. Quem autoriza a aprovação é o
 * código de aprovação; quem identifica o cliente é o cadastro do orçamento.
 */
export class AcaoClientePublicoDto {
  @ApiProperty({
    description: 'Ação escolhida pelo cliente na página pública da proposta.',
    enum: ['APROVAR', 'REJEITAR', 'NEGOCIAR'],
  })
  @IsIn(['APROVAR', 'REJEITAR', 'NEGOCIAR'], {
    message: 'Ação inválida.',
  })
  acao: 'APROVAR' | 'REJEITAR' | 'NEGOCIAR';

  @ApiPropertyOptional({
    description:
      'Motivo informado pelo cliente. Obrigatório quando a ação é REJEITAR.',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observacoes?: string;

  @ApiPropertyOptional({
    description:
      'Código de aprovação recebido por e-mail. Obrigatório quando a ação é APROVAR.',
  })
  @IsOptional()
  @IsString()
  // O limite corta payloads absurdos antes de qualquer acesso ao banco.
  @MaxLength(CODIGO_APROVACAO_TAMANHO_MAXIMO)
  // O código é sensível a maiúsculas/minúsculas (base64url); só espaços
  // acidentais de cópia são removidos.
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  codigo_aprovacao?: string;

  @ApiPropertyOptional({
    description: 'Nome informado pelo cliente. Não é usado para autorizar.',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  cliente_nome?: string;

  @ApiPropertyOptional({
    description: 'E-mail informado pelo cliente. Não é usado para autorizar.',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  cliente_email?: string;
}

/**
 * Estados a partir dos quais o cliente ainda pode agir sobre a proposta.
 * É a condição de origem do UPDATE que serializa o aceite.
 */
export const STATUS_QUE_ACEITAM_ACAO_PUBLICA = [
  'pendente',
  'enviado',
  'rascunho',
];

/**
 * Erro público único para ação recusada.
 *
 * O texto não diz se o orçamento existe, em que status está, nem por que a
 * ação foi negada — no canal anônimo, essa diferença é informação para o
 * atacante e não ajuda o cliente legítimo.
 */
export const ACAO_PUBLICA_ERRO_GENERICO =
  'Não foi possível registrar esta ação para o orçamento informado. Entre em contato com a empresa responsável pela proposta.';

/**
 * Sinaliza que a transição de estado não se aplicava mais no momento do
 * UPDATE. É lançado dentro da transação para desfazer, junto, a queima do
 * código de aprovação.
 */
export class ConflitoAcaoPublicaError extends Error {
  constructor() {
    super('Estado do orçamento incompatível com a ação solicitada.');
    this.name = 'ConflitoAcaoPublicaError';
  }
}
