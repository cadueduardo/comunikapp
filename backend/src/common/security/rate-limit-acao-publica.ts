import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { pseudonimizar, registrarEventoDeSeguranca } from './eventos-seguranca';

/**
 * Gate 0S / HS-04 — rate limit das duas rotas anônimas de proposta comercial
 * (ação do cliente e reenvio do código de aprovação).
 *
 * São dois limites encadeados, porque cada um cobre um abuso diferente:
 *
 * 1. por (orçamento, IP): protege o alvo. Quem tenta adivinhar um código ataca
 *    um orçamento específico. Chavear só por IP puniria um cliente legítimo por
 *    causa de outro que saísse pelo mesmo IP corporativo.
 * 2. por IP: protege contra varredura. Sozinho, o limite composto não conteria
 *    enumeração — bastaria trocar o id do orçamento a cada requisição para
 *    ganhar um contador novo.
 *
 * A mensagem de excesso é a mesma nos dois e não menciona o orçamento; a chave
 * existe apenas no armazenamento interno do limitador.
 *
 * O IP vem de `req.ip`, resolvido pela política `trust proxy` do Express.
 * Nenhum header livre ou parâmetro de query participa da chave.
 *
 * DEPENDÊNCIA DE TOPOLOGIA: estas rotas chegam pelo BFF do Next
 * (`/api/*` -> 127.0.0.1:3001 -> BACKEND_URL), e o BFF abre uma conexão nova
 * para cá. Sem o repasse de `X-Forwarded-For` feito em
 * `frontend/src/lib/client-ip.ts`, `req.ip` seria o IP do processo Next para
 * todos os clientes e as duas chaves colapsariam em uma só.
 *
 * Esta é a camada de borda e **não** substitui o contador
 * `codigo_aprovacao_tentativas`, gravado na linha do orçamento: é ele que trava
 * o alvo quando o atacante troca de IP.
 *
 * ATENÇÃO ao escalar: o armazenamento é em memória do processo. Com mais de uma
 * instância do backend, o limite passa a valer por instância e o teto efetivo se
 * multiplica. Antes de escalar horizontalmente, estes limitadores precisam de
 * store compartilhado (Redis).
 *
 * Vive fora do `main.ts` para poder ser exercitado por teste com o mesmo
 * `trust proxy` de produção — é a única forma de provar que a chave observa o
 * IP resolvido pelo Express e não um cabeçalho escolhido pelo chamador.
 */

export const ROTA_ACAO_PUBLICA_PROPOSTA =
  /^\/(?:api\/)?orcamentos-v2\/([^/]+)\/(?:publico\/acao|reenviar-codigo)\/?$/;

export const MENSAGEM_EXCESSO_ACAO_PUBLICA = {
  statusCode: 429,
  message:
    'Muitas tentativas em sequência. Aguarde alguns instantes e tente novamente.',
};

/**
 * `ipKeyGenerator` colapsa IPv6 na /64. Sem isso, um atacante com um bloco IPv6
 * — o comum em provedor residencial — ganharia um contador novo a cada endereço
 * e o limite não valeria nada.
 */
const chaveDeIp = (req: any): string =>
  ipKeyGenerator(String(req.ip ?? 'sem-ip'));

/**
 * Monta o middleware encadeado. Recebe os tetos para que o teste possa usar
 * valores pequenos sem depender de `NODE_ENV`.
 */
export function criarRateLimitAcaoPublica(opcoes: {
  maxPorOrcamento: number;
  maxPorIp: number;
  windowMs?: number;
}) {
  const windowMs = opcoes.windowMs ?? 60 * 1000;

  // Gate 0S / HS-06: a barrada precisa virar evento contável. Sem isto, um
  // ataque de enumeração aparece só como ausência de sucesso, e não há como
  // alertar sobre pico de 429. A origem entra pseudonimizada — IP bruto é
  // proibido em log.
  const registrarBarrada =
    (bucket: 'por_orcamento' | 'por_ip') => (req: any, res: any) => {
      const path = String(req.path || req.url || '').split('?')[0];
      registrarEventoDeSeguranca({
        tipo: 'RATE_LIMIT',
        rota: 'orcamentos-v2/acao-publica',
        recursoId: ROTA_ACAO_PUBLICA_PROPOSTA.exec(path)?.[1],
        origem: pseudonimizar(chaveDeIp(req)),
        motivo: bucket,
      });
      res.status(429).json(MENSAGEM_EXCESSO_ACAO_PUBLICA);
    };

  const porOrcamento = rateLimit({
    windowMs,
    max: opcoes.maxPorOrcamento,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: any) => {
      const path = String(req.path || req.url || '').split('?')[0];
      const orcamentoId = ROTA_ACAO_PUBLICA_PROPOSTA.exec(path)?.[1] ?? 'sem-id';
      return `orcamento:${orcamentoId}:${chaveDeIp(req)}`;
    },
    handler: registrarBarrada('por_orcamento'),
    skip: (req: any) => req.method === 'OPTIONS',
    validate: { xForwardedForHeader: false },
  }) as any;

  const porIp = rateLimit({
    windowMs,
    max: opcoes.maxPorIp,
    standardHeaders: false,
    legacyHeaders: false,
    keyGenerator: (req: any) => `ip:${chaveDeIp(req)}`,
    handler: registrarBarrada('por_ip'),
    skip: (req: any) => req.method === 'OPTIONS',
    validate: { xForwardedForHeader: false },
  }) as any;

  return (req: any, res: any, next: any) => {
    const path = String(req.path || req.url || '').split('?')[0];
    if (req.method !== 'POST' || !ROTA_ACAO_PUBLICA_PROPOSTA.test(path)) {
      return next();
    }
    return porIp(req, res, (erro?: unknown) =>
      erro ? next(erro) : porOrcamento(req, res, next),
    );
  };
}
