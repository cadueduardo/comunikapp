/**
 * Gate 0S / HS-06 — comprovação da linha como ela chega ao arquivo de log.
 *
 * Os testes automatizados provam que os cinco tipos saem dos pontos reais
 * (`common/security/eventos-seguranca.spec.ts` e
 * `orcamentos-v2/services/orcamentos-v2-aceite-publico.spec.ts`). O que eles não
 * mostram é o texto final: em teste, o logger é interceptado antes de escrever.
 *
 * Este script escreve de verdade no stdout do processo — que é o que o PM2
 * grava em `out_file` — e depois relê o que foi escrito para conferir que
 * nenhuma linha contém dado sensível. É a evidência de "logs locais
 * consultáveis" citada no gate.
 *
 * Uso:
 *   npx ts-node scripts/comprovar-eventos-seguranca.ts
 *
 * Saída: as cinco linhas exatamente como aparecem no arquivo, seguidas do
 * resultado da varredura. Sai com código 1 se algum padrão proibido aparecer.
 */

import {
  PREFIXO_EVENTO_SEGURANCA,
  pseudonimizar,
  registrarEventoDeSeguranca,
  type EventoSeguranca,
} from '../src/common/security/eventos-seguranca';

/** Mesma lista do harness de teste, repetida aqui para o script ser autônomo. */
const PADROES_PROIBIDOS: Array<[string, RegExp]> = [
  ['e-mail', /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/],
  ['IPv4 bruto', /\b\d{1,3}(?:\.\d{1,3}){3}\b/],
  ['código de aprovação', /\bcodigo=|\bcodigo_aprovacao\b/],
  ['token', /\btoken\b/i],
  ['custo, margem ou preço', /\bcusto|\bmargem|\bpreco/i],
  ['authorization', /\bauthorization\b|\bbearer\b/i],
];

/**
 * Um exemplo de cada tipo, com os mesmos campos que o ponto real preenche.
 *
 * O IP e o id de usuário abaixo passam por `pseudonimizar` como no código de
 * produção — é justamente o que a varredura precisa confirmar que não voltou a
 * aparecer em claro.
 */
const AMOSTRAS: EventoSeguranca[] = [
  {
    tipo: 'RATE_LIMIT',
    rota: 'orcamentos-v2/acao-publica',
    recursoId: 'orc-exemplo',
    origem: pseudonimizar('203.0.113.42'),
    motivo: 'por_ip',
  },
  {
    tipo: 'TOKEN_RECUSADO',
    rota: 'orcamentos-v2/acao-publica',
    recursoId: 'orc-exemplo',
    origem: pseudonimizar('203.0.113.42'),
    motivo: 'codigo_nao_aceito',
  },
  {
    tipo: 'CONFLITO_IDEMPOTENCIA',
    rota: 'orcamentos-v2/acao-publica',
    recursoId: 'orc-exemplo',
    origem: pseudonimizar('203.0.113.42'),
    motivo: 'estado_incompativel',
  },
  {
    tipo: 'FALHA_HANDOFF',
    rota: 'orcamentos-v2/aceite',
    recursoId: 'orc-exemplo',
    motivo: 'os_nao_gerada',
  },
  {
    tipo: 'AUTORIZACAO_NEGADA',
    rota: 'OrcamentosV2Controller.remover',
    origem: pseudonimizar('usuario-exemplo'),
    motivo: 'permissao_insuficiente',
  },
];

function main(): void {
  const escritoNoStdout: string[] = [];
  const writeOriginal = process.stdout.write.bind(process.stdout);

  // Intercepta a escrita sem impedi-la: a linha precisa realmente sair, senão
  // o script comprovaria uma formatação que nunca chegou ao arquivo.
  (process.stdout as NodeJS.WriteStream).write = ((
    chunk: string | Uint8Array,
    ...resto: unknown[]
  ) => {
    escritoNoStdout.push(chunk.toString());
    return (writeOriginal as (...a: unknown[]) => boolean)(chunk, ...resto);
  }) as typeof process.stdout.write;

  for (const amostra of AMOSTRAS) {
    registrarEventoDeSeguranca(amostra);
  }

  (process.stdout as NodeJS.WriteStream).write = writeOriginal;

  const linhas = escritoNoStdout
    .join('')
    .split('\n')
    .filter((l) => l.includes(PREFIXO_EVENTO_SEGURANCA));

  console.log('');
  console.log(`linhas emitidas: ${linhas.length} de ${AMOSTRAS.length}`);

  let achados = 0;

  for (const linha of linhas) {
    for (const [nome, padrao] of PADROES_PROIBIDOS) {
      if (padrao.test(linha)) {
        achados += 1;
        // Não imprime a linha: se ela tem dado sensível, imprimi-la aqui
        // repetiria o problema no terminal e no relatório.
        console.error(`FALHA: padrão proibido "${nome}" encontrado.`);
      }
    }
  }

  if (linhas.length !== AMOSTRAS.length) {
    console.error(
      'FALHA: nem todos os eventos chegaram ao stdout. Verifique o nível de log.',
    );
    process.exit(1);
  }

  if (achados > 0) {
    process.exit(1);
  }

  console.log('varredura de dado sensível: nenhum achado.');
  process.exit(0);
}

main();
