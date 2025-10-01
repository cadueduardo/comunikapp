import { DocumentCodeService, TipoOS } from './document-code.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DocumentCodeService', () => {
  const upsertMock = jest.fn();
  const findUniqueMock = jest.fn();
  const prismaMock = {
    document_sequence: {
      upsert: upsertMock,
      findUnique: findUniqueMock,
    },
    $transaction: jest.fn((callback: any) => callback(prismaMock)),
  } as unknown as PrismaService;

  let service: DocumentCodeService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DocumentCodeService(prismaMock);
  });

  it('deve gerar codigo inicial para orcamento', async () => {
    (prismaMock.document_sequence.upsert as jest.Mock).mockResolvedValue({
      ultimo_numero: 1,
    });

    const codigo = await service.gerarCodigoOrcamento('loja-001', 2025);

    expect(codigo).toBe('ORC-2025-001');
    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(prismaMock.document_sequence.upsert).toHaveBeenCalledWith({
      where: {
        loja_id_tipo_ano: {
          loja_id: 'loja-001',
          tipo: 'ORC',
          ano: 2025,
        },
      },
      update: {
        ultimo_numero: {
          increment: 1,
        },
      },
      create: {
        loja_id: 'loja-001',
        tipo: 'ORC',
        ano: 2025,
        ultimo_numero: 1,
      },
    });
  });

  it('deve gerar codigo padronizado para OS', async () => {
    (prismaMock.document_sequence.upsert as jest.Mock).mockResolvedValue({
      ultimo_numero: 3,
    });

    const codigo = await service.gerarCodigoOS('loja-xyz', 2024);

    expect(codigo).toBe('OS-2024-003');
    expect(prismaMock.document_sequence.upsert).toHaveBeenLastCalledWith({
      where: {
        loja_id_tipo_ano: {
          loja_id: 'loja-xyz',
          tipo: 'OS',
          ano: 2024,
        },
      },
      update: {
        ultimo_numero: {
          increment: 1,
        },
      },
      create: {
        loja_id: 'loja-xyz',
        tipo: 'OS',
        ano: 2024,
        ultimo_numero: 1,
      },
    });
  });

  it('deve gerar codigo para OS Interna', async () => {
    (prismaMock.document_sequence.upsert as jest.Mock).mockResolvedValue({
      ultimo_numero: 1,
    });

    const codigo = await service.gerarCodigoOSInterna('loja-001', 2025);

    expect(codigo).toBe('OSI-2025-001');
    expect(prismaMock.document_sequence.upsert).toHaveBeenCalledWith({
      where: {
        loja_id_tipo_ano: {
          loja_id: 'loja-001',
          tipo: 'OSI',
          ano: 2025,
        },
      },
      update: {
        ultimo_numero: {
          increment: 1,
        },
      },
      create: {
        loja_id: 'loja-001',
        tipo: 'OSI',
        ano: 2025,
        ultimo_numero: 1,
      },
    });
  });

  it('deve gerar codigo por tipo de OS', async () => {
    (prismaMock.document_sequence.upsert as jest.Mock).mockResolvedValue({
      ultimo_numero: 5,
    });

    const codigoComercial = await service.gerarCodigoOSPorTipo('loja-001', TipoOS.COMERCIAL, 2025);
    const codigoInterna = await service.gerarCodigoOSPorTipo('loja-001', TipoOS.INTERNA, 2025);

    expect(codigoComercial).toBe('OS-2025-005');
    expect(codigoInterna).toBe('OSI-2025-005');
  });

  it('deve validar codigos de OS corretamente', () => {
    // Códigos válidos
    expect(service.validarCodigoOS('OS-2025-001')).toEqual({
      valido: true,
      tipo: TipoOS.COMERCIAL
    });
    expect(service.validarCodigoOS('OSI-2025-001')).toEqual({
      valido: true,
      tipo: TipoOS.INTERNA
    });

    // Códigos inválidos
    expect(service.validarCodigoOS('OS-25-001')).toEqual({
      valido: false,
      erro: 'Formato inválido. Use OS-AAAA-NNN para comercial ou OSI-AAAA-NNN para interna'
    });
    expect(service.validarCodigoOS('OSI-2025-1')).toEqual({
      valido: false,
      erro: 'Formato inválido. Use OS-AAAA-NNN para comercial ou OSI-AAAA-NNN para interna'
    });
  });

  it('deve extrair informacoes de codigo corretamente', () => {
    const infoComercial = service.extrairInformacoesCodigo('OS-2025-001');
    const infoInterna = service.extrairInformacoesCodigo('OSI-2025-001');
    const infoInvalida = service.extrairInformacoesCodigo('INVALIDO');

    expect(infoComercial).toEqual({
      tipo: TipoOS.COMERCIAL,
      ano: 2025,
      numero: 1
    });
    expect(infoInterna).toEqual({
      tipo: TipoOS.INTERNA,
      ano: 2025,
      numero: 1
    });
    expect(infoInvalida).toBeNull();
  });

  it('deve verificar codigo existente', async () => {
    (prismaMock.document_sequence.findUnique as jest.Mock).mockResolvedValue({
      ultimo_numero: 5
    });

    const existe = await service.verificarCodigoExistente('OS-2025-003', 'loja-001');
    expect(existe).toBe(true);

    const naoExiste = await service.verificarCodigoExistente('OS-2025-010', 'loja-001');
    expect(naoExiste).toBe(false);
  });

  it('deve obter estatisticas de numeracao', async () => {
    (prismaMock.document_sequence.findUnique as jest.Mock)
      .mockResolvedValueOnce({ ultimo_numero: 10 }) // Comercial
      .mockResolvedValueOnce({ ultimo_numero: 5 });  // Interna

    const stats = await service.obterEstatisticasNumeracao('loja-001', 2025);

    expect(stats).toEqual({
      comercial: { total: 10, ultimoNumero: 10 },
      interna: { total: 5, ultimoNumero: 5 }
    });
  });

  it('deve obter proximo numero', async () => {
    (prismaMock.document_sequence.findUnique as jest.Mock).mockResolvedValue({
      ultimo_numero: 5
    });

    const proximoComercial = await service.obterProximoNumero('loja-001', TipoOS.COMERCIAL, 2025);
    const proximoInterna = await service.obterProximoNumero('loja-001', TipoOS.INTERNA, 2025);

    expect(proximoComercial).toBe(6);
    expect(proximoInterna).toBe(6);
  });

  it('deve incrementar sequencia existente', async () => {
    (prismaMock.document_sequence.upsert as jest.Mock).mockResolvedValue({
      ultimo_numero: 7,
    });

    const codigo = await service.gerarCodigoOrcamento('loja-001', 2025);

    expect(codigo).toBe('ORC-2025-007');
  });

  it('deve usar ano atual quando nao informado', async () => {
    const anoAtual = new Date().getFullYear();

    (prismaMock.document_sequence.upsert as jest.Mock).mockResolvedValue({
      ultimo_numero: 2,
    });

    const codigo = await service.gerarCodigoOS('loja-abc');

    expect(codigo).toBe(`OS-${anoAtual}-002`);
  });
});
