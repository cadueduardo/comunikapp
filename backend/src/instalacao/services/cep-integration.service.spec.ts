import { CepIntegrationService } from './cep-integration.service';

describe('CepIntegrationService', () => {
  let service: CepIntegrationService;
  const fetchOriginal = global.fetch;

  beforeEach(() => {
    service = new CepIntegrationService();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = fetchOriginal;
    jest.clearAllMocks();
  });

  it('retorna erro amigável para CEP inválido', async () => {
    const resultado = await service.buscarEnderecoPorCep('123');

    expect(resultado.sucesso).toBe(false);
    expect(resultado.permitir_preenchimento_manual).toBe(true);
    expect(resultado.erro).toContain('CEP inválido');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('retorna endereço quando ViaCEP responde com sucesso', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        cep: '01310100',
        logradouro: 'Avenida Paulista',
        bairro: 'Bela Vista',
        localidade: 'São Paulo',
        uf: 'SP',
        ibge: '3550308',
      }),
    });

    const resultado = await service.buscarEnderecoPorCep('01310-100');

    expect(resultado.sucesso).toBe(true);
    expect(resultado.endereco).toEqual(
      expect.objectContaining({
        cep: '01310-100',
        logradouro: 'Avenida Paulista',
        cidade: 'São Paulo',
        uf: 'SP',
      }),
    );
    expect(resultado.permitir_preenchimento_manual).toBe(false);
  });

  it('permite preenchimento manual quando CEP não é encontrado', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ erro: true }),
    });

    const resultado = await service.buscarEnderecoPorCep('99999999');

    expect(resultado.sucesso).toBe(false);
    expect(resultado.permitir_preenchimento_manual).toBe(true);
    expect(resultado.erro).toContain('não encontrado');
  });

  it('captura falha da API e permite preenchimento manual', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('timeout'));

    const resultado = await service.buscarEnderecoPorCep('01310100');

    expect(resultado.sucesso).toBe(false);
    expect(resultado.permitir_preenchimento_manual).toBe(true);
    expect(resultado.erro).toContain('indisponível');
  });
});
