import { encontrarRotaPublica, ROTAS_PUBLICAS } from './rotas-publicas';

describe('Catálogo de rotas públicas (Gate 0S — HS-03)', () => {
  const PRODUCAO = true;
  const DESENVOLVIMENTO = false;

  describe('rotas indispensáveis permanecem anônimas', () => {
    it.each([
      ['POST', '/lojas/login'],
      ['POST', '/api/lojas/login'],
      ['POST', '/lojas/login/2fa'],
      ['POST', '/lojas'],
      ['GET', '/lojas/public/by-slug/minha-loja'],
      ['GET', '/lojas/public/by-host/minha-loja.comunikapp.com.br'],
      ['POST', '/usuarios/definir-senha'],
      ['POST', '/usuarios/redefinir-senha'],
      ['GET', '/platform/convites/validar'],
      ['POST', '/platform/interesse-beta'],
      ['GET', '/public/v1/product-updates'],
      ['GET', '/public/v1/product-updates/nova-versao'],
      ['GET', '/conexoes/google/callback'],
      ['GET', '/arte-aprovacao/links/public/tok123'],
      ['GET', '/arte-aprovacao/links/public/tok123/validate'],
      ['POST', '/arte-aprovacao/links/public/tok123/approve'],
      ['POST', '/arte-aprovacao/mensagens/publico/tok123'],
      ['GET', '/arte-aprovacao/mensagens/publico/tok123/versao/v1'],
      ['GET', '/orcamentos-v2/orc1/publico'],
      ['POST', '/orcamentos-v2/orc1/publico/acao'],
      ['POST', '/orcamentos-v2/orc1/reenviar-codigo'],
    ])('%s %s', (metodo, caminho) => {
      expect(encontrarRotaPublica(metodo, caminho, PRODUCAO)).not.toBeNull();
    });
  });

  describe('nega por padrão', () => {
    it.each([
      ['GET', '/orcamentos-v2'],
      ['GET', '/orcamentos-v2/orc1'],
      ['DELETE', '/orcamentos-v2/orc1'],
      ['GET', '/orcamentos-v2/orc1/mensagens/publico'],
      ['POST', '/orcamentos-v2/orc1/mensagens/publico'],
      ['POST', '/orcamentos-v2/orc1/publico/mensagens/m1/visualizar'],
      ['GET', '/orcamentos/orc1/mensagens/publico'],
      ['GET', '/clientes'],
      ['GET', '/usuarios'],
      ['GET', '/lojas/health'],
      ['GET', '/estoque/health'],
      ['GET', '/arte-aprovacao/comentarios/public'],
    ])('%s %s exige autenticação', (metodo, caminho) => {
      expect(encontrarRotaPublica(metodo, caminho, PRODUCAO)).toBeNull();
    });

    it('não libera método diferente do declarado no mesmo caminho', () => {
      expect(encontrarRotaPublica('POST', '/orcamentos-v2/orc1/publico', PRODUCAO)).toBeNull();
      expect(encontrarRotaPublica('DELETE', '/lojas/login', PRODUCAO)).toBeNull();
      expect(encontrarRotaPublica('GET', '/lojas', PRODUCAO)).toBeNull();
    });

    it('não libera subcaminho de rota pública', () => {
      expect(
        encontrarRotaPublica('GET', '/lojas/public/by-slug/loja/extra', PRODUCAO),
      ).toBeNull();
      expect(
        encontrarRotaPublica('POST', '/orcamentos-v2/orc1/publico/acao/extra', PRODUCAO),
      ).toBeNull();
    });

    it('trata HEAD como GET', () => {
      expect(
        encontrarRotaPublica('HEAD', '/public/v1/product-updates', PRODUCAO),
      ).not.toBeNull();
      expect(encontrarRotaPublica('HEAD', '/clientes', PRODUCAO)).toBeNull();
    });
  });

  describe('rotas de diagnóstico', () => {
    it('ficam fora de produção', () => {
      expect(encontrarRotaPublica('GET', '/test-validacoes', PRODUCAO)).toBeNull();
      expect(
        encontrarRotaPublica('GET', '/test-validacoes', DESENVOLVIMENTO),
      ).not.toBeNull();
    });
  });

  it('o download por link assinado exige token na query', () => {
    const rota = encontrarRotaPublica(
      'GET',
      '/arte-aprovacao/versoes/v1/arquivos/public/download/arte.pdf',
      PRODUCAO,
    );
    expect(rota?.exigeTokenNaQuery).toBe(true);
  });

  it('toda rota do catálogo declara finalidade e ao menos um método', () => {
    for (const rota of ROTAS_PUBLICAS) {
      expect(rota.finalidade.trim().length).toBeGreaterThan(0);
      expect(rota.metodos.length).toBeGreaterThan(0);
      expect(rota.caminho.startsWith('/')).toBe(true);
    }
  });
});
