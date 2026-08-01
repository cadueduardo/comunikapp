import * as express from 'express';
import * as request from 'supertest';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PREFIXO_EVENTO_SEGURANCA,
  pseudonimizar,
  registrarEventoDeSeguranca,
} from './eventos-seguranca';
import { criarRateLimitAcaoPublica } from './rate-limit-acao-publica';
import { VendasPermissionsGuard } from '../../vendas/permissions/vendas-permissions.guard';
import { REQUER_PERMISSAO_VENDAS } from '../../vendas/permissions/requer-permissao-vendas.decorator';
import {
  capturarEventosDeSeguranca,
  procurarDadoSensivel,
  type CapturaDeEventos,
} from './testing/capturar-eventos-seguranca';

/**
 * Gate 0S / HS-06 — comprovação de que os eventos de segurança existem de fato.
 *
 * O contrato do HS-06, depois da decisão de arquitetura que adiou a
 * observabilidade centralizada, é local: os eventos precisam ser emitidos pelos
 * pontos reais, sair em formato estável e não carregar segredo. É isso que este
 * arquivo verifica, exercitando o limitador e o guard de verdade em vez de
 * chamar o formatador diretamente.
 *
 * Os outros três tipos (`TOKEN_RECUSADO`, `CONFLITO_IDEMPOTENCIA` e
 * `FALHA_HANDOFF`) nascem dentro do fluxo de aceite e são comprovados em
 * `orcamentos-v2/services/orcamentos-v2-aceite-publico.spec.ts`, onde o cenário
 * de banco simulado já existe.
 */
