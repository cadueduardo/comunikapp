/**
 * Gate 0S / HS-04 — IP real do cliente para as rotas públicas de proposta.
 *
 * Por que isto existe: o navegador chama `/api/...` no próprio Next, e o route
 * handler abre uma **nova** conexão com o Nest (`BACKEND_URL`, normalmente
 * `127.0.0.1:4001`). Sem repassar o IP, o Nest enxerga sempre o IP do processo
 * Next, e qualquer rate limit lá vira um contador único compartilhado por todos
 * os clientes — inútil como isolamento e perigoso como limite global.
 *
 * Confiabilidade da origem: em produção o Nginx **sobrescreve**
 * `X-Forwarded-For` com `$remote_addr` (ver `deploy/nginx/snippets/
 * comunikapp-app-proxy.conf`), então o valor que chega aqui não é escolhido
 * pelo chamador. Fora dessa topologia o cabeçalho é apenas dica: por isso o
 * valor é validado antes de ser repassado, e o controle que realmente contém
 * abuso é o contador persistente de tentativas no banco.
 */

/** Aceita IPv4 e IPv6 em notação simples. Rejeita qualquer outra coisa. */
const FORMATO_DE_IP = /^[0-9a-fA-F:.]{3,45}$/;

/**
 * Extrai o IP do cliente dos cabeçalhos definidos pelo proxy de borda.
 *
 * Ordem de preferência:
 *
 * 1. `X-Real-IP`, que o Nginx define como `$remote_addr` e **nunca** acumula
 *    valores. É o único cabeçalho da cadeia que não tem forma de lista, então
 *    não existe ambiguidade sobre qual elemento é o cliente.
 * 2. O **último** elemento de `X-Forwarded-For`, que é o acrescentado pelo
 *    proxy imediato.
 *
 * O último elemento, e não o primeiro: hoje o Nginx sobrescreve o cabeçalho com
 * um valor só, então tanto faz — mas se essa diretiva algum dia virar
 * `$proxy_add_x_forwarded_for`, que anexa, o primeiro elemento passa a ser o
 * que o chamador enviou. Ler da direita mantém a mesma semântica que o Express
 * usa do outro lado (`trust proxy`), e é o que impede o repasse de um IP
 * escolhido por quem chama.
 *
 * Retorna `null` quando não há cabeçalho confiável — caso do desenvolvimento
 * local, em que o Nest simplesmente usa o IP do socket.
 */
export function extrairIpDoCliente(headers: Headers): string | null {
  const encaminhados = headers.get('x-forwarded-for')?.split(',') ?? [];

  const candidatos = [
    headers.get('x-real-ip'),
    encaminhados[encaminhados.length - 1],
  ];

  for (const candidato of candidatos) {
    const ip = candidato?.trim();
    if (ip && FORMATO_DE_IP.test(ip)) {
      return ip;
    }
  }

  return null;
}

/**
 * Monta os cabeçalhos de encaminhamento para o Nest, preservando o IP do
 * cliente quando ele é conhecido.
 */
export function cabecalhosDeEncaminhamento(
  headers: Headers,
): Record<string, string> {
  const ip = extrairIpDoCliente(headers);

  return {
    'Content-Type': 'application/json',
    ...(ip ? { 'X-Forwarded-For': ip } : {}),
  };
}
