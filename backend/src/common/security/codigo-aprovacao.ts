import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Gate 0S / HS-04 - Código de aprovação pública de proposta comercial.
 *
 * Contrato desta unidade:
 * - o segredo é gerado por CSPRNG com 256 bits de entropia;
 * - o banco guarda apenas o hash SHA-256 (hex, 64 caracteres);
 * - o valor em claro só existe em memória, no caminho de emissão, e é
 *   entregue exclusivamente pelo canal do cliente (e-mail). Ele nunca é
 *   persistido, devolvido em resposta HTTP nem escrito em log;
 * - a comparação é feita sobre os hashes, com tempo constante.
 *
 * SHA-256 sem salt e sem KDF é adequado **porque o segredo é aleatório de
 * 256 bits**: não há dicionário nem rainbow table viável contra ele. Um
 * KDF (bcrypt/argon2) só seria necessário se o segredo fosse escolhido por
 * pessoa ou tivesse entropia baixa.
 */

/** 32 bytes = 256 bits de entropia, conforme exigido pelo contrato do HS-04. */
export const CODIGO_APROVACAO_BYTES = 32;

/**
 * Validade do código, alinhada à validade padrão da proposta
 * (`orcamento.validade_proposta` = "30 dias"). Expirar antes disso deixaria
 * o cliente sem conseguir aceitar uma proposta ainda vigente.
 */
export const CODIGO_APROVACAO_VALIDADE_DIAS = 30;

/**
 * Teto de tentativas registradas por orçamento. É o limite *no registro*,
 * complementar ao rate limit de borda: mesmo que o atacante troque de IP,
 * o contador da linha trava o alvo.
 */
export const CODIGO_APROVACAO_MAX_TENTATIVAS = 10;

/**
 * Tamanho do hash em hexadecimal (SHA-256). Usado para dimensionar a coluna
 * e para descartar valores corrompidos antes da comparação.
 */
export const CODIGO_APROVACAO_HASH_TAMANHO = 64;

/**
 * Limite defensivo do payload recebido do cliente. O código legítimo tem 43
 * caracteres (32 bytes em base64url); qualquer coisa muito maior é ruído ou
 * tentativa de abuso e é descartada antes de tocar o banco.
 */
export const CODIGO_APROVACAO_TAMANHO_MAXIMO = 128;

/**
 * Mensagem única devolvida ao cliente público para qualquer falha de código:
 * inválido, expirado, revogado, já usado, inexistente ou acima do limite de
 * tentativas. Diferenciar os casos entregaria um oráculo ao atacante.
 */
export const CODIGO_APROVACAO_ERRO_PUBLICO =
  'Código de aprovação inválido ou expirado. Solicite o reenvio do código para o e-mail cadastrado.';

/**
 * Hash de referência usado quando não há hash armazenado. Serve apenas para
 * manter o mesmo custo de comparação nos dois caminhos.
 */
const HASH_INEXISTENTE = '0'.repeat(CODIGO_APROVACAO_HASH_TAMANHO);

export interface CodigoAprovacaoEmitido {
  /** Valor em claro. Só pode trafegar até o canal de entrega ao cliente. */
  readonly codigo: string;
  /** SHA-256 hexadecimal do código. É o único valor persistido. */
  readonly hash: string;
  /** Instante de expiração (UTC). */
  readonly expiraEm: Date;
}

/**
 * Gera um novo código de aprovação.
 *
 * `base64url` mantém o token seguro para URL, e-mail e cópia manual, sem os
 * caracteres `+`, `/` e `=` que quebram em alguns clientes de e-mail.
 */
export function emitirCodigoAprovacao(
  agora: Date = new Date(),
): CodigoAprovacaoEmitido {
  const codigo = randomBytes(CODIGO_APROVACAO_BYTES).toString('base64url');

  // `getTime()` é o instante absoluto em epoch; somar milissegundos aqui é
  // independente do fuso do processo, e o Prisma persiste em UTC.
  const expiraEm = new Date(
    agora.getTime() + CODIGO_APROVACAO_VALIDADE_DIAS * 24 * 60 * 60 * 1000,
  );

  return { codigo, hash: calcularHashCodigoAprovacao(codigo), expiraEm };
}

/** SHA-256 hexadecimal do código em claro. */
export function calcularHashCodigoAprovacao(codigo: string): string {
  return createHash('sha256').update(codigo, 'utf8').digest('hex');
}

/**
 * Rejeita payloads que nem chegam a ter forma de código antes de qualquer
 * acesso ao banco. Não valida o alfabeto exato de propósito: o objetivo é
 * cortar abuso, não dar pistas sobre o formato do segredo.
 */
export function formatoCodigoAprovacaoValido(
  codigo: unknown,
): codigo is string {
  return (
    typeof codigo === 'string' &&
    codigo.length > 0 &&
    codigo.length <= CODIGO_APROVACAO_TAMANHO_MAXIMO
  );
}

/**
 * Compara dois hashes em tempo constante.
 *
 * Quando o hash armazenado é nulo ou está fora do formato esperado, a
 * comparação ainda é executada contra `HASH_INEXISTENTE` para não vazar,
 * pelo tempo de resposta, se o orçamento tem ou não código ativo.
 */
export function hashesConferem(
  hashInformado: string,
  hashArmazenado: string | null | undefined,
): boolean {
  const referencia =
    typeof hashArmazenado === 'string' &&
    hashArmazenado.length === CODIGO_APROVACAO_HASH_TAMANHO
      ? hashArmazenado
      : HASH_INEXISTENTE;

  if (hashInformado.length !== referencia.length) {
    return false;
  }

  const iguais = timingSafeEqual(
    Buffer.from(hashInformado, 'utf8'),
    Buffer.from(referencia, 'utf8'),
  );

  return iguais && referencia !== HASH_INEXISTENTE;
}

/**
 * Contingência fail-closed do HS-04.
 *
 * Preferir forward-fix. Se o fluxo público seguro falhar de forma não
 * corrigível de imediato, **não** se volta ao código pré-HS-04 (a coluna
 * legada ainda existe no schema e a app antiga voltaria a emitir/aceitar
 * segredo fraco). Em vez disso, mantém-se o schema expandido e desliga-se
 * emissão, reenvio e aceite públicos via esta flag.
 *
 * Em produção: `ORCAMENTOS_ACEITE_PUBLICO_DESABILITADO=true` no env do
 * backend + reinício do PM2. Remover a variável (ou `=false`) reabre o
 * fluxo sem migration adicional.
 */
export function aceitePublicoDesabilitado(): boolean {
  const valor = (process.env.ORCAMENTOS_ACEITE_PUBLICO_DESABILITADO || '')
    .trim()
    .toLowerCase();
  return valor === 'true' || valor === '1' || valor === 'yes';
}

/** Mensagem estável, sem detalhe interno, para os três pontos do kill-switch. */
export const ACEITE_PUBLICO_DESABILITADO_MSG =
  'A aprovação pública desta proposta está temporariamente indisponível. Entre em contato com a loja.';