describe('eventos de segurança (HS-06)', () => {
  let captura: CapturaDeEventos;

  beforeEach(() => {
    captura = capturarEventosDeSeguranca();
  });

  afterEach(() => {
    captura.restaurar();
  });

  describe('formato da linha', () => {
    it('emite prefixo fixo e só os campos preenchidos', () => {
      registrarEventoDeSeguranca({
        tipo: 'AUTORIZACAO_NEGADA',
        rota: 'OrcamentosV2Controller.remover',
        motivo: 'permissao_insuficiente',
      });

      const [evento] = captura.eventos();
      expect(evento.linha.startsWith(PREFIXO_EVENTO_SEGURANCA)).toBe(true);
      expect(evento.tipo).toBe('AUTORIZACAO_NEGADA');
      expect(evento.motivo).toBe('permissao_insuficiente');
      // Campo ausente não vira `recurso=undefined`: quem conta ocorrências não
      // precisa filtrar lixo.
      expect(evento.linha).not.toContain('undefined');
      expect(evento.recurso).toBeUndefined();
      expect(evento.origem).toBeUndefined();
    });

    it('mantém a linha em uma só, para que cada evento seja um registro', () => {
      registrarEventoDeSeguranca({
        tipo: 'FALHA_HANDOFF',
        rota: 'orcamentos-v2/aceite',
        recursoId: 'orc-1',
        motivo: 'os_nao_gerada',
      });

      const [evento] = captura.eventos();
      expect(evento.linha).not.toContain('\n');
    });
  });

  describe('pseudonimização', () => {
    it('não deixa o valor original aparecer no pseudônimo', () => {
      const ip = '203.0.113.42';
      const pseudonimo = pseudonimizar(ip);

      expect(pseudonimo).not.toContain(ip);
      expect(pseudonimo).toMatch(/^[0-9a-f]{12}$/);
    });

    it('agrupa o mesmo valor e separa valores diferentes dentro do processo', () => {
      expect(pseudonimizar('203.0.113.42')).toBe(pseudonimizar('203.0.113.42'));
      expect(pseudonimizar('203.0.113.42')).not.toBe(
        pseudonimizar('203.0.113.43'),
      );
    });
  });

  describe('RATE_LIMIT sai dos dois limitadores', () => {
    const montarApp = (maxPorOrcamento: number, maxPorIp: number) => {
      const app = express();
      app.set('trust proxy', 1);
      app.use(criarRateLimitAcaoPublica({ maxPorOrcamento, maxPorIp }));
      app.post('/orcamentos-v2/:id/publico/acao', (_req, res) => {
        res.status(200).json({ ok: true });
      });
      return app;
    };

    const acionar = (app: express.Express, id: string, ip: string) =>
      request(app)
        .post(`/orcamentos-v2/${id}/publico/acao`)
        .set('X-Forwarded-For', ip);

    it('registra a barrada por orçamento com o bucket que barrou', async () => {
      // Teto por orçamento baixo e teto por IP alto: quem barra é o primeiro.
      const app = montarApp(1, 50);

      await acionar(app, 'orc-1', '203.0.113.10');
      const barrada = await acionar(app, 'orc-1', '203.0.113.10');
      expect(barrada.status).toBe(429);

      const evento = captura
        .eventos()
        .find((e) => e.tipo === 'RATE_LIMIT' && e.motivo === 'por_orcamento');

      expect(evento).toBeDefined();
      expect(evento?.rota).toBe('orcamentos-v2/acao-publica');
      expect(evento?.recurso).toBe('orc-1');
      expect(evento?.origem).toMatch(/^[0-9a-f]{12}$/);
    });

    it('registra a barrada por IP quando o atacante troca de orçamento', async () => {
      // Teto por IP baixo: trocar o id do orçamento não devolve contador novo.
      const app = montarApp(50, 2);

      await acionar(app, 'orc-1', '203.0.113.11');
      await acionar(app, 'orc-2', '203.0.113.11');
      const barrada = await acionar(app, 'orc-3', '203.0.113.11');
      expect(barrada.status).toBe(429);

      const evento = captura
        .eventos()
        .find((e) => e.tipo === 'RATE_LIMIT' && e.motivo === 'por_ip');

      expect(evento).toBeDefined();
      expect(evento?.origem).toMatch(/^[0-9a-f]{12}$/);
    });
  });

  describe('AUTORIZACAO_NEGADA sai do guard, com motivo distinguível', () => {
    class ControllerFalso {}

    // Handlers como funções soltas, e não métodos: o guard só precisa de algo
    // com nome para compor a rota, e assim o metadata fica preso à função certa.
    function semPermissaoDeclarada(this: void) {}
    function comPermissaoDeclarada(this: void) {}

    Reflect.defineMetadata(
      REQUER_PERMISSAO_VENDAS,
      ['orcamentos.ler'],
      comPermissaoDeclarada,
    );

    const montarContexto = (handler: () => void): ExecutionContext =>
      ({
        getHandler: () => handler,
        getClass: () => ControllerFalso,
        switchToHttp: () => ({
          getRequest: () => ({
            // `funcao` é obrigatória: sem ela a identidade nem chega ao guard,
            // e o teste mediria a recusa errada.
            user: { sub: 'usuario-1', loja_id: 'loja-1', funcao: 'VENDAS' },
          }),
        }),
      }) as unknown as ExecutionContext;

    const montarGuard = () =>
      new VendasPermissionsGuard(new Reflector(), {
        assertPodeQualquer: jest
          .fn()
          .mockRejectedValue(new ForbiddenException('sem permissão')),
      } as never);

    it('separa defeito de configuração de tentativa de acesso', async () => {
      const guard = montarGuard();

      await expect(
        guard.canActivate(montarContexto(semPermissaoDeclarada)),
      ).rejects.toBeInstanceOf(ForbiddenException);

      await expect(
        guard.canActivate(montarContexto(comPermissaoDeclarada)),
      ).rejects.toBeInstanceOf(ForbiddenException);

      const motivos = captura
        .eventos()
        .filter((e) => e.tipo === 'AUTORIZACAO_NEGADA')
        .map((e) => e.motivo);

      // A distinção existe porque as duas exigem reações opostas:
      // `permissao_nao_declarada` deveria ser sempre zero e indica handler novo
      // mal anotado; `permissao_insuficiente` é o sistema funcionando.
      expect(motivos).toEqual([
        'permissao_nao_declarada',
        'permissao_insuficiente',
      ]);
    });

    it('não registra o identificador do usuário em claro', async () => {
      const guard = montarGuard();

      await expect(
        guard.canActivate(montarContexto(comPermissaoDeclarada)),
      ).rejects.toBeInstanceOf(ForbiddenException);

      const [evento] = captura.eventos();
      expect(evento.linha).not.toContain('usuario-1');
      expect(evento.origem).toBe(pseudonimizar('usuario-1'));
    });
  });

  it('nenhuma linha emitida nesta suíte contém dado sensível', () => {
    registrarEventoDeSeguranca({
      tipo: 'TOKEN_RECUSADO',
      rota: 'orcamentos-v2/acao-publica',
      recursoId: 'orc-1',
      origem: pseudonimizar('203.0.113.42'),
      motivo: 'codigo_nao_aceito',
    });

    expect(procurarDadoSensivel(captura.eventos())).toBeNull();
  });
});
