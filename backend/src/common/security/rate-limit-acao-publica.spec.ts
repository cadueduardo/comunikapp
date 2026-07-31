import * as express from 'express';
import * as request from 'supertest';
import { criarRateLimitAcaoPublica } from './rate-limit-acao-publica';

/**
 * Gate 0S / HS-03, HS-04 e HS-06 — fluxo real do IP até a chave do rate limit.
 *
 * O que estes testes provam, e por que reasoning não bastava:
 *
 * A cadeia em produção é navegador -> Cloudflare -> Nginx -> Next/BFF -> Nest.
 * O Nginx **sobrescreve** `X-Forwarded-For` com `$remote_addr`
 * (`deploy/nginx/snippets/comunikapp-app-proxy.conf`), e o BFF repassa esse
 * valor. O Nest roda com `trust proxy = 1`.
 *
 * A pergunta que decide se o limitador funciona é: com `trust proxy = 1`, qual
 * elemento de `X-Forwarded-For` vira `req.ip`? Se fosse o primeiro, um chamador
 * que prefixasse o cabeçalho ganharia um contador novo por requisição e os dois
 * limitadores viariam enfeite. A app abaixo é montada com o mesmo
 * `trust proxy` do `main.ts`, então a resposta aqui é a resposta de produção.
 */
describe('rate limit da ação pública (HS-04)', () => {
  const MAX_POR_ORCAMENTO = 3;
  const MAX_POR_IP = 8;

  const montarApp = () => {
    const app = express();
    // Idêntico ao `main.ts`.
    app.set('trust proxy', 1);
    app.use(
      criarRateLimitAcaoPublica({
        maxPorOrcamento: MAX_POR_ORCAMENTO,
        maxPorIp: MAX_POR_IP,
      }),
    );
    // Devolve o IP resolvido para que o teste possa inspecioná-lo.
    app.post('/orcamentos-v2/:id/publico/acao', (req, res) => {
      res.status(200).json({ ipResolvido: req.ip });
    });
    return app;
  };

  let app: express.Express;

  beforeEach(() => {
    app = montarApp();
  });

  const acionar = (orcamentoId: string, xff: string) =>
    request(app)
      .post(`/orcamentos-v2/${orcamentoId}/publico/acao`)
      .set('X-Forwarded-For', xff);

  it('resolve o IP a partir do último elemento de X-Forwarded-For', async () => {
    // O último elemento é o que o proxy imediato acrescentou — o único que a
    // aplicação não pode ter recebido do chamador.
    const resposta = await acionar('orc-1', '203.0.113.10');
    expect(resposta.body.ipResolvido).toBe('203.0.113.10');
  });

  it('ignora elementos prefixados por quem chama (anti-spoofing)', async () => {
    // Cenário do atacante: ele injeta um IP falso à esquerda esperando que a
    // aplicação leia o primeiro elemento. Com `trust proxy = 1` o valor
    // considerado é o da direita, posto pelo proxy.
    const resposta = await acionar('orc-1', '1.2.3.4, 203.0.113.10');
    expect(resposta.body.ipResolvido).toBe('203.0.113.10');
    expect(resposta.body.ipResolvido).not.toBe('1.2.3.4');
  });

  it('não deixa o atacante escapar do limite trocando o IP forjado', async () => {
    // Mesma origem real, IPs forjados diferentes a cada requisição. Se o
    // limitador olhasse o elemento da esquerda, nenhuma seria barrada.
    const respostas: number[] = [];
    for (let i = 0; i < MAX_POR_ORCAMENTO + 2; i++) {
      const r = await acionar('orc-1', `10.0.0.${i}, 203.0.113.10`);
      respostas.push(r.status);
    }

    expect(respostas.slice(0, MAX_POR_ORCAMENTO)).toEqual(
      Array(MAX_POR_ORCAMENTO).fill(200),
    );
    expect(respostas.slice(MAX_POR_ORCAMENTO)).toEqual([429, 429]);
  });

  it('mantém buckets independentes por IP de origem', async () => {
    for (let i = 0; i < MAX_POR_ORCAMENTO; i++) {
      expect((await acionar('orc-1', '203.0.113.10')).status).toBe(200);
    }
    expect((await acionar('orc-1', '203.0.113.10')).status).toBe(429);

    // Outro cliente, mesmo orçamento: não pode herdar o bloqueio do primeiro.
    expect((await acionar('orc-1', '203.0.113.99')).status).toBe(200);
  });

  it('mantém buckets independentes por orçamento, até o teto por IP', async () => {
    const ip = '203.0.113.10';

    // Trocar de orçamento renova o contador composto — é o que evita punir um
    // cliente legítimo por causa de outro atrás do mesmo IP corporativo.
    for (let i = 0; i < MAX_POR_ORCAMENTO; i++) {
      expect((await acionar('orc-A', ip)).status).toBe(200);
    }
    expect((await acionar('orc-A', ip)).status).toBe(429);
    expect((await acionar('orc-B', ip)).status).toBe(200);
  });

  it('o limite por IP contém a enumeração que o limite composto deixaria passar', async () => {
    const ip = '203.0.113.77';

    // O atacante varre orçamentos, um por requisição, para nunca esbarrar no
    // contador composto. Quem o segura é o limitador por IP.
    const status: number[] = [];
    for (let i = 0; i < MAX_POR_IP + 2; i++) {
      status.push((await acionar(`orc-varredura-${i}`, ip)).status);
    }

    expect(status.slice(0, MAX_POR_IP)).toEqual(Array(MAX_POR_IP).fill(200));
    expect(status.slice(MAX_POR_IP)).toEqual([429, 429]);
  });

  it('colapsa IPv6 na /64 para não dar contador novo a cada endereço do bloco', async () => {
    // Provedor residencial entrega um /64 inteiro. Sem a normalização, o
    // atacante trocaria de endereço dentro do próprio bloco indefinidamente.
    const status: number[] = [];
    for (let i = 0; i < MAX_POR_ORCAMENTO + 1; i++) {
      status.push((await acionar('orc-1', `2001:db8:1:1::${i + 1}`)).status);
    }

    expect(status[status.length - 1]).toBe(429);
  });

  it('não aplica limite a rota fora do recorte nem a método diferente de POST', async () => {
    const appLocal = montarApp();
    appLocal.get('/orcamentos-v2/:id/publico/acao', (_req, res) =>
      res.status(200).send('ok'),
    );

    for (let i = 0; i < MAX_POR_IP + 5; i++) {
      const r = await request(appLocal)
        .get('/orcamentos-v2/orc-1/publico/acao')
        .set('X-Forwarded-For', '203.0.113.10');
      expect(r.status).toBe(200);
    }
  });

  it('a resposta de excesso não revela o orçamento nem a chave usada', async () => {
    for (let i = 0; i < MAX_POR_ORCAMENTO; i++) {
      await acionar('orc-secreto', '203.0.113.10');
    }
    const barrada = await acionar('orc-secreto', '203.0.113.10');

    expect(barrada.status).toBe(429);
    const corpo = JSON.stringify(barrada.body);
    expect(corpo).not.toContain('orc-secreto');
    expect(corpo).not.toContain('203.0.113.10');
  });
});
