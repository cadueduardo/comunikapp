import { ContextoDaRequisicao } from '../../orcamentos-v2/dto/aceite-proposta';

/**
 * Gate 0S / HS-03 + HS-06 — dados de rede da requisição, para auditoria.
 *
 * `req.ip` é resolvido pelo Express a partir da política `trust proxy = 1`
 * definida no bootstrap. É o único caminho aceito: ler `x-forwarded-for`
 * diretamente devolveria um valor escolhido pelo chamador quando a requisição
 * não passa pelo proxy de borda, e o Nginx de produção já sobrescreve esse
 * cabeçalho com `$remote_addr`.
 *
 * Nada aqui vem de query string ou do corpo. O `user-agent` é truncado no
 * momento da gravação; aqui ele é apenas lido.
 */
export function extrairContextoDaRequisicao(req: any): ContextoDaRequisicao {
  const userAgent = req?.headers?.['user-agent'];

  return {
    ip: typeof req?.ip === 'string' ? req.ip : null,
    userAgent: typeof userAgent === 'string' ? userAgent : null,
  };
}
